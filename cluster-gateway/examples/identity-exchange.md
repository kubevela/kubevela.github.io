---
title: Identity Exchange on Two Clusters
description: Turn on ClientIdentityPenetration, let the member's RBAC decide per hub user, and use exchange rules for an admin group and a CI ServiceAccount.
---

With `ClientIdentityPenetration` on, the member sees the hub user instead of the registered credential. This example turns it on, shows the member's RBAC applying to a hub user, then adds two rules on the cluster's Secret: an admin group that acts as the registered credential, and a CI ServiceAccount mapped to a fixed member user. The background is in [Identity Exchange](../guides/identity-exchange.md).

Start from the [Quick Start](../getting-started/quick-start.md), steps 1 to 4. Its `cluster-gateway` ServiceAccount on the member is bound to `cluster-admin`, which already includes `impersonate`; for a narrower credential, add the impersonation ClusterRole from the guide.

## 1. Turn on the gate

The standalone chart writes an empty `--feature-gates=` as the third argument; replace it:

```shell
kubectl --context k3d-hub --namespace cluster-gateway patch deployment gateway-deployment --type json -p '[
  {"op": "replace", "path": "/spec/template/spec/containers/0/args/2",
   "value": "--feature-gates=ClientIdentityPenetration=true"}
]'
kubectl --context k3d-hub --namespace cluster-gateway rollout status deployment gateway-deployment
kubectl --context k3d-hub wait --for=condition=Available apiservice/v1alpha1.cluster.core.oam.dev --timeout=2m
```

```console
deployment.apps/gateway-deployment patched
Waiting for deployment "gateway-deployment" rollout to finish: 1 old replicas are pending termination...
deployment "gateway-deployment" successfully rolled out
apiservice.apiregistration.k8s.io/v1alpha1.cluster.core.oam.dev condition met
```

## 2. Let hub users use the proxy

`alice`, and anyone in the `platform-admins` group, may use `member`'s proxy:

```shell
kubectl --context k3d-hub apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: proxy-member
rules:
  - apiGroups: ["cluster.core.oam.dev"]
    resources: ["clustergateways/proxy"]
    resourceNames: ["member"]
    verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: proxy-member
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: proxy-member
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: alice
  - apiGroup: rbac.authorization.k8s.io
    kind: Group
    name: platform-admins
EOF
HUB=$(kubectl --context k3d-hub config view --minify -o jsonpath='{.clusters[0].cluster.server}')
MEMBER="$HUB/apis/cluster.core.oam.dev/v1alpha1/clustergateways/member/proxy"
kubectl --context k3d-hub --as alice --server "$MEMBER" get pods --namespace default
```

```console
Error from server (Forbidden): pods is forbidden: User "alice" cannot list resource "pods" in API group "" in the namespace "default"
```

The member refused `alice` by name. Without the gate it would have answered as the registered `cluster-admin` credential.

## 3. The member's RBAC decides

Grant `alice` `view` in `default`, on the member only:

```shell
kubectl --context k3d-member create rolebinding alice-view --namespace default --clusterrole=view --user=alice
kubectl --context k3d-hub --as alice --server "$MEMBER" get pods --namespace default
kubectl --context k3d-hub --as alice --server "$MEMBER" get pods --namespace kube-system
```

```console
rolebinding.rbac.authorization.k8s.io/alice-view created
NAME                     READY   STATUS    RESTARTS   AGE
hello-78bbf8c4f9-8lz59   1/1     Running   0          85s
Error from server (Forbidden): pods is forbidden: User "alice" cannot list resource "pods" in API group "" in the namespace "kube-system"
```

## 4. Rules on the cluster's Secret

`bob` is in `platform-admins`, and the member knows nothing about him:

```shell
kubectl --context k3d-hub --as bob --as-group platform-admins --server "$MEMBER" get pods --namespace kube-system
```

```console
Error from server (Forbidden): pods is forbidden: User "bob" cannot list resource "pods" in API group "" in the namespace "kube-system"
```

Add two rules to `member`'s Secret. `super-user` sends `platform-admins` as the registered credential; `ci-deployer` maps a hub ServiceAccount to one member user:

```shell
kubectl --context k3d-hub annotate secret member --namespace open-cluster-management-credentials \
  cluster.core.oam.dev/cluster-gateway-proxy-configuration='
apiVersion: cluster.core.oam.dev/v1alpha1
kind: ClusterGatewayProxyConfiguration
spec:
  clientIdentityExchanger:
    rules:
      - name: super-user
        type: PrivilegedIdentityExchanger
        source:
          group: platform-admins
      - name: ci-deployer
        type: StaticMappingIdentityExchanger
        source:
          user: system:serviceaccount:ci:deployer
        target:
          user: ci-deployer
'
kubectl --context k3d-hub --as bob --as-group platform-admins --server "$MEMBER" get pods --namespace kube-system
```

```console
secret/member annotated
NAME                                      READY   STATUS    RESTARTS   AGE
coredns-8db54c48d-s9zn6                   1/1     Running   0          10m
local-path-provisioner-5d9d9885bc-d599z   1/1     Running   0          10m
metrics-server-786d997795-7p8bt           1/1     Running   0          10m
```

No restart: the gateway picked the annotation up from its Secret cache.

Now the CI ServiceAccount. The member sees `ci-deployer`, whatever the hub ServiceAccount is called, so the member's RoleBindings don't need to know the hub's names:

```shell
kubectl --context k3d-hub create namespace ci
kubectl --context k3d-hub create serviceaccount deployer --namespace ci
kubectl --context k3d-hub create clusterrolebinding ci-deployer-proxy --clusterrole=proxy-member --serviceaccount=ci:deployer
kubectl --context k3d-hub --as system:serviceaccount:ci:deployer --server "$MEMBER" get pods --namespace default
kubectl --context k3d-member create rolebinding ci-deployer-edit --namespace default --clusterrole=edit --user=ci-deployer
kubectl --context k3d-hub --as system:serviceaccount:ci:deployer --server "$MEMBER" get pods --namespace default
```

```console
namespace/ci created
serviceaccount/deployer created
clusterrolebinding.rbac.authorization.k8s.io/ci-deployer-proxy created
Error from server (Forbidden): pods is forbidden: User "ci-deployer" cannot list resource "pods" in API group "" in the namespace "default"
rolebinding.rbac.authorization.k8s.io/ci-deployer-edit created
NAME                     READY   STATUS    RESTARTS   AGE
hello-78bbf8c4f9-8lz59   1/1     Running   0          88s
```

## 5. Which rule applied

```shell
kubectl --context k3d-hub --namespace cluster-gateway logs deployment/gateway-deployment | grep 'identity exchanged'
```

```console
I1127 09:55:21.927763       1 clustergateway_proxy.go:350] identity exchanged with rule `super-user` in the proxy config from cluster `member`
I1127 09:55:22.198649       1 clustergateway_proxy.go:350] identity exchanged with rule `ci-deployer` in the proxy config from cluster `member`
```

`alice` matched no rule, so nothing is logged for her: she was impersonated as herself.

## Clean up

```shell
kubectl --context k3d-hub annotate secret member --namespace open-cluster-management-credentials \
  cluster.core.oam.dev/cluster-gateway-proxy-configuration-
kubectl --context k3d-hub delete clusterrolebinding proxy-member ci-deployer-proxy
kubectl --context k3d-hub delete clusterrole proxy-member
kubectl --context k3d-hub delete namespace ci
kubectl --context k3d-member delete rolebinding alice-view ci-deployer-edit --namespace default
kubectl --context k3d-hub --namespace cluster-gateway patch deployment gateway-deployment --type json -p '[
  {"op": "replace", "path": "/spec/template/spec/containers/0/args/2", "value": "--feature-gates="}
]'
```
