---
title: Register & Output
---

`defkit.Register(def)` auto-registers a definition when its package is imported. Call it in `init()` so the registration happens automatically when the package is blank-imported. The output methods generate different representations of the definition.

## defkit.Register and init()

The registration pattern relies on Go's `init()` function, which runs automatically when a package is imported. By calling `defkit.Register()` inside `init()`, each definition self-registers without any explicit wiring:

```go title="Go — defkit"
func Webservice() *defkit.ComponentDefinition {
    // ...
    return defkit.NewComponent("webservice").
        Workload("apps/v1", "Deployment").
        Params(image, replicas).
        Template(webserviceTemplate)
}

// Auto-register when package is imported
func init() { defkit.Register(Webservice()) }
```

The `cmd/register/main.go` entry point uses blank imports to trigger all `init()` calls across every package:

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

`defkit.ToJSON()` serializes all registered definitions into a JSON payload that `vela def apply-module` reads to apply definitions to the cluster.

## Output Methods

All four definition types expose the same set of output methods:

| Method | Return | Description |
|---|---|---|
| `.ToCue() string` | `string` | Generate the CUE definition as a string. |
| `.ToCueWithImports(imports...) string` | `string` | Generate CUE with explicit import declarations appended. |
| `.ToYAML() ([]byte, error)` | `[]byte, error` | Generate the Kubernetes YAML manifest for the definition CRD. |
| `.ToParameterSchema() string` | `string` | Generate only the parameter CUE block (without the full definition). |

## Example Usage

```go title="Go — defkit"
func Webservice() *defkit.ComponentDefinition {
    // ...
    return defkit.NewComponent("webservice").
        Workload("apps/v1", "Deployment").
        Params(image, replicas).
        Template(webserviceTemplate)
}

// Auto-register when package is imported
func init() { defkit.Register(Webservice()) }

// Generate output programmatically
comp := Webservice()

cue         := comp.ToCue()               // CUE definition string
cueWithImps := comp.ToCueWithImports("strconv", "strings")
yamlBytes, err := comp.ToYAML()           // Kubernetes YAML manifest
schema      := comp.ToParameterSchema()   // parameter block only
```

```cue title="Output context"
// defkit.Register() is called in init():
// - cmd/register/main.go imports all packages
// - Blank imports trigger init() which calls Register()
// - defkit.ToJSON() then exports all registered defs
//
// ToCue() output:
webservice: {
    type: "component"
    ...
}
template: { ... }
//
// ToYAML() output:
// apiVersion: core.oam.dev/v1beta1
// kind: ComponentDefinition
// metadata: name: webservice
// spec: schematic: cue: template: "..."
//
// ToParameterSchema() output:
// parameter: { image: string, replicas: *1 | int }
```

:::tip
`ToCue()` and `ToYAML()` are useful in unit tests to assert on the generated output without a live cluster. Use them with `go test` to verify that parameter defaults, types, and structure match expectations.
:::

## Related

- [Architecture](./architecture.md) — how the registration pipeline works end-to-end
- [Integration](./integration.md) — `cmd/register/main.go` and `vela def apply-module`
- [ComponentDefinition](./definition-component.md) — component-specific output methods
