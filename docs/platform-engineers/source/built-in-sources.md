---
title: Built-in Sources
---

Eight SourceDefinitions are installed in `vela-system` with the `vela-core` chart. They read data a platform commonly needs, so most Applications bind one of these instead of authoring a definition. To read the definitions themselves, see `vela-templates/definitions/internal/source/` in the [kubevela repository](https://github.com/kubevela/kubevela).

| Type | Reads |
|---|---|
| [`configmap-local`](#configmap-local) | The data of a ConfigMap in the Application's own namespace |
| [`git-file`](#git-file) | A file from a registry configured in the cluster |
| [`http-get`](#http-get) | A URL |
| [`vela-config`](#vela-config) | A KubeVela Config's properties and the references it produced |
| [`vela-app`](#vela-app) | The status of another Application |
| [`vela-component`](#vela-component) | The status of one placement of one component |
| [`vela-addon`](#vela-addon) | Whether an addon is installed and running |
| [`vela-env`](#vela-env) | The environment the Application is deployed into |

The tables below list the parameters you put in `spec.sources[].properties`, the fields you can read as `source.<name>.<field>`, and the default cache lifetime.

## configmap-local

Reads a ConfigMap's `data` from the Application's own namespace, on the cluster being rendered for, and nowhere else. Values are strings, as Kubernetes stores them.

| Parameter | Type | Description |
|---|---|---|
| `name` | string, required | Name of the ConfigMap |

Output: `data` (map of string to string). Cache: 5m, `use-stale`.

```yaml
sources:
  - name: settings
    type: configmap-local
    properties:
      name: app-settings
components:
  - name: api
    type: webservice
    properties:
      env:
        - name: LOG_LEVEL
          value: '$(source.settings.data.logLevel)'
```

A key of `data` may be absent from the ConfigMap, so guard it with `has(...)` where it feeds a required parameter, see [Optional fields](./using-sources.md#optional-fields).

There is deliberately no source that reads a ConfigMap from another namespace or cluster. When definition permission validation is enabled, RBAC on the SourceDefinition controls who may bind it, so the reach of a source belongs in the definition and not in a parameter that an application author can change. A platform that needs cross-namespace reads can write its own definition, starting from `configmap-local`.

## git-file

Reads a file from a registry configured in this cluster. YAML and JSON files are parsed, and any other file comes back as a string.

| Parameter | Type | Description |
|---|---|---|
| `registry` | string, required | Name of a registry configured in the cluster |
| `path` | string, required | Path of the file within the registry |
| `ref` | string | Branch, tag or commit. Defaults to whatever the registry pinned |
| `required` | bool, default `true` | When `false`, a missing file resolves with `found: false` and `content: null` instead of failing |

Output: `content` (parsed value or string) and `found` (bool). Cache: 30m, `use-stale`.

## http-get

Sends a GET request to a URL. The response is parsed when its `Content-Type` is JSON or YAML. A response outside the 2xx range fails the source rather than becoming its value.

| Parameter | Type | Description |
|---|---|---|
| `url` | string, required | The URL to GET |

Output: `content` (parsed value or string) and `statusCode` (int). Cache: 5m, `use-stale`.

The request is made by the controller process, so the controller needs outbound access to the URL. It is also subject to the controller's outbound HTTP deny policy and, when enabled, private-address blocking.

## vela-config

Reads a KubeVela Config: its properties, the ConfigTemplate it satisfies, and references to the resources that template produced. Values of the generated resources are never returned, only their references, and a Config marked sensitive is refused.

| Parameter | Type | Description |
|---|---|---|
| `name` | string, required | Name of the Config |
| `namespace` | string | Namespace of the Config. Defaults to `vela-system` |

Output: `properties`, `template.name`, `template.namespace`, `output` and `outputs`, where the last two are `{apiVersion, kind, name, namespace}` references. Cache: 5m, `use-stale`.

## vela-app

Reads the **status** of another Application: phase, health, workflow state, and per-component status broken down by the cluster each component is placed in. It never returns the Application's spec.

| Parameter | Type | Description |
|---|---|---|
| `name` | string, required | Name of the Application |
| `namespace` | string | Defaults to the consuming Application's namespace |

Output: `name`, `namespace`, `phase`, `healthy`, optional `revision`, optional `workflow` (`mode`, `phase`, `suspend`, `terminated`, `finished`, `message`), `components`, `clusters`, and `services`, which maps each component to its `healthy` flag and a `clusters` map of `{healthy, message, namespace}`. Cache: 1m, `fail`.

## vela-component

Reads the **status** of one placement of one component: health, message, details, and traits keyed by type. It never returns the spec.

| Parameter | Type | Description |
|---|---|---|
| `app` | string, required | Name of the Application |
| `component` | string, required | Name of the component |
| `namespace` | string | Defaults to the consumer's namespace |
| `cluster` | string | Which placement to read. Defaults to the hub (`local`) |

Output: `name`, `healthy`, `workloadHealthy`, `message`, `details`, `cluster`, `namespace`, and `traits`, which maps each trait type to `{healthy, pending, message, details}`. Cache: 1m, `fail`.

## vela-addon

Reports whether an addon is installed and running, and the name and namespace of the Application that built it. Chain it into `vela-app` for detail.

| Parameter | Type | Description |
|---|---|---|
| `name` | string, required | Addon name, as `vela addon list` shows it |
| `namespace` | string, default `vela-system` | Namespace addon Applications are installed into. Set it if the chart was installed with a non-default `systemDefinitionNamespace` |

Output: `installed`, `running`, `app`, `namespace`. Cache: 1m, `fail`.

```yaml
sources:
  - name: fluxcd
    type: vela-addon
    properties: {name: fluxcd}
  - name: fluxApp                       # chained: reads the Application the addon created
    type: vela-app
    properties:
      name: '$(source.fluxcd.app)'
      namespace: '$(source.fluxcd.namespace)'
```

## vela-env

Reads the environment the Application is deployed into, from its own namespace only. It takes no parameters.

Output: `name` (the `namespace.oam.dev/env` label if set, otherwise the namespace name), `namespace`, `managed` (whether the namespace is a managed environment), `labels` and `annotations`. Cache: 5m, `use-stale`.

## Why the application-state sources return status only

A component can reach for the Kubernetes API itself, but that needs credentials, gets no caching and cannot be type-checked at admission. The `vela-app`, `vela-component`, `vela-addon`, and `vela-env` sources give the same answer with all three. They return status, never spec: a spec is its author's intent and can hold properties they never meant to publish, while a status is observable state that anyone with read access can already see. That makes them a health signal and not a way to read someone else's configuration. `vela-config` is different: it deliberately returns a non-sensitive Config's declared properties, while returning only references for resources generated from them.
