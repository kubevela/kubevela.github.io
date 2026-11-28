---
title: Clusters Without Credentials
sidebar_label: Clusters
description: Listing the clusters KubeVela manages without exposing their credentials, and the RBAC that goes with it.
---

KubeVela keeps each managed cluster as a Secret in `vela-system`, and Cluster Gateway serves it as a `ClusterGateway` object. Both carry the cluster's credential: a token, a client key, or a cloud provider's access key. Granting read access to either hands that credential over.

Prism's `Cluster` is the same list with the credential left out: name, alias, endpoint, credential type, whether the cluster is accepted, and its labels.

```shell
kubectl get vela-clusters
```

```console
NAME     ALIAS     CREDENTIAL_TYPE   ENDPOINT                                ACCEPTED   LABELS
local              Internal          -                                       true       cluster.core.oam.dev/control-plane=true
member   staging   X509Certificate   https://k3d-prism-demo-server-0:6443    true       env=staging,cluster.core.oam.dev/control-plane=false
```

Use `vela-clusters` or `clusters.prism.oam.dev` in commands. The short name `vc` also belongs to Cluster Gateway's `virtualclusters`, which wins, and plain `clusters` clashes with any other API that has a `clusters` resource, such as Cluster API.

## Where the list comes from

| Entry | From |
| --- | --- |
| `local` | Always there, first: the hub itself, credential type `Internal`, endpoint `-`. |
| One per cluster Secret | Secrets in the storage namespace (`vela-system`) with the `cluster.core.oam.dev/cluster-credential-type` label, which `vela cluster join` writes. A Secret without an endpoint is left out. |
| One per OCM ManagedCluster | ManagedClusters with at least one client config, if OCM is installed, credential type `ManagedCluster`. `ACCEPTED` is the ManagedCluster's `hubAcceptsClient`. A Secret of the same name wins. |

The alias is the Secret's `cluster.core.oam.dev/cluster-alias` annotation, which `vela cluster alias` sets. Labels are the Secret's or ManagedCluster's, minus any under `cluster.core.oam.dev/`; Prism adds `cluster.core.oam.dev/control-plane`, `true` only for `local`. Label selectors work on what you see: `kubectl get vela-clusters -l env=staging` drops `local`, and `-l cluster.core.oam.dev/control-plane=false` lists only the members.

## Grant it

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: vela-cluster-viewer
rules:
  - apiGroups: ["prism.oam.dev"]
    resources: ["clusters"]
    verbs: ["get", "list"]
```

Clusters are cluster-scoped, so bind it with a ClusterRoleBinding. The addon already grants this to the `kubevela:client` group, the group `vela auth gen-kubeconfig` puts the users it makes into.

## What the vela CLI needs

The vela CLI doesn't read Prism's clusters. `vela status --tree` reads Cluster Gateway's `virtualclusters`, which also carry no credential and show the same fields, so add that to the role for anyone who runs it:

```yaml
  - apiGroups: ["cluster.core.oam.dev"]
    resources: ["virtualclusters"]
    verbs: ["get", "list"]
```

`vela cluster list` reads the Secrets themselves, and the Cluster Gateway APIService, so it stays a command for whoever administers clusters.

## Compared with VirtualCluster

Cluster Gateway's `VirtualCluster` came later and covers the same ground: the same list built from the same Secrets and ManagedClusters, without credentials. Grant whichever your tools read. Prism's adds nothing VirtualCluster lacks; its value is that it sits in the same API group as `applicationresourcetrackers`, so one role covers both.
