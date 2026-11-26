---
title: Generating OpenAPI Schema
---

The `parameter` of your definition is what its users fill in. KubeVela turns it into an OpenAPI v3 JSON schema, and VelaUX renders that schema as the definition's form. `vela show` prints the same parameters. So the `// +usage` comments, defaults and constraints you write in `parameter` become the descriptions, default values and validation your users see. See [Parameter Markers](./cue/parameter-markers.md) for the markers you can use, and [UX of Definition](/velaux/extend/ui-schema) to customize the form further.

KubeVela generates the schema whenever you apply a [definition](./oam/x-definition.md), and stores it in a `ConfigMap` in the definition's namespace.

> The default KubeVela system `namespace` is `vela-system`, where the built-in definitions and their schemas live.

## Find a schema

Schema ConfigMaps carry the label `definition.oam.dev=schema`:

```shell
kubectl get configmap -n vela-system -l definition.oam.dev=schema
```

```console
NAME                             DATA   AGE
component-schema-webservice      4      2m26s
component-schema-webservice-v1   4      40s
component-schema-worker          3      1m45s
component-schema-worker-v1       3      55s
component-schema-worker-v2       3      20s
trait-schema-scaler              2      50m
```

The name is `<type>-schema-<definition name>`, where `<type>` is `component`, `trait`, `policy`, `workflowstep` or `source`. The ConfigMap without a version suffix holds the latest version; each [definition revision](../end-user/definition-version-control.md) also gets its own, suffixed `-v<revision>`.

To list the schemas of one definition, filter on `definition.oam.dev/name`:

```shell
kubectl get configmap -n vela-system -l definition.oam.dev/name=worker
```

```console
NAME                         DATA   AGE
component-schema-worker      3      1m50s
component-schema-worker-v1   3      1m
component-schema-worker-v2   3      25s
```

## What a schema ConfigMap holds

| Key | Holds | Written for |
| --- | --- | --- |
| `openapi-v3-json-schema` | The OpenAPI v3 JSON schema of `parameter`. | Every definition. |
| `default-ui-schema` | A UI schema generated from `parameter`, for the form VelaUX renders. | Definitions a UI schema can be generated for. |
| `output-schema` | The schema of the component's `output`, the value an Application reads with `$(component.<name>.output)`. | Component and trait definitions that declare `output`. |
| `outputs-schema` | The schema of each resource in `outputs`, by resource name, read with `$(component.<name>.outputs.<resource>)`. | Component and trait definitions that declare `outputs`. |
| `source-output-schema` | The schema of the source's `schema`, the value an Application reads with `$(source.<name>)`. | SourceDefinitions. |

For example, to see the parameter schema of `webservice`:

```shell
kubectl get configmap component-schema-webservice -n vela-system -o jsonpath='{.data.openapi-v3-json-schema}'
```

```console
{"properties":{"cmd":{"description":"Commands to run in the container","items":{"type":"string"},"title":"cmd","type":"array"},"cpu":{"description":"Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)","title":"cpu","type":"string"},"image":{"description":"Which image would you like to use for your service","title":"image","type":"string"}, ...},"required":["image"],"type":"object"}
```

The schema comes from the definition's parameters:

* For a CUE based definition: the `parameter` field of its template.
* For a Terraform based definition: the `variable` blocks of its module.

## Next

* Refer to [UX of Definition](/velaux/extend/ui-schema)
