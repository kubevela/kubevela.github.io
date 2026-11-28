---
title: OCM Cluster-Gateway Manager
---

__TL;DR__: "OCM Cluster-Gateway Manager" addon installs an operator component
into the hub cluster that help the administrator to easily operate the
configuration of cluster-gateway instances via "ClusterGatewayConfiguration"
custom resource. *WARNING* this addon will restart the cluster-gateway
instances upon the first-time installation.

## What does "Cluster-Gateway Manager" do?

Basically it helps us to sustainably operate the cluster-gateway instances from
the following aspects:

* Automatic cluster-gateway's server TLS certificate rotation.
* Automatic cluster discovery.
* Structurize the component configuration for cluster-gateway.
* Manages the "egress identity" for cluster-gateway to access each clusters.

Requests proxied by cluster-gateway reach each managed cluster as the
`open-cluster-management-managed-serviceaccount/cluster-gateway` ServiceAccount,
which has cluster-admin there by default (the
`open-cluster-management:cluster-gateway:default` ClusterRole allows every verb
on every resource). Anyone who can use cluster-gateway on the hub is
cluster-admin on every managed cluster.

The addon keeps that ClusterRole in place through an OCM ManifestWork, so an
edit made on the managed cluster is put back. To grant less, set
`spec.secretManagement.type: Manual` in the ClusterGatewayConfiguration: the
addon then creates no RBAC, and you provide each cluster's credential Secret
yourself, for a ServiceAccount bound to a narrower ClusterRole.


### How to confirm if the addon installation is working?

Run the following commands to check the healthiness of the addons:

```shell
$ kubectl -n <cluster> get managedclusteraddon
kubectl get managedclusteraddon -A
NAMESPACE   NAME                     AVAILABLE   DEGRADED   PROGRESSING
<cluster>   cluster-gateway          True                   
<cluster>   cluster-proxy            True                   
<cluster>   managed-serviceaccount   True 
```

In case you have too many clusters to browse at a time, install the command-line
binary via:

```shell
curl -L https://raw.githubusercontent.com/open-cluster-management-io/clusteradm/main/install.sh | bash
```

Then run the following commands to see the details of the addon:

```shell
$ clusteradm get addon
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

### Sample of ClusterGatewayConfiguration API

You can read or edit the overall configuration of cluster-gateway deployments
via the following command:

```shell
$ kubectl get clustergatewayconfiguration -o yaml
apiVersion: v1
kind: List
items:
- apiVersion: proxy.open-cluster-management.io/v1alpha1
  kind: ClusterGatewayConfiguration
  metadata: ...
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
