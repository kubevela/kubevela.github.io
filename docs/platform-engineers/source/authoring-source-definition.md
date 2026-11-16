---
title: Authoring a SourceDefinition
---

This page is for platform engineers. A SourceDefinition holds arbitrary [CueX](../cue/basic.md) logic: it can make HTTP calls and read cluster resources, and its result is stored in the controller's cache. Publishing one is therefore a high-trust operation, comparable to writing a `ComponentDefinition`. An application author can bind a definition and supply its properties. They cannot change its logic or read anything outside its declared schema.

Before writing your own, check whether a [built-in source](./built-in-sources.md) already does the job.

## A complete example

Save this as `cluster-lookup.cue`:

```cue
import "vela/kube"

"cluster-lookup": {
	type: "source"
	annotations: {}
	labels: {}
	description: "Reads cluster-wide facts (region, zone, provider) from the cluster-info ConfigMap."
}

template: {
	// The output contract: the fields an Application may read with $(source...).
	schema: {
		region:   string
		zone:     string
		provider: string
	}

	// Optional cache preferences.
	storage: {
		storageTTL:     "15m"
		onStaleFailure: "use-stale"
	}

	// Inputs an application author supplies in spec.sources[].properties.
	parameter: {}

	// The fetch logic. It runs only on a cache miss or when the entry has expired.
	_clusterInfo: kube.#Get & {
		$params: {
			cluster: context.cluster
			resource: {
				apiVersion: "v1"
				kind:       "ConfigMap"
				metadata: {
					name:      "cluster-info"
					namespace: "kube-system"
				}
			}
		}
	}

	output: {
		region:   _clusterInfo.$returns.data["region"]
		zone:     _clusterInfo.$returns.data["zone"]
		provider: _clusterInfo.$returns.data["provider"]
	}
}
```

Apply it with `vela def apply`, not `kubectl apply`, because the file uses the `vela def` CUE format:

```bash
vela def apply cluster-lookup.cue
```

With no `-n`, the definition is installed in `vela-system`, and the controller reads it from there for an Application in any namespace. Applying with `vela def apply` also generates the cache key, see [The cache key is generated](#the-cache-key-is-generated).

You can write the resource as YAML instead, with the CUE under `spec.schematic.cue.template`. A YAML SourceDefinition must already carry the generated `$internal` block and its two `definition.oam.dev/cache-key-rules*` annotations, otherwise admission refuses it:

```text
SourceDefinition must declare a $internal block with a key field; apply it with `vela def apply` and one will be generated
```

The simplest way to get a correct YAML file is `vela def render cluster-lookup.cue`.

## The blocks of a definition

The `template` of a definition has four parts, and each is used at a different time.

| Block | Required | Purpose |
|---|---|---|
| `schema` | yes | The shape of `output`. It is both the contract application authors read against and the check the controller runs on the result |
| `storage` | no | Cache lifetime and stale-data policy. Fields: `storageTTL` (default `15m`) and `onStaleFailure` (`use-stale` or `fail`, default `use-stale`) |
| `parameter` | no | Inputs from `spec.sources[].properties` |
| `output` | yes | The resolved value, produced by CueX logic. Helper fields beginning with `_` are not part of it |

### `schema`

A definition without a non-empty `schema` is rejected at admission. The schema is used twice:

- **At admission**, the Application webhook checks that every expression reads a field the schema declares, and that the type of the expression fits the parameter it feeds.
- **At runtime**, the controller checks the resolved `output` against the schema as a *closed* struct. Every required field must be present and concrete, and a field the schema does not declare is an error. A failed check fails the resolution.

Whether a field is required or optional matters to consumers:

```cue
schema: {
	region:      string   // required: always present
	accountId!:  string   // required, spelled explicitly
	vpcId?:      string   // optional: may be absent
	// +sensitive
	token:       string   // redacted wherever it appears in status
}
```

Declare optionality accurately. An application author must guard an optional field with `has(...)` wherever it feeds a required parameter, see [Optional fields](./using-sources.md#optional-fields).

Mark secret fields with `// +sensitive`. They are redacted in Application status. They are still substituted into the workload, so mask them only where leaking them into status is the concern.

### `parameter`

Parameters work as in other definitions. Declare required inputs without `?` and optional ones with `?`:

```cue
parameter: {
	// +usage=Name of the ConfigMap, read from the Application's own namespace
	name: string
	// +usage=Fail when the file is absent
	required: *true | bool
}
```

Values come from `spec.sources[].properties`. A missing required parameter fails resolution; declare optional inputs with `?` so the template can handle their absence.

### `output` and `errs`

Add an `errs` list to turn a failed logic check into a message that the application team can read. Without it they see a raw CUE evaluation error:

```cue
errs: [
	if _res.$returns.statusCode != 200 {
		"catalog lookup failed: HTTP \(_res.$returns.statusCode)"
	},
]
```

If any entry of `errs` is non-empty, the resolution fails and the message is shown on the Application status.

### `context`

A template may read only these `context` fields. Reading anything else is rejected by `vela def apply`:

| Group | Fields |
|---|---|
| Binding | `name` |
| Application | `appName`, `namespace`, `appRevision`, `appRevisionNum`, `publishVersion`, `workflowName` |
| Application metadata | `appLabels` and `appAnnotations`, each read by a literal key, for example `context.appLabels["team"]` |
| Cluster | `cluster`, `clusterVersion` |
| Component | `componentName`, `componentType`, `revision`, `replicaKey` |
| Trait | `traitType`, plus the component fields |
| Workflow step | `stepName`, `stepType` |
| Policy | `policyName`, `policyType` |
| Published policy data | `custom`, when an Application-scoped policy has published `output.ctx`; because its shape and presence are unknown, reads need a type assertion and a default |

`context.name` is the name of the `spec.sources[]` binding, not the consuming component, so it means the same on every surface.

Every field the template reads becomes part of the cache key. A field that the consuming surface does not have, such as `componentName` in a workflow step, cannot be read there.

What your template reads decides where it can be consumed. A source that reads `context.componentName` resolves per component, so it cannot be bound from a workflow step. Admission refuses that binding:

```text
SourceDefinition "per-component" reads context.componentName, which is unavailable in workflow steps
```

To limit a definition on purpose, add a top-level `consumableFrom` list next to `schema`, for example `consumableFrom: ["component"]`. Leave it out to allow every surface that can resolve sources. An entry that is not such a surface is rejected, and the error lists the valid ones.

Where the fetch goes is set by the provider. `kube.#Get` takes a `cluster` field. Set it to `context.cluster` to read from the cluster being rendered for, or omit it to read the hub.

## The cache key is generated

You do not write the cache key. When you run `vela def apply`, `vela def` scans the template for the `context` fields it reads and writes the result into a `$internal` block:

```cue
// Generated from the context this template reads - do not edit.
$internal: {
	key:       "tenant-profile-\(context.cluster)-\(context.namespace)"
	keyInputs: ["cluster", "namespace"]
}
```

Admission derives the key again and rejects a definition whose block does not match, so it cannot be edited by hand. The scope of sharing follows from what the template reads:

| The template reads | Cache entries | Shared by |
|---|---|---|
| nothing | one | every Application that binds it with the same properties |
| `context.cluster` | one per cluster | every Application on that cluster |
| `context.cluster` and `context.namespace` | one per cluster and namespace pair | Applications in that namespace on that cluster |
| `context.appName` | one per Application | that Application |

The effective identity of an entry is the readable key plus a hash of the template, the binding's properties, and the context values named by `keyInputs`. Two consequences:

- Editing a SourceDefinition template stops it from using entries that its previous version wrote. A changed URL behind an unchanged schema cannot serve old data.
- Different properties give different entries, with no work from you.

This design removes a class of bug where a key left out a discriminating input and a second Application received the first one's data.

## Restrict where a definition is usable

`spec.restrictions` on the SourceDefinition limits where it can be used. An absent or empty block means usable anywhere. A non-empty block overrides the `definition.oam.dev/restrict-namespaces` annotation.

## Versioning

SourceDefinitions use the same revision mechanism as other definitions, see [Version Control for Definitions](../x-def-version.md). Each change creates a new `DefinitionRevision`. An application author can pin one with `type: cluster-lookup@v1` and stop following the latest. A binding without `@` uses the latest revision at the time the Application is evaluated. Setting `spec.version` to a semantic version makes each version a distinct revision.

:::caution
Revision names are `<definition>-v<n>` and do not include the kind. Do not give a SourceDefinition the same name as a definition of another kind, such as the built-in `configmap` trait. They would share revision names, and a pin like `configmap@v1` would point at the wrong one. This is why the built-in source is named `configmap-local`.
:::

Each SourceDefinition also registers its `schema` as a ConfigTemplate, named `source-<definition>-<first-8-characters-of-schema-hash>`. A new ConfigTemplate appears only when the schema changes, and reverting to an earlier schema reuses the existing one. The current name and full hash are recorded in the definition's `status.configTemplateRef`.

## Chain definitions

A definition receives the output of another source through its parameters, because the application author wires the chain in `spec.sources[].properties`, see [Chain sources](./using-sources.md#chain-sources). Write the second definition to take plain parameters. By the time its cache key is computed, those parameters hold concrete values from the first source.

## Check your definition

```bash
vela def vet cluster-lookup.cue      # validate the file
vela def render cluster-lookup.cue   # print the YAML, including the generated $internal block
```

Then bind it from a test Application, and use `vela status <app> --sources` to see the resolution, see [Caching and operations](./caching-and-operations.md).
