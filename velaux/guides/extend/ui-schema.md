---
title: UX of Definition
---

VelaUX builds a form for every component, trait, policy and workflow step from its parameter schema. A UI schema changes how that form looks: which widget a field uses, its label and order, its validation, and when it is shown.

You can shape a form in two places:

- **A UI schema ConfigMap**, `<type>-uischema-<name>`, written in YAML and applied with `vela uischema apply` or shipped in an addon. It works with any VelaUX version.
- **`+ui:` markers** in the definition's CUE parameter comments. They travel with the definition, and need KubeVela 1.12 and a newer VelaUX (see [`+ui:` markers](#ui-markers)).

## How VelaUX builds a form

Take the built-in `scaler` trait. Its only parameter is `replicas`:

```cue
template: {
	parameter: {
		// +usage=Specify the number of workload
		replicas: *1 | int
	}
	// +patchStrategy=retainKeys
	patch: spec: replicas: parameter.replicas
}
```

VelaUX turns that into a form in three steps:

1. **The default form.** KubeVela generates the parameter's [OpenAPI schema](/docs/next/platform-engineers/openapi-v3-json-schema) and stores it in the definition's schema ConfigMap (`trait-schema-scaler`). Each field gets a widget from its type: `replicas` is an `int`, so it becomes a `Number` input with `1` filled in. With KubeVela 1.12 the controller also generates the default form itself, `+ui:` markers included, and stores it under the `default-ui-schema` key of the same ConfigMap; an older VelaUX ignores that key and builds the form from the OpenAPI schema.
2. **Your UI schema.** If a ConfigMap named `trait-uischema-scaler` exists, VelaUX patches the default form with it, field by field, matched on `jsonKey`.
3. **Render.** VelaUX draws the result.

The patch replaces a field's `label`, `description`, `uiType`, `sort`, `disable`, `conditions`, `additional` and `subParameterGroupOption` where your schema sets them, and recurses into `subParameters`. `validate` and `style` are replaced whole, not merged: if you set `validate.max`, also set the `required` and `defaultValue` the default form had, or they are lost.

## Customise a form

Say you want the `scaler` form to accept between 1 and 10 replicas.

1. Write the UI schema to a file named `trait-uischema-scaler.yaml`:

   ```yaml
   - jsonKey: replicas
     label: Replicas
     description: Number of pods, between 1 and 10.
     uiType: Number
     validate:
       required: true
       defaultValue: 1
       min: 1
       max: 10
   ```

2. Apply it:

   ```shell
   vela uischema apply trait-uischema-scaler.yaml
   ```

   ```console
   apply trait-uischema-scaler.yaml success
   ```

   The command reads the definition type and name from the file name, `<type>-uischema-<name>.yaml` (or `<type>-<name>.yaml`), and writes the ConfigMap `trait-uischema-scaler` in `vela-system`. Pass a directory to apply every `.yaml` file in it. The `vela-system` namespace is fixed: for a definition in another namespace, create the ConfigMap there yourself, with the schema as JSON under the `ui-schema` key.

3. Open an application in VelaUX and add the `scaler` trait. Before, the Replicas field took any number from 0 up (the limit the velaux addon's own schema sets). Now it shows the new description, and VelaUX refuses a value below 1 or above 10 with a message under the field.

The velaux addon ships its own `trait-uischema-scaler`, so applying yours replaces it, and enabling or upgrading the velaux addon again puts the addon's back.

### Ship a UI schema in an addon

An addon carries its UI schemas in its `schemas/` directory, one file per definition, named `<type>-uischema-<name>.yaml`, for example `schemas/trait-uischema-scaler.yaml`. When the addon is enabled, each file becomes a ConfigMap in `vela-system` named after the file (everything before the first `.`), so a file with any other name produces a ConfigMap VelaUX never reads. `<type>` is `component`, `trait`, `policy`, `workflowstep`, `config` or `addon`. See [Addons](/addons/developer/addon-reference) for the rest of the addon layout.

## See the UI schemas in your cluster

List the UI schema ConfigMaps:

```shell
kubectl get configmap -n vela-system | grep uischema
```

With the velaux addon enabled, you get the schemas it ships:

```console
addon-uischema-velaux                          1      25h
component-uischema-k8s-objects                 1      25h
component-uischema-task                        1      25h
component-uischema-webservice                  1      25h
config-uischema-image-registry                 1      25h
config-uischema-nacos-config                   1      25h
config-uischema-nacos-server                   1      25h
policy-uischema-override                       1      25h
trait-uischema-scaler                          1      25h
trait-uischema-storage                         1      25h
workflowstep-uischema-deploy                   1      25h
workflowstep-uischema-deploy2env               1      25h
workflowstep-uischema-notification             1      25h
workflowstep-uischema-webhook                  1      25h
```

Each one holds its schema as JSON under the `ui-schema` key. For example, the `k8s-objects` component's:

```shell
kubectl get configmap -n vela-system component-uischema-k8s-objects -o yaml
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: component-uischema-k8s-objects
  namespace: vela-system
data:
  ui-schema: '[{"jsonKey":"objects","uiType":"K8sObjectsCode"}]'
```

The sources of these schemas are in the catalog, under [addons/velaux/schemas](https://github.com/kubevela/catalog/tree/master/addons/velaux/schemas): a good place to find a worked example for each widget.

## UI schema fields

A UI schema is a list of fields, one per parameter. Fields marked *newer* are read only by VelaUX v1.12.0-alpha.1 and later; the velaux addon in the catalog is v1.9.5, which ignores them.

| Field | Type | What it does | Example |
| --- | --- | --- | --- |
| `jsonKey` | string | The parameter this entry applies to. Required. | `replicas` |
| `label` | string | The field's name in the form. | `Replicas` |
| `description` | string | Help text under the field. | `Number of pods.` |
| `uiType` | string | The widget, from [Widgets](#widgets). | `Number` |
| `sort` | int | Position in the form, lowest first. Generated fields start at 100. | `1` |
| `disable` | bool | Hides the field from the form. | `true` |
| `style.colSpan` | int | Width on a 24-column grid; 24 is the full width. | `12` |
| `style.placeholder` | string | Text shown in an empty input. *Newer.* | `nginx:1.27` |
| `style.format` | string | `table` lays a list of structs out as one row per item. *Newer.* | `table` |
| `style.rowKey` | string | The sub-field that identifies an item of a list: it must be unique and titles the item. *Newer.* | `name` |
| `style.itemLabel` | string | The sub-field that titles each item of a list. *Newer.* | `path` |
| `style.section` | string | The collapsible section of the form the field is shown in. *Newer.* | `Networking` |
| `style.advanced` | bool | Puts the field behind the Advanced toggle. Once any field sets it, only those that do are hidden. *Newer.* | `true` |
| `style.optionsFrom` | string | Reads the field's choices when the form opens: `configs:<template>`, `clusters` or `envs`. *Newer.* | `configs:image-registry` |
| `style.expression` | string | `never` keeps the field a literal value, even where the application accepts `$( )` expressions. *Newer.* | `never` |
| `conditions` | list | Shows or hides the field depending on other fields' values; see below. | |
| `validate.required` | bool | The field must have a value. | `true` |
| `validate.defaultValue` | any | The value the form starts with. | `1` |
| `validate.min`, `validate.max` | number | Bounds for a number. | `10` |
| `validate.minLength`, `validate.maxLength` | int | Bounds on a string's length. | `63` |
| `validate.pattern` | string | A regular expression the value must match. | `^[a-z0-9-]+$` |
| `validate.options` | list | The choices of a `Select`, each a `label` and a `value`. | `[{label: TCP, value: TCP}]` |
| `validate.immutable` | bool | The value cannot change once the application is created. | `true` |
| `validate.message` | string | The message shown when a value fails `min`, `max`, `minLength`, `maxLength` or `pattern`. *Newer.* | `Pick 1 to 10.` |
| `subParameters` | list | UI schema entries for the fields of a struct, a list of structs or a map of structs. | |
| `subParameterGroupOption` | list | For a `Structs` list: named sets of sub-fields an item can take, each a `label` and a list of `keys`. | |
| `additional`, `additionalParameter` | bool, entry | For a `KV` map: whether keys can be added freely, and the UI schema of each value. | |

Each entry in `conditions` has a `jsonKey` (the field whose value is read), an `op` (`==`, `!=` or `in`; default `==`), a `value`, and an `action` (`enable` or `disable`; default `enable`). The field is shown when all its `enable` conditions match and none of its `disable` conditions do. This shows `port` only while `expose` is on:

```yaml
- jsonKey: port
  conditions:
    - jsonKey: expose
      op: "=="
      value: true
      action: enable
```

## Widgets

The `uiType` values VelaUX renders. *Newer* means VelaUX v1.12.0-alpha.1 or later.

| uiType | Use for | VelaUX |
| --- | --- | --- |
| `Input` | A string. | v1.9.5 |
| `Password` | A string shown masked. | v1.9.5 |
| `Number` | A number. | v1.9.5 |
| `Switch` | A boolean. | v1.9.5 |
| `Select` | One value from `validate.options`. | v1.9.5 |
| `Suggest` | A string with suggestions from `validate.options`; any other value is allowed too. | *Newer* |
| `KV` | A map of strings. | v1.9.5 |
| `Strings` | A list of strings. | v1.9.5 |
| `Numbers` | A list of numbers. | v1.9.5 |
| `Structs` | A list of structs, described by `subParameters`. | v1.9.5 |
| `StructMap` | A map of structs, entered as rows of a key and the struct's fields. | *Newer* |
| `Group` | A struct, shown as a titled container of its `subParameters`. | v1.9.5 |
| `Ignore` | A struct whose own field is not shown; its `subParameters` are shown in its place. | v1.9.5 |
| `ImageInput` | A container image name; VelaUX looks the image up and shows its details. | v1.9.5 |
| `SecretSelect` | A Secret written by a cloud resource in the application's namespace. | v1.9.5 |
| `SecretKeySelect` | A key of the Secret picked in a `SecretSelect`. | v1.9.5 |
| `CPUNumber` | A CPU amount, in cores. | v1.9.5 |
| `MemoryNumber` | A memory amount. | v1.9.5 |
| `DiskNumber` | A storage size. | v1.9.5 |
| `K8sObjectsCode` | Kubernetes objects, as a YAML editor. | v1.9.5 |
| `HelmRepoSelect` | A Helm repository, from the project's `helm-repository` configs. | v1.9.5 |
| `HelmChartSelect` | A chart in the repository picked above. | v1.9.5 |
| `HelmChartVersionSelect` | A version of the chart picked above. | v1.9.5 |
| `HelmValues` | Values for the chart, starting from its defaults. | v1.9.5 |
| `PolicySelect` | Policies of the current application. | v1.9.5 |
| `ComponentSelect` | Components of the current application. | v1.9.5 |
| `ComponentPatches` | Per-component patches, as used by the `override` policy. | v1.9.5 |
| `CertBase64` | A certificate or key, uploaded or pasted; VelaUX base64-encodes it. | v1.9.5 |

A field with `style.optionsFrom` set is rendered as a select of those choices whatever its `uiType`.

## `+ui:` markers {#ui-markers}

From KubeVela 1.12, a definition can describe its own form in its CUE parameter comments, one `// +ui:` marker per line, next to `+usage`. The controller reads them when it generates the default form, and also publishes them in the parameter's OpenAPI schema as the `x-vela-ui` extension.

```cue
template: {
	parameter: {
		// +usage=The image to run
		// +ui:placeholder=nginx:1.27
		image: string

		// +usage=Number of pods
		// +ui:error=Pick between 1 and 10
		// +ui:order=1
		replicas: *1 | int & >=1 & <=10

		// +usage=Ports to expose
		// +ui:format=table
		// +ui:rowKey=port
		ports?: [...{
			port:     int
			protocol: *"TCP" | "UDP"
		}]

		// +usage=Log level
		// +ui:suggest=debug,info,warn,error
		// +ui:section=Logging
		logLevel?: string

		// +usage=Annotations added to each pod
		// +ui:advanced
		// +ui:label=Pod annotations
		podAnnotations?: [string]: string
	}
}
```

| Marker | Sets | Effect |
| --- | --- | --- |
| `+ui:type=<uiType>` | `uiType` | Overrides the widget the field's type implies. |
| `+ui:label=<text>` | `label` | The field's name in the form. |
| `+ui:placeholder=<text>` | `style.placeholder` | Text shown in an empty input. |
| `+ui:error=<text>` | `validate.message` | The message shown when a value fails the field's constraints. |
| `+ui:format=table` | `style.format` | Lays a list of structs out as one row per item. |
| `+ui:rowKey=<field>` | `style.rowKey` | The sub-field that identifies an item of a list: unique, and the item's title. |
| `+ui:itemLabel=<field>` | `style.itemLabel` | The sub-field that titles each item of a list. |
| `+ui:section=<name>` | `style.section` | The collapsible section the field is shown in. |
| `+ui:optionsFrom=<source>` | `style.optionsFrom` | Reads the choices when the form opens: `configs:<template>`, `clusters` or `envs`. |
| `+ui:expression=never` | `style.expression` | Keeps the field a literal value, even where the application accepts `$( )` expressions. |
| `+ui:suggest=<a>,<b>` | `uiType: Suggest`, `validate.options` | Suggestions for a string field; other values are still allowed. |
| `+ui:colSpan=<n>` | `style.colSpan` | Width on a 24-column grid. |
| `+ui:order=<n>` | `sort` | Places the field at position `n` among its siblings, counting from 0; the rest keep their declaration order. |
| `+ui:advanced` | `style.advanced` | Puts the field behind the Advanced toggle. |
| `+ui:hidden` | `disable` | Hides the field from the form. |

An unknown marker is ignored, so a definition written for a newer VelaUX still renders on an older one. A UI schema ConfigMap still applies on top: since it replaces `style` and `validate` whole, setting either there drops what the markers put in it.

:::note
The markers need both halves: KubeVela 1.12 to generate the form, and VelaUX v1.12.0-alpha.1 or later to read it. The velaux addon in the catalog is v1.9.5, which builds the form from the OpenAPI schema and ignores the markers.
:::

## Add a widget

Widgets are React components in velaux's [`packages/velaux-ui/src/extends`](https://github.com/kubevela/velaux/tree/main/packages/velaux-ui/src/extends), chosen by the `switch (param.uiType)` in `packages/velaux-ui/src/components/UISchema/index.tsx`. Adding one needs a VelaUX build.
