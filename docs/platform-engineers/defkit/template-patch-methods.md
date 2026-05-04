---
title: Trait Patch Methods
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Traits in KubeVela mutate an already-rendered workload by emitting a `patch:` block rather than a new `output:`. This page covers all methods for building trait patches — the template-level entry points on `*defkit.Template`, the field-setter methods on `*PatchResource`, and the high-level `tpl.UsePatchContainer()` helper for container-targeting traits.

## Method Reference

### Template Entry Points

| Method | Description |
|---|---|
| `tpl.Patch() *PatchResource` | Returns or creates the trait's `patch:` block builder. Chain `.Set()`, `.SetIf()`, `.SpreadIf()`, `.If()/.EndIf()`, and patch-specific methods. |
| `tpl.PatchStrategy(strategy)` | Sets the patch merge strategy comment: `"retainKeys"`, `"jsonMergePatch"`, or `"jsonPatch"`. |
| `tpl.SetRawPatchBlock(block)` | Escape hatch: replaces the builder-generated patch output with raw CUE. The string must start with `patch:`. |
| `tpl.UsePatchContainer(config)` | High-level helper for traits that patch individual containers. Generates the full `patchSets` / `patch` CUE block with container targeting, optional multi-container support, and field declarations. |

### PatchResource Methods

These methods are available on the `*PatchResource` returned by `tpl.Patch()`.

| Method | Description |
|---|---|
| `.Set(path, value)` | Sets a field in the patch. Generates `patch: path: value`. |
| `.SetIf(cond, path, value)` | Conditionally sets a patch field. Generates `if cond { patch: path: value }`. |
| `.SpreadIf(cond, path, value)` | Conditionally spreads a map value into a path. Use for merging labels, annotations. |
| `.If(cond)` / `.EndIf()` | Opens/closes a conditional block where all enclosed patch operations share the same condition. |
| `.ForEach(source, path)` | Iterates over a map and spreads each key-value pair into the path. Generates `for k, v in source { (k): v }`. |
| `.PatchKey(path, key, elements...)` | Adds `// +patchKey=key` directive and array elements. For strategic merge patch by key field (e.g. `name` for containers). |
| `.SpreadAll(path, elements...)` | Applies each element as a spread constraint on every item in the target array. |
| `.PatchStrategyAnnotation(path, strategy)` | Adds `// +patchStrategy=strategy` comment at the given path. |
| `.Passthrough()` | Generates `patch: parameter` — the entire parameter becomes the patch. |

## Working Example 1 — `pod-metadata` Trait

The `pod-metadata` trait demonstrates `tpl.PatchStrategy()`, `.SetIf()`, and `.If()` / `.ForEach()` / `.EndIf()` in a single coherent trait:

- **Always** — emits `// +patchStrategy=jsonMergePatch` on the patch block.
- **`serviceAccountName` provided** — sets `spec.template.spec.serviceAccountName` via `.SetIf()`.
- **`labels` provided** — iterates each key-value pair into `spec.template.metadata.labels` via `.If()` / `.ForEach()` / `.EndIf()`.

The Go on the left and the CUE on the right are byte-for-byte what `vela def gen-module ./my-platform` produces for this trait. Verified by running `vela def validate-module ./my-platform` against KubeVela v1.11.0-alpha.3.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func PodMetadata() *defkit.TraitDefinition {
	serviceAccountName := defkit.String("serviceAccountName").Optional().
		Description("Service account to bind to the pod")
	labels := defkit.StringKeyMap("labels").Optional().
		Description("Labels to merge into the pod template")

	return defkit.NewTrait("pod-metadata").
		Description("Merge labels into the pod template and optionally bind a service account").
		AppliesTo("deployments.apps").
		PodDisruptive(false).
		Params(serviceAccountName, labels).
		Template(podMetadataTemplate)
}

func podMetadataTemplate(tpl *defkit.Template) {
	serviceAccountName := defkit.String("serviceAccountName").Optional()
	labels             := defkit.StringKeyMap("labels").Optional()

	tpl.PatchStrategy("jsonMergePatch")
	tpl.Patch().
		SetIf(serviceAccountName.IsSet(),
			"spec.template.spec.serviceAccountName", serviceAccountName).
		If(labels.IsSet()).
		ForEach(labels, "spec.template.metadata.labels").
		EndIf()
}

func init() { defkit.Register(PodMetadata()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"pod-metadata": {
	type: "trait"
	annotations: {}
	labels: {}
	description: "Merge labels into the pod template and optionally bind a service account"
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: {
	// +patchStrategy=jsonMergePatch
	patch: spec: template: {
		if parameter["serviceAccountName"] != _|_ {
			spec: serviceAccountName: parameter.serviceAccountName
		}
		if parameter["labels"] != _|_ {
			metadata: labels: {
				for k, v in parameter.labels {
					(k): v
				}
			}
		}
	}
	parameter: {
		// +usage=Service account to bind to the pod
		serviceAccountName?: string
		// +usage=Labels to merge into the pod template
		labels?: [string]: string
	}
}
```

</TabItem>
</Tabs>

**`serviceAccountName` provided** (`serviceAccountName: my-sa`): the `if` guard evaluates true and `spec.template.spec.serviceAccountName: my-sa` is written into the patch. **Omitted**: the field is absent from the patch — it is left untouched on the workload.

**`labels` provided** (`labels: {team: backend}`): the `ForEach` emits `team: backend` into `spec.template.metadata.labels`. **Omitted**: the `if` guard collapses to nothing — no labels are patched.

## Working Example 2 — `inject-env` Trait

The `inject-env` trait demonstrates `PatchKey`, `NewArray().ForEach()`, and `.If()` / `.Set()` / `.EndIf()` in a single coherent trait:

- **Always** — merges env vars into a named container via `PatchKey` (strategic-merge by `name`).
- **`debug: true`** — additionally sets `spec.template.metadata.annotations.debug: "enabled"` via an `.If()` / `.Set()` / `.EndIf()` block.

The Go on the left and the CUE on the right are byte-for-byte what `vela def gen-module ./my-platform` produces for this trait.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func InjectEnv() *defkit.TraitDefinition {
	containerName := defkit.String("containerName").
		Description("Name of the target container")
	env := defkit.Array("env").
		Description("Environment variables to inject — list of {name, value} pairs")
	debug := defkit.Bool("debug").Default(false).
		Description("Add debug: enabled annotation to the pod")

	return defkit.NewTrait("inject-env").
		Description("Inject env vars into a named container, with optional debug annotation").
		AppliesTo("deployments.apps").
		PodDisruptive(false).
		Params(containerName, env, debug).
		Template(injectEnvTemplate)
}

func injectEnvTemplate(tpl *defkit.Template) {
	containerName := defkit.String("containerName")
	env           := defkit.Array("env")
	debug         := defkit.Bool("debug")

	envElem := defkit.NewArrayElement().
		Set("name", defkit.Reference("m.name")).
		Set("value", defkit.Reference("m.value"))

	containerElem := defkit.NewArrayElement().
		Set("name", containerName).
		Set("env", defkit.NewArray().ForEach(env, envElem))

	tpl.Patch().
		PatchKey("spec.template.spec.containers", "name", containerElem).
		If(debug.IsTrue()).
		Set("spec.template.metadata.annotations.debug", defkit.Lit("enabled")).
		EndIf()
}

func init() { defkit.Register(InjectEnv()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"inject-env": {
	type: "trait"
	annotations: {}
	labels: {}
	description: "Inject env vars into a named container, with optional debug annotation"
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: {
	patch: spec: template: {
		spec: {
			// +patchKey=name
			containers: [{
				env: [
					for m in parameter.env {
						{
							name:  m.name
							value: m.value
						}
					},
				]
				name: parameter.containerName
			}]
		}
		if parameter.debug {
			metadata: annotations: debug: "enabled"
		}
	}
	parameter: {
		// +usage=Name of the target container
		containerName: string
		// +usage=Environment variables to inject — list of {name, value} pairs
		env: [...]
		// +usage=Add debug: enabled annotation to the pod
		debug: *false | bool
	}
}
```

</TabItem>
</Tabs>

**`debug: false`** (default): the `if parameter.debug` block evaluates away — only the `PatchKey` containers merge is emitted. **`debug: true`**: same containers merge, plus `debug: enabled` annotation on the pod.

**`PatchKey` behaviour**: the `// +patchKey=name` directive tells the KubeVela strategic-merge engine to match by `name`. It finds the container named `parameter.containerName` and merges the `env` list into it — the rest of the container spec is left untouched.

## Reproduce

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
vela def apply-module ./my-platform --conflict overwrite
```

## Pass-through: `Patch().Passthrough()`

When a trait's parameter schema already matches the patch shape verbatim, `Passthrough()` emits `patch: parameter`, promoting the entire parameter block to be the patch.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
tr := defkit.NewTrait("ex-passthrough").
    AppliesTo("deployments.apps").
    Params(defkit.Struct("patch").Optional()).
    Template(func(tpl *defkit.Template) {
        tpl.Patch().Passthrough()
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    patch: parameter
}
```

</TabItem>
</Tabs>

## Raw CUE: `tpl.SetRawPatchBlock()`

Escape hatch for patches the fluent builder can't express cleanly (nested patchKeys, custom strategic merge, complex comprehensions). The string you pass is dropped into the template verbatim — it **must** begin with `patch:`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
containerName := defkit.String("containerName")
env := defkit.List("env").Optional()

tr := defkit.NewTrait("ex-raw-patch").
    AppliesTo("deployments.apps").
    Params(containerName, env).
    Template(func(tpl *defkit.Template) {
        tpl.SetRawPatchBlock(`patch: spec: template: spec: {
    containers: [{
        name: parameter.containerName
        env:  parameter.env
    }]
}`)
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    patch: spec: template: spec: {
        containers: [{
            name: parameter.containerName
            env:  parameter.env
        }]
    }
}
```

</TabItem>
</Tabs>

## Container Patching: `tpl.UsePatchContainer()`

High-level helper for traits that patch individual containers. Generates the full `patchSets` / `patch` CUE block with container targeting, optional multi-container support, and field declarations. Use when your trait mutates container fields (env, resources, image, ports, security context, etc.).

### Context Introspection

| Function | Description |
|---|---|
| `ContextOutput() *ContextOutputRef` | Returns a reference to the primary output resource (`context.output`). Chain with `.Field(path)` to access fields or `.HasPath(path)` for existence conditions. |

### PatchField Methods

| Method | Description |
|---|---|
| `PatchField(name)` | Defines a single patch field for container mutation. Returns a builder — chain the methods below, call `.Build()` to finalise. |
| `.Target(t)` | Sets the target container field name. |
| `.Default(val)` | Sets the CUE default value. |
| `.Type(t)` / `.Int()` / `.Bool()` / `.Str()` / `.StringArray()` | Sets the parameter type. |
| `.Strategy(s)` | Sets a patch strategy on the field. |
| `.IsSet()` / `.NotEmpty()` | Adds a presence or non-empty condition. |
| `.Eq(val)` / `.Ne(val)` / `.Gt(val)` / `.Gte(val)` / `.Lt(val)` / `.Lte(val)` | Adds a value-comparison condition. |
| `.RawCondition(c)` | Sets an arbitrary raw CUE condition string. |
| `.Description(d)` | Sets the `+usage` description. |
| `.Build()` | Finalises the field and returns the `PatchContainerField`. |

### Convenience Conditions

| Function | Description |
|---|---|
| `ParamIsSet(name)` | Standalone condition: true when the named parameter is provided. Generates `parameter["name"] != _\|_`. |
| `ParamNotSet(name)` | Standalone condition: true when the named parameter is not provided. |
| `ContextOutputExists(path)` | Condition checking if a path exists on the primary output resource. Generates `context.output.path != _\|_`. |
| `AllConditions(conditions...)` | Combines multiple conditions with logical AND. |

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func EnvPatch() *defkit.TraitDefinition {
    return defkit.NewTrait("env-patch").
        Description("Inject environment variables into a named container").
        AppliesTo("deployments.apps").
        PodDisruptive(false).
        Template(envPatchTemplate)
}

func envPatchTemplate(tpl *defkit.Template) {
    tpl.UsePatchContainer(defkit.PatchContainerConfig{
        ContainerNameParam:   "containerName",
        DefaultToContextName: true,
        PatchFields: []defkit.PatchContainerField{
            {
                ParamName:   "env",
                TargetField: "env",
                ParamType:   "[string]: string",
                Description: "Environment variables to inject",
            },
        },
        CustomPatchContainerBlock: `_params: #PatchParams
name: _params.containerName
env: [for k, v in _params.env { name: k, value: v }]`,
    })
}

func init() { defkit.Register(EnvPatch()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated (illustrative)">

```cue
#PatchParams: {
    containerName?: *context.name | string
    env: [string]: string
}

patchSets: [{
    name: "container-patch"
    patches: [...]
}]
patch: { ... }
```

</TabItem>
</Tabs>

:::info
`UsePatchContainer` handles the boilerplate of container selection, multi-container iteration, and patchSets generation. Reserve `tpl.Patch().PatchKey()` for cases where you need direct control over the patch structure.
:::

## Related

- [Template Output Methods](./template-output-methods.md) — `tpl.Output()` / `tpl.Outputs()` / `tpl.OutputsIf()` / `tpl.OutputsGroupIf()`
- [Resource Builder](./resource-builder.md) — full `*Resource` and `*ArrayBuilder` API reference
- [TraitDefinition](./definition-trait.md) — full trait example combining `Patch()` with `Outputs()`
