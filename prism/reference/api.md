---
title: API Reference
sidebar_label: API
description: Every resource Prism v1.7.0 serves, its fields, short names, verbs and table columns.
---

Prism v1.7.0 serves two API groups through the addon and the published chart, and a third with the chart at the `v1.7.0` tag. All are `v1alpha1`.

| Group | Resources |
| --- | --- |
| `prism.oam.dev` | `applicationresourcetrackers`, `clusters` |
| `o11y.prism.oam.dev` | `grafanas`, `grafanadashboards`, `grafanadatasources` |
| `dynamic.prism.oam.dev` | Whatever [dynamic resources](../guides/dynamic-resources.md) define. Chart at the tag only. |

No resource supports `watch`, `deletecollection`, status or other subresources.

## ApplicationResourceTracker

`prism.oam.dev/v1alpha1`, namespaced, short name `apprt`. Verbs: `get`, `list`.

| Field | Type | Description |
| --- | --- | --- |
| `metadata.name` | string | The ResourceTracker's name without its `-<namespace>` suffix. |
| `metadata.namespace` | string | The ResourceTracker's `app.oam.dev/namespace` label, or `default` if it has none. |
| `metadata.labels`, `annotations`, `uid`, `resourceVersion`, `creationTimestamp`, `finalizers`, `generation` | | The ResourceTracker's own. |
| `spec` | object | The ResourceTracker's spec, unchanged: `type`, `applicationGeneration`, and either `managedResources` or `compression` (`type`, `data`) when KubeVela compresses it. See the [ResourceTracker CRD](https://github.com/kubevela/kubevela/blob/master/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml). |

The ResourceTracker's `status` is not carried over. `kubectl get` shows `NAME` and `CREATED AT`.

A `get` reads ResourceTracker `<name>-<namespace>`. A `list` lists ResourceTrackers labelled `app.oam.dev/namespace=<namespace>`, with your label selector added; across all namespaces, it lists every ResourceTracker.

## Cluster

`prism.oam.dev/v1alpha1`, cluster-scoped, short names `vela-cluster`, `vela-clusters`, `vc` (`vc` is also Cluster Gateway's `virtualclusters`, which kubectl prefers). Verbs: `get`, `list`.

| Field | Type | Description |
| --- | --- | --- |
| `metadata.name` | string | The cluster's name. `local` is the hub. |
| `metadata.labels` | map | The Secret's or ManagedCluster's labels, except those under `cluster.core.oam.dev/`, plus `cluster.core.oam.dev/control-plane`: `"true"` for `local`, `"false"` otherwise. |
| `metadata.creationTimestamp` | time | The Secret's or ManagedCluster's. Unset for `local`. |
| `spec.alias` | string | The `cluster.core.oam.dev/cluster-alias` annotation. |
| `spec.accepted` | bool | Always `true` for Secrets; `spec.hubAcceptsClient` for ManagedClusters. |
| `spec.endpoint` | string | The Secret's `endpoint` data, or its `cluster.core.oam.dev/cluster-endpoint-type` label when set (for example `ClusterProxy`). `-` for `local` and ManagedClusters. |
| `spec.credential-type` | string | The Secret's `cluster.core.oam.dev/cluster-credential-type` label (`X509Certificate`, `ServiceAccountToken`, and the other Cluster Gateway types); `Internal` for `local`; `ManagedCluster` for OCM. |

Columns: `NAME`, `ALIAS`, `CREDENTIAL_TYPE`, `ENDPOINT`, `ACCEPTED`, `LABELS`, and `CREATION_TIMESTAMP` with `-o wide`. A list is sorted with `local` first, then newest first.

## Grafana

`o11y.prism.oam.dev/v1alpha1`, cluster-scoped, short names `gf`, `grafana-instance`. Verbs: `get`, `list`, `create`, `update`, `patch`, `delete`.

| Field | Type | Description |
| --- | --- | --- |
| `metadata.name` | string | The name dashboards and datasources refer to after `@`. |
| `metadata.labels`, `annotations` | map | Kept on the Secret. |
| `spec.endpoint` | string | Grafana's base URL, reachable from Prism's pod. Required. |
| `spec.access.username`, `spec.access.password` | string | Basic auth. |
| `spec.access.token` | string | A bearer token. Used instead of basic auth when both are set. |

Stored as Secret `grafana.<name>` in the observability namespace: the endpoint in annotation `o11y.oam.dev/grafana-endpoint`, the credential in data keys `username`, `password`, `token`. Owner references are not copied. A Secret with that prefix but no endpoint or credential is skipped in lists.

Columns: `NAME`, `ENDPOINT`, `CREDENTIAL_TYPE` (`BasicAuth`, `BearerToken`, or `NA`), and `LABELS`, `CREATION_TIMESTAMP` with `-o wide`.

## GrafanaDashboard

`o11y.prism.oam.dev/v1alpha1`, cluster-scoped, short name `gdb` (and, by mistake, `datasource`, `datasources`, `grafana-datasource`, `grafana-datasources`). Verbs: `get`, `list`, `create`, `update`, `patch`, `delete`.

| Field | Type | Description |
| --- | --- | --- |
| `metadata.name` | string | `<uid>@<grafana>`; `<uid>` alone means Grafana `default`. |
| `metadata.labels["o11y.oam.dev/grafana-dashboard-folder-uid"]` | string | Folder to save into, by uid. Read back from Grafana. |
| `metadata.labels["o11y.oam.dev/grafana-dashboard-folder-id"]` | string | Folder to save into, by numeric id. Read back from Grafana. |
| `spec` | object | Grafana's dashboard JSON model. `uid` is set from the name; `id` is dropped on write. |

| Operation | Grafana call |
| --- | --- |
| `get` | `GET /api/dashboards/uid/<uid>` |
| `list` | `GET /api/search?type=dash-db`, with `query`, `tag`, `folderIds`, `dashboardIds`, `starred` taken from label selectors of those names, and `grafana` choosing the instance |
| `create`, `update`, `patch` | `POST /api/dashboards/db` with `{"dashboard": <spec>, "folderId"?, "folderUid"?}` |
| `delete` | `DELETE /api/dashboards/uid/<uid>` |

`list` returns only `title`, `id` and `tags` in each spec. Columns: `UID`, `TITLE`, and `FOLDERID` with `-o wide`.

## GrafanaDatasource

`o11y.prism.oam.dev/v1alpha1`, cluster-scoped, short names `gds`, `datasource`, `datasources`, `grafana-datasource`, `grafana-datasources` (the last four also match dashboards, which kubectl prefers). Verbs: `get`, `list`, `create`, `update`, `patch`, `delete`.

| Field | Type | Description |
| --- | --- | --- |
| `metadata.name` | string | `<uid>@<grafana>`; `<uid>` alone means Grafana `default`. |
| `spec` | object | Grafana's datasource model. `uid` is set from the name. `id` is Grafana's, and an update needs it. |

| Operation | Grafana call |
| --- | --- |
| `get` | `GET /api/datasources/uid/<uid>` |
| `list` | `GET /api/datasources`, on the Grafana chosen by the `grafana` label selector |
| `create` | `POST /api/datasources/` |
| `update`, `patch` | `PUT /api/datasources/<spec.id>` |
| `delete` | `DELETE /api/datasources/uid/<uid>` |

Columns: `UID`, `NAME`, `TYPE`, `URL`.

Labels and annotations on dashboards and datasources, other than the two folder labels, are not stored. `metadata.uid` is `-` and there is no `resourceVersion` or `creationTimestamp`.

## Other endpoints

v1.7.0 also serves `POST /cue/compile` and `POST /cuex/compile` on its own port, from `github.com/kubevela/pkg`. They aren't part of any API group, so the hub doesn't route to them; a client that reaches the pod directly is authorized as a non-resource URL (`nonResourceURLs: ["/cue/compile"]`), and anonymous requests are refused.
