---
title: Introduction
description: What Cluster Gateway is, who it's for, and how it relates to KubeVela.
---

Cluster Gateway gives a hub cluster a single Kubernetes API for reaching its member clusters. It is an aggregated API server: it registers the `cluster.core.oam.dev/v1alpha1` API group with the hub's kube-apiserver, and any request sent to a cluster's `proxy` subresource is passed on to that cluster's kube-apiserver with the credential the hub holds for it.

It has no etcd and stores nothing. Each cluster is a Secret on the hub, and the gateway builds the `ClusterGateway` object from that Secret every time it is read. Adding a cluster is creating a Secret; removing it is deleting one.

```shell
# Any kubectl command, against the member cluster "prod", with your hub credentials
kubectl --server "$HUB/apis/cluster.core.oam.dev/v1alpha1/clustergateways/prod/proxy" get pods -A
```

## Who it's for

* **KubeVela users.** KubeVela installs the gateway as part of vela-core and reaches every managed cluster through it. You rarely touch it directly, but when a cluster won't connect, this is the layer to look at.
* **Platform teams running a hub.** On its own, without KubeVela, it puts one hub endpoint in front of several clusters: hub RBAC decides who may reach which cluster, and the member clusters' credentials never leave the hub.
* **Controller authors.** A controller on the hub can talk to any member cluster with an ordinary client-go or controller-runtime client, by routing its requests through the gateway: see [Go client](../examples/go-client.md).

## How it relates to KubeVela

The vela-core chart installs Cluster Gateway beside the controller, with `multicluster.enabled` on by default. From there:

* `vela cluster join` writes the cluster Secret into `vela-system`, the namespace the gateway reads.
* The controller sends every request for a managed cluster to the gateway's proxy path. By default it calls the gateway's Service directly instead of going through the hub's kube-apiserver (the chart's `multicluster.clusterGateway.direct`).
* vela-core creates and renews the gateway's serving certificate and writes its CA into the APIService.
* With `authentication.enabled`, the chart turns on `ClientIdentityPenetration`, so resources reach managed clusters as the user who owns the Application.

How to use multiple clusters from KubeVela lives in the KubeVela docs:

* [Deploy to Multiple Clusters](/docs/next/end-user/policies/multi-cluster)
* [Manage Clusters](/docs/next/platform-engineers/system-operation/managing-clusters): `vela cluster join`, list, detach.
* [Working with OCM](/docs/next/platform-engineers/system-operation/working-with-ocm), and the [OCM Cluster-Gateway Manager](/addons/ocm-gateway-manager-addon) addon for clusters registered with Open Cluster Management.
* [Underlying Mechanism](/docs/next/platform-engineers/auth/advance) of authentication, for how the identity travels through the gateway.

These pages describe Cluster Gateway 1.10.0-alpha.1, the version KubeVela 1.12 ships. [Versions](../reference/versions.md) lists the version each KubeVela release ships and what changed between them.

## Where next

* [Install](./install.md) it, on its own or with KubeVela.
* [Quick Start](./quick-start.md): two clusters, one hub, kubectl through the proxy, in about ten minutes.
* [The proxy path](../concepts/proxy-path.md) and [cluster Secrets](../concepts/cluster-secrets.md), for how it works.

The source is [oam-dev/cluster-gateway](https://github.com/oam-dev/cluster-gateway).
