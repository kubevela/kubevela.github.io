---
title: Rolling Out Policy Changes
---

An [Application-scoped policy](./application-scoped-policy.md) is rendered against every Application it applies to. Policies don't stand still, though: a platform team publishes a new version, or the data a policy reads (a Namespace label, a ConfigMap, an external API) changes underneath it. KubeVela then has to decide what happens to the Applications that are already running. This page explains those decisions, the settings that control them, and how to see what was decided.

Make sure you have read [Application-Scoped Policies](./application-scoped-policy.md) first.

## An Example

Say your platform team runs a global `platform-labels` policy that stamps every Application with `platform.io/managed-by: kubevela`. You publish a new version that also adds `platform.io/cost-centre`.

With the default settings, nothing happens to the Applications that are already running. Each one keeps rendering the version it was deployed with, and reports the new version as **pending**. The new version reaches an Application at its next revision: when its owner edits it, or bumps `app.oam.dev/publishVersion`. Brand-new Applications take the new version straight away.

If you want the new label everywhere now, set `applyPolicyUpdates: true` in the policy's template and publish it. Each running Application then adopts the new version on its next reconcile: KubeVela cuts a new ApplicationRevision and re-runs the workflow, with no edit to the Application, and the Application and its resources take the new version's labels, annotations and context.

The rest of this page covers the three kinds of change, where the settings come from, and the cases where a change is held back whatever the settings say.

## Three Kinds of Change

Every Application revision records the PolicyDefinitions it was rendered with. A change to an Application's own spec (an author edit, its first deployment, or a `publishVersion` bump) cuts a new revision, and a new revision always takes the live policies and their current data. The settings on this page decide what happens **between** those revisions, and there is one for each kind of change:

| Change | Example | Controlled by |
|---|---|---|
| **A new policy version** | A platform engineer edits, adds or deletes a PolicyDefinition | `applyPolicyUpdates` (a new version that rewrites the spec waits for the next revision) |
| **A data change** | The policy is unchanged, but what it reads (a Namespace label, a ConfigMap, an API) now returns something else, so its `output` differs | `applyDataChanges` |
| **A spec rewrite** | The policy's `output.components`, `output.workflow` or `output.policies` replaces part of the Application spec | `autoRevision` |

When a setting lets its change through, a new policy version cuts a new ApplicationRevision and re-runs the workflow, as in the example above. A data change reaches the Application's resources and components without a new revision, and the workflow does not re-run. A spec rewrite cuts a new ApplicationRevision.

:::caution All three settings default to off
With the defaults, a running Application keeps the policy versions and data it was deployed with until its next revision. The newer version or data is reported as **pending**, not applied. Turn a setting on per policy, per Application or for the whole controller, as described below, when you want changes to reach running Applications.
:::

## Where a Setting Comes From

Each setting can be given in three places: the policy's template, an annotation on the Application, and a controller-wide default.

| Setting | Template field | Application annotation | Chart value (controller flag) | Default |
|---|---|---|---|---|
| Adopt new policy versions | `config.applyPolicyUpdates` | `policy.oam.dev/apply-policy-updates` | `controllerArgs.defaultApplyPolicyUpdates` (`--application-default-apply-policy-updates`) | `false` |
| Take data changes without a new revision | `config.applyDataChanges` | `policy.oam.dev/apply-data-changes` | `controllerArgs.defaultApplyDataChanges` (`--application-default-apply-data-changes`) | `false` |
| Cut a new revision for a spec rewrite | `config.autoRevision` | `policy.oam.dev/auto-revision` | `controllerArgs.defaultAutoRevision` (`--application-default-auto-revision`) | `false` |

KubeVela works each setting out **per policy**, for each Application, in this order:

1. The Application's annotation, if it is set and valid. A list decides for every policy: a policy it names is on, and a policy it leaves out is off. Neither falls back to the template or the default.
2. The policy template's `config` field, if the template sets it.
3. The controller default from the chart value.

:::caution A platform team cannot push a change past an Application's annotation
An Application whose annotation turns a setting off for a policy (`"false"`, or a list that leaves the policy out) holds the changes that setting covers (new versions, or data changes) between revisions, whatever the template or the controller default says. That includes a security fix in a new policy version: it reaches that Application only at its next revision, when its owner edits it or bumps `app.oam.dev/publishVersion`. If a policy change must reach every Application at once, check which Applications carry these annotations first.
:::

### Template Fields

The settings sit next to `config.enabled` in the policy's template. They are evaluated with the Application's context, so a template can decide per Application. This one rolls out its own new versions straight away, and takes data changes everywhere except in the `production` namespace:

```cue
"platform-labels": {
  attributes: {
    scope:  "Application"
    global: true
  }
  description: "Platform identity labels."
  type: "policy"
}

template: {
  parameter: {}

  config: {
    enabled: true
    // New versions of this policy roll out to running Applications straight away...
    applyPolicyUpdates: true
    // ...and so do changes in the data it reads, except in the production namespace.
    applyDataChanges: context.namespace != "production"
  }

  output: labels: {
    "platform.io/managed-by": "kubevela"
  }
}
```

It's the new version's own `applyPolicyUpdates` that decides whether that version is adopted, so publishing a version that sets `applyPolicyUpdates: true` rolls it out, except to an Application whose `policy.oam.dev/apply-policy-updates` annotation says otherwise.

A value that is not a boolean is ignored, and the Application gets a `PolicySettingIgnored` Warning event naming the field. A rollout setting never makes a policy fail.

### Annotation Values

An Application owner can choose for themselves with an annotation. Each annotation takes `"true"` (every policy), `"false"` (no policy) or a comma-separated list of PolicyDefinition names (only those):

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: payments
  annotations:
    # Adopt new versions of these two policies; hold every other policy's updates.
    policy.oam.dev/apply-policy-updates: "platform-labels,tenant-identity"
    # Never take data changes between revisions.
    policy.oam.dev/apply-data-changes: "false"
spec:
  components:
    - name: api
      type: webservice
      properties:
        image: payments/api:1.4.2
```

Use the PolicyDefinition name in a list, without any `@version` suffix. An annotation that cannot be read (empty, or a name that cannot be a PolicyDefinition) is ignored for that setting, which falls back to the template and the default. A listed name that matches no policy applied to the Application is reported but harmless. Both give a `PolicySettingIgnored` Warning event.

### Controller Defaults

To change the default for every policy that doesn't set its own, set the chart values:

```bash
helm upgrade --install kubevela kubevela/vela-core -n vela-system \
  --set controllerArgs.defaultApplyPolicyUpdates=true \
  --set controllerArgs.defaultApplyDataChanges=true
```

## New Policy Versions

Between revisions, on each reconcile, KubeVela compares the live PolicyDefinitions with the versions pinned in the Application's latest revision. A policy that was edited, added or deleted is a **changed** policy. With `applyPolicyUpdates` on for that policy, the new version is **adopted**: the Application renders with it and a new revision is cut, and its labels and annotations reach the Application and its resources. With it off, the update is **held**: the Application keeps rendering the pinned version, and the policy is reported as pending until the Application's next revision adopts it.

Some updates are held whatever the setting says.

A new version that fails to render is held rather than applied, and the pinned version keeps the Application running. If it failed because of something it reads, such as a missing ConfigMap, fixing that can take up to ten minutes to reach the Application, because KubeVela remembers a held update for that long rather than rendering it on every reconcile. Publishing a corrected version, or any change to the Application, decides again straight away.

Adoption is decided in sequence. Policies run as a chain (see [Priority](./application-scoped-policy.md#priority)), so a new version is tried in its place in that chain, after the policies before it. A new version that only fails next to the others is held.

A new version that rewrites the spec stays pinned until the next revision, even with `applyPolicyUpdates` on. Spec rewrites are covered by `autoRevision`, in [Spec Rewrites](#spec-rewrites).

A deleted policy is a changed policy too. Its removal follows the settings its own template last set (they are recorded when it renders), then the annotation and the default. Until the removal is adopted, the deleted policy keeps applying from the pinned revision.

A `publishVersion` pin holds every update until `app.oam.dev/publishVersion` changes. Bumping it cuts a new revision, which takes the live policies like an author edit does.

You can see a held update in three places. The policy's entry in `status.appliedApplicationPolicies` has a message that starts `update pending:` and says why: `a newer version of this policy is held by policy.oam.dev/apply-policy-updates or a publishVersion pin`, or `a newer version of this policy fails to render`. The Application gets a `PolicyUpdatePending` event. And `vela policy view <app> --details` prints each policy's effective settings.

## Data Changes

A policy that reads the cluster or an external API can produce different output without changing its template: someone edits a Namespace label, or a ConfigMap value changes. That is a **data change**.

With `applyDataChanges` on for that policy, the changed output reaches the Application **without a new revision and without re-running the workflow**. Changed labels and annotations are written to the Application and its dispatched resources, and a changed `output.ctx` re-applies the components that read it. With it off, the policy keeps contributing the output it last applied. The change is reported as **data change pending** in its status message, and applies at the Application's next revision. A `publishVersion` pin holds data changes too, until it moves.

To tell a data change from a policy that is simply rendering the same thing again, KubeVela records each policy's applied output in the Application's policy ConfigMap, and a hash of each policy's context output on the Application's current ResourceTracker (`app.oam.dev/policy-context-hash`). An Application deployed before that hash existed records one on its next reconcile, without redeploying.

With `applyDataChanges` on, a refresh writes a policy's new label or annotation value onto every dispatched resource that already carries that key, even where a trait set the key to something else on that resource.

:::caution A held policy's data can still reach a later policy
Holding swaps a policy's output for its last applied output **after** the policy chain has rendered. A later policy in the chain that reads the held policy's results during render (for example through `context.appLabels`) sees the new data, and its own output is built from it. If a later policy derives values from an earlier one, give both the same `applyDataChanges` setting.
:::

## Spec Rewrites

A policy that sets `output.components`, `output.workflow` or `output.policies` rewrites the Application spec. With `autoRevision` on for that policy, a rewrite that differs from the latest revision cuts a new revision and is deployed. With it off, the Application keeps the components, workflow and policies stored in its latest revision, and the rewrite takes effect at the next revision.

A rewrite only counts when it differs from what the latest revision stores. A policy that rewrites the spec the same way on every reconcile cuts no revision, and does not stop another policy's update from being adopted.

## What Holds a Change Back

Putting the sections above together, a change waits for the Application's next revision when its setting is off for that policy (see [New Policy Versions](#new-policy-versions), [Data Changes](#data-changes) and [Spec Rewrites](#spec-rewrites)), or when a `publishVersion` pin has not moved. A new version that fails to render, or that rewrites the spec, waits too, as described in [New Policy Versions](#new-policy-versions). A mandatory global policy that fails holds the whole Application: see [Mandatory Global Policies](./application-scoped-policy.md#mandatory-global-policies).

An explicit policy pinned with `@version` in `spec.policies` (`type: add-team-labels@v2`) stays where it is pinned. `@v2` names DefinitionRevision `add-team-labels-v2` when one exists, which is a hard pin. For a definition with semantic versions (`spec.version`), `@v2` resolves to the newest `2.x`, so pin the full version (`@v2.1.0`) to hold it.

## Removing What a Policy Stops Setting

When a policy stops setting a label or annotation (a new version drops it, the data no longer yields it, or the policy is deleted and its removal is adopted), KubeVela takes the key off the Application and off its dispatched resources.

It only removes what it knows the policies put there. The key must still hold the value the policy set: if someone has changed it since, it's theirs, and it stays. Keys from before KubeVela kept a record are not removed either. The record is the `metadata` entry of the policy ConfigMap, so a key set before it existed is left alone, and an Application with no policy ConfigMap has nothing removed.

A removal seen while the workflow is suspended is kept in the ConfigMap's `pending_removals` entry, and applied to resources once the workflow resumes. Keys an Application filters from inheritance are left alone on its resources: a key listed in `filter.oam.dev/label-keys` or `filter.oam.dev/annotation-keys` is never written to or removed from the resources by a policy refresh, since a full render would not put it there.

:::warning Two cases where a removal goes wrong
An author's own key with the same value is removed too. If an Application author sets a label to exactly the value a policy set, KubeVela cannot tell the two apart, and removes it when the policy stops setting it. Use a different key, or a different value, for anything an author must own.

ConfigMaps, Secrets and CRDs keep removed keys. KubeVela records no last-applied configuration for those kinds, so the three-way merge that removes a key from other resources cannot remove it from them. The key stays on the resource until something else removes it.
:::

:::caution Revoking a bad global policy
Deleting a global policy is itself a policy change. With `applyPolicyUpdates` off (the default), the deleted policy's labels stay on existing Applications until their next revision. If you may need to pull a policy back quickly, decide on `applyPolicyUpdates` before you need it.
:::

## Rolling Back

Rolling an Application back to an earlier revision's spec is an edit like any other: it renders with the **live** policy versions and their **current** data, not the versions pinned in that revision. A rollback restores what the author wrote, not the policies or the data of the time.

## Seeing What Happened

Each Application's `status.appliedApplicationPolicies` has one entry per policy: whether it applied or was skipped, its source (`global` or `explicit`), the definition revision used, and a message for pending updates and data changes. `status.applicationPoliciesConfigMap` names the Application's policy ConfigMap, `application-policies-<namespace>-<name>` in the Application's namespace, which holds the record KubeVela works from (its entries are listed under [The Policy ConfigMap](#the-policy-configmap)). The Application's [events](#events) say what was applied, skipped or held, and `vela policy view <app> --details` prints each policy's labels, annotations, context and spec changes, its effective rollout settings, and its context schema.

### Previewing with `vela policy dry-run`

`vela policy dry-run` renders an Application's policies with the controller's own code, and writes nothing to the cluster. Which global policies apply depends on two controller flags (see [Global Policies](./application-scoped-policy.md#global-policies)), and the CLI cannot read them from the controller, so pass the controller's values, or the result can differ from what the controller does:

```bash
vela policy dry-run my-app \
  --allow-namespace-global-policies=false \
  --allow-skip-global-policies=false
```

Both flags default to `false`, as the chart does. The output starts with the values it assumed:

```
Assumed controller flags: --allow-namespace-global-policies=false --allow-skip-global-policies=false
```

With `-o json` or `-o yaml` the same values are in `assumedControllerFlags`.

## Choosing Settings

:::tip
For informational tags (team, cost centre, managed-by), turn `applyPolicyUpdates` and `applyDataChanges` on in the template. Changes reach every Application within a resync, with no change to the Application: a new version cuts a revision, and changed data doesn't.

For policies that change behaviour, leave the settings off and let each Application adopt the new version at its next revision. Owners who want it sooner can opt in with the annotation.

Set the cluster-wide defaults (the controller flags, Helm `controllerArgs.*`) only once your policies are written to be safe to roll out live.
:::

## Upgrading from an Earlier Release

Global policies outside `vela-system` stop applying unless the controller runs with `--allow-namespace-global-policies`, and `policy.oam.dev/skip-global` is ignored unless it runs with `--allow-skip-global-policies`. The two are independent. Before upgrading, find global PolicyDefinitions outside `vela-system` and Applications carrying `skip-global`. For each, either move the policies to `vela-system` (and check the Applications are fine taking them), or set the matching chart value to `true` to keep the earlier behaviour.

A namespace global that stops applying is a deleted policy for the Applications it covered. Its labels come off when its removal is adopted, following the [rollout settings](#new-policy-versions).

Existing Applications keep running as deployed. With the default settings, nothing changes for them until their next revision, apart from pending updates now being reported.

## Reference

### Annotations and Labels

These are the annotations and labels the rollout works with. The first six are set by Application authors; the rest KubeVela manages itself.

| Key | Set on | Set by | Values | Effect |
|---|---|---|---|---|
| `policy.oam.dev/skip-global` | Application | Application author | `"true"` | Opts the Application out of global policies, only while the controller runs with `--allow-skip-global-policies`. Otherwise it is ignored with a `GlobalPolicySkipIgnored` event, and adding it is refused. See [Opting Out of Global Policies](./application-scoped-policy.md#opting-out-of-global-policies). |
| `policy.oam.dev/apply-policy-updates` | Application | Application author | `"true"`, `"false"`, or PolicyDefinition names | Whether the Application adopts new versions of the policies it runs. See [New Policy Versions](#new-policy-versions). |
| `policy.oam.dev/apply-data-changes` | Application | Application author | `"true"`, `"false"`, or PolicyDefinition names | Whether changed output from an unchanged policy version reaches the Application without a new revision. See [Data Changes](#data-changes). |
| `policy.oam.dev/auto-revision` | Application | Application author | `"true"`, `"false"`, or PolicyDefinition names | Whether a policy's spec rewrite cuts a new revision. See [Spec Rewrites](#spec-rewrites). |
| `app.oam.dev/publishVersion` | Application | Application author | any version string | Pins the Application: policy updates and data changes are held until the value changes, and a new value takes the live policies. See [Version Control](../../end-user/version-control.md). |
| `filter.oam.dev/label-keys`, `filter.oam.dev/annotation-keys` | Application | Application author | comma-separated keys | Keys not copied from the Application to its resources. A policy refresh leaves them alone on resources. |
| `app.oam.dev/policy-context-hash` | ResourceTracker | KubeVela | JSON map of policy instance (`global:<name>`, or the `spec.policies` name) to hash | The hash of each policy's context output when the components were last applied. Used to detect data changes in `output.ctx`. |
| `app.oam.dev/application-generation` | ApplicationRevision | KubeVela | the Application's generation | The Application generation the revision was written for. Used to tell an author's edit from a policy's spec rewrite. |
| `app.oam.dev/application-policies` | ConfigMap | KubeVela | `"true"` | Marks an Application's policy ConfigMap, with `app.oam.dev/name`, `app.oam.dev/namespace` and `app.oam.dev/uid` naming the Application. |
| `policydefinition.oam.dev/name` | DefinitionRevision | KubeVela | PolicyDefinition name | Links a PolicyDefinition's revisions to it, for [versioning](./application-scoped-policy.md#versioning-policydefinitions). |

A policy template cannot read any of the KubeVela-managed keys above: `context.appLabels` and `context.appAnnotations` leave out internal prefixes. See [Context Variables](./application-scoped-policy.md#context-variables) for the list.

### Controller Flags and Chart Values

These are the controller settings that shape how policies roll out.

| Chart value | Controller flag | Default | Effect |
|---|---|---|---|
| `featureGates.enableApplicationScopedPolicies` | `--feature-gates=EnableApplicationScopedPolicies=true` | `false` | Turns Application-scoped policies on. Needed for everything on this page. |
| `featureGates.enableGlobalPolicies` | `--feature-gates=EnableGlobalPolicies=true` | `false` | Turns global policies on. |
| `controllerArgs.allowNamespaceGlobalPolicies` | `--allow-namespace-global-policies` | `false` | Lets a global policy outside `vela-system` apply to the Applications in its own namespace. |
| `controllerArgs.allowSkipGlobalPolicies` | `--allow-skip-global-policies` | `false` | Lets an Application opt out of global policies with `policy.oam.dev/skip-global`. |
| `controllerArgs.defaultApplyPolicyUpdates` | `--application-default-apply-policy-updates` | `false` | Default for `applyPolicyUpdates`. |
| `controllerArgs.defaultApplyDataChanges` | `--application-default-apply-data-changes` | `false` | Default for `applyDataChanges`. |
| `controllerArgs.defaultAutoRevision` | `--application-default-auto-revision` | `false` | Default for `autoRevision`. |

### Events

These are the events an Application gets from its policies.

| Reason | Type | When |
|---|---|---|
| `GlobalPolicyApplied` / `PolicyApplied` | Normal | A global or explicit policy applied. |
| `GlobalPolicySkipped` / `PolicySkipped` | Normal | A policy was skipped, for example with `config.enabled: false`. |
| `GlobalPolicyFailed` / `PolicyFailed` | Warning | A policy failed to render. |
| `GlobalPolicyHeld` | Warning | A mandatory global policy fails, and the Application is held at its current revision. See [Mandatory Global Policies](./application-scoped-policy.md#mandatory-global-policies). |
| `GlobalPolicyIgnored` | Warning | A global policy in the Application's namespace does not apply, because global policies must be in `vela-system`. |
| `GlobalPolicySkipIgnored` | Warning | The Application carries `policy.oam.dev/skip-global`, but global policies are mandatory. |
| `PolicyUpdatePending` | Normal | Newer versions of the named policies are held by `apply-policy-updates`, a `publishVersion` pin, or a render failure. |
| `PolicySettingIgnored` | Warning | A rollout annotation or template setting could not be read, or names a policy the Application does not run. |

### Conditions

The `GlobalPolicies` condition shows when an Application is held by a failing global policy.

| Type | Status | Meaning |
|---|---|---|
| `GlobalPolicies` | `False` | A mandatory global policy fails to load or render; the message names it and the error. The Application is held at its current revision. |
| `GlobalPolicies` | `True` | Set when a held Application's global policies render again. An Application that was never held has no `GlobalPolicies` condition. |

### The Policy ConfigMap

The Application's policy ConfigMap holds the record KubeVela works from. Its entries:

| Key | Holds |
|---|---|
| `info` | When the policies last rendered, how many applied, whether the result came from the cache, and whether a spec rewrite was set to cut a revision. |
| `rendered_spec`, `applied_spec` | The spec the policies rendered, and the spec that was applied. |
| `metadata` | The labels, annotations and context the policies set, used to work out removals. |
| `applied_outputs` | Each policy's last applied output, used to hold data changes. |
| `pending_removals` | Removals still to be applied to resources. |
| `NNN-<policy>` | One entry per policy, prefixed with its zero-padded render order, with its output, settings and the settings its template set. |
