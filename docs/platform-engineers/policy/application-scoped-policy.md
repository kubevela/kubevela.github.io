---
title: Application-Scoped Policies
---

Application-scoped policies allow platform engineers to apply organisational standards to Applications deployed in a namespace or across the entire cluster. Use them to enforce consistent labelling, inject configuration, apply security standards, or adapt Applications to their environment.

Policies come in two forms: **global policies** apply automatically to every Application without any developer involvement, and **explicit policies** are declared by developers in their Application's `spec.policies`.

:::caution Alpha Feature
Application-scoped policies are an **alpha feature** and are subject to change in future releases. The API, CUE template structure, and CLI commands may evolve based on feedback.

This feature is disabled by default. Enable it via feature gates when installing or upgrading KubeVela:

**Helm:**
```bash
helm install kubevela kubevela/vela-core \
  --set "featureGates.enableApplicationScopedPolicies=true" \
  --set "featureGates.enableGlobalPolicies=true"
```

**Controller flags (if managing the controller directly):**
```bash
--feature-gates=EnableApplicationScopedPolicies=true
--feature-gates=EnableGlobalPolicies=true
```

`EnableGlobalPolicies` is only required if you want to use [global policies](#global-policies). `EnableApplicationScopedPolicies` is required for all Application-scoped policy functionality.

If you encounter any issues, please [report them on GitHub](https://github.com/kubevela/kubevela/issues/new/choose).
:::

Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition.md) and [how to manage definitions](../cue/definition-edit.md) before continuing.

## How It Works

When KubeVela reconciles an Application, Application-scoped policies run as a **pre-flight step** before the Application is revisioned and deployed. Each policy renders a CUE template and applies its `output` to the Application specification before it is processed.

Global policies always run before explicit policies. Global policies execute in ascending priority order (lower value first), with alphabetical name as the tiebreaker for determinism. Explicit policies run after all global policies have completed, in the order they are declared in `spec.policies`.

## Creating an Application-Scoped PolicyDefinition

Use `vela def init` to scaffold a new policy definition:

```bash
vela def init add-team-labels -t policy --desc "Add team and environment labels to every Application." > add-team-labels.cue
```

The scaffold will look like:

```cue
"add-team-labels": {
  annotations: {}
  attributes: {}
  description: "Add team and environment labels to every Application."
  labels: {}
  type: "policy"
}

template: {
}
```

Set `attributes.scope` to `"Application"` and fill in the template:

```cue
"add-team-labels": {
  attributes: {
    scope: "Application"
  }
  description: "Add team and environment labels to every Application."
  type: "policy"
}

template: {
  parameter: {
    team:        string
    environment: *"production" | string
  }

  config: {
    enabled: true
  }

  output: {
    labels: {
      "platform.io/team":        parameter.team
      "platform.io/environment": parameter.environment
    }
  }
}
```

The value of `scope` is case-sensitive. The PolicyDefinition webhook refuses any other value, since a misspelt scope would never render:

```
unknown scope "application": a PolicyDefinition's scope is empty or "Application" (requestUID=...)
```

Apply it to the cluster:

```bash
vela def apply add-team-labels.cue
```

Use it in an Application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
  namespace: default
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: nginx:latest
  policies:
    - name: team-labels
      type: add-team-labels
      properties:
        team: platform-team
        environment: production
```

Before reconciliation continues, the Application will have `platform.io/team: platform-team` and `platform.io/environment: production` merged into its metadata labels.

## The `output` Object

The `output` field specifies what to apply to the Application:

| Field | Type | Behaviour |
|---|---|---|
| `output.labels` | `{[string]: string}` | Merged into `metadata.labels` |
| `output.annotations` | `{[string]: string}` | Merged into `metadata.annotations` |
| `output.components` | `[...ApplicationComponent]` | Replaces `spec.components` |
| `output.workflow` | `Workflow` | Replaces `spec.workflow` |
| `output.policies` | `[...AppPolicy]` | Replaces `spec.policies` |
| `output.ctx` | `{[string]: _}` | Read by components, traits and workflow steps as `context.custom` |

Labels and annotations are always merged with existing values. The `components`, `workflow`, and `policies` fields replace their corresponding sections entirely.

:::caution Advanced Use
`output.components`, `output.workflow`, and `output.policies` are powerful escape hatches that completely replace their respective fields on the Application. This means any components, workflow steps, or policies defined by the developer will be discarded and replaced by the policy output. This should be reserved for advanced platform use cases where the platform team needs full control over the Application structure. Use with care: later policies in the execution chain will also see the replaced values, and developers may find it difficult to reason about why their Application spec is not being honoured.

For most use cases, prefer `output.labels`, `output.annotations`, and `output.ctx` which safely merge with or extend existing values.
:::

### Example: Add Annotations

```cue
"inject-backup-config": {
  attributes: { scope: "Application" }
  description: "Inject backup and monitoring annotations."
  type: "policy"
}

template: {
  parameter: {}

  config: { enabled: true }

  output: {
    annotations: {
      "config.platform.io/backup-enabled": "true"
      "config.platform.io/monitoring":     "enhanced"
    }
  }
}
```

## Conditional Policies with `config.enabled`

Set `config.enabled` to a CUE expression to make the policy conditional. When it evaluates to `false`, the policy is skipped entirely.

```cue
import "strings"

"tenant-config": {
  attributes: { scope: "Application" }
  description: "Inject tenant configuration for tenant namespaces only."
  type: "policy"
}

template: {
  parameter: {}

  config: {
    // Only apply to tenant namespaces
    enabled: strings.HasPrefix(context.namespace, "tenant-")
  }

  output: {
    annotations: {
      "config.platform.io/tenant-mode": "true"
    }
  }
}
```

## Context Variables

Inside the CUE template, the `context` object provides read access to the current Application:

| Variable | Description |
|---|---|
| `context.name` | Application name |
| `context.namespace` | Application namespace |
| `context.appLabels` | Application labels map |
| `context.appAnnotations` | Application annotations map |
| `context.appComponents` | Application components array |
| `context.appWorkflow` | Application workflow object |
| `context.appPolicies` | Application policies array |
| `context.appName` | Application name (same as `context.name`) |
| `context.appRevision` | The Application revision being rendered |
| `context.publishVersion` | The Application's `app.oam.dev/publishVersion`, if set |
| `context.policyName` | Name of the currently executing policy instance |
| `context.policyType` | The policy's type, as written in `spec.policies` or the global's name |
| `context.policyRevision` | Policy definition revision number (if versioned) |
| `context.policyRevisionName` | Policy DefinitionRevision resource name (if versioned) |
| `context.policyRevisionHash` | Policy template content hash (if versioned) |

`context.appLabels` and `context.appAnnotations` leave out keys with internal prefixes (`app.oam.dev/`, `oam.dev/`, `owner.oam.dev/`, `modules.oam.dev/`, `kubernetes.io/`, `k8s.io/`, `kubectl.kubernetes.io/`, `app.kubernetes.io/`, `helm.sh/`), so a policy cannot read or key off KubeVela's own bookkeeping. Annotations an author sets, such as `policy.oam.dev/*` and `filter.oam.dev/*`, are visible.

The PolicyDefinition webhook refuses a template that reads a `context` field a policy render does not supply, such as a misspelt `context.namesapce`. A field that does not exist would fail the render of every Application the policy applies to.

Example: conditionally applying based on a label. Read a label through a default, since in CUE comparing a missing key is an error, not `false`, and an Application without the label would fail the policy's render:

```cue
_env: *context.appLabels["env"] | ""

config: {
  enabled: _env == "production"
}
```

## Passing Context to Workflow Steps

Use `output.ctx` to pass computed values from the policy to the Application's components, traits and workflow steps. These values are available as `context.custom.<key>` in their CUE templates.

Declare the shape of what a policy puts in `output.ctx` with a `schema: ctx` block, so that a definition reading it wrongly is refused when the Application is applied, not when it renders. See [Typed Policy Context](./policy-context-schema.md).

In this example, a global policy detects tenant namespaces and makes the tenant name available to workflow steps without developers needing to declare it themselves:

```cue
import "strings"

"inject-tenant-context": {
  attributes: {
    scope:  "Application"
    global: true
  }
  description: "Inject tenant name into workflow context for tenant namespaces."
  type: "policy"
}

template: {
  parameter: {}

  config: {
    enabled: strings.HasPrefix(context.namespace, "tenant-")
  }

  output: {
    ctx: {
      // Strips the "tenant-" prefix to give workflow steps the bare tenant name
      // e.g. namespace "tenant-acme" → context.custom.tenant = "acme"
      tenant: strings.TrimPrefix(context.namespace, "tenant-")
    }
  }
}
```

Workflow steps can then reference `context.custom.tenant` to drive tenant-specific behaviour, such as selecting a target cluster or looking up configuration, without any change to the Application definition.

## Global Policies

A **global policy** is evaluated against every Application without developers declaring it in `spec.policies`. Whether it applies to a given Application is still controlled by `config.enabled` in the CUE template, so global policies can be selective. This is the primary way platform teams enforce organisation-wide standards.

Add `global: true` to the definition attributes and apply the definition to `vela-system`:

```cue
"platform-labels": {
  attributes: {
    scope:  "Application"
    global: true
  }
  description: "Add platform-managed-by label to all Applications."
  type: "policy"
}

template: {
  parameter: {}

  config: { enabled: true }

  output: {
    labels: {
      "platform.io/managed-by": "kubevela"
    }
  }
}
```

```bash
vela def apply platform-labels.cue -n vela-system
```

Two controller flags decide how far a platform's global policies reach. Both are off by default, which makes global policies platform-wide and mandatory:

| Chart value (controller flag) | Off (default) | On |
|---|---|---|
| `controllerArgs.allowNamespaceGlobalPolicies` (`--allow-namespace-global-policies`) | Only global policies in `vela-system` apply. See [Namespace Override Pattern](#namespace-override-pattern) for what happens to one elsewhere. | A global policy in another namespace applies to the Applications in that namespace, and overrides a `vela-system` policy of the same name there. |
| `controllerArgs.allowSkipGlobalPolicies` (`--allow-skip-global-policies`) | Global policies are mandatory. An Application cannot opt out, and a global policy that fails holds the Applications it covers. See [Mandatory Global Policies](#mandatory-global-policies). | An Application can opt out with `policy.oam.dev/skip-global`, and a global policy that fails is skipped for that render. |

How changes to a global policy reach Applications that are already running is covered in [Rolling Out Policy Changes](./policy-rollout.md).

### Priority

When multiple global policies apply, `priority` controls execution order. **Lower values run first** (priority `1` runs before priority `100`). Policies with the same priority execute alphabetically by name.

Policies execute in a chain: each policy receives the Application as it was left by the previous policy. This means `output.labels` and `output.annotations` accumulate across policies, while `output.components`, `output.workflow`, and `output.policies` set by an earlier policy will be what later policies see in `context.appComponents`, `context.appWorkflow`, and `context.appPolicies`.

This allows policies to be stacked and composed, but platform teams must be deliberate about execution order:

- **Foundation policies** (low priority, e.g. `1`–`10`) should establish baseline values: security annotations, required labels, compliance markers
- **Specialisation policies** (higher priority, e.g. `50`–`100`) can build on or refine those values for specific teams or environments
- When two policies set the same label or annotation, the **last policy to run wins**, so use priority to make this deterministic

```cue
"security-hardening": {
  attributes: {
    scope:    "Application"
    global:   true
    priority: 1   // Runs first: establishes the security baseline
  }
  description: "Enforce security annotations on all Applications."
  type: "policy"
}
```

:::caution
Avoid having two global policies at the same priority level modify the same fields. The alphabetical tiebreaker makes this technically deterministic but fragile: a policy rename could silently change the outcome. Use distinct priority values to make ordering explicit.
:::

### Namespace Override Pattern

:::warning Needs `--allow-namespace-global-policies`
This pattern only works when the controller runs with `controllerArgs.allowNamespaceGlobalPolicies=true`. With the default (`false`):

- creating a global PolicyDefinition outside `vela-system`, or switching `global` on for one, is refused by the webhook:

  ```
  global policy tenant/tags must be in the vela-system namespace: global policies apply platform-wide (requestUID=...)
  ```

- a global PolicyDefinition that already exists outside `vela-system` does not apply. Updates to it are admitted with a warning saying so, and each Application in its namespace gets a `GlobalPolicyIgnored` Warning event;
- for the Applications it used to cover, it counts as a deleted policy, and its labels come off following the [rollout settings](./policy-rollout.md#new-policy-versions).
:::

With the flag on, a namespace becomes a unit of policy customisation. Platform teams define cluster-wide defaults in `vela-system`, and individual teams or environments override specific policies in their own namespace:

- A `compliance` policy in `vela-system` enforces production security standards cluster-wide
- The `dev` namespace overrides `compliance` with a relaxed version suited to development
- The `team-a` namespace overrides `platform-labels` to add team-specific labelling

Create a definition with the **same name** in a specific namespace to override the cluster-wide version for Applications in that namespace:

```cue
// Applied cluster-wide: vela def apply environment-config.cue -n vela-system
"environment-config": {
  attributes: {
    scope:    "Application"
    global:   true
    priority: 50
  }
  description: "Set environment label for all Applications."
  type: "policy"
}

template: {
  parameter: {}
  config: { enabled: true }
  output: {
    labels: { "environment": "production" }
  }
}
```

```cue
// Namespace override: vela def apply environment-config.cue -n dev
// The definition name matches the vela-system version, so it takes precedence for the dev namespace
"environment-config": {
  attributes: {
    scope:    "Application"
    global:   true
    priority: 50
  }
  description: "Set environment label for dev namespace Applications."
  type: "policy"
}

template: {
  parameter: {}
  config: { enabled: true }
  output: {
    labels: { "environment": "development" }
  }
}
```

Applications in the `dev` namespace get `environment: development`; all other namespaces get `environment: production`.

## Mandatory Global Policies

With `controllerArgs.allowSkipGlobalPolicies` off (the default), every global policy that applies to an Application is mandatory: rendering on without it would deploy resources missing what it adds, such as identity labels. So when a global policy fails to load or render, for example because a ConfigMap it reads has gone missing:

- **An Application that already has a revision is held at it.** It keeps running and reconciling (health, resync, its current workflow), but cuts no new revision: an author's edit waits until the policy renders again. Its `GlobalPolicies` condition is `False`, with a message naming the policy and the error, and it gets a `GlobalPolicyHeld` Warning event on each reconcile.
- **An Application with no revision yet fails** to reconcile, with an error naming the policy, until the policy renders.

Once the policy renders again, the held Application picks up where it was: the waiting edit is deployed with the policy's current output, and the condition returns to `True`.

```bash
kubectl get application payments -o jsonpath='{.status.conditions[?(@.type=="GlobalPolicies")]}'
```

```json
{"type":"GlobalPolicies","status":"False","reason":"ReconcileError","message":"failed to render global policy \"tenant-identity\", which is mandatory: ..."}
```

:::warning One broken global policy holds every Application it covers
A global policy in `vela-system` usually applies to every Application in the cluster. If it reads something that disappears, or its template fails for some Application shapes, all of those Applications stop taking changes until it is fixed. Test a global policy change before applying it, keep what it reads highly available, and use `config.enabled` to limit it to the Applications that need it.
:::

With `controllerArgs.allowSkipGlobalPolicies` on, a global policy that fails is skipped for that render instead, with a `GlobalPolicyFailed` Warning event, and the Application deploys without it.

## Using CueX in Policies

Policy templates have access to [CueX](../cue/external-packages.md) providers, such as `vela/kube` (`kube.#Get`, `kube.#List`) and `vela/http` (`http.#Do`), enabling them to read Kubernetes resources or call external APIs as part of policy evaluation. This makes it possible to enrich the Application context with data sourced from outside the Application itself.

Global policies cannot accept `parameter` values: there is no `spec.policies` entry where a developer can supply `properties`. Any configuration a global policy needs must come from the policy template itself, from Kubernetes resources read via `kube.#Get`, or derived from context variables such as `context.namespace` or `context.appLabels`.

### Security Considerations

Policy templates execute with the KubeVela controller's service account, which typically has broad cluster access. This gives platform teams a powerful tool for abstracting infrastructure concerns: policies can read Secrets, ConfigMaps, custom resources, and external APIs on behalf of every Application in the cluster.

With this power comes responsibility:

- **Treat policy templates as privileged code.** A policy that reads a Secret and injects its values into Application labels or context is effectively exposing that data to any workflow step or observer with access to the Application. Be deliberate about what is injected and where it ends up.
- **Limit what global policies expose.** Prefer injecting only the derived values needed (e.g. an owner name, an environment tag) rather than raw secret data or full resource contents.
- **Audit policy changes carefully.** Because global policies apply to every Application in their scope, a change to a global policy template is a cluster-wide change. Treat policy definition updates with the same review process as controller configuration changes.
- **Use `config.enabled` to scope impact.** Restrict CueX calls to only the Applications that need them, reducing both the blast radius of errors and unnecessary load on external endpoints.

### Reading Namespace Labels

A common pattern is reading labels from the Application's namespace to derive environment or team configuration without requiring developers to duplicate that information in every Application. This example reads the namespace resource and propagates its labels into workflow context:

```cue
import "vela/kube"

"inject-namespace-context": {
  attributes: {
    scope:  "Application"
    global: true
  }
  description: "Inject namespace labels into workflow context."
  type: "policy"
}

template: {
  parameter: {}

  // Read the namespace the Application is deployed into
  _ns: kube.#Get & {
    $params: {
      resource: {
        apiVersion: "v1"
        kind:       "Namespace"
        metadata: name: context.namespace
      }
    }
  }

  config: { enabled: true }

  output: {
    // Propagate namespace labels as Application labels
    labels: _ns.$returns.metadata.labels

    // Make namespace labels available to workflow steps
    ctx: {
      namespaceLabels: _ns.$returns.metadata.labels
    }
  }
}
```

### Enriching Context from an External API

Policies can call external APIs to fetch data that should be applied universally across Applications. This example calls a [Backstage](https://backstage.io) catalog API to look up the component entry for the Application and inject ownership and system membership as labels. The Backstage URL is read from a ConfigMap in `vela-system` rather than a parameter, since global policies cannot accept user-supplied values:

```cue
import (
  "vela/kube"
  "vela/http"
  "encoding/json"
)

"inject-backstage-ownership": {
  attributes: {
    scope:  "Application"
    global: true
  }
  description: "Fetch team ownership from Backstage and inject as labels."
  type: "policy"
}

template: {
  parameter: {}

  // Read Backstage URL from a platform ConfigMap in vela-system
  _config: kube.#Get & {
    $params: {
      resource: {
        apiVersion: "v1"
        kind:       "ConfigMap"
        metadata: {
          name:      "platform-config"
          namespace: "vela-system"
        }
      }
    }
  }

  _backstageURL: _config.$returns.data["backstageURL"]

  // Look up the component in the Backstage catalog by Application name
  _entity: http.#Do & {
    $params: {
      method: "GET"
      url:    "\(_backstageURL)/api/catalog/entities/by-name/component/default/\(context.name)"
      request: header: Accept: "application/json"
    }
  }

  _component: json.Unmarshal(_entity.$returns.body)

  config: { enabled: true }

  output: {
    labels: {
      "backstage.io/owner":  _component.spec.owner
      "backstage.io/system": _component.spec.system
    }
    ctx: {
      owner:  _component.spec.owner
      system: _component.spec.system
    }
  }
}
```

:::caution
A failed call fails the policy's render. For a global policy that holds every Application it covers (see [Mandatory Global Policies](#mandatory-global-policies)); for an explicit policy it fails the Application's reconcile. A slow call delays reconciliation for every Application the policy applies to. Make sure the endpoint or resource is highly available, and use `config.enabled` to restrict the policy to the Applications where the call is expected to succeed.
:::

KubeVela caches policy results, so CueX actions are not re-evaluated on every reconcile. A policy is rendered again when the Application changes or the cache entry expires (after one minute). A changed result is a data change, which reaches running Applications as described in [Rolling Out Policy Changes](./policy-rollout.md#data-changes).

## Opting Out of Global Policies

An Application can opt out of all global policies with the annotation `policy.oam.dev/skip-global: "true"`, **only while the controller runs with `controllerArgs.allowSkipGlobalPolicies=true`**:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: special-application
  namespace: default
  annotations:
    policy.oam.dev/skip-global: "true"
spec:
  components:
    - name: my-component
      type: webservice
      properties:
        image: nginx:latest
```

Only the policies declared in its `spec.policies` are then processed for this Application.

With the default (`false`), global policies are mandatory:

- **Adding the annotation is refused** while Application-scoped and global policies are enabled. With either feature gate off the annotation has no effect, and is admitted.

  ```
  metadata.annotations[policy.oam.dev/skip-global]: Forbidden: global platform policies are mandatory; applications cannot opt out of them
  ```

- **An Application that already carries it stays updatable**, but the annotation is ignored. The Application takes the global policies at its next revision, and gets a `GlobalPolicySkipIgnored` Warning event.

:::caution Check opted-out Applications before turning skips off
An Application that carried `skip-global` before an upgrade, or before an operator turned `allowSkipGlobalPolicies` off, starts receiving every global policy (labels, context, spec rewrites) at its next revision, with no action from its owner. Find them first:

```bash
kubectl get applications -A -o json | jq -r '.items[] | select(.metadata.annotations["policy.oam.dev/skip-global"] == "true") | "\(.metadata.namespace)/\(.metadata.name)"'
```
:::

## Inspecting Applied Policies

Use the `vela policy` commands to inspect which policies were applied to an Application.

View all policies with their status:

```bash
vela policy view my-app
```

```
+---+----------------+----------------+-------------+----------+---------+
| # |     POLICY     |      TYPE      |  NAMESPACE  |  SOURCE  | ENABLED |
+---+----------------+----------------+-------------+----------+---------+
| 1 | platform-labels| platform-labels| vela-system | global   | Yes     |
| 2 | team-labels    | add-team-labels| default     | explicit | Yes     |
+---+----------------+----------------+-------------+----------+---------+
```

Include per-policy details: the labels, annotations, context and spec changes each policy injected, its effective [rollout settings](./policy-rollout.md), and its [context schema](./policy-context-schema.md):

```bash
vela policy view my-app --details
```

Filter to a specific policy:

```bash
vela policy view my-app -p platform-labels --details
```

Include the final outcome (merged labels, annotations, context, and spec after all policies have run):

```bash
vela policy view my-app --outcome
```

Get structured output for scripting or CI:

```bash
vela policy view my-app --details --outcome -o json
```

Dry-run and preview the effect of policies on a deployed Application without applying changes:

```bash
vela policy dry-run my-app
```

Or test locally with a YAML file without deploying to the cluster:

```bash
vela policy dry-run -f my-app.yaml
```

Both `view` and `dry-run` support the same `--details`, `--outcome`, `-p`, and `-o` flags for consistent output across live and simulated policy inspection.

Which global policies apply depends on the controller's `--allow-namespace-global-policies` and `--allow-skip-global-policies` flags, which the CLI cannot read, so pass the controller's values to `dry-run`. See [Previewing with `vela policy dry-run`](./policy-rollout.md#previewing-with-vela-policy-dry-run).

## Versioning PolicyDefinitions

Application-scoped policies support [definition versioning](../x-def-version.md). Each ApplicationRevision records the PolicyDefinition versions it was rendered with. A new revision (an Application spec change, its first deployment, or a `publishVersion` bump) takes the latest versions. Between revisions, whether a running Application adopts a new version is decided by its [rollout settings](./policy-rollout.md#new-policy-versions); with the defaults, it keeps the recorded version and reports the newer one as pending.

For production use cases, pin explicit policies to a specific version with the `@version` suffix. `@v2` names the DefinitionRevision `add-team-labels-v2` when one exists; for a definition with semantic versions (`spec.version`), it resolves to the newest `2.x`, so pin the full version (`@v2.1.0`) to hold it. A pinned explicit policy is not changed by updates to its PolicyDefinition:

```yaml
policies:
  - name: team-labels
    type: add-team-labels@v2
    properties:
      team: platform-team
```

Global policies always resolve to the latest PolicyDefinition version; pinning is not supported, since they represent universal governance standards. An update to a global policy reaches every Application in its scope, at each Application's next revision or sooner if its rollout settings adopt it. Treat global policy updates with the same care as any breaking change: test them, and roll them out deliberately.

## Summary

| Concept | Description |
|---|---|
| `attributes.scope: "Application"` | Marks a PolicyDefinition as Application-scoped |
| `attributes.global: true` | Auto-applies to all Applications without user declaration |
| `attributes.priority` | Execution order; lower value runs first |
| `config.enabled` | Skip policy when this CUE expression evaluates to `false` |
| `output.labels` / `output.annotations` | Merged into Application metadata |
| `output.components` / `output.workflow` / `output.policies` | Replace corresponding spec fields |
| `output.ctx` | Read by components, traits and workflow steps as `context.custom` |
| `config.applyPolicyUpdates` / `config.applyDataChanges` / `config.autoRevision` | Per-policy [rollout settings](./policy-rollout.md#where-a-setting-comes-from) |
| `schema: ctx` | Declares the shape of `output.ctx`; see [Typed Policy Context](./policy-context-schema.md) |
| `policy.oam.dev/skip-global: "true"` | Opts an Application out of all global policies, only with `--allow-skip-global-policies` |
| `policy.oam.dev/apply-policy-updates` / `policy.oam.dev/apply-data-changes` / `policy.oam.dev/auto-revision` | Application annotations that override the rollout settings; see the [annotation reference](./policy-rollout.md#annotations-and-labels) |
| `--allow-namespace-global-policies` / `--allow-skip-global-policies` | Controller flags that let global policies live outside `vela-system`, and let Applications opt out (default `false`) |
