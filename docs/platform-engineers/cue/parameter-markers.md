---
title: Parameter Markers
---

KubeVela supports special comment markers in CUE `parameter` blocks that control how parameters behave at runtime. These markers are recognised by the KubeVela controller and its admission webhook.

## Available Markers

| Marker | Applies to | Effect |
|--------|-----------|--------|
| `// +usage=<description>` | Any field | Sets the human-readable description shown in the UI and `vela show` output |
| `// +short=<alias>` | Any field | Provides a short alias for the field name |
| `// +immutable` | Any field | Prevents the field from being changed or removed after the Application is first created |

## The `+usage` Marker

The `// +usage=<description>` marker sets the human-readable description for a parameter field. This description is shown in the output of `vela show` and in the VelaUX UI.

```cue
template: {
    parameter: {
        // +usage=The container image to run, e.g. nginx:1.21
        image: string
        // +usage=Number of replicas to run
        replicas: *1 | int
    }
}
```

```shell
$ vela show my-component
# Properties
+----------+----------------------------+--------+----------+---------+
|   NAME   |        DESCRIPTION         |  TYPE  | REQUIRED | DEFAULT |
+----------+----------------------------+--------+----------+---------+
| image    | The container image to run | string | true     |         |
| replicas | Number of replicas to run  | int    | false    | 1       |
+----------+----------------------------+--------+----------+---------+
```

## The `+short` Marker

The `// +short=<alias>` marker sets a short alias for a field name, stored in the parameter metadata and available to tooling that builds on the KubeVela API.

```cue
template: {
    parameter: {
        // +usage=The container image to run
        // +short=i
        image: string
    }
}
```

## The `+immutable` Marker

The `// +immutable` marker prevents a parameter field from being mutated once it has been set in an Application. This is useful for fields that should be fixed for the lifetime of a workload, such as a tenant identifier or a target cluster.

### Marking a field as immutable

Add `// +immutable` as a comment on the line immediately before the field declaration in the `parameter` block:

```cue
"my-component": {
    type: "component"
    ...
}
template: {
    parameter: {
        // +usage=The tenant this workload belongs to — cannot be changed after creation
        // +immutable
        tenant: string

        // +usage=Container image (mutable)
        image: string
    }
}
```

### Nested fields

`// +immutable` can be applied to individual fields within a nested struct. Only the marked field is frozen — sibling fields remain mutable:

```cue
template: {
    parameter: {
        governance: {
            // +immutable
            tenant: string    // frozen
            region: string    // still mutable
        }
        image: string         // still mutable
    }
}
```

Marking a struct field itself (rather than a leaf) freezes the entire subtree:

```cue
template: {
    parameter: {
        // +immutable
        governance: {
            tenant: string    // frozen (entire struct is frozen)
            region: string    // frozen
        }
    }
}
```

### Validation behaviour

When an Application is updated, the validating webhook checks all `// +immutable` fields:

- **Field unchanged** — allowed
- **Field not yet set** — first-time population is always allowed
- **Field changed** — rejected with an error showing the current and attempted values:
  ```
  spec.components[0].properties[governance.tenant]: Forbidden: immutable field cannot be changed (current: "acme", new: "other")
  ```
- **Field removed** — rejected with an error showing the current value

### Bypassing immutability

In exceptional cases (e.g. a controlled migration), you can bypass all immutability checks by adding the `app.oam.dev/force-param-mutations: "true"` annotation to the Application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
  annotations:
    app.oam.dev/force-param-mutations: "true"
spec:
  ...
```

Remove the annotation after the update to re-enable immutability enforcement.

### OpenAPI schema extension

When KubeVela generates the OpenAPI v3 schema for a definition (stored in the `schema-<name>` ConfigMap), fields marked `// +immutable` will have the `x-immutable: true` extension set on their schema entry.

## Next

- [Generating OpenAPI Schema](../openapi-v3-json-schema.md)
- [Managing Definitions](./definition-edit.md)