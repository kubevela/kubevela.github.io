---
title: Rolling Out Policy Changes
---

An [application-scoped policy](./application-scoped-policy.md) is resolved when an Application is revisioned, and that resolution is locked into the ApplicationRevision. This page covers what happens to Applications that are already deployed when a policy changes, and how platform teams and Application owners control it.

Make sure you've read [Application-Scoped Policies](./application-scoped-policy.md) before continuing.

## Three kinds of change

| Change | Example | Setting that lets it through |
|---|---|---|
| A **new version** of a policy | a global PolicyDefinition is edited, or deleted | `applyPolicyUpdates` |
| **Changed output** from the same policy version | a policy reads namespace labels with `kube.#Get`, and a label changes | `applyDataChanges` |
| Policy output that **rewrites the spec** | a policy sets `output.components`, `output.workflow` or `output.policies` | `autoRevision` |

Every setting is **off by default**. With all three off, an Application's dispatched resources and components keep the policies, and the policy output, the Application was revisioned with until its next revision (for example, the next change to its spec).

When a setting lets a change through:
- **New policy version:** a new ApplicationRevision is cut and the workflow re-runs, with no edit to the Application. The Application and its resources take the new version's labels, annotations and context.
- **Changed data:** the Application's resources and components take the new labels, annotations and context. No new ApplicationRevision is cut and the workflow does not re-run.
- **Spec rewrite:** a new ApplicationRevision is cut.

:::note Known limitation
The Application object's own labels and annotations follow changed data whatever the settings, when the policy is next rendered (the policy cache expires). Only its dispatched resources and context are held.
:::

:::note On the 1.11 line
`applyDataChanges` covers labels and annotations only. Changed `output.ctx` data reaches components at the Application's next revision.
:::

## Where a setting comes from

Each setting is resolved per policy, from three places. The first one that is set wins:

1. **The Application's annotation.** This lets an Application owner opt in or out.
2. **The policy template's `config`**, next to `config.enabled`. This lets the platform team decide per policy.
3. **The controller flag.** This is the cluster-wide default.

| Setting | Application annotation | Template field | Controller flag | Helm value |
|---|---|---|---|---|
| adopt new policy versions | `policy.oam.dev/apply-policy-updates` | `config.applyPolicyUpdates` | `--application-default-apply-policy-updates` | `controllerArgs.defaultApplyPolicyUpdates` |
| apply changed data | `policy.oam.dev/apply-data-changes` | `config.applyDataChanges` | `--application-default-apply-data-changes` | `controllerArgs.defaultApplyDataChanges` |
| cut a revision for a spec rewrite | `policy.oam.dev/auto-revision` | `config.autoRevision` | `--application-default-auto-revision` | `controllerArgs.defaultAutoRevision` |

### Annotation values

An annotation takes one of:
- `"true"`: the setting applies to every policy the Application runs.
- `"false"`: it applies to none.
- **A comma-separated list of PolicyDefinition names:** it applies only to those policies.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: payments-api
  annotations:
    # Take new versions of these two policies as soon as they are published.
    policy.oam.dev/apply-policy-updates: "platform-labels,tenant-identity"
spec:
  components:
    - name: api
      type: webservice
      properties:
        image: nginx:latest
```

An Application gets a `PolicySettingIgnored` warning event when an annotation names a policy it does not run, or has a value that is none of the above. An annotation with such a value is ignored.

### Template fields

A template field is evaluated with the Application's context, like `config.enabled`, so a policy can decide per Application:

```cue
template: {
  parameter: {}

  config: {
    enabled: true
    // Production Applications take new versions of this policy straight away;
    // others wait for their next revision.
    applyPolicyUpdates: context.appLabels["env"] == "production"
    applyDataChanges:   true
  }

  output: labels: "platform.io/managed-by": "kubevela"
}
```

The new version's own `applyPolicyUpdates` decides whether that version is adopted, so publishing a version that sets `applyPolicyUpdates: true` rolls it out.

A value that is not a boolean is ignored with a `PolicySettingIgnored` warning event. It never fails the policy.

## What holds a change back

- **The settings above.** When `applyPolicyUpdates` holds a newer version of a policy, the Application gets a `PolicyUpdatePending` event naming the policies. The held version is adopted at the Application's next revision.
- **A `publishVersion` pin** (`app.oam.dev/publishVersion`) holds both new policy versions and data changes until the pin moves.
- **A `@version` reference** in `spec.policies` (`type: add-team-labels@v2`) is a hard pin. It never moves to another version on its own.
- **A new version that fails to render** is held rather than applied. The Application keeps running with the version it has.
- **Spec-rewriting policies stay pinned.** A new version of a policy that rewrites the spec isn't adopted between revisions, even when `applyPolicyUpdates` is on.

The effective settings for each policy, as the controller resolved them, are recorded under `settings` in that policy's entry of the policy ConfigMap named by the Application's `status.applicationPoliciesConfigMap`. From v1.12, `vela policy view <app> --details` prints them under each policy:

```
  Settings:
    autoRevision: true
```

## Removing what a policy stops setting

When a policy stops setting a label or annotation (a new version drops it, or the data it reads no longer yields it), KubeVela removes that key from the Application and its dispatched resources, once the change is let through. The same applies when a global policy is deleted. A key that someone else has changed since the policy set it is left alone. A removal seen while the workflow is suspended (for example at an approval gate) is kept in the policy ConfigMap under `pending_removals` and applied once the workflow resumes.

:::caution Revoking a bad global policy
Deleting a global policy is itself a policy change. With `applyPolicyUpdates` off (the default), the deleted policy's labels stay on existing Applications until their next revision. If you may need to pull a policy back quickly, decide on `applyPolicyUpdates` before you need it.
:::

Known limits:
- **ConfigMaps, Secrets and CRDs keep a removed key.** KubeVela records no last-applied configuration for these kinds, so a removed label or annotation stays on them.
- **An Application with no policy record** (no policy ConfigMap) has nothing removed, since there is no record of which policy set which key.
- **A key the Application declares with the same value is removed too.** If an Application's own manifest sets a label or annotation to the value a policy also sets, KubeVela cannot tell the two apart, and removes the key when the policy stops setting it. A GitOps sync puts it back once; after that the record no longer lists the key, so it stays.

## Choosing settings

- **Informational tags** (team, cost centre, managed-by): `applyPolicyUpdates` and `applyDataChanges` on in the template. Changes reach every Application within a resync, with no change to the Application: a new version cuts a revision, and changed data doesn't.
- **Policies that change behaviour:** leave the settings off and let each Application adopt the new version at its next revision. Owners who want it sooner opt in with the annotation.
- **Cluster-wide defaults:** set the controller flags (Helm `controllerArgs.*`) only once your policies are written to be safe to roll out live.
