---
title: PolicyDefinition
---

`defkit.NewPolicy(name string) *PolicyDefinition` creates a PolicyDefinition builder. Policies are applied globally to applications and have no workload coupling. They control lifecycle behaviors like garbage collection, apply-once semantics, or override rules.

## Chain Methods

| Method | Description |
|---|---|
| `.Description(text)` | Human-readable description of the policy behavior. |
| `.Params(params...)` | Registers typed parameter definitions for the policy. |
| `.Helper(name, param)` | Registers a named helper variable for the template body. |

## Example

```go title="Go — defkit"
func ApplyOnce() *defkit.PolicyDefinition {
    enable := defkit.Bool("enable").Default(true).
        Description("Disable KubeVela from re-applying components on every reconcile")
    rules := defkit.Array("rules").Of(defkit.Struct("rule").
        WithFields(
            defkit.StringList("selector").Optional(),
        )).Optional()

    return defkit.NewPolicy("apply-once").
        Description("Prevent KubeVela from re-applying resources that already exist").
        Params(enable, rules)
}

func init() { defkit.Register(ApplyOnce()) }
```

```cue title="CUE — generated"
parameter: {
    // Disable KubeVela from re-applying components on every reconcile
    enable: *true | bool

    rules?: [...{
        selector?: [...string]
    }]
}
```

## Policy API Group

PolicyDefinitions are registered under `core.oam.dev/v1beta1`. Users reference policies by name in the `policies` section of an Application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  policies:
    - name: my-apply-once
      type: apply-once
      properties:
        enable: true
```

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Integration](./integration.md) — KubeVela ecosystem integration points
