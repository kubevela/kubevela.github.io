---
title: Vela prism
---

Vela Prism adds read-only Kubernetes APIs over KubeVela's own objects, so you can grant access with ordinary RBAC:

- `ApplicationResourceTracker`, a namespaced view of ResourceTrackers (`kubectl get apprt`).
- `Cluster`, the cluster list without credentials (`kubectl get vela-clusters`).

Enable it when you want to let users in a namespace see what their Applications created, or list clusters, without cluster-admin.

It runs as a Kubernetes [aggregated API server](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/).

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
| `namespace` | `vela-system` | Namespace vela-prism is installed in, and where it looks for cluster Secrets and OCM ManagedClusters. |
| `image` | `oamdev/vela-prism:v1.7.0` | vela-prism image. |
| `imagePullPolicy` | `IfNotPresent` | `IfNotPresent`, `Never` or `Always`. |
| `cpu` | `0.1` | CPU request and limit. |
| `memory` | `200Mi` | Memory request and limit. |

The addon's `namespace` parameter (default `vela-system`) sets where vela-prism looks for cluster Secrets and OCM ManagedClusters; set it to the namespace KubeVela stores clusters in.

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
