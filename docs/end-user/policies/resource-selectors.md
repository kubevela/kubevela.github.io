---
title: Resource Selectors
---

Several policies act on only some of the resources an Application creates: `apply-once`, `garbage-collect`, `read-only`, `take-over`, `shared-resource` and `resource-update`. Each of their rules picks its resources with the same `selector`.

| Field | Matches a resource when | Example |
| --- | --- | --- |
| `componentNames` | its `app.oam.dev/component` label is in the list, that is, it was rendered by one of these components | `["frontend", "backend"]` |
| `componentTypes` | its `workload.oam.dev/type` label is in the list, that is, its component has one of these types | `["webservice"]` |
| `oamTypes` | its `app.oam.dev/resourceType` label is in the list: `WORKLOAD` for a component's output, `TRAIT` for a trait's | `["TRAIT"]` |
| `traitTypes` | its `trait.oam.dev/type` label is in the list, that is, one of these traits rendered it | `["gateway"]` |
| `resourceTypes` | its `kind` is in the list | `["Deployment", "ConfigMap"]` |
| `resourceNames` | its `metadata.name` is in the list | `["hello-world"]` |

How a selector matches:

- Within one field, any listed value matches.
- Across fields, every field you set must match. `componentNames: ["backend"]` with `resourceTypes: ["Service"]` selects only the Service the `backend` component created.
- A selector with no fields set matches nothing.

For example, this `apply-once` rule leaves `spec.replicas` alone on the Deployment of the `hello-world` component only:

```yaml
policies:
  - name: apply-once
    type: apply-once
    properties:
      enable: true
      rules:
        - selector:
            componentNames: ["hello-world"]
            resourceTypes: ["Deployment"]
          strategy:
            path: ["spec.replicas"]
```
