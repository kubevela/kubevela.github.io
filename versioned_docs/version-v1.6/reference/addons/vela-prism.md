---
title: Vela prism
---

## Install

```shell
vela addon enable vela-prism
```

## Uninstall

```shell
vela addon disable vela-prism
```

## Introduction

**Prism** provides API Extensions to the core [KubeVela](https://github.com/kubevela/kubevela).
It works as a Kubernetes [Aggregated API Server](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/).

![PrismArch](https://raw.githubusercontent.com/kubevela/prism/master/hack/prism-arch.jpg)

## Modules

### apiserver

The vela-prism is an apiserver which leverages the Kubernetes Aggregated API capability to provide native interface for users.

#### ApplicationResourceTracker

The original ResourceTracker in KubeVela is one kind of cluster-scoped resource (for some history reasons), which makes it hard for cluster administrator to assign privilege.
The ApplicationResourceTracker is a kind of namespace-scoped resource, which works as a delegator to the original ResourceTracker.
It does not need extra storages but can project requests to ApplicationResourceTracker to underlying ResourceTrackers.
Therefore, it is possible for cluster administrator to assign ApplicationResourceTracker permissions to users.

After installing vela-prism in your cluster, you can run `kubectl get apprt` to view ResourceTrackers.

#### Cluster

In vela-prism, Cluster API is also introduced which works as a delegator to the ClusterGateway object.
The original ClusterGateway object contains the credential information.
This makes the exposure of ClusterGateway access can be dangerous.
The Cluster object provided in prism, on the other hand, only expose metadata of clusters to accessor.
Therefore, the credential information will be secured and the user can also use the API to access the cluster list.

After installing vela-prism in your cluster, you can run `kubectl get vela-clusters` to view all the installed clusters.

> Notice that the vela-prism bootstrap parameter contains `--storage-namespace`, which identifies the underlying namespace for storing cluster secrets and the OCM managed cluster.