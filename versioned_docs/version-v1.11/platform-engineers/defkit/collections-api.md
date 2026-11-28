---
title: Collections API
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The Collections API transforms list and struct parameters into Kubernetes resource arrays using a chainable pipeline. Use `defkit.Each()` or `defkit.From()` for single-source transformations on flat arrays, and `defkit.FromFields()` for multi-source operations that combine several sub-arrays from a structured parameter into one unified list.

## `defkit.Each()` / `defkit.From()` — Collection Pipeline

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
| `.Flatten()` | Flattens one level of nested arrays — items that are themselves arrays are expanded into the parent list. |
| `.Dedupe(keyField string)` | Removes duplicate items by a key field, keeping the first occurrence of each key value. |

## `defkit.FromFields()` — Multi-Source Collections

`defkit.FromFields(source Value, fields ...string) *MultiSource` iterates over multiple named sub-arrays within a single struct parameter and combines them into one array. It returns a `*MultiSource` with its own chain methods.

| Method | Description |
|---|---|
| `.MapBySource(mappings map[string]FieldMap)` | Applies a different `FieldMap` to items from each named sub-array. Keys in the map are the sub-array field names passed to `FromFields`. Items from sources with no entry in the map are passed through unchanged. |
| `.Pick(fields ...string)` | Selects only the named fields from every item across all sources. |
| `.Dedupe(keyField string)` | Removes duplicate items across all sources by a key field. |
| `.Filter(pred Predicate)` | Keeps only items matching the predicate (applied after all source items are collected). |
| `.FilterCond(cond Condition)` | Filters by a `Condition` expression (CUE-level; runtime is a passthrough). |

## FieldMap Value Helpers

These functions produce `FieldValue` expressions for use inside `Map()`, `MapBySource()`, and the `tpl.Helper()` builder.

| Function | Description |
|---|---|
| `defkit.FieldRef(name string) FieldRef` | References the named field on the current iteration variable. Inside `for v in source`, `FieldRef("port")` becomes `v.port`. `F(name)` is a short alias. |
| `defkit.LitField(val any) LitVal` | A literal constant value in a field mapping. Use inside `Map()` FieldMaps — distinct from `defkit.Lit()`, which is for `Resource.Set()` calls. |
| `defkit.Nested(mapping FieldMap) *NestedField` | Creates a nested struct value inside a `FieldMap`. Generates `{ outerField: { innerField: v.source } }`. `defkit.NestedFieldMap(mapping)` is an alias. |
| `defkit.Optional(field string) *OptionalField` | References a field that may be absent — generates a conditional field inclusion (`if v.field != _\|_`). `defkit.OptionalFieldRef(field)` is an alias. |
| `defkit.OptionalFieldWithCond(field string, cond Condition) *CompoundOptionalField` | Like `Optional()` but the field is only included when both the field exists and the additional condition is true. |
| `defkit.Format(format string, args ...FieldValue) *FormatField` | Creates a formatted string using field references. Generates CUE string interpolation. When a `FieldRef` arg is used with a `%v` or `%d` verb, `strconv` is auto-imported. |
| `defkit.FieldEquals(field string, value any) FieldEq` | Creates a `Predicate` for `Filter()`. Generates `if v.field == value` inside the comprehension. |
| `defkit.FieldExists(field string) FieldIsSet` | Creates a `Predicate` for `Filter()`. Generates `if v.field != _\|_`. |
| `(FieldRef).Or(fallback FieldValue) *OrFieldRef` | Provides a fallback when a field is undefined. Generates CUE default syntax: `*v.field \| fallback`. |
| `(FieldRef).OrConditional(fallback FieldValue) *ConditionalOrFieldRef` | Provides a fallback using `if`/`else` blocks instead of CUE default syntax. |
| `defkit.ConcatExpr(source *StructArrayHelper, fields ...string) *ConcatExprValue` | Concatenates arrays from a `StructArrayHelper`'s named fields into a single CUE expression. Used when you need `pvc + configMap + secret + ...` as a single list value. |

## Template Helper Builder

`tpl.Helper(name string)` registers a named let-bound array (`let name = [...]`) at template scope. The helper reference can then be passed to `Resource.Set()`. See [Helper Builder](./template-helper-builder.md) for the full API.

| Method | Description |
|---|---|
| `tpl.Helper(name).From(source Value)` | Sets a single source for the helper. |
| `tpl.Helper(name).FromFields(source Value, fields ...string)` | Sets multiple named sub-array fields as the source. |
| `tpl.Helper(name).MapBySource(map[string]FieldMap)` | Applies per-source field mappings (same semantics as `MultiSource.MapBySource`). |
| `tpl.Helper(name).Pick(fields ...string)` | Projects each item to only the named fields. |
| `tpl.Helper(name).PickIf(cond Condition, field string)` | Conditionally includes `field` only when the condition is true. Use `defkit.ItemFieldIsSet(field)` to gate on field presence. |
| `tpl.Helper(name).Build() *HelperVar` | Finalizes the builder and returns a `*HelperVar` that implements `Value`. Pass it to `Resource.Set()` or `Resource.SetIf()`. |
| `(*HelperVar).NotEmpty() Condition` | Returns a `Condition` that is true when the helper list has at least one element. Use with `tpl.OutputsIf(helper.NotEmpty(), ...)`. |

:::tip
Use `tpl.Helper()` instead of inlining a collection expression directly in `Set()` when the same list is referenced in two or more places (for example, both `spec.volumes` and a separate validation block). The helper emits one `let` binding and reuses it, keeping the generated CUE compact.
:::

## Example

Let's build a `collections-demo` component that exercises the full collections pipeline in a single definition. The component accepts optional container `ports`, optional `hosts`, and an optional `volumes` struct containing `pvc` and `configMap` sub-arrays.

Behind the scenes the template exercises every API listed above: `Each` with `Guard` + `Filter(FieldEquals)` + `Map` + `Pick` for the Deployment container ports; `Each` with `Guard` + `Filter(FieldExists)` + `Rename` for an alternative port shape; `Each` + `Guard` + `Wrap` for the hosts list; `Each` + `Guard` + `DefaultField(Format(...))` for auto-naming; `Each` + `Guard` + `MapVariant` for protocol-specific variants; `From` + `Guard` + `FilterCond` for a general-condition filter; `From` + `Guard` + `Map` + `Dedupe` for deduplication; `FromFields` + `MapBySource` + `Dedupe` for the multi-source volume list; `tpl.Helper` + `FromFields` + `Pick` + `PickIf(ItemFieldIsSet)` for the reusable mounts array; and `FieldRef.Or(LitField(...))` for a fallback field value. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

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
	hosts := defkit.Array("hosts").
		Description("Hostnames to route traffic to; wrapped into {host: ...} entries").
		Optional()
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
		Params(ports, hosts, volumes, extraLabels).
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
	hosts    := defkit.Array("hosts")
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

	// Each + Guard + Filter(FieldExists) + Rename
	// Only named ports; "port" becomes "containerPort".
	renamedPorts := defkit.Each(ports).
		Guard(ports.IsSet()).
		Filter(defkit.FieldExists("name")).
		Rename("port", "containerPort")

	// Each + Guard + Wrap — scalar host strings → {host: "..."} objects.
	wrappedHosts := defkit.Each(hosts).
		Guard(hosts.IsSet()).
		Wrap("host")

	// Each + Guard + DefaultField(Format(...)) — auto-name ports that lack a name.
	namedPorts := defkit.Each(ports).
		Guard(ports.IsSet()).
		DefaultField("name", defkit.Format("port-%v", defkit.FieldRef("port")))

	// Each + Guard + MapVariant — protocol-specific field shape.
	variantPorts := defkit.Each(ports).
		Guard(ports.IsSet()).
		MapVariant("protocol", "TCP", defkit.FieldMap{
			"containerPort": defkit.FieldRef("port"),
			"name":          defkit.FieldRef("name"),
		}).
		MapVariant("protocol", "UDP", defkit.FieldMap{
			"containerPort": defkit.FieldRef("port"),
			"name":          defkit.Format("udp-%v", defkit.FieldRef("port")),
		})

	// From + Guard + FilterCond — general Condition filter (port > 1024).
	filteredByCondPorts := defkit.From(ports).
		Guard(ports.IsSet()).
		FilterCond(defkit.Gt(defkit.Reference("v.port"), defkit.Lit(1024))).
		Map(defkit.FieldMap{
			"containerPort": defkit.FieldRef("port"),
		})

	// From + Guard + Map + Dedupe — deduplicate by containerPort.
	dedupedPorts := defkit.From(ports).
		Guard(ports.IsSet()).
		Map(defkit.FieldMap{
			"containerPort": defkit.FieldRef("port"),
			"name":          defkit.Optional("name"),
		}).
		Dedupe("containerPort")

	// FromFields + MapBySource + Dedupe — combine pvc and configMap sub-arrays.
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

	// tpl.Helper + FromFields + Pick + PickIf(ItemFieldIsSet) — reusable mounts array.
	mountsHelper := tpl.Helper("mountsArray").
		FromFields(volumes, "pvc", "configMap").
		Pick("name", "mountPath").
		PickIf(defkit.ItemFieldIsSet("subPath"), "subPath").
		Build()

	_ = renamedPorts
	_ = wrappedHosts
	_ = namedPorts
	_ = variantPorts
	_ = filteredByCondPorts
	_ = dedupedPorts

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
<TabItem value="cue" label="CUE — generated">

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
    // +usage=Hostnames to route traffic to; wrapped into {host: ...} entries
    hosts?: [..._]
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
        hosts:
          - example.com
          - api.example.com
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

Reproduce the CUE on the right with:

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

Inspect the rendered Deployment — the Guard + Filter pipeline emits only the `expose: true` port (8080), and the `FromFields` pipeline produces both volume types:

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

## Related

- [Resource Builder](./resource-builder.md) — `NewResource`, `Set`, `SetIf`, `ArrayBuilder`, and `ArrayConcat`
- [ForEachWith / ItemBuilder](./foreach-item-builder.md) — per-element builder pattern for complex per-item logic
- [Helper Builder](./template-helper-builder.md) — `tpl.Helper()`, `tpl.AddLetBinding()`, and let-variable APIs
- [ComponentDefinition](./definition-component.md) — define workload types
