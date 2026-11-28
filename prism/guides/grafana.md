---
title: Grafana Dashboards and Datasources
sidebar_label: Grafana
description: Registering a Grafana instance with Prism, and managing its dashboards and datasources as Kubernetes objects.
---

Prism can manage a Grafana instance's dashboards and datasources through the Kubernetes API. It isn't an operator: there's no copy of the dashboard in etcd and no reconcile loop. Each request is turned into a call to Grafana's HTTP API, and the answer comes straight back, so what `kubectl get` shows is what Grafana holds right now.

Three resources work together, all cluster-scoped in `o11y.prism.oam.dev/v1alpha1`:

| Resource | Short name | What it is |
| --- | --- | --- |
| `Grafana` | `gf` | Where a Grafana instance is and how to sign in to it. |
| `GrafanaDashboard` | `gdb` | One dashboard, named `<uid>@<grafana>`. |
| `GrafanaDatasource` | `gds` | One datasource, named `<uid>@<grafana>`. |

The [`grafana` addon](/docs/next/platform-engineers/operations/o11y/installation) registers the Grafana it installs as `default`, and `o11y-definitions` gives you component types and steps that write these objects from an Application: see [Customize Dashboard](/docs/next/platform-engineers/operations/o11y/dashboard). This page is about the objects themselves.

## Register a Grafana

```yaml
apiVersion: o11y.prism.oam.dev/v1alpha1
kind: Grafana
metadata:
  name: default
spec:
  endpoint: http://grafana.o11y-system:3000
  access:
    username: admin
    password: kubevela
```

`access` takes either `username` and `password`, for basic auth, or `token`, for a Grafana API token or service account token:

```yaml
  access:
    token: glsa_xxxxxxxxxxxxxxxx
```

Prism stores the object as a Secret named `grafana.<name>` in `o11y-system` (the `--observability-namespace` flag), with the endpoint in its `o11y.oam.dev/grafana-endpoint` annotation and the credential in its data. That namespace must exist before you create the first one.

```shell
kubectl get grafanas
```

```console
NAME      ENDPOINT                          CREDENTIAL_TYPE
default   http://grafana.o11y-system:3000   BasicAuth
```

:::caution
Reading a `Grafana` object returns its credential in the clear, in `spec.access`. Treat `get` on `grafanas` like `get` on Secrets.

Create it with `kubectl create`, not `kubectl apply`. `apply` stores the whole object, password included, in the `kubectl.kubernetes.io/last-applied-configuration` annotation, and Prism copies annotations onto the Secret, so the password ends up in the Secret's metadata as well as its data. A `grafana` config (`vela config create my-grafana -t grafana ...`) avoids both, and keeps the credential out of Applications: see [Cloud Service Integration](/docs/next/platform-engineers/operations/o11y/integration#integrate-grafana).
:::

## Datasources

A datasource's spec is Grafana's [datasource model](https://grafana.com/docs/grafana/latest/developers/http_api/data_source/), as YAML. Prism sets `uid` from the name, so leave it out:

```yaml
apiVersion: o11y.prism.oam.dev/v1alpha1
kind: GrafanaDatasource
metadata:
  name: prometheus@default
spec:
  name: Prometheus
  type: prometheus
  access: proxy
  url: http://prometheus-server.o11y-system:9090
  isDefault: true
```

```shell
kubectl get grafanadatasources
```

```console
UID          NAME         TYPE         URL
prometheus   Prometheus   prometheus   http://prometheus-server.o11y-system:9090
```

Reading one back shows everything Grafana keeps, including the `id` it assigned. An update is a `PUT` to that `id`, so update with `kubectl apply`, `edit` or `patch`, which start from what Grafana returns. `kubectl replace` with a spec that has no `id` sends the update to datasource `0`, and fails:

```console
Error from server: error when replacing "STDIN": request grafana http://grafana.o11y-system:3000 failed, path: /api/datasources/0, code: 500, detail: {"message":"Failed to update datasource"}
```

## Dashboards

A dashboard's spec is Grafana's [dashboard JSON model](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/). Prism sets `uid` from the name and drops `id`:

```yaml
apiVersion: o11y.prism.oam.dev/v1alpha1
kind: GrafanaDashboard
metadata:
  name: team-a-overview@default
spec:
  title: Team A Overview
  tags: [team-a]
  time:
    from: now-6h
    to: now
  panels:
    - type: timeseries
      title: Targets up
      gridPos: {h: 8, w: 12, x: 0, "y": 0}
      datasource: {type: prometheus, uid: prometheus}
      targets:
        - expr: sum(up)
```

Quote `"y"` in `gridPos`. kubectl reads YAML 1.1, where a bare `y` is the boolean `true`, so `y: 0` reaches Grafana as `"true": 0` and every panel stacks at the top. Writing the dashboard as JSON, or the whole spec as one JSON block, avoids it too.

Create and update are the same call to Grafana (`POST /api/dashboards/db`), so `kubectl apply` works either way. To put a dashboard in a folder, set a label:

```yaml
metadata:
  name: team-a-overview@default
  labels:
    o11y.oam.dev/grafana-dashboard-folder-uid: team-a
```

`o11y.oam.dev/grafana-dashboard-folder-id` takes Grafana's numeric folder ID instead. Prism reads both back from Grafana, so they're the only labels a dashboard keeps.

### Finding dashboards

A list is Grafana's search, and label selectors become its query parameters:

| Selector | Grafana search parameter |
| --- | --- |
| `grafana=<name>` | Which Grafana to search; `default` if omitted |
| `query=<text>` | `query`: title contains |
| `tag=<tag>` | `tag` |
| `folderIds=<id>` | `folderIds` |
| `dashboardIds=<id>` | `dashboardIds` |
| `starred=true` | `starred` |

```shell
kubectl get grafanadashboards -l grafana=default,tag=team-a
```

```console
UID               TITLE
team-a-overview   Team A Overview
```

A list shows only each dashboard's title, id and tags; `get` on one name returns the full model.

## Several Grafanas

Register each one under its own name, and name every dashboard and datasource after the Grafana it belongs to: `team-a-overview@my-grafana`. Lists default to `default`, so pass `-l grafana=my-grafana` to see another. If the named Grafana doesn't exist, Prism says so:

```console
Error from server (NotFound): Unable to find "o11y.prism.oam.dev/v1alpha1, Resource=grafanadashboards" that match label selector "grafana=missing", field selector "": secrets "grafana.missing" not found
```

## Permissions

A user's RBAC is checked against the Prism resource only. Prism then calls Grafana with the credential in the `Grafana` object, so:

* `create`, `update` or `delete` on `grafanadashboards` lets a user change any dashboard, in any registered Grafana, with that Grafana's credential. `resourceNames` narrows `get`, `update`, `patch` and `delete` to named dashboards, but not `create`: a create request carries no name when it is authorized. To limit who creates dashboards where, register a Grafana per team with a credential scoped in Grafana itself.
* `get` or `list` on `grafanas` reveals the credentials.
* Grafana's own errors come back as Kubernetes ones: a `401` from Grafana is `Unauthorized`, `403` is `Forbidden`, `404` is `NotFound`, `412` (a version conflict) is `BadRequest`.

## Short names

Prism v1.7.0 gives `GrafanaDashboard` the same extra short names as `GrafanaDatasource`: `datasource`, `datasources`, `grafana-datasource`, `grafana-datasources`. kubectl resolves them to dashboards, so `kubectl get datasources` lists dashboards, with only a warning:

```console
Warning: short name "datasources" could also match lower priority resource grafanadatasources.o11y.prism.oam.dev
No resources found
```

Use `gds` or `grafanadatasources` for datasources, and `gdb` or `grafanadashboards` for dashboards.
