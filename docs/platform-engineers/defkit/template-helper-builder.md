---
title: Helper Builder
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The helper builder computes derived CUE array variables from array parameters — filtering, renaming fields, and applying conditionals — without writing raw CUE strings. Helpers are emitted as named list comprehensions at the top of the `template:` block and can be referenced by name in resource `.Set()` calls.

## Method Reference

### HelperBuilder Chain Methods

| Method | Description |
|---|---|
| `.From(source Value)` | Sets a single source collection (e.g. a parameter list). |
| `.FromFields(source, fields...)` | Uses multiple named sub-fields of a single source object. Each sub-field is iterated separately; results are combined. Use with `Pick`, `PickIf`, `MapBySource`. |
| `.FromArray(ab *ArrayBuilder)` | Uses a pre-built `ArrayBuilder` as the helper source. Enables guard+filter patterns not expressible via the standard pipeline. |
| `.FromHelper(helper *HelperVar)` | Chains from another helper's output for multi-step transformations. |
| `.Guard(cond)` | Wraps the for comprehension in an outer `if cond` guard. Evaluates to empty when the condition is false. |
| `.Filter(pred)` | Keeps only items where the predicate matches. Generates `if v.field == value` in the for loop. |
| `.FilterCond(cond)` | Keeps only items where the condition holds. Generates a CUE condition expression in the for loop. |
| `.Map(mappings FieldMap)` | Transforms each item using field mappings. Use `FieldRef("f")`, `Optional("f")`, `FieldRef("f").Or(...)` as values. |
| `.Pick(fields...)` | Selects only the named fields from each item. Works with `FromFields` (MultiSource). |
| `.PickIf(cond, field)` | Conditionally includes a field when the condition is true. Works with `FromFields` (MultiSource). |
| `.MapBySource(map[string]FieldMap)` | Applies different field mappings per source field. Works with `FromFields`. |
| `.Wrap(key)` | Wraps each item under a new key. Transforms `"val"` → `{key: "val"}`. |
| `.Rename(from, to)` | Renames a field in each item. |
| `.Dedupe(keyField)` | Removes duplicate items based on a key field. |
| `.DefaultField(field, default)` | Provides a default value for a potentially missing field. |
| `.AfterOutput()` | Places this helper after the `output:` block in generated CUE. Use when the helper feeds `outputs:` (auxiliary resources) rather than the primary `output:`. |
| `.Build() *HelperVar` | Finalizes the helper, registers it with the template, and returns a `*HelperVar` reference. |

### FieldMap Value Constructors

| Function | Description |
|---|---|
| `defkit.FieldRef("field")` | References `v.field` from the current item. |
| `defkit.FieldRef("f").Or(fallback)` | Emits `*v.f \| fallback` — CUE default syntax for absent fields. |
| `defkit.Optional("field")` | Generates `if v.field != _\|_ { name: v.field }` — conditional inclusion. |
| `defkit.Format("port-%v", FieldRef("port"))` | Formats a string value using item fields. Generates `strconv.FormatInt(...)` for numeric args. |

### Helper Construction Helpers

| Function | Description |
|---|---|
| `HelperStruct(fields ...StructFieldDef)` | Constructs a CUE struct value for use inside `Each()` callbacks. |
| `HelperField(name, value Value)` | Defines an unconditional field within a `HelperStruct()`. |
| `HelperFieldIf(cond, name, value)` | Defines a conditional field within a `HelperStruct()`. |
| `Item() *ItemValue` | References the current iteration item inside `Each()`. Chain `.Get(field)` to access a field. |
| `ItemFieldIsSet(field) Condition` | Returns a condition checking if a field exists on the current item. Generates `v.field != _\|_`. |

### Specialized Helper Entry Points on `*Template`

| Method | Description |
|---|---|
| `tpl.Helper(name) *HelperBuilder` | General-purpose helper. Returns a `*HelperBuilder` you configure with the chain methods above, then finalize with `.Build()`. |
| `tpl.StructArrayHelper(name, source)` | Splits a struct parameter's sub-fields into separate typed arrays — one per sub-field, named by the field. |
| `tpl.ConcatHelper(name, source)` | Concatenates arrays from a `StructArrayHelper` into one flat list via `list.Concat`. Chain `.Fields(...)` to specify which sub-arrays to join. |
| `tpl.DedupeHelper(name, source)` | Deduplicates items from another helper by a key field. Chain `.ByKey("name")` to pick the dedup key. |

`StructArrayHelper` → `ConcatHelper` → `DedupeHelper` is the canonical pipeline for heterogeneous volume mount patterns: split by type, join into one list, remove duplicates.

### `*HelperVar` Methods

| Method | Description |
|---|---|
| `helper.NotEmpty() Condition` | Returns a condition that checks `len(helper) != 0`. Use with `tpl.OutputsIf` to emit an auxiliary resource only when the helper is non-empty. |

## Working Example 1 — `port-service` Component

Demonstrates `tpl.Helper()` with a single-source `From()` pipeline:

- **`From` + `Guard`** — source `parameter.ports`, guard against the param being absent.
- **`Map` + `FieldRef` + `Optional`** — rename `port → containerPort`; include `name` and `protocol` only when set.
- **`Filter(FieldEquals(...))`** — keep only items where `v.expose == true`.
- **`FieldRef("name").Or(Format(...))`** — service port name falls back to `"port-<N>"` when absent.
- **`AfterOutput()`** — `exposedPorts` helper is placed after `output:` because it feeds `outputs:`.
- **`helper.NotEmpty()`** — emit the `Service` only when at least one port is exposed.

Verified with `vela def validate-module ./my-platform` against KubeVela v1.11.0-alpha.3.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func PortService() *defkit.ComponentDefinition {
	image := defkit.String("image").
		Description("Container image")
	replicas := defkit.Int("replicas").Default(1).
		Description("Replica count")
	ports := defkit.List("ports").Optional().
		Description("Port list. Set expose:true on a port to include it in the Service")

	return defkit.NewComponent("port-service").
		Description("Deployment with a companion Service for every exposed port").
		Workload("apps/v1", "Deployment").
		Params(image, replicas, ports).
		Template(portServiceTemplate)
}

func portServiceTemplate(tpl *defkit.Template) {
	vela     := defkit.VelaCtx()
	image    := defkit.String("image")
	replicas := defkit.Int("replicas")
	ports    := defkit.List("ports").Optional()

	// From+Guard+Map: all ports → container port shape.
	// Optional("field") generates `if v.field != _|_ { field: v.field }`.
	containerPorts := tpl.Helper("containerPorts").
		From(ports).
		Guard(ports.IsSet()).
		Map(defkit.FieldMap{
			"containerPort": defkit.FieldRef("port"),
			"protocol":      defkit.Optional("protocol"),
			"name":          defkit.Optional("name"),
		}).
		Build()

	// From+Guard+Filter+Map: expose:true ports only → Service port shape.
	// Filter(Predicate): generates `if v.expose == true` in the for loop.
	// FieldRef.Or(Format(...)): name falls back to "port-<N>" when absent.
	// AfterOutput: placed after output: because it feeds outputs:.
	exposedPorts := tpl.Helper("exposedPorts").
		From(ports).
		Guard(ports.IsSet()).
		Filter(defkit.FieldEquals("expose", true)).
		Map(defkit.FieldMap{
			"port":       defkit.FieldRef("port"),
			"targetPort": defkit.FieldRef("port"),
			"name":       defkit.FieldRef("name").Or(defkit.Format("port-%v", defkit.FieldRef("port"))),
		}).
		AfterOutput().
		Build()

	dep := defkit.NewResource("apps/v1", "Deployment").
		Set("metadata.name", vela.Name()).
		Set("spec.replicas", replicas).
		Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
		Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
		Set("spec.template.spec.containers[0].name", vela.Name()).
		Set("spec.template.spec.containers[0].image", image).
		SetIf(ports.IsSet(), "spec.template.spec.containers[0].ports", containerPorts)
	tpl.Output(dep)

	// OutputsIf + NotEmpty: emit Service only when len(exposedPorts) != 0.
	svc := defkit.NewResource("v1", "Service").
		Set("metadata.name", vela.Name()).
		Set("spec.selector[app.oam.dev/component]", vela.Name()).
		Set("spec.ports", exposedPorts)
	tpl.OutputsIf(exposedPorts.NotEmpty(), "service", svc)
}

func init() { defkit.Register(PortService()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
import (
	"strconv"
)

"port-service": {
	type: "component"
	annotations: {}
	labels: {}
	description: "Deployment with a companion Service for every exposed port"
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
	}
}
template: {
	containerPorts: [
		if parameter["ports"] != _|_ for v in parameter.ports {
			containerPort: v.port
			if v.name != _|_ {
				name: v.name
			}
			if v.protocol != _|_ {
				protocol: v.protocol
			}
		},
	]
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: {
			name: context.name
		}
		spec: {
			replicas: parameter.replicas
			selector: matchLabels: "app.oam.dev/component": context.name
			template: {
				metadata: labels: "app.oam.dev/component": context.name
				spec: containers: [{
					name:  context.name
					image: parameter.image
					if parameter["ports"] != _|_ {
						ports: containerPorts
					}
				}]
			}
		}
	}
	exposedPorts: [
		if parameter["ports"] != _|_ for v in parameter.ports if v.expose == true {
			name:       *v.name | "port-" + strconv.FormatInt(v.port, 10)
			port:       v.port
			targetPort: v.port
		},
	]
	outputs: {
		if len(exposedPorts) != 0 {
			service: {
				apiVersion: "v1"
				kind:       "Service"
				metadata: name: context.name
				spec: {
					selector: "app.oam.dev/component": context.name
					ports: exposedPorts
				}
			}
		}
	}
	parameter: {
		// +usage=Container image
		image: string
		// +usage=Replica count
		replicas: *1 | int
		// +usage=Port list. Set expose:true on a port to include it in the Service
		ports?: [..._]
	}
}
```

</TabItem>
</Tabs>

**`ports` absent**: `containerPorts` and `exposedPorts` evaluate to `[]`; the Deployment has no `ports:` field; the `if len(exposedPorts) != 0` guard collapses and no Service is emitted.

**`ports` present, none with `expose:true`**: `containerPorts` is populated and set on the Deployment; `exposedPorts` is `[]`; the `len` guard collapses and no Service is emitted.

**`ports` present, some with `expose:true`**: `containerPorts` populates all container ports; `exposedPorts` contains only the exposed subset; the `len` guard passes and the Service is emitted with those ports. Each exposed port's `name` defaults to `"port-<N>"` when not explicitly set.

## Working Example 2 — `volume-worker` Component

Demonstrates the `StructArrayHelper` → `ConcatHelper` → `DedupeHelper` compositional pipeline:

- **`StructArrayHelper` + `Field(FieldMap)`** — splits `parameter.volumeMounts` into typed sub-arrays (`pvc`, `configMap`, `secret`). Each sub-array generates `fieldName: *[for v in source.field { mapping }] | []`; the `*[...] | []` default means an absent sub-field safely yields `[]`.
- **`Optional("field")` in FieldMap** — `subPath` is included only when set on the item.
- **`ConcatHelper` + `Fields(...)`** — joins the typed sub-arrays into one flat list via `list.Concat`.
- **`DedupeHelper` + `ByKey("name")`** — removes duplicate entries using CUE's double-loop `_ignore` pattern; earlier entries win.

Verified with `vela def validate-module ./my-platform` against KubeVela v1.11.0-alpha.3.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func VolumeWorker() *defkit.ComponentDefinition {
	image := defkit.String("image").
		Description("Container image")
	volumeMounts := defkit.Object("volumeMounts").Optional().
		Description("Volume mounts keyed by type (pvc, configMap, secret)")

	return defkit.NewComponent("volume-worker").
		Description("Deployment with heterogeneous volume mounts deduped by name").
		Workload("apps/v1", "Deployment").
		Params(image, volumeMounts).
		Template(volumeWorkerTemplate)
}

func volumeWorkerTemplate(tpl *defkit.Template) {
	vela         := defkit.VelaCtx()
	image        := defkit.String("image")
	volumeMounts := defkit.Object("volumeMounts").Optional()

	// StructArrayHelper: expands each type-keyed sub-array into a typed output array.
	// Each Field() call generates: name: *[for v in source.name { mapping }] | []
	// Optional("subPath") generates: if v.subPath != _|_ { subPath: v.subPath }
	mountsArray := tpl.StructArrayHelper("mountsArray", volumeMounts).
		Field("pvc", defkit.FieldMap{
			"name":      defkit.FieldRef("name"),
			"mountPath": defkit.FieldRef("mountPath"),
			"subPath":   defkit.Optional("subPath"),
		}).
		Field("configMap", defkit.FieldMap{
			"name":      defkit.FieldRef("name"),
			"mountPath": defkit.FieldRef("mountPath"),
		}).
		Field("secret", defkit.FieldMap{
			"name":      defkit.FieldRef("name"),
			"mountPath": defkit.FieldRef("mountPath"),
		}).
		Build()

	// ConcatHelper: joins the typed sub-arrays into one flat list.
	// Generates: mountsList: list.Concat([mountsArray.pvc, mountsArray.configMap, mountsArray.secret])
	mountsList := tpl.ConcatHelper("mountsList", mountsArray).
		Fields("pvc", "configMap", "secret").
		Build()

	// DedupeHelper: removes duplicates by name. Earlier entries win.
	// Generates the double-loop _ignore pattern for CUE-native deduplication.
	uniqueMounts := tpl.DedupeHelper("uniqueMounts", mountsList).
		ByKey("name").
		Build()

	tpl.Output(
		defkit.NewResource("apps/v1", "Deployment").
			Set("metadata.name", vela.Name()).
			Set("spec.template.spec.containers[0].name", vela.Name()).
			Set("spec.template.spec.containers[0].image", image).
			SetIf(volumeMounts.IsSet(), "spec.template.spec.containers[0].volumeMounts", uniqueMounts),
	)
}

func init() { defkit.Register(VolumeWorker()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
import (
	"list"
)

"volume-worker": {
	type: "component"
	annotations: {}
	labels: {}
	description: "Deployment with heterogeneous volume mounts deduped by name"
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
	}
}
template: {
	mountsArray: {
		pvc: *[
			for v in parameter.volumeMounts.pvc {
			{
				mountPath: v.mountPath
				name:      v.name
				if v.subPath != _|_ {
					subPath: v.subPath
				}
			}
			},
		] | []

		configMap: *[
			for v in parameter.volumeMounts.configMap {
			{
				mountPath: v.mountPath
				name:      v.name
			}
			},
		] | []

		secret: *[
			for v in parameter.volumeMounts.secret {
			{
				mountPath: v.mountPath
				name:      v.name
			}
			},
		] | []
	}
	mountsList: list.Concat([mountsArray.pvc, mountsArray.configMap, mountsArray.secret])
	uniqueMounts: [
		for val in [
			for i, vi in mountsList {
				for j, vj in mountsList if j < i && vi.name == vj.name {
					_ignore: true
				}
				vi
			},
		] if val._ignore == _|_ {
			val
		},
	]
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: name: context.name
		spec: template: spec: containers: [{
			name:  context.name
			image: parameter.image
			if parameter["volumeMounts"] != _|_ {
				volumeMounts: uniqueMounts
			}
		}]
	}
	parameter: {
		// +usage=Container image
		image: string
		// +usage=Volume mounts keyed by type (pvc, configMap, secret)
		volumeMounts?: {...}
	}
}
```

</TabItem>
</Tabs>

**`volumeMounts` absent**: `parameter["volumeMounts"] != _|_` is false; `volumeMounts:` is not emitted on the container.

**`volumeMounts` present, some sub-fields absent**: The `*[...] | []` default on each `mountsArray` sub-field means `parameter.volumeMounts.secret` not being set still yields `mountsArray.secret = []`, so `list.Concat` never sees `_|_`.

**Duplicate names across sub-fields**: If a PVC and a ConfigMap mount both use the name `"data"`, the `uniqueMounts` double-loop suppresses the later occurrence. Earlier entries in `mountsList` win.

:::note Pattern example — pod volumes not included
This component sets `volumeMounts` on the container but does **not** define the corresponding `spec.template.spec.volumes` entries in the Deployment. Kubernetes requires every `volumeMount.name` to match a volume in `spec.template.spec.volumes`, so the Deployment above cannot be applied as-is.

The example is intentionally scoped to demonstrating the `StructArrayHelper → ConcatHelper → DedupeHelper` pipeline. In production use, wire up the pod-level volumes by either:
- Extending this component template with additional `.Set("spec.template.spec.volumes[...]", ...)` calls for each volume type, or
- Using a companion trait that injects the volume specs alongside the mounts.
:::

## Reproduce

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
vela def apply-module ./my-platform --conflict overwrite
```

## Related

- [Template Output Methods](./template-output-methods.md) — `tpl.Output` / `tpl.Outputs` / `tpl.OutputsIf` for emitting resources
- [Template Patch Methods](./template-patch-methods.md) — `tpl.Patch()` / `tpl.PatchStrategy()` for trait patch templates
- [WorkflowStep Actions](./template-workflowstep-actions.md) — `tpl.Builtin` / `tpl.SuspendIf` for workflow step templates
