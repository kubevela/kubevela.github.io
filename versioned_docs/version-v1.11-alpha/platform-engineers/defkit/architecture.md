---
title: Architecture
---

defkit sits between your Go platform code and the KubeVela controller. It compiles Go method chains into CUE templates, which the controller evaluates at runtime to produce Kubernetes resources.

## End-to-End Flow

### Platform Engineer Flow (Authoring)

1. **Go Code** (defkit fluent API) — You write Go using method chains to declare parameters, workload types, and template functions.
2. **defkit SDK** (Compiles to CUE) — defkit introspects the builder chain and emits a CUE template string.
3. **CUE Template** (X-Definition YAML) — The generated CUE is embedded in a Kubernetes CRD manifest (`ComponentDefinition`, `TraitDefinition`, etc.).
4. **KubeVela** (Controller evaluates) — The KubeVela controller stores the definition and evaluates it when an Application references it.
5. **Kubernetes** (Resources applied) — The evaluated output is applied as standard Kubernetes resources (Deployments, Services, etc.).

### Application Author Flow (Runtime)

When an end user submits an Application YAML:

1. **App Author** submits an Application YAML referencing a definition by name.
2. **CUE Eval** — The controller injects the Application's component parameters into the CUE template.
3. **Rendered** — CUE evaluation produces concrete Kubernetes manifests.
4. **ResourceTracker** — The controller tracks all rendered resources for lifecycle management (garbage collection, updates).
5. **Health Check** — Status is evaluated against the health policy to determine if the component is `Healthy`, `DispatchHealthy`, or `Unhealthy`.

## What defkit Generates

Every definition built with defkit implements the `Definition` interface — the contract between your Go code and the KubeVela CLI/controller:

| Method | Purpose |
|---|---|
| `DefName()` | The definition's name (e.g. `"webservice"`, `"scaler"`). Used as the Kubernetes CR name. |
| `DefType()` | The definition type: `component`, `trait`, `policy`, or `workflow-step`. |
| `ToCue()` | Generates the complete CUE template string consumed by the controller. |
| `ToYAML()` | Generates the full Kubernetes CR YAML (`ComponentDefinition`, `TraitDefinition`, etc.). |
| `GetPlacement()` | Returns cluster placement constraints (RunOn / NotRunOn). |
| `HasPlacement()` | Whether the definition has any placement constraints. |

The CLI command `vela def apply-module` compiles your Go module, calls `ToJSON()` on all registered definitions, and applies the resulting CRs to the cluster — you never invoke these methods directly.

## Health Evaluation

defkit's Health DSL generates `status.healthPolicy` and `status.customStatus` CUE blocks. At runtime, the controller evaluates these against the deployed resource to determine component health. Use preset builders like `DeploymentHealth()` for common workloads or compose custom expressions with the [Health & Status DSL](./health-status-dsl.md).

## Related

- [Integration](./integration.md) — go.mod setup, module structure, CLI commands
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Quick Start](./quick-start.md) — get started in 4 steps
