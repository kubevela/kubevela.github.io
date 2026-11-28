---
title: OCM Cluster-Gateway Manager
---

The OCM Cluster-Gateway Manager addon runs an operator on the hub cluster that manages KubeVela's cluster-gateway for clusters registered with [Open Cluster Management](https://open-cluster-management.io/) (OCM). You configure cluster-gateway through one `ClusterGatewayConfiguration` resource instead of by hand.

## When to use it

Use it when your clusters are OCM `ManagedCluster`s. It gives you:

* Automatic rotation of cluster-gateway's server TLS certificate.
* Automatic discovery of the managed clusters.
* The cluster-gateway configuration as a single `ClusterGatewayConfiguration` resource.
* Credentials for cluster-gateway to reach each cluster, created for you through OCM's managed-serviceaccount.

If you join clusters with `vela cluster join`, you don't need it: the cluster-gateway that comes with KubeVela already handles those.

## Install

The addon needs an OCM hub, for example from the `ocm-hub-control-plane` addon. Then:

```shell
vela addon enable ocm-gateway-manager-addon
```

To remove it:

```shell
vela addon disable ocm-gateway-manager-addon
```

:::warning
The first install restarts the cluster-gateway instances.
:::

## Access on the managed clusters

Requests proxied by cluster-gateway reach each managed cluster as the `open-cluster-management-managed-serviceaccount/cluster-gateway` ServiceAccount, which has cluster-admin there by default (the `open-cluster-management:cluster-gateway:default` ClusterRole allows every verb on every resource). Anyone who can use cluster-gateway on the hub is cluster-admin on every managed cluster.

The addon keeps that ClusterRole in place through an OCM ManifestWork, so an edit made on the managed cluster is put back. To grant less, set `spec.secretManagement.type: Manual` in the ClusterGatewayConfiguration: the addon then creates no RBAC, and you provide each cluster's credential Secret yourself, for a ServiceAccount bound to a narrower ClusterRole.

## Check it's working

List the addons on every managed cluster:

```shell
kubectl get managedclusteraddon -A
```

```console
NAMESPACE   NAME                     AVAILABLE   DEGRADED   PROGRESSING
<cluster>   cluster-gateway          True
<cluster>   cluster-proxy            True
<cluster>   managed-serviceaccount   True
```

With many clusters, OCM's `clusteradm` CLI gives a tree view. Install it:

```shell
curl -L https://raw.githubusercontent.com/open-cluster-management-io/clusteradm/main/install.sh | bash
```

Then:

```shell
clusteradm get addon
```

```console
<ManagedCluster>
└── managed1
    └── cluster-gateway
    │   ├── <Status>
    │   │   ├── Available -> true
    │   │   ├── ...
    │   ├── <ManifestWork>
    │       └── clusterrolebindings.rbac.authorization.k8s.io
    │       │   ├── open-cluster-management:cluster-gateway:default (applied)
    │       └── ...
    └── cluster-proxy
    │   ├── <Status>
    │   │   ├── Available -> true
    │   │   ├── ...
    │   ├── <ManifestWork>
    │       └── ...
    └── managed-serviceaccount
        └── <Status>
        │   ├── Available -> true
        │   ├── ...
        └── <ManifestWork>
            └── ...
```

## The ClusterGatewayConfiguration

Read or edit the cluster-gateway configuration with:

```shell
kubectl get clustergatewayconfiguration -o yaml
```

```yaml
apiVersion: v1
kind: List
items:
- apiVersion: proxy.open-cluster-management.io/v1alpha1
  kind: ClusterGatewayConfiguration
  metadata:
    name: cluster-gateway
  spec:
    egress:
      clusterProxy:
        credentials:
          namespace: open-cluster-management-addon
          proxyClientCASecretName: proxy-server-ca
          proxyClientSecretName: proxy-client
        proxyServerHost: proxy-entrypoint.open-cluster-management-addon
        proxyServerPort: 8090
      type: ClusterProxy
    image: oamdev/cluster-gateway:v1.4.0
    installNamespace: vela-system
    secretManagement:
      managedServiceAccount:
        name: cluster-gateway
      type: ManagedServiceAccount
    secretNamespace: open-cluster-management-credentials
```
