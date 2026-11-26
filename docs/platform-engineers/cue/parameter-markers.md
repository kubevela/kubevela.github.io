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
| `// +ignore` | Any field | Hides the field from `vela show`, the generated reference docs and `vela init`'s prompts |
| `// +ui:<key>=<value>` | Any field | Tells VelaUX how to show the field in its form; see [UI hints](#ui-hints) |

Definitions that extend another definition have two more markers, `// +final` on a field and `// +required` on an output. See [Definition Inheritance](./definition-inheritance.md#mark-fields-final-and-outputs-required).

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

## The `+ignore` Marker

The `// +ignore` marker hides a parameter from the CLI: `vela show`, the reference docs `vela def doc-gen` generates, and the prompts of `vela init`. Use it for a field the platform sets and end users shouldn't need to see. The field is still part of the definition: an Application can set it, and it stays in the OpenAPI schema.

```cue
template: {
    parameter: {
        // +usage=Container image to run
        image: string
        // +ignore
        // +usage=Sidecar image, set by the platform team
        sidecarImage: *"registry.example.com/proxy:1.4" | string
    }
}
```

## UI hints

A `// +ui:<key>=<value>` line tells VelaUX how to render the parameter in the form it builds from the definition. Put one hint per line, next to `+usage`. KubeVela copies the hints into the `x-vela-ui` extension of the parameter's OpenAPI schema, and applies them to the default UI schema it generates for VelaUX. An unknown key is ignored. The hints need KubeVela 1.12 and a VelaUX that reads them; every key is listed in [`+ui:` markers](/velaux/extend/ui-schema#ui-markers).

```cue
template: {
    parameter: {
        // +usage=Database password
        // +ui:type=Password
        // +ui:section=Database
        password: string

        // +usage=Ports to expose
        // +ui:format=table
        // +ui:rowKey=port
        ports: [...{
            port:     int
            protocol: *"TCP" | "UDP"
        }]

        // +usage=Extra annotations for the Deployment
        // +ui:advanced
        annotations?: [string]: string
    }
}
```

| Hint | Value | Effect |
| --- | --- | --- |
| `type` | A VelaUX widget name, such as `Input`, `Password`, `Select`, `Switch` or `KV` | Overrides the widget the field's type implies |
| `label` | Text | The field's label, in place of its capitalised name |
| `placeholder` | Text | Shown in an empty input |
| `error` | Text | The message shown when a value fails the field's constraints, in place of one naming the raw constraint |
| `section` | A section name | Shows the field in that collapsible section of the form |
| `advanced` | None, or `true` | Puts the field behind the Advanced toggle. Once any field in a form sets it, only those that do are hidden |
| `hidden` | None, or `true` | Leaves the field out of the form |
| `order` | A number | Places the field at that position among its siblings, ahead of declaration order |
| `colSpan` | A number | The field's width in the form's responsive layout |
| `format` | `table` | Lays out a list of structs as a table, one row per item |
| `rowKey` | A field name | For a list, the field that identifies a row: unique, and the row's title |
| `itemLabel` | A field name | For a list, the field that titles each item |
| `optionsFrom` | `configs:<template>`, `clusters` or `envs` | Reads the field's choices when the form opens |
| `suggest` | Comma-separated values | Offers these values without limiting the field to them |
| `expression` | `never` | The field must be a literal value, even in an Application that uses `$( )` expressions |

## Next

- [Generating OpenAPI Schema](../openapi-v3-json-schema.md)
- [Managing Definitions](./definition-edit.md)