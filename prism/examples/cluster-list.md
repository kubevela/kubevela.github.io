---
title: Cluster List for Users
description: Join a cluster, give it an alias and labels, and let a user list and filter clusters without being able to read a credential.
---

A platform team joins a cluster to the hub, names it and labels it, and lets an application developer see the cluster list, which they need to pick a placement for their Applications. The developer can read the list through Prism but can't read the cluster Secret or the `ClusterGateway` object, both of which carry the credential.

You need a cluster with KubeVela and the `vela-prism` addon: steps 1 and 2 of the [Quick Start](../getting-started/quick-start.md) make one, called `prism-demo`.

## 1. Join a cluster

To keep this to one machine, the hub joins itself a second time, under the name `member`, through its address on the Docker network. Any cluster you join with `vela cluster join` works the same way.

```shell
k3d kubeconfig get prism-demo \
  | sed 's#https://0.0.0.0:[0-9]*#https://k3d-prism-demo-server-0:6443#; s#https://127.0.0.1:[0-9]*#https://k3d-prism-demo-server-0:6443#' \
  > member.kubeconfig
vela cluster join member.kubeconfig --name member
vela cluster alias member staging
vela cluster labels add member env=staging
```

```console
Successfully add cluster member, endpoint: https://k3d-prism-demo-server-0:6443.
Alias cluster member as staging.
Successfully update labels for cluster member (staging), type: X509Certificate.
env=staging
```

## 2. A developer who can list clusters

```shell
kubectl create namespace dev
kubectl create serviceaccount carol -n dev
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: vela-cluster-viewer
rules:
  - apiGroups: ["prism.oam.dev"]
    resources: ["clusters"]
    verbs: ["get", "list"]
EOF
kubectl create clusterrolebinding carol-clusters --clusterrole=vela-cluster-viewer --serviceaccount=dev:carol
kubectl config view --minify --raw > carol.kubeconfig
kubectl --kubeconfig carol.kubeconfig config set-credentials carol \
  --token="$(kubectl create token carol -n dev --duration 1h)"
kubectl --kubeconfig carol.kubeconfig config set-context --current --user=carol
```

## 3. List and filter

```shell
KUBECONFIG=carol.kubeconfig kubectl get vela-clusters
KUBECONFIG=carol.kubeconfig kubectl get vela-clusters -l env=staging
KUBECONFIG=carol.kubeconfig kubectl get vela-clusters -l cluster.core.oam.dev/control-plane=false -o name
```

```console
NAME     ALIAS     CREDENTIAL_TYPE   ENDPOINT                                ACCEPTED   LABELS
local              Internal          -                                       true       cluster.core.oam.dev/control-plane=true
member   staging   X509Certificate   https://k3d-prism-demo-server-0:6443    true       env=staging,cluster.core.oam.dev/control-plane=false
NAME     ALIAS     CREDENTIAL_TYPE   ENDPOINT                                ACCEPTED   LABELS
member   staging   X509Certificate   https://k3d-prism-demo-server-0:6443    true       env=staging,cluster.core.oam.dev/control-plane=false
cluster.prism.oam.dev/member
```

The order of the labels in the `LABELS` column varies from one call to the next.

The full object holds nothing more than the table:

```shell
KUBECONFIG=carol.kubeconfig kubectl get vela-cluster member -o yaml
```

```console
apiVersion: prism.oam.dev/v1alpha1
kind: Cluster
metadata:
  creationTimestamp: "2026-11-27T16:45:21Z"
  labels:
    cluster.core.oam.dev/control-plane: "false"
    env: staging
  name: member
spec:
  accepted: true
  alias: staging
  credential-type: X509Certificate
  endpoint: https://k3d-prism-demo-server-0:6443
```

## 4. The credential stays out of reach

```shell
KUBECONFIG=carol.kubeconfig kubectl get secret member -n vela-system
KUBECONFIG=carol.kubeconfig kubectl get clustergateway member
```

```console
Error from server (Forbidden): secrets "member" is forbidden: User "system:serviceaccount:dev:carol" cannot get resource "secrets" in API group "" in the namespace "vela-system"
Error from server (Forbidden): clustergateways.cluster.core.oam.dev "member" is forbidden: User "system:serviceaccount:dev:carol" cannot get resource "clustergateways" in API group "cluster.core.oam.dev" at the cluster scope
```

As an administrator, compare what the same cluster looks like as a `ClusterGateway`: its `spec.access` holds the client certificate and key.

```shell
kubectl get clustergateway member -o jsonpath='{.spec.access}' | cut -c1-80
```

```console
{"credential":{"type":"X509Certificate","x509":{"certificate":"LS0tLS1CRUdJTiBDR
```

## Clean up

```shell
vela cluster detach member
kubectl delete namespace dev
kubectl delete clusterrolebinding carol-clusters
kubectl delete clusterrole vela-cluster-viewer
rm member.kubeconfig carol.kubeconfig
```
