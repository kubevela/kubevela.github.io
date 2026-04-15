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

`EnableGlobalPolicies` is only required if you want to use [global policies](#global-policies). `EnableApplicationScopedPolicies` is required for all application-scoped policy functionality.

If you encounter any issues, please [report them on GitHub](https://github.com/kubevela/kubevela/issues/new/choose).
:::

Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition.md) and [how to manage definitions](../cue/definition-edit.md) before continuing.

## How It Works

When KubeVela reconciles an Application, application-scoped policies run as a **pre-flight step** before the Application is revisioned and deployed. Each policy renders a CUE template and applies its `output` to the Application specification before it is processed.

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
| `output.ctx` | `{[string]: _}` | Passed to workflow steps as `context.custom` |

Labels and annotations are always merged with existing values. The `components`, `workflow`, and `policies` fields replace their corresponding sections entirely.

:::caution Advanced Use
`output.components`, `output.workflow`, and `output.policies` are powerful escape hatches that completely replace their respective fields on the Application. This means any components, workflow steps, or policies defined by the developer will be discarded and replaced by the policy output. This should be reserved for advanced platform use cases where the platform team needs full control over the Application structure. Use with care: later policies in the execution chain will also see the replaced values, and developers may find it difficult to reason about why their Application spec is not being honoured.

For most use cases, prefer `output.labels`, `output.annotations`, and `output.ctx` which safely merge with or extend existing values.
:::

### Example — Add Annotations

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
"tenant-config": {
  attributes: { scope: "Application" }
  description: "Inject tenant configuration for tenant namespaces only."
  type: "policy"
}

template: {
  import "strings"

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
| `context.policyName` | Name of the currently executing policy instance |
| `context.policyRevision` | Policy definition revision number (if versioned) |
| `context.policyRevisionName` | Policy DefinitionRevision resource name (if versioned) |
| `context.policyRevisionHash` | Policy template content hash (if versioned) |

Example — conditionally applying based on a label:

```cue
config: {
  enabled: context.appLabels["env"] == "production"
}
```

## Passing Context to Workflow Steps

Use `output.ctx` to pass computed values from the policy to workflow steps. These values are available as `context.custom.<key>` within workflow step CUE templates.

In this example, a global policy detects tenant namespaces and makes the tenant name available to workflow steps without developers needing to declare it themselves:

```cue
"inject-tenant-context": {
  attributes: {
    scope:  "Application"
    global: true
  }
  description: "Inject tenant name into workflow context for tenant namespaces."
  type: "policy"
}

template: {
  import "strings"

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

Workflow steps can then reference `context.custom.tenant` to drive tenant-specific behaviour such as selecting a target cluster or looking up configuration — without any change to the Application definition.

## Global Policies

A **global policy** is automatically evaluated against every Application — no need for developers to declare it in `spec.policies`. Whether it actually applies to a given Application is still controlled by `config.enabled` in the CUE template, so global policies can be selective. This is the primary way platform teams enforce organisation-wide standards. Add `global: true` to the definition attributes and apply the definition to `vela-system` for cluster-wide coverage, or to a specific namespace for namespace-scoped coverage.

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

Apply it to `vela-system` for cluster-wide coverage:

```bash
vela def apply platform-labels.cue -n vela-system
```

:::tip Namespace-scoped overrides
Global policies in `vela-system` apply cluster-wide as a baseline. A global policy deployed to a specific namespace with the same name will override the `vela-system` version for Applications in that namespace only.

This makes namespaces a natural unit of policy customisation. Platform teams can define cluster-wide defaults in `vela-system` and then let individual teams or environments override specific policies in their own namespace. For example:

- A `compliance` policy in `vela-system` enforces production security standards cluster-wide
- The `dev` namespace overrides `compliance` with a relaxed version suited to development
- The `team-a` namespace overrides `platform-labels` to add team-specific labelling

This pattern means a single cluster can serve multiple teams and environments with consistent baseline governance while still allowing controlled namespace-level customisation.
:::

### Priority

When multiple global policies apply, `priority` controls execution order. **Lower values run first** (priority `1` runs before priority `100`). Policies with the same priority execute alphabetically by name.

Policies execute in a chain — each policy receives the Application as it was left by the previous policy. This means `output.labels` and `output.annotations` accumulate across policies, while `output.components`, `output.workflow`, and `output.policies` set by an earlier policy will be what later policies see in `context.appComponents`, `context.appWorkflow`, and `context.appPolicies`.

This allows policies to be stacked and composed, but platform teams must be deliberate about execution order:

- **Foundation policies** (low priority, e.g. `1`–`10`) should establish baseline values — security annotations, required labels, compliance markers
- **Specialisation policies** (higher priority, e.g. `50`–`100`) can build on or refine those values for specific teams or environments
- When two policies set the same label or annotation, the **last policy to run wins** — use priority to make this deterministic

```cue
"security-hardening": {
  attributes: {
    scope:    "Application"
    global:   true
    priority: 1   // Runs first — establishes security baseline
  }
  description: "Enforce security annotations on all Applications."
  type: "policy"
}
```

:::caution
Avoid having two global policies at the same priority level modify the same fields. The alphabetical tiebreaker makes this technically deterministic but fragile — a policy rename could silently change the outcome. Use distinct priority values to make ordering explicit.
:::

### Namespace Override Pattern

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
// The definition name matches the vela-system version — it takes precedence for the dev namespace
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

## Using CueX in Policies

Policy templates have full access to [CueX](../cue/external-packages.md) providers, enabling them to read Kubernetes resources or call external APIs as part of policy evaluation. This makes it possible to enrich the Application context with data sourced from outside the Application itself.

:::note
Global policies cannot accept `parameter` values — there is no `spec.policies` entry where a developer can supply `properties`. Any configuration a global policy needs must come from the policy template itself, from Kubernetes resources read via `kube.#Read`, or derived from context variables such as `context.namespace` or `context.appLabels`.
:::

### Security Considerations

Policy templates execute with the KubeVela controller's service account, which typically has broad cluster access. This gives platform teams a powerful tool for abstracting infrastructure concerns — policies can read Secrets, ConfigMaps, custom resources, and external APIs on behalf of every Application in the cluster.

With this power comes responsibility:

- **Treat policy templates as privileged code.** A policy that reads a Secret and injects its values into Application labels or context is effectively exposing that data to any workflow step or observer with access to the Application. Be deliberate about what is injected and where it ends up.
- **Limit what global policies expose.** Prefer injecting only the derived values needed (e.g. an owner name, an environment tag) rather than raw secret data or full resource contents.
- **Audit policy changes carefully.** Because global policies apply to every Application in their scope, a change to a global policy template is a cluster-wide change. Treat policy definition updates with the same review process as controller configuration changes.
- **Use `config.enabled` to scope impact.** Restrict CueX calls to only the Applications that need them, reducing both the blast radius of errors and unnecessary load on external endpoints.

### Reading Namespace Labels

A common pattern is reading labels from the Application's namespace to derive environment or team configuration without requiring developers to duplicate that information in every Application. This example reads the namespace resource and propagates its labels into workflow context:

```cue
"inject-namespace-context": {
  attributes: {
    scope:  "Application"
    global: true
  }
  description: "Inject namespace labels into workflow context."
  type: "policy"
}

template: {
  import "vela/kube"

  parameter: {}

  // Read the namespace the Application is deployed into
  _ns: kube.#Read & {
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
    labels: _ns.$returns.value.metadata.labels

    // Make namespace labels available to workflow steps
    ctx: {
      namespaceLabels: _ns.$returns.value.metadata.labels
    }
  }
}
```

### Enriching Context from an External API

Policies can call external APIs to fetch data that should be applied universally across Applications. This example calls a [Backstage](https://backstage.io) catalog API to look up the component entry for the Application and inject ownership and system membership as labels. The Backstage URL is read from a ConfigMap in `vela-system` rather than a parameter, since global policies cannot accept user-supplied values:

```cue
"inject-backstage-ownership": {
  attributes: {
    scope:  "Application"
    global: true
  }
  description: "Fetch team ownership from Backstage and inject as labels."
  type: "policy"
}

template: {
  import (
    "vela/kube"
    "vela/http"
    "encoding/json"
  )

  parameter: {}

  // Read Backstage URL from a platform ConfigMap in vela-system
  _config: kube.#Read & {
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

  _backstageURL: _config.$returns.value.data["backstageURL"]

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
When calling external APIs or reading Kubernetes resources from a policy, ensure the endpoint is highly available. A failed or slow call will delay reconciliation for the Applications the policy applies to. Consider using `config.enabled` to restrict the policy to only Applications where the call is expected to succeed.

KubeVela includes a built-in policy result cache that prevents CueX actions from being re-evaluated on every reconciliation loop. Policy outputs are cached and only re-evaluated when the Application spec changes or the cache TTL expires, keeping reconciliation performance predictable even with external API calls.
:::

## Opting Out of Global Policies

An Application can opt out of all global policies with the annotation `policy.oam.dev/skip-global: "true"`:

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

Only explicitly declared policies in `spec.policies` will be processed for this Application.

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

Include per-policy details — labels, annotations, context, and spec diffs injected by each policy:

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

## Versioning PolicyDefinitions

Application-scoped policies support [definition versioning](../x-def-version.md). Once an ApplicationRevision is created, the PolicyDefinition version resolved at that point is locked for the lifetime of that revision. Updating the PolicyDefinition will not affect existing ApplicationRevisions — only new revisions (triggered by an Application spec change) will pick up the latest definition.

For production use cases, it is strongly recommended to pin explicit policies to a specific version using the `@version` suffix. This prevents a PolicyDefinition update from silently changing the behaviour of a deployed Application:

```yaml
policies:
  - name: team-labels
    type: add-team-labels@v2
    properties:
      team: platform-team
```

:::note Global policy versioning
Global policies always resolve to the latest available PolicyDefinition version; since they represent universal governance standards, pinning is not supported. This means updating a global PolicyDefinition will take effect on the next new ApplicationRevision for any Application it applies to.

As with explicit policies, the resolved version is locked for the duration of an ApplicationRevision. Platform Engineers should treat global policy updates with the same care as any breaking change — updating a global policy affects every Application in its scope, so changes should be tested and rolled out deliberately.
:::

## Summary

| Concept | Description |
|---|---|
| `attributes.scope: "Application"` | Marks a PolicyDefinition as application-scoped |
| `attributes.global: true` | Auto-applies to all Applications without user declaration |
| `attributes.priority` | Execution order; lower value runs first |
| `config.enabled` | Skip policy when this CUE expression evaluates to `false` |
| `output.labels` / `output.annotations` | Merged into Application metadata |
| `output.components` / `output.workflow` / `output.policies` | Replace corresponding spec fields |
| `output.ctx` | Passed to workflow steps as `context.custom` |
| `policy.oam.dev/skip-global: "true"` | Annotation to opt an Application out of all global policies |
| `policy.oam.dev/auto-revision: "true"` | When set on an Application, policy-driven spec changes (via `output.components`, `output.workflow`, or `output.policies`) will automatically create a new ApplicationRevision. Without this, spec changes from policies are ignored until the next deployment of the Application |
