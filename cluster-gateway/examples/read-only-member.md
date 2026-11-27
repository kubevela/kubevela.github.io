---
title: Narrow a Member Credential
description: Register a member with a read-only ServiceAccount, and use hub RBAC to decide which hub users may reach it.
---

Whatever the registered credential may do on a member, every hub user allowed to use that cluster's proxy may do too. This example registers the same member a second time with a read-only credential, then gives a hub user, `alice`, the proxy for that read-only registration only.

Start from the [Quick Start](../getting-started/quick-start.md), steps 1 to 4: clusters `hub` and `member`, the gateway on the hub, and `member` registered.

## 1. A read-only ServiceAccount on the member

Bind the built-in `view` ClusterRole, which reads most things and writes nothing:

```shell
kubectl --context k3d-member create serviceaccount gateway-reader --namespace kube-system
kubectl --context k3d-member create clusterrolebinding gateway-reader \
  --clusterrole=view --serviceaccount=kube-system:gateway-reader
kubectl --context k3d-member apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: gateway-reader-token
  namespace: kube-system
  annotations:
    kubernetes.io/service-account.name: gateway-reader
type: kubernetes.io/service-account-token
EOF
TOKEN=$(kubectl --context k3d-member get secret gateway-reader-token --namespace kube-system \
  -o jsonpath='{.data.token}' | base64 -d)
kubectl --context k3d-member get secret gateway-reader-token --namespace kube-system \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > member-ca.crt
```

## 2. Register it as `member-readonly`

The same endpoint, a different name and credential. A cluster's name is only the Secret's name, so one member can be registered as many times as you have credentials for it:

```shell
kubectl --context k3d-hub create secret generic member-readonly --namespace open-cluster-management-credentials \
  --from-literal=endpoint=https://k3d-member-server-0:6443 \
  --from-literal=token="$TOKEN" \
  --from-file=ca.crt=member-ca.crt
kubectl --context k3d-hub label secret member-readonly --namespace open-cluster-management-credentials \
  cluster.core.oam.dev/cluster-credential-type=ServiceAccountToken
kubectl --context k3d-hub get clustergateways
```

```console
NAME              PROVIDER   CREDENTIAL-TYPE       ENDPOINT-TYPE   HEALTHY
member                       ServiceAccountToken   Const           false
member-readonly              ServiceAccountToken   Const           false
```

## 3. Reads work, writes don't

```shell
HUB=$(kubectl --context k3d-hub config view --minify -o jsonpath='{.clusters[0].cluster.server}')
READONLY="$HUB/apis/cluster.core.oam.dev/v1alpha1/clustergateways/member-readonly/proxy"
kubectl --context k3d-hub --server "$READONLY" get pods --namespace kube-system
kubectl --context k3d-hub --server "$READONLY" create deployment hello2 --image=nginx:1.27-alpine
```

```console
NAME                                      READY   STATUS    RESTARTS   AGE
coredns-8db54c48d-s9zn6                   1/1     Running   0          6m
local-path-provisioner-5d9d9885bc-d599z   1/1     Running   0          6m
metrics-server-786d997795-7p8bt           1/1     Running   0          6m
error: failed to create deployment: deployments.apps is forbidden: User "system:serviceaccount:kube-system:gateway-reader" cannot create resource "deployments" in API group "apps" in the namespace "default"
```

You're the hub's admin, but the member refused the write, naming the registered credential: the member never sees who you are on the hub.

## 4. Give a hub user the read-only cluster

The hub authorizes the `clustergateways/proxy` subresource, and `resourceNames` limits it to named clusters. `alice` gets `member-readonly` and nothing else:

```shell
kubectl --context k3d-hub apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: proxy-member-readonly
rules:
  - apiGroups: ["cluster.core.oam.dev"]
    resources: ["clustergateways/proxy"]
    resourceNames: ["member-readonly"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: alice-proxy-member-readonly
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: proxy-member-readonly
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: alice
EOF
```

Act as `alice` with `--as`:

```shell
kubectl --context k3d-hub --as alice --server "$READONLY" get pods --namespace kube-system
kubectl --context k3d-hub --as alice \
  --server "$HUB/apis/cluster.core.oam.dev/v1alpha1/clustergateways/member/proxy" get pods --namespace kube-system
kubectl --context k3d-hub --as alice --server "$READONLY" delete pod --namespace kube-system -l k8s-app=kube-dns --dry-run=server
kubectl --context k3d-hub --as alice get clustergateway member-readonly
```

```console
NAME                                      READY   STATUS    RESTARTS   AGE
coredns-8db54c48d-s9zn6                   1/1     Running   0          7m
local-path-provisioner-5d9d9885bc-d599z   1/1     Running   0          7m
metrics-server-786d997795-7p8bt           1/1     Running   0          7m
Error from server (Forbidden): clustergateways.cluster.core.oam.dev "member" is forbidden: User "alice" cannot get resource "clustergateways/proxy" in API group "cluster.core.oam.dev" at the cluster scope
Error from server (Forbidden): clustergateways.cluster.core.oam.dev "member-readonly" is forbidden: User "alice" cannot delete resource "clustergateways/proxy" in API group "cluster.core.oam.dev" at the cluster scope
Error from server (Forbidden): clustergateways.cluster.core.oam.dev "member-readonly" is forbidden: User "alice" cannot get resource "clustergateways" in API group "cluster.core.oam.dev" at the cluster scope
```

Four things to see:

* `alice` reads the member through `member-readonly`.
* She can't use `member`, the `cluster-admin` registration, at all.
* The hub checks the HTTP verb of the inner request against the proxy: a `DELETE` needs `delete` on `clustergateways/proxy`, so with `get` only she can't even try a delete on the hub's side. Listing pods is a `GET`, so `get` covers every read.
* She can't read the `ClusterGateway` object itself, and that matters: it carries the credential.

## The credential is in the object

As the hub admin:

```shell
kubectl --context k3d-hub get clustergateway member-readonly -o yaml
```

```yaml
apiVersion: cluster.core.oam.dev/v1alpha1
kind: ClusterGateway
metadata:
  creationTimestamp: "2026-11-27T09:54:06Z"
  name: member-readonly
spec:
  access:
    credential:
      serviceAccountToken: eyJhbGciOiJSUzI1NiIsImtpZCI6...
      type: ServiceAccountToken
    endpoint:
      const:
        address: https://k3d-member-server-0:6443
        caBundle: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...
      type: Const
  provider: ""
status:
  healthy: false
```

Grant hub users `clustergateways/proxy`, never `get` on `clustergateways`.

## Clean up

```shell
kubectl --context k3d-hub delete clusterrolebinding alice-proxy-member-readonly
kubectl --context k3d-hub delete clusterrole proxy-member-readonly
kubectl --context k3d-hub delete secret member-readonly --namespace open-cluster-management-credentials
kubectl --context k3d-member delete clusterrolebinding gateway-reader
kubectl --context k3d-member delete serviceaccount gateway-reader --namespace kube-system
kubectl --context k3d-member delete secret gateway-reader-token --namespace kube-system
```
