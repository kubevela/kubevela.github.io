---
title: The Definition File
---

A definition is a Kubernetes object: a `ComponentDefinition`, `TraitDefinition`, `PolicyDefinition`, `WorkflowStepDefinition` or `SourceDefinition`. You can write it in two formats, and the docs use both:

- **Kubernetes YAML**, the object as the cluster stores it, with the CUE template as a string under `spec.schematic.cue.template`. You apply it with `kubectl apply` or `vela def apply`.
- **The CUE format**, a `.cue` file with the metadata in one block and the template as plain CUE. It's easier to write and to check, since the template is real CUE rather than a string. `vela def` converts it to YAML when you apply it.

## One definition, both formats

Here is the same trait in each format.

The CUE format, `my-labels.cue`:

```cue
"my-labels": {
	type:        "trait"
	description: "Add labels to the workload."
	labels: "category": "metadata"
	attributes: {
		appliesToWorkloads: ["deployments.apps"]
		podDisruptive: true
	}
}
template: {
	patch: spec: template: metadata: labels: parameter.labels
	parameter: labels: [string]: string
}
```

What `vela def render my-labels.cue` turns it into:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: Add labels to the workload.
  labels:
    custom.definition.oam.dev/category: metadata
  name: my-labels
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: spec: template: metadata: labels: parameter.labels
        parameter: labels: [string]: string
```

## How the fields map

| CUE format | Kubernetes YAML |
| --- | --- |
| The block's name, `"my-labels": {...}` | `metadata.name` |
| `type` (`component`, `trait`, `policy`, `workflow-step`, `source`, `workload`) | `kind` (`ComponentDefinition`, `TraitDefinition`, ...) |
| `description` | `metadata.annotations["definition.oam.dev/description"]` |
| `alias` | `metadata.annotations["definition.oam.dev/alias"]` |
| `annotations` | `metadata.annotations`; a key without `oam.dev` in it gets the prefix `custom.definition.oam.dev/` |
| `labels` | `metadata.labels`, prefixed the same way |
| `attributes` | `spec`, every field except `schematic` |
| `extends`, `abstract` | `spec.extends`, `spec.abstract` (also accepted under `attributes`, but not in both places) |
| `template` | `spec.schematic.cue.template`, as a string |
| `import` lines at the top of the file | The top of the template string |

Only CUE templates convert this way. A definition with a `terraform` schematic is written as YAML.

## Moving between them

| To | Run |
| --- | --- |
| See the YAML a CUE file becomes | `vela def render my-labels.cue` |
| Apply a CUE file to the cluster | `vela def apply my-labels.cue` |
| Print an installed definition in the CUE format | `vela def get my-labels` |
| Start a new definition in the CUE format | `vela def init my-labels -t trait` |

See [Manage Definition](../cue/definition-edit.md) for the full `vela def` workflow, and [OAM Definition Protocol](./x-definition.md) for the fields each kind of definition has.
