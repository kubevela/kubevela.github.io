---
title: Context Reference
---

Every definition template can read `context`, the runtime data KubeVela fills in when it renders: which Application, where it is going, which component or step is being rendered. What `context` holds depends on the kind of definition. This page lists every field and where you can read it.

## Fields

A tick means the field is set when that kind of definition renders. The columns are:

- **Component**: a ComponentDefinition template.
- **Trait**: a TraitDefinition template. A trait renders against its component's context and adds to it.
- **Policy**: a PolicyDefinition rendered into resources, as in [Custom Policy](./policy/custom-policy.md).
- **App-scoped policy**: an [Application-scoped policy](./policy/application-scoped-policy.md), which changes the Application before it renders.
- **Workflow step**: a WorkflowStepDefinition template, as the step runs.
- **Source**: a SourceDefinition template. A source reads only the fields its cache key can include, and only those its consumer has: a source read from a component can read `componentName`, one read from a workflow step can't.

| Field | Type | Meaning | Component | Trait | Policy | App-scoped policy | Workflow step | Source |
| --- | --- | --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `context.name` | string | What is being rendered; see [What `context.name` means](#what-contextname-means) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.appName` | string | The Application's name | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.namespace` | string | The namespace being rendered for: the Application's, or the one a `topology` policy places the component in | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.appNamespace` | string | The Application's own namespace, wherever the component is placed | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.cluster` | string | The cluster being rendered for; `local` is the hub. A policy always reads `local` | ✓ | ✓ | ✓ | | | ✓ |
| `context.clusterVersion` | struct | `major`, `minor` (int), `gitVersion` and `platform` of the target cluster, or of the hub where there is no target | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.appRevision` | string | Name of the current ApplicationRevision | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.appRevisionNum` | int | Number of the current ApplicationRevision | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.appLabels` | map | The Application's labels | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.appAnnotations` | map | The Application's annotations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.publishVersion` | string | The `app.oam.dev/publishVersion` annotation, when set | ✓ | ✓ | ✓ | | ✓ | ✓ |
| `context.workflowName` | string | The `app.oam.dev/workflowName` annotation, when set | ✓ | ✓ | ✓ | | ✓ | ✓ |
| `context.custom` | any | Data an Application-scoped policy published; absent unless one did | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `context.componentName` | string | The component being rendered | ✓ | ✓ | | | | ✓ |
| `context.componentType` | string | The component's type | ✓ | ✓ | | | | ✓ |
| `context.revision` | string | Name of the component's revision | ✓ | ✓ | | | | ✓ |
| `context.replicaKey` | string | The replica key, set by the [`replication`](./components/replication.md) policy | ✓ | ✓ | | | | ✓ |
| `context.components` | list | The Application's `spec.components` | ✓ | ✓ | ✓ | | | |
| `context.traitType` | string | The trait's type | | ✓ | | | | ✓ |
| `context.output` | object | The component's workload as rendered; the live object in a [`PostDispatch` trait](./traits/postdispatch-traits.md) | | ✓ | | | | |
| `context.outputs.<name>` | object | The component's other resources, by their name in its `outputs` | | ✓ | | | | |
| `context.artifacts` | object | The rendered resources of every component, as `<component>.workload` and `<component>.traits.<type>.<name>` | | | ✓ | | | |
| `context.policyName` | string | The policy's name in `spec.policies` | | | ✓ | ✓ | | ✓ |
| `context.policyType` | string | The policy's type | | | ✓ | ✓ | | ✓ |
| `context.policyRevision` | int | The PolicyDefinition's revision, when it is versioned | | | | ✓ | | |
| `context.policyRevisionName` | string | Name of that DefinitionRevision | | | | ✓ | | |
| `context.policyRevisionHash` | string | Hash of the policy template | | | | ✓ | | |
| `context.appComponents` | list | `spec.components` of the Application | | | | ✓ | | |
| `context.appWorkflow` | object | `spec.workflow` of the Application | | | | ✓ | | |
| `context.appPolicies` | list | `spec.policies` of the Application | | | | ✓ | | |
| `context.stepName` | string | The step being run | | | | | ✓ | ✓ |
| `context.stepType` | string | The step's type, for a source read from a step's properties | | | | | | ✓ |
| `context.stepSessionID` | string | The step's ID in the workflow status | | | | | ✓ | |
| `context.spanID` | string | The trace ID of this reconcile, for logs | | | | | ✓ | |
| `context.each` | struct | Inside a `forEach`: `item`, `index` and `key` of the current pass | | | | | ✓ | |

A component or trait's health policy and custom status read `context.output` and `context.outputs` too, as the live objects; see [Definition Health & Status](./status/definition_health_status.md).

## What `context.name` means

`context.name` is the name of the thing being rendered, which differs by kind:

| Kind | `context.name` is |
| --- | --- |
| Component | The component |
| Trait | The component the trait is attached to (a trait has no name of its own; read `context.traitType`) |
| Policy | The policy |
| App-scoped policy | The Application |
| Workflow step | The Application (read `context.stepName` for the step) |
| Source | The `spec.sources[]` entry being resolved |

Where you mean a particular one, read the explicit field: `context.appName`, `context.componentName`, `context.policyName` or `context.stepName`.

## Use the cluster version

`context.clusterVersion` lets one definition work across Kubernetes versions. This picks the PodDisruptionBudget API by the target cluster's minor version:

```cue
outputs: pdb: {
	if context.clusterVersion.minor < 21 {
		apiVersion: "policy/v1beta1"
	}
	if context.clusterVersion.minor >= 21 {
		apiVersion: "policy/v1"
	}
	kind: "PodDisruptionBudget"
}
```

Or match on the distribution through `gitVersion`:

```cue
import "strings"

if strings.Contains(context.clusterVersion.gitVersion, "k3s") {
	provider: "k3s"
}
```
