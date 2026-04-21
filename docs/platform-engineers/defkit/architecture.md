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

## Module Structure

<details>
<summary>Module directory layout</summary>

```shell
my-platform/
├── module.yaml              # Module metadata (name, description, version)
├── go.mod
├── go.sum
├── cmd/register/main.go     # Registry entry point — imports all packages
├── components/
│   ├── webservice.go        # ComponentDefinition — Deployment workload
│   ├── worker.go            # ComponentDefinition — background worker
│   └── statefulset.go       # ComponentDefinition — StatefulSet workload
├── traits/
│   ├── env.go               # TraitDefinition — environment variables
│   ├── scaler.go            # TraitDefinition — replica scaling
│   └── hpa.go               # TraitDefinition — HPA autoscaling
├── policies/
│   ├── override.go          # PolicyDefinition — parameter override
│   └── garbage-collect.go   # PolicyDefinition — GC policies
└── workflowsteps/
    ├── deploy.go             # WorkflowStepDefinition — deploy step
    └── apply-object.go      # WorkflowStepDefinition — apply K8s object
```

</details>

## Registration Pattern

Each definition file self-registers via `init()`. The `cmd/register/main.go` entry point uses blank imports to trigger all `init()` calls, then calls `defkit.ToJSON()` to export all registered definitions.

<details>
<summary>Definition file example</summary>

```go title="definition file"
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func Webservice() *defkit.ComponentDefinition {
    return defkit.NewComponent("webservice").
        Description("...").
        Workload("apps/v1", "Deployment").
        Params(...)
}

// init() is called automatically on import
func init() {
    defkit.Register(Webservice())
}
```

</details>

<details>
<summary>cmd/register/main.go</summary>

```go title="cmd/register/main.go"
package main

import (
    "fmt"
    "github.com/oam-dev/kubevela/pkg/definition/defkit"

    // Blank imports trigger init() in each package,
    // registering all definitions automatically
    _ "my-platform/components"
    _ "my-platform/traits"
    _ "my-platform/policies"
    _ "my-platform/workflowsteps"
)

func main() {
    // Exports all registered definitions as JSON
    fmt.Println(defkit.ToJSON())
}
```

</details>

## Related

- [Integration](./integration.md) — go.mod setup and package structure
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Quick Start](./quick-start.md) — get started in 4 steps
