---
title: Vela prism
---

Vela Prism adds Kubernetes APIs over KubeVela's own objects and those of some addons, so you can grant access with ordinary RBAC. Two of them are read-only views:

- `ApplicationResourceTracker`, a namespaced view of ResourceTrackers (`kubectl get apprt`).
- `Cluster`, the cluster list without credentials (`kubectl get vela-clusters`).

It also serves `Grafana`, `GrafanaDatasource` and `GrafanaDashboard`, which the observability addons use to manage Grafana's datasources and dashboards.

Enable it when you want to let users in a namespace see what their Applications created, or list clusters, without cluster-admin.

It runs as a Kubernetes [aggregated API server](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/).

This page covers enabling the addon. Prism itself, including its Grafana APIs, RBAC patterns and worked examples, has its own section: [Prism](/prism/getting-started/introduction).

![PrismArch](https://raw.githubusercontent.com/kubevela/prism/master/hack/prism-arch.jpg)

## Install

```shell
vela addon enable vela-prism
```

To remove it:

```shell
vela addon disable vela-prism
```

## Parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `namespace` | `vela-system` | Where vela-prism looks for cluster Secrets and OCM ManagedClusters. Leave it at `vela-system`: see below. |
| `image` | `oamdev/vela-prism:v1.7.0` | vela-prism image. |
| `imagePullPolicy` | `IfNotPresent` | `IfNotPresent`, `Never` or `Always`. |
| `cpu` | `0.1` | CPU request and limit. |
| `memory` | `200Mi` | Memory request and limit. |

vela-prism itself always runs in `vela-system`. Setting `namespace` to anything else points its APIServices at a Service that isn't there, and every Prism API stops answering: see [Configuration](/prism/operate/configuration#addon-parameters).

## ApplicationResourceTracker

ResourceTracker is cluster-scoped, so you can't grant access to one namespace's trackers with a Role.
ApplicationResourceTracker is a namespaced view of the same objects. It stores nothing of its own: each request is served from the underlying ResourceTrackers, so a Role on `applicationresourcetrackers` in a namespace lets a user read the trackers of the Applications in it.

```shell
kubectl get apprt -n <namespace>
```

## Cluster

The ClusterGateway objects that describe clusters carry their credentials, so granting read access to them is dangerous.
The `Cluster` API shows only the clusters' metadata, so users can list clusters without ever seeing a credential.

```shell
kubectl get vela-clusters
```
