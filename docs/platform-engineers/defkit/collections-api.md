---
title: Build Lists and Maps from Parameters
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`defkit` builds lists and maps from parameters three ways:

- a **collection pipeline** (`defkit.Each`, `defkit.From`, `defkit.FromFields`) for transforming one list into another inline;
- a **per-item builder** (`ForEachWith`) when each item needs conditionals, let bindings or defaults of its own;
- a **template helper** (`tpl.Helper`) when the same list is used in more than one place.

The collection pipeline transforms list and struct parameters into Kubernetes resource arrays using a chainable pipeline. Use `defkit.Each()` or `defkit.From()` for single-source transformations on flat arrays, and `defkit.FromFields()` for multi-source operations that combine several sub-arrays from a structured parameter into one unified list.

## Collection pipeline: `defkit.Each()` / `defkit.From()`

`defkit.Each(source Value) *CollectionOp` starts a transformation pipeline on any array or list value. `defkit.From(source Value)` is an alias that reads more naturally when chaining filters and maps. Both return a `*CollectionOp` you chain with the operations below.

| Method | Description |
|---|---|
| `.Guard(cond Condition)` | Wraps the entire comprehension in a guard: `[if cond for v in source { ... }]`. The comprehension produces an empty list when the guard is false. Use `param.IsSet()` to skip iteration when an optional parameter is absent. |
| `.Filter(pred Predicate)` | Keeps only items where the predicate is true. Generates a for-comprehension filter clause: `for v in source if v.field == val { ... }`. Build predicates with `FieldEquals()` or `FieldExists()`. |
| `.FilterCond(cond Condition)` | Filters items using a general `Condition` expression instead of a `Predicate`. The condition can reference context or computed values rather than the raw iteration variable. |
| `.Map(mappings FieldMap)` | Transforms each item by mapping source fields to output fields. `FieldMap` maps output field names to `FieldValue` expressions such as `FieldRef("sourceName")`, `LitField("constant")`, or `Nested(subMap)`. |
| `.MapVariant(discriminator, variantName, mappings FieldMap)` | Adds a variant-specific mapping block applied only when `v.discriminator == variantName`. Chain multiple `.MapVariant()` calls to handle each variant of a discriminated union. |
| `.Pick(fields ...string)` | Selects only the named fields from each item, dropping everything else. |
| `.Rename(from, to string)` | Renames a field in each item: `from` is emitted as `to` in the output. |
| `.Wrap(key string)` | Wraps each scalar item under a new key. `Each(hosts).Wrap("host")` turns `"example.com"` into `{ host: "example.com" }`. |
| `.DefaultField(field string, defaultVal FieldValue)` | Provides a default value for a field that may be missing on some items. For CUE default syntax (`*val \| type`) on a field reference, use `FieldRef.Or(fallback)` instead. |
| `.Flatten()` | Flattens one level of nested arrays: items that are themselves arrays are expanded into the parent list. |
| `.Dedupe(keyField string)` | Removes duplicate items by a key field, keeping the first occurrence of each key value. |

### What each operation generates

Each snippet below sets a Deployment field from this `ports` parameter, and shows the CUE that `vela def gen-module` writes for it:

```go
ports := defkit.Array("ports").WithFields(
    defkit.Int("port"),
    defkit.String("name").Optional(),
    defkit.String("protocol").Default("TCP"),
).Optional()
```

**`FilterCond`** keeps the items a general condition holds for:

```go
defkit.From(ports).Guard(ports.IsSet()).
    FilterCond(defkit.Gt(defkit.Reference("v.port"), defkit.Lit(1024))).
    Map(defkit.FieldMap{"containerPort": defkit.FieldRef("port")})
```

```cue
[if parameter["ports"] != _|_ for v in parameter.ports if v.port > 1024 {
	{
		containerPort: v.port
	}
}]
```

**`MapVariant`** gives each value of a discriminator field its own mapping:

```go
defkit.Each(ports).Guard(ports.IsSet()).
    MapVariant("protocol", "TCP", defkit.FieldMap{"containerPort": defkit.FieldRef("port")}).
    MapVariant("protocol", "UDP", defkit.FieldMap{
        "containerPort": defkit.FieldRef("port"),
        "name":          defkit.FieldRef("name"),
    })
```

```cue
[if parameter["ports"] != _|_ for v in parameter.ports {
	{
		if v.protocol == "TCP" {
			containerPort: v.port
		}
		if v.protocol == "UDP" {
			containerPort: v.port
			name: v.name
		}
	}
}]
```

Inside `MapVariant`, use `FieldRef` values: a `defkit.Format(...)` value is written out as its literal format string.

**`Wrap`** turns each scalar into a struct. Given `hosts := defkit.StringList("hosts")`:

```go
defkit.Each(hosts).Wrap("host")
```

```cue
[for v in parameter.hosts { host: v }]
```

`Wrap` drops a `.Guard()`, so give the parameter a default, or set the field with `SetIf(hosts.IsSet(), ...)`, when it is optional.

**`Dedupe`** keeps the first item for each value of a key field:

```go
defkit.From(ports).Dedupe("port")
```

```cue
[
	for val in [
		for i, vi in parameter.ports {
			for j, vj in parameter.ports if j < i && vi.port == vj.port {
				_ignore: true
			}
			vi
		},
	] if val._ignore == _|_ {
		val,
	},
]
```

The key is a field of the source items, not of the mapped output. Don't combine `Dedupe` with `.Guard()`: the generated CUE doesn't compile. Guard the field with `SetIf` instead.

**`Rename`** and **`DefaultField`** don't reach the generated CUE: the pipeline is written as if they weren't there. Use `Map` instead: `"containerPort": defkit.FieldRef("port")` renames a field, and `defkit.FieldRef("name").Or(defkit.LitField("unnamed"))` gives it a default.

## Multi-source collections: `defkit.FromFields()`

`defkit.FromFields(source Value, fields ...string) *MultiSource` iterates over multiple named sub-arrays within a single struct parameter and combines them into one array. It returns a `*MultiSource` with its own chain methods.

| Method | Description |
|---|---|
| `.MapBySource(mappings map[string]FieldMap)` | Applies a different `FieldMap` to items from each named sub-array. Keys in the map are the sub-array field names passed to `FromFields`. Items from sources with no entry in the map are passed through unchanged. |
| `.Pick(fields ...string)` | Selects only the named fields from every item across all sources. |
| `.Dedupe(keyField string)` | Removes duplicate items across all sources by a key field. |
| `.Filter(pred Predicate)` | Keeps only items matching the predicate (applied after all source items are collected). |
| `.FilterCond(cond Condition)` | Filters by a `Condition` expression (CUE-level; runtime is a passthrough). |

## FieldMap value helpers

These functions produce `FieldValue` expressions for use inside `Map()`, `MapBySource()`, and the `tpl.Helper()` builder.

| Function | Description |
|---|---|
| `defkit.FieldRef(name string) FieldRef` | References the named field on the current iteration variable. Inside `for v in source`, `FieldRef("port")` becomes `v.port`. `F(name)` is a short alias. |
| `defkit.LitField(val any) LitVal` | A literal constant value in a field mapping. Use inside `Map()` FieldMaps: distinct from `defkit.Lit()`, which is for `Resource.Set()` calls. |
| `defkit.Nested(mapping FieldMap) *NestedField` | Creates a nested struct value inside a `FieldMap`. Generates `{ outerField: { innerField: v.source } }`. `defkit.NestedFieldMap(mapping)` is an alias. |
| `defkit.Optional(field string) *OptionalField` | References a field that may be absent: generates a conditional field inclusion (`if v.field != _\|_`). `defkit.OptionalFieldRef(field)` is an alias. |
| `defkit.OptionalFieldWithCond(field string, cond Condition) *CompoundOptionalField` | Like `Optional()` but the field is only included when both the field exists and the additional condition is true. |
| `defkit.Format(format string, args ...FieldValue) *FormatField` | Creates a formatted string using field references. Generates CUE string interpolation. When a `FieldRef` arg is used with a `%v` or `%d` verb, `strconv` is auto-imported. |
| `defkit.FieldEquals(field string, value any) FieldEq` | Creates a `Predicate` for `Filter()`. Generates `if v.field == value` inside the comprehension. |
| `defkit.FieldExists(field string) FieldIsSet` | Creates a `Predicate` for `Filter()`. Generates `if v.field != _\|_`. |
| `(FieldRef).Or(fallback FieldValue) *OrFieldRef` | Provides a fallback when a field is undefined. Generates CUE default syntax: `*v.field \| fallback`. |
| `(FieldRef).OrConditional(fallback FieldValue) *ConditionalOrFieldRef` | Provides a fallback using `if`/`else` blocks instead of CUE default syntax. |
| `defkit.ConcatExpr(source *StructArrayHelper, fields ...string) *ConcatExprValue` | Concatenates arrays from a `StructArrayHelper`'s named fields into a single CUE expression. Used when you need `pvc + configMap + secret + ...` as a single list value. |

## Example: collection pipeline

Let's build a `collections-demo` component that uses the pipeline in a single definition. The component accepts optional container `ports` and an optional `volumes` struct containing `pvc` and `configMap` sub-arrays.

Behind the scenes the template uses `Each` with `Guard` + `Filter(FieldEquals)` + `Map` + `Pick` for the Deployment container ports; `FromFields` + `MapBySource` + `Dedupe` for the multi-source volume list; `tpl.Helper` + `FromFields` + `Pick` + `PickIf(ItemFieldIsSet)` for the reusable mounts array; and `FieldRef.Or(LitField(...))` for a fallback field value. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func CollectionsDemo() *defkit.ComponentDefinition {
	ports := defkit.Array("ports").
		Description("Container ports; set expose=true to publish via Service").
		WithFields(
			defkit.Int("port"),
			defkit.String("name").Optional(),
			defkit.Bool("expose").Default(false),
			defkit.String("protocol").Default("TCP"),
		).Optional()
	volumes := defkit.Object("volumes").
		Description("Structured volume sources: pvc and configMap sub-arrays").
		WithFields(
			defkit.Array("pvc").
				Description("PersistentVolumeClaim volume sources mounted into the container").
				WithFields(
					defkit.String("name").Description("Volume name; also used as the volumeMount name"),
					defkit.String("claimName").Description("Name of the bound PersistentVolumeClaim"),
					defkit.String("mountPath").Description("Container path where the volume is mounted"),
					defkit.String("subPath").Optional().Description("Optional sub-path within the volume"),
				).Optional(),
			defkit.Array("configMap").
				Description("ConfigMap volume sources mounted into the container").
				WithFields(
					defkit.String("name").Description("Volume name; also used as the volumeMount name"),
					defkit.String("cmName").Description("Name of the source ConfigMap"),
					defkit.String("mountPath").Description("Container path where the volume is mounted"),
					defkit.String("subPath").Optional().Description("Optional sub-path within the volume"),
				).Optional(),
		).
		Optional()
	extraLabels := defkit.StringKeyMap("extraLabels").Optional().
		Description("Extra labels spread onto the Deployment metadata")

	return defkit.NewComponent("collections-demo").
		Description("Demonstrates the Collections API: Each, From, FromFields, MapVariant, Wrap, Rename, DefaultField, Dedupe, Flatten, Filter, FilterCond, Guard, Map, Pick, Nested, Optional, Format, FieldEquals, FieldExists, FieldRef.Or").
		Workload("apps/v1", "Deployment").
		PodSpecPath("spec.template.spec").
		Params(ports, volumes, extraLabels).
		Template(collectionsDemoTemplate)
}

func collectionsDemoTemplate(tpl *defkit.Template) {
	vela := defkit.VelaCtx()
	ports := defkit.Array("ports").WithFields(
		defkit.Int("port"),
		defkit.String("name").Optional(),
		defkit.Bool("expose").Default(false),
		defkit.String("protocol").Default("TCP"),
	)
	volumes  := defkit.Object("volumes")
	extraLabels := defkit.StringKeyMap("extraLabels")

	// Each + Guard + Filter(FieldEquals) + Map + Pick
	// Only expose:true ports become containerPorts; name falls back via FieldRef.Or.
	containerPorts := defkit.Each(ports).
		Guard(ports.IsSet()).
		Filter(defkit.FieldEquals("expose", true)).
		Map(defkit.FieldMap{
			"containerPort": defkit.FieldRef("port"),
			"name":          defkit.FieldRef("name").Or(defkit.LitField("unnamed")),
			"protocol":      defkit.FieldRef("protocol"),
		}).
		Pick("containerPort", "name", "protocol")

	// FromFields + MapBySource + Dedupe: combine pvc and configMap sub-arrays.
	podVolumes := defkit.FromFields(volumes, "pvc", "configMap").
		MapBySource(map[string]defkit.FieldMap{
			"pvc": {
				"name": defkit.FieldRef("name"),
				"persistentVolumeClaim": defkit.Nested(defkit.FieldMap{
					"claimName": defkit.FieldRef("claimName"),
				}),
			},
			"configMap": {
				"name": defkit.FieldRef("name"),
				"configMap": defkit.Nested(defkit.FieldMap{
					"name": defkit.FieldRef("cmName"),
				}),
			},
		}).
		Dedupe("name")

	// tpl.Helper + FromFields + Pick + PickIf(ItemFieldIsSet): reusable mounts array.
	mountsHelper := tpl.Helper("mountsArray").
		FromFields(volumes, "pvc", "configMap").
		Pick("name", "mountPath").
		PickIf(defkit.ItemFieldIsSet("subPath"), "subPath").
		Build()


	dep := defkit.NewResource("apps/v1", "Deployment").
		Set("metadata.name", vela.Name()).
		SpreadIf(extraLabels.IsSet(), "metadata.labels", extraLabels).
		Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
		Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
		Set("spec.template.spec.containers[0].name", vela.Name()).
		Set("spec.template.spec.containers[0].image", defkit.Lit("nginx:stable")).
		SetIf(ports.IsSet(), "spec.template.spec.containers[0].ports", containerPorts).
		SetIf(volumes.IsSet(), "spec.template.spec.containers[0].volumeMounts", mountsHelper).
		SetIf(volumes.IsSet(), "spec.template.spec.volumes", podVolumes)

	tpl.Output(dep)

	svc := defkit.NewResource("v1", "Service").
		Set("metadata.name", vela.Name()).
		Set("spec.selector[app.oam.dev/component]", vela.Name()).
		Set("spec.ports", defkit.Each(ports).
			Guard(ports.IsSet()).
			Filter(defkit.FieldEquals("expose", true)).
			Map(defkit.FieldMap{
				"port":       defkit.FieldRef("port"),
				"targetPort": defkit.FieldRef("port"),
				"protocol":   defkit.FieldRef("protocol"),
			}))
	tpl.OutputsIf(ports.IsSet(), "service", svc)
}

func init() { defkit.Register(CollectionsDemo()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
"collections-demo": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Demonstrates the Collections API: Each, From, FromFields, MapVariant, Wrap, Rename, DefaultField, Dedupe, Flatten, Filter, FilterCond, Guard, Map, Pick, Nested, Optional, Format, FieldEquals, FieldExists, FieldRef.Or"
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
  mountsArray: [
    if parameter.volumes != _|_ && parameter.volumes.pvc != _|_ for v in parameter.volumes.pvc {
    {
      name: v.name
      mountPath: v.mountPath
      if v.subPath != _|_ {
        subPath: v.subPath
      }
    }
    },
    if parameter.volumes != _|_ && parameter.volumes.configMap != _|_ for v in parameter.volumes.configMap {
    {
      name: v.name
      mountPath: v.mountPath
      if v.subPath != _|_ {
        subPath: v.subPath
      }
    }
    }
  ]
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: {
      name: context.name
    }
    spec: {
      selector: matchLabels: "app.oam.dev/component": context.name
      template: {
        metadata: labels: "app.oam.dev/component": context.name
        spec: {
          containers: [{
            name:  context.name
            image: "nginx:stable"
            if parameter["ports"] != _|_ {
              ports: [if parameter["ports"] != _|_ for v in parameter.ports if v.expose == true {
                {
                  containerPort: v.port
                  name:          *v.name | "unnamed"
                  protocol:      v.protocol
                }
              }]
            }
            if parameter["volumes"] != _|_ {
              volumeMounts: mountsArray
            }
          }]
          if parameter["volumes"] != _|_ {
            volumes: [
              if parameter.volumes != _|_ && parameter.volumes.pvc != _|_ for v in parameter.volumes.pvc {
                {
                  name: v.name
                  persistentVolumeClaim: {
                    claimName: v.claimName
                  }
                }
              },
              if parameter.volumes != _|_ && parameter.volumes.configMap != _|_ for v in parameter.volumes.configMap {
                {
                  configMap: {
                    name: v.cmName
                  }
                  name: v.name
                }
              }
            ]
          }
        }
      }
    }
  }
  outputs: {
    if parameter["ports"] != _|_ {
      service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: context.name
        spec: {
          selector: "app.oam.dev/component": context.name
          ports: [if parameter["ports"] != _|_ for v in parameter.ports if v.expose == true {
            {
              port:       v.port
              protocol:   v.protocol
              targetPort: v.port
            }
          }]
        }
      }
    }
  }
  parameter: {
    // +usage=Container ports; set expose=true to publish via Service
    ports?: [...{
      port:     int
      name?:    string
      expose:   *false | bool
      protocol: *"TCP" | string
    }]
    // +usage=Structured volume sources: pvc and configMap sub-arrays
    volumes?: {
      // +usage=PersistentVolumeClaim volume sources mounted into the container
      pvc?: [...{
        // +usage=Volume name; also used as the volumeMount name
        name:      string
        // +usage=Name of the bound PersistentVolumeClaim
        claimName: string
        // +usage=Container path where the volume is mounted
        mountPath: string
        // +usage=Optional sub-path within the volume
        subPath?:  string
      }]
      // +usage=ConfigMap volume sources mounted into the container
      configMap?: [...{
        // +usage=Volume name; also used as the volumeMount name
        name:      string
        // +usage=Name of the source ConfigMap
        cmName:    string
        // +usage=Container path where the volume is mounted
        mountPath: string
        // +usage=Optional sub-path within the volume
        subPath?:  string
      }]
    }
    // +usage=Extra labels spread onto the Deployment metadata
    extraLabels?: [string]: string
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="collections-demo-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: collections-demo-app
  namespace: default
spec:
  components:
    - name: collections-demo-app
      type: collections-demo
      properties:
        ports:
          - { port: 8080, name: http, expose: true,  protocol: TCP }
          - { port: 9000,               expose: false, protocol: TCP }
        volumes:
          pvc:
            - { name: data-vol,    claimName: data-pvc,    mountPath: /data }
          configMap:
            - { name: config-vol,  cmName: app-config,     mountPath: /etc/config }
        extraLabels:
          env: demo
```

</TabItem>
</Tabs>

The CUE tab shows what `vela def gen-module` generates. Reproduce it with:

```shell
vela def gen-module ./my-platform -o ./generated-cue
```

### Apply and verify

Apply the definition and the Application YAML above:

```shell
vela def apply ./generated-cue/components/collections-demo.cue
vela up -f collections-demo-app.yaml
```

```
NAME                   COMPONENT              TYPE               PHASE     HEALTHY   STATUS   AGE
collections-demo-app   collections-demo-app   collections-demo   running   true               75s
```

Inspect the rendered Deployment: the Guard + Filter pipeline emits only the `expose: true` port (8080), and the `FromFields` pipeline produces both volume types:

```shell
$ kubectl get deployment collections-demo-app -n default -o jsonpath='{.spec.template.spec}'
{
  "containers": [{
    "image": "nginx:stable",
    "name": "collections-demo-app",
    "ports": [{"containerPort": 8080, "name": "http", "protocol": "TCP"}],
    "volumeMounts": [
      {"mountPath": "/data",       "name": "data-vol"},
      {"mountPath": "/etc/config", "name": "config-vol"}
    ]
  }],
  "volumes": [
    {"name": "data-vol", "persistentVolumeClaim": {"claimName": "data-pvc"}},
    {"name": "config-vol", "configMap": {"defaultMode": 420, "name": "app-config"}}
  ]
}
```

The Service receives only the exposed port (8080, filtered by `FieldEquals("expose", true)`):

```shell
$ kubectl get service collections-demo-app -n default -o jsonpath='{.spec.ports}'
[{"port": 8080, "protocol": "TCP", "targetPort": 8080}]
```

Clean up:

```shell
vela delete collections-demo-app --namespace default -y
kubectl delete componentdefinition collections-demo -n vela-system
```

## Per-item builder: `ForEachWith`

`ForEachWith` and its variants produce one CUE array item per element in a source array with complex per-item logic (conditionals, let bindings, and defaults within each item). The callback receives an `*ItemBuilder` you populate with `Set()`, `IfSet()`, `Let()`, etc.

### Methods

#### Array Iteration

Top-level methods on `defkit.NewArray()` that produce a CUE array comprehension.

| Method | Description |
|---|---|
| `.ForEachWith(param, fn)` | Iterates over a source `ArrayParam` and produces one item per element. The callback receives an `*ItemBuilder` to populate the per-item fields. The default loop variable name in the generated CUE is `v`. Generates `[for v in parameter.<param> { ... }]`. |
| `.ForEachWithVar(varName, param, fn)` | Same as `ForEachWith` but lets you specify the loop variable name (e.g. `"p"`, `"item"`) instead of the default `v`. Use when you need to reference the iteration variable by a specific name in the generated CUE for readability or to avoid clashes with existing identifiers. |
| `.ForEachWithGuardedFiltered(guard, filter, param, fn)` | Combines an outer guard condition (wraps the whole expression, typically `param.IsSet()` for optional source arrays), a per-element `FilterPredicate` (e.g. `defkit.FieldEquals("expose", true)`), and an item builder callback. Generates `if guard { result: [for v in parameter.<param> if <filter> { ... }] }`. |
| `.ForEachWithGuardedFilteredVar(varName, guard, filter, param, fn)` | Same as `ForEachWithGuardedFiltered` but with a custom loop variable name. The whole comprehension is emitted inline as `[if <guard> for <varName> in parameter.<param> if <filter> { ... }]`. |

#### ItemBuilder

The callback in every `ForEachWith*` method receives an `*ItemBuilder`. Use it to assemble the fields, conditionals, and let-bindings that make up each item of the produced array.

| Method | Description |
|---|---|
| `item.Var()` | Returns an `IterVarBuilder` that references the iteration variable (`v` by default, or whatever name you passed to the `*Var` variant). All field references inside the item should go through this. |
| `item.Var().Field("name")` | References a field on the iteration variable: generates `v.name`. Use this when reading values from the source element to assign into the produced item. |
| `item.Var().Ref()` | References the iteration variable itself (`v`) without descending into a field. Use it as a value when the source element already has the shape the output field needs: `item.Set("spec", v.Ref())` generates `spec: v`. When only some fields carry over, copy each with `.Field()` instead, as in `item.Set("valueFrom", v.Field("valueFrom"))`. |
| `item.Set(field, value)` | Unconditional field assignment. Generates `field: <value>` at the top level of the item. |
| `item.If(cond, fn)` | Conditional block with an arbitrary condition. The callback runs against the same `*ItemBuilder`, and any `Set` calls inside it are wrapped in `if <cond> { ... }`. |
| `item.IfSet(field, fn)` | Convenience for `item.If(item.FieldExists(field), fn)`: generates `if v.<field> != _\|_ { ... }`. Use when an output field should only be emitted if the source element has the named field set. |
| `item.IfNotSet(field, fn)` | Inverse of `IfSet`: generates `if v.<field> == _\|_ { ... }`. Use to provide a fallback when the source element omits the named field. |
| `item.Let(name, value)` | Emits a private CUE binding (`_name: <value>`) inside the item and returns a reference you can pass to `Set()` or `SetDefault()`. Use to compute an expression once and reuse it. |
| `item.SetDefault(field, value, type)` | Emits a CUE default: generates `field: *<value> \| <type>`. Pair with `Let` to produce a defaulted field whose default value is computed from the iteration variable. |
| `item.FieldExists(field)` | Returns the condition `v.<field> != _\|_` for use with `item.If(...)`. |
| `item.FieldNotExists(field)` | Returns the condition `v.<field> == _\|_` for use with `item.If(...)`. |

#### Predicates and Conditions

Top-level helpers that produce conditions for filters and field selection.

| Function | Description |
|---|---|
| `defkit.FieldEquals(field, value)` | Produces a `FilterPredicate` for `ForEachWithGuardedFiltered`: keeps only elements where the named field equals the given value. Generates `if v.<field> == <value>` inside the array comprehension. |
| `defkit.HasExposedPorts(ports)` | Returns a condition that is true when any element of `ports` has `expose: true`. Generates `len([for p in parameter.ports if p.expose == true { p }]) > 0`. The field name `expose` is fixed. The condition reads the parameter directly, so it fails to render when the parameter is optional and absent: give the parameter a default (`.Default([]any{})`) instead of `.Optional()`. Use with `tpl.OutputsIf()` to emit a Service only when there is a port to publish. |
| `defkit.ItemFieldIsSet(field)` | Returns a condition that is true when the named field exists on the current iteration element (`v.<field> != _\|_`). Used with `.PickIf()` on the `tpl.Helper()` builder to conditionally include optional fields when projecting elements through a helper. |

:::tip
Use `ForEachWithGuardedFiltered` when you need *both* an outer guard (the source param is optional) and an element-level filter (only include items matching a condition). Plain `ForEachWith` is enough when the source param is required and you want every element.
:::

### Example: per-item builder

Let's build a `web-service` component that wires a `Deployment` and an optional `Service` from a `ports` parameter and a `env` parameter: every port entry contributes a named container port, entries marked `expose: true` additionally publish a service port (with the Service itself emitted only when at least one port asks to be exposed, so we don't ship a Kubernetes-invalid Service with empty `spec.ports`), and every env entry becomes a container env var (with a string fallback when `value` is omitted). The component shows how the four `ForEachWith*` variants cooperate from different source arrays, with `ItemBuilder` assembling per-item conditionals, defaults, let bindings, and field-existence checks.

Behind the scenes the example exercises most of the per-item builder in a single template: `ForEachWith` to build the container-port array (using `IfSet`/`IfNotSet`, `Let`, and `SetDefault` to derive `port-<N>` names when the user omits one), `ForEachWithVar` with a custom iteration name to build the env array (using `item.If` with `item.FieldExists`/`item.FieldNotExists` for the value fallback), `ForEachWithGuardedFiltered` with `defkit.FieldEquals("expose", true)` to build the filtered service-port array, `defkit.HasExposedPorts` to emit the Service only when a port is exposed, and `WithImports("strconv")` so the generated CUE can call `strconv.FormatInt(...)`. `ForEachWithGuardedFilteredVar` takes the same arguments plus a leading `varName` if you need to rename the iteration variable; pair it with var-aware predicates when you do. `defkit.ItemFieldIsSet` returns a `Condition` for the `tpl.Helper().PickIf()` projector and is covered under [Template helpers](#template-helpers-tplhelper). Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func WebService() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Container image")
    ports := defkit.Array("ports").
        Description("Container ports; set expose=true to publish via Service").
        WithFields(
            defkit.Int("port"),
            defkit.String("name").Optional(),
            defkit.Bool("expose").Default(false),
        ).
        // A default, not Optional(): HasExposedPorts reads the list directly,
        // so it must exist even when the user sets no ports.
        Default([]any{})
    env := defkit.Array("env").
        Description("Container env vars; entries without value default to empty string").
        WithFields(
            defkit.String("name"),
            defkit.String("value").Optional(),
        ).Optional()

    return defkit.NewComponent("web-service").
        Description("HTTP service with container ports and optional Service exposure").
        Workload("apps/v1", "Deployment").
        PodSpecPath("spec.template.spec").
        Params(image, ports, env).
        Template(webServiceTemplate).
        WithImports("strconv")
}

func webServiceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    ports := defkit.Array("ports").WithFields(
        defkit.Int("port"),
        defkit.String("name").Optional(),
        defkit.Bool("expose").Default(false),
    )
    env := defkit.Array("env").WithFields(
        defkit.String("name"),
        defkit.String("value").Optional(),
    )

    // Container ports: ForEachWith with default "v" iter var.
    // Uses item.IfSet / IfNotSet / Let / SetDefault to derive a name when omitted.
    containerPorts := defkit.NewArray().ForEachWith(ports,
        func(item *defkit.ItemBuilder) {
            v := item.Var()
            item.Set("containerPort", v.Field("port"))

            item.IfSet("name", func() {
                item.Set("name", v.Field("name"))
            })
            item.IfNotSet("name", func() {
                nameRef := item.Let("_name",
                    defkit.Plus(defkit.Lit("port-"),
                        defkit.StrconvFormatInt(v.Field("port"), 10)))
                item.SetDefault("name", nameRef, "string")
            })
        })

    // Container env: ForEachWithVar with named "e" iter var.
    // Demonstrates item.If with item.FieldExists / FieldNotExists.
    containerEnv := defkit.NewArray().ForEachWithVar("e", env,
        func(item *defkit.ItemBuilder) {
            e := item.Var()
            item.Set("name", e.Field("name"))

            // item.If with an arbitrary Condition produced by item.FieldExists.
            item.If(item.FieldExists("value"), func() {
                item.Set("value", e.Field("value"))
            })
            // item.FieldNotExists is the inverse, used for the fallback.
            item.If(item.FieldNotExists("value"), func() {
                item.Set("value", defkit.Lit(""))
            })
        })

    // Service ports: ForEachWithGuardedFiltered with FieldEquals predicate.
    // ForEachWithGuardedFilteredVar takes the same arguments plus a leading
    // varName to rename the iteration variable; pair it with var-aware
    // predicates when you need a non-default name.
    servicePorts := defkit.NewArray().ForEachWithGuardedFiltered(
        ports.IsSet(),
        defkit.FieldEquals("expose", true),
        ports,
        func(item *defkit.ItemBuilder) {
            v := item.Var()
            item.Set("port", v.Field("port"))
            item.Set("targetPort", v.Field("port"))
        })

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        SetIf(env.IsSet(),
            "spec.template.spec.containers[0].env", containerEnv).
        SetIf(ports.IsSet(),
            "spec.template.spec.containers[0].ports", containerPorts)

    svc := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports", servicePorts)

    tpl.Output(dep)
    // Emit the Service only when at least one port has expose: true. Always
    // emitting it would leave spec.ports empty when no port is exposed and
    // the Kubernetes API server rejects that ("spec.ports: Required value").
    tpl.OutputsIf(defkit.HasExposedPorts(ports), "service", svc)
}

func init() { defkit.Register(WebService()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
import (
  "strconv"
)

"web-service": {
  type: "component"
  annotations: {}
  labels: {}
  description: "HTTP service with container ports and optional Service exposure"
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
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: name: context.name
    spec: {
      selector: matchLabels: "app.oam.dev/component": context.name
      template: {
        metadata: labels: "app.oam.dev/component": context.name
        spec: containers: [{
          name:  context.name
          image: parameter.image
          if parameter["env"] != _|_ {
            env: [for e in parameter.env {
              name: e.name
              if e.value != _|_ { value: e.value }
              if e.value == _|_ { value: "" }
            }]
          }
          if parameter["ports"] != _|_ {
            ports: [for v in parameter.ports {
              containerPort: v.port
              if v.name != _|_ {
                name: v.name
              }
              if v.name == _|_ {
                _name: "port-" + strconv.FormatInt(v.port, 10)
                name:  *_name | string
              }
            }]
          }
        }]
      }
    }
  }
  outputs: {
    if len([for p in parameter.ports if p.expose == true { p }]) > 0 {
      service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: context.name
        spec: {
          selector: "app.oam.dev/component": context.name
          ports: [
            if parameter["ports"] != _|_ for v in parameter.ports if v.expose == true {
              port:       v.port
              targetPort: v.port
            },
          ]
        }
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: string
    // +usage=Container ports; set expose=true to publish via Service
    ports: [...{
      port:   int
      name?:  string
      expose: *false | bool
    }]
    // +usage=Container env vars; entries without value default to empty string
    env?: [...{
      name:   string
      value?: string
    }]
  }
}
```

</TabItem>
</Tabs>

The CUE tab shows what `vela def gen-module` generates. Reproduce it with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

## Template helpers: `tpl.Helper()`

The helper builder computes derived CUE array variables from array parameters (filtering, renaming fields, and applying conditionals) without writing raw CUE strings. Helpers are emitted as named list comprehensions at the top of the `template:` block and can be referenced by name in resource `.Set()` calls.

A template helper is not a named schema type: `.Helper(name, param)` on a definition emits a CUE type `#Name` for parameters (see [ComponentDefinition](./definition-component.md#chain-methods)), while `tpl.Helper(name)` emits a list for the template to reuse.

:::tip
Use `tpl.Helper()` instead of inlining a collection expression directly in `Set()` when the same list is referenced in two or more places (for example, both `spec.volumes` and a separate validation block). The helper emits one `let` binding and reuses it, keeping the generated CUE compact.
:::

### Methods

#### HelperBuilder Chain Methods

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

#### FieldMap Value Constructors

| Function | Description |
|---|---|
| `defkit.FieldRef("field")` | References `v.field` from the current item. |
| `defkit.FieldRef("f").Or(fallback)` | Emits `*v.f \| fallback`: CUE default syntax for absent fields. |
| `defkit.Optional("field")` | Generates `if v.field != _\|_ { name: v.field }`: conditional inclusion. |
| `defkit.Format("port-%v", FieldRef("port"))` | Formats a string value using item fields. Generates `strconv.FormatInt(...)` for numeric args. |

#### Helper Construction Helpers

| Function | Description |
|---|---|
| `HelperStruct(fields ...StructFieldDef)` | Constructs a CUE struct value for use inside `Each()` callbacks. |
| `HelperField(name, value Value)` | Defines an unconditional field within a `HelperStruct()`. |
| `HelperFieldIf(cond, name, value)` | Defines a conditional field within a `HelperStruct()`. |
| `Item() *ItemValue` | References the current iteration item inside `Each()`. Chain `.Get(field)` to access a field. |
| `ItemFieldIsSet(field) Condition` | Returns a condition checking if a field exists on the current item. Generates `v.field != _\|_`. |

#### Specialized Helper Entry Points on `*Template`

| Method | Description |
|---|---|
| `tpl.Helper(name) *HelperBuilder` | General-purpose helper. Returns a `*HelperBuilder` you configure with the chain methods above, then finalize with `.Build()`. |
| `tpl.StructArrayHelper(name, source)` | Splits a struct parameter's sub-fields into separate typed arrays: one per sub-field, named by the field. |
| `tpl.ConcatHelper(name, source)` | Concatenates arrays from a `StructArrayHelper` into one flat list via `list.Concat`. Chain `.Fields(...)` to specify which sub-arrays to join. |
| `tpl.DedupeHelper(name, source)` | Deduplicates items from another helper by a key field. Chain `.ByKey("name")` to pick the dedup key. |

`StructArrayHelper` → `ConcatHelper` → `DedupeHelper` is the canonical pipeline for heterogeneous volume mount patterns: split by type, join into one list, remove duplicates.

#### `*HelperVar` Methods

| Method | Description |
|---|---|
| `helper.NotEmpty() Condition` | Returns a condition that checks `len(helper) != 0`. Use with `tpl.OutputsIf` to emit an auxiliary resource only when the helper is non-empty. |

### Example: `port-service`

Demonstrates `tpl.Helper()` with a single-source `From()` pipeline:

- **`From` + `Guard`**: source `parameter.ports`, guard against the param being absent.
- **`Map` + `FieldRef` + `Optional`**: rename `port → containerPort`; include `name` and `protocol` only when set.
- **`Filter(FieldEquals(...))`**: keep only items where `v.expose == true`.
- **`FieldRef("name").Or(Format(...))`**: service port name falls back to `"port-<N>"` when absent.
- **`AfterOutput()`**: `exposedPorts` helper is placed after `output:` because it feeds `outputs:`.
- **`helper.NotEmpty()`**: emit the `Service` only when at least one port is exposed.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

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
<TabItem value="cue" label="CUE (generated)">

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

### Example: `volume-worker`

Demonstrates the `StructArrayHelper` → `ConcatHelper` → `DedupeHelper` compositional pipeline:

- **`StructArrayHelper` + `Field(FieldMap)`**: splits `parameter.volumeMounts` into typed sub-arrays (`pvc`, `configMap`, `secret`). Each sub-array generates `fieldName: *[for v in source.field { mapping }] | []`; the `*[...] | []` default means an absent sub-field safely yields `[]`.
- **`Optional("field")` in FieldMap**: `subPath` is included only when set on the item.
- **`ConcatHelper` + `Fields(...)`**: joins the typed sub-arrays into one flat list via `list.Concat`.
- **`DedupeHelper` + `ByKey("name")`**: removes duplicate entries using CUE's double-loop `_ignore` pattern; earlier entries win.
- **`FromFields` + `MapBySource`**: builds the matching pod volumes, one per mount, from the same three sub-arrays.

Each mount's `name` is also the name of the PVC, ConfigMap or Secret it mounts.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

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

	// FromFields + MapBySource: one pod volume per mount. Each mount's name is
	// also the name of the PVC, ConfigMap or Secret it mounts.
	podVolumes := defkit.FromFields(volumeMounts, "pvc", "configMap", "secret").
		MapBySource(map[string]defkit.FieldMap{
			"pvc": {
				"name": defkit.FieldRef("name"),
				"persistentVolumeClaim": defkit.Nested(defkit.FieldMap{
					"claimName": defkit.FieldRef("name"),
				}),
			},
			"configMap": {
				"name": defkit.FieldRef("name"),
				"configMap": defkit.Nested(defkit.FieldMap{
					"name": defkit.FieldRef("name"),
				}),
			},
			"secret": {
				"name": defkit.FieldRef("name"),
				"secret": defkit.Nested(defkit.FieldMap{
					"secretName": defkit.FieldRef("name"),
				}),
			},
		})

	tpl.Output(
		defkit.NewResource("apps/v1", "Deployment").
			Set("metadata.name", vela.Name()).
			Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
			Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
			Set("spec.template.spec.containers[0].name", vela.Name()).
			Set("spec.template.spec.containers[0].image", image).
			SetIf(volumeMounts.IsSet(), "spec.template.spec.containers[0].volumeMounts", uniqueMounts).
			SetIf(volumeMounts.IsSet(), "spec.template.spec.volumes", podVolumes),
	)
}

func init() { defkit.Register(VolumeWorker()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

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
				name: v.name
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
				name: v.name
			}
			},
		] | []

		secret: *[
			for v in parameter.volumeMounts.secret {
			{
				mountPath: v.mountPath
				name: v.name
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
		metadata: {
			name: context.name
		}
		spec: {
			selector: {
				matchLabels: {
					"app.oam.dev/component": context.name
				}
			}
			template: {
				metadata: {
					labels: {
						"app.oam.dev/component": context.name
					}
				}
				spec: {
					containers: [{
						name: context.name
						image: parameter.image
						if parameter["volumeMounts"] != _|_ {
							volumeMounts: uniqueMounts
						}
					}]
					if parameter["volumeMounts"] != _|_ {
						volumes: [
					if parameter.volumeMounts != _|_ && parameter.volumeMounts.pvc != _|_ for v in parameter.volumeMounts.pvc {
						{
							name: v.name
							persistentVolumeClaim: {
								claimName: v.name
							}
						}
					},
					if parameter.volumeMounts != _|_ && parameter.volumeMounts.configMap != _|_ for v in parameter.volumeMounts.configMap {
						{
							configMap: {
								name: v.name
							}
							name: v.name
						}
					},
					if parameter.volumeMounts != _|_ && parameter.volumeMounts.secret != _|_ for v in parameter.volumeMounts.secret {
						{
							name: v.name
							secret: {
								secretName: v.name
							}
						}
					}
				]
					}
				}
			}
		}
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

**Duplicate names across sub-fields**: If a PVC and a ConfigMap mount both use the name `"data"`, the `uniqueMounts` double-loop suppresses the later mount; earlier entries in `mountsList` win.

:::note
The volume list is not deduplicated, so two mounts with one name still produce two volumes with that name, and the API server refuses the pod. Give every mount a unique `name` across `pvc`, `configMap` and `secret`.
:::

### Reproduce the helper examples

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
vela def apply-module ./my-platform --conflict overwrite
```

## Related

- [Resource Builder](./resource-builder.md): `NewResource`, `Set`, `SetIf`, `ArrayBuilder`, and `ArrayConcat`
- [ComponentDefinition](./definition-component.md): define workload types
- [TraitDefinition](./definition-trait.md): patch workloads with traits
- [Register & Output](./definition-register.md): `defkit.Register()` and output methods
- [Template Output Methods](./template-output-methods.md): `tpl.Output` / `tpl.Outputs` / `tpl.OutputsIf` for emitting resources
- [Template Patch Methods](./template-patch-methods.md): `tpl.Patch()` / `tpl.PatchStrategy()` for trait patch templates
- [WorkflowStepDefinition and Step Actions](./template-workflowstep-actions.md): `tpl.Builtin` / `tpl.SuspendIf` for workflow step templates
