---
title: Quick Start
description: Two k3d clusters, Cluster Gateway on the hub, a member registered with a ServiceAccount token, and kubectl against the member through the hub.
---

This runs Cluster Gateway on its own, without KubeVela, on two local [k3d](https://k3d.io) clusters: a hub, where the gateway runs, and a member, which the hub reaches through it. It takes about ten minutes, most of it waiting for clusters to start.

You need Docker, k3d 5.x, kubectl, Helm 3 and git.

## 1. Create the clusters

Both clusters go on one Docker network, so the gateway's pod on the hub can reach the member's API server by its container name:

```shell
docker network create multicluster
k3d cluster create hub --network multicluster --no-lb --k3s-arg "--disable=traefik@server:0" --wait
k3d cluster create member --network multicluster --no-lb --k3s-arg "--disable=traefik@server:0" --wait
```

k3d adds a context for each to your kubeconfig, `k3d-hub` and `k3d-member`. Every command below names its context, so it doesn't matter which one is current.

## 2. Install the gateway on the hub

```shell
git clone --depth 1 --branch v1.10.0-alpha.1 https://github.com/oam-dev/cluster-gateway.git
helm install cluster-gateway ./cluster-gateway/charts/cluster-gateway \
  --kube-context k3d-hub \
  --namespace cluster-gateway --create-namespace \
  --set tag=v1.10.0-alpha.1 \
  --wait
kubectl --context k3d-hub wait --for=condition=Available apiservice/v1alpha1.cluster.core.oam.dev --timeout=2m
```

```console
apiservice.apiregistration.k8s.io/v1alpha1.cluster.core.oam.dev condition met
```

Helm's `--wait` returns as soon as the pod is ready, and the hub takes a few more seconds to check the new API (the APIService shows `False (FailedDiscoveryCheck)` meanwhile), hence the `kubectl wait`.

## 3. Make a credential on the member

A ServiceAccount on the member, bound to `cluster-admin`, with a long-lived token:

```shell
kubectl --context k3d-member create serviceaccount cluster-gateway --namespace kube-system
kubectl --context k3d-member create clusterrolebinding cluster-gateway \
  --clusterrole=cluster-admin --serviceaccount=kube-system:cluster-gateway
kubectl --context k3d-member apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: cluster-gateway-token
  namespace: kube-system
  annotations:
    kubernetes.io/service-account.name: cluster-gateway
type: kubernetes.io/service-account-token
EOF
TOKEN=$(kubectl --context k3d-member get secret cluster-gateway-token --namespace kube-system \
  -o jsonpath='{.data.token}' | base64 -d)
kubectl --context k3d-member get secret cluster-gateway-token --namespace kube-system \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > member-ca.crt
```

Every hub user allowed to use this cluster's proxy gets what this credential can do. `cluster-admin` keeps the quick start short; [Narrow a member credential](../examples/read-only-member.md) does it properly.

## 4. Register the member on the hub

A cluster is a Secret in the gateway's Secret namespace, `open-cluster-management-credentials` for the standalone chart. The endpoint is the member's server container on the shared network, `k3d-member-server-0`, port 6443:

```shell
kubectl --context k3d-hub create secret generic member --namespace open-cluster-management-credentials \
  --from-literal=endpoint=https://k3d-member-server-0:6443 \
  --from-literal=token="$TOKEN" \
  --from-file=ca.crt=member-ca.crt
kubectl --context k3d-hub label secret member --namespace open-cluster-management-credentials \
  cluster.core.oam.dev/cluster-credential-type=ServiceAccountToken
kubectl --context k3d-hub get clustergateways
```

```console
NAME     PROVIDER   CREDENTIAL-TYPE       ENDPOINT-TYPE   HEALTHY
member              ServiceAccountToken   Const           false
```

`HEALTHY` stays `false`: nothing writes a health status in this setup, and it says nothing about whether the member can be reached.

## 5. Reach the member through the hub

A raw request through the proxy, answered by the member's API server:

```shell
kubectl --context k3d-hub get --raw /apis/cluster.core.oam.dev/v1alpha1/clustergateways/member/proxy/version
```

```console
{
  "major": "1",
  "minor": "35",
  ...
  "gitVersion": "v1.35.5+k3s1",
  ...
}
```

Any kubectl command works against the member when its server is the proxy path, using your hub credentials:

```shell
HUB=$(kubectl --context k3d-hub config view --minify -o jsonpath='{.clusters[0].cluster.server}')
MEMBER="$HUB/apis/cluster.core.oam.dev/v1alpha1/clustergateways/member/proxy"
kubectl --context k3d-hub --server "$MEMBER" get nodes
```

```console
NAME                    STATUS   ROLES           AGE   VERSION
k3d-member-server-0   Ready    control-plane   4m    v1.35.5+k3s1
```

Create something on the member through the hub, then look for it on each cluster directly:

```shell
kubectl --context k3d-hub --server "$MEMBER" create deployment hello --image=nginx:1.27-alpine
kubectl --context k3d-hub --server "$MEMBER" rollout status deployment hello
kubectl --context k3d-member get deployment hello
kubectl --context k3d-hub get deployment hello
```

```console
deployment.apps/hello created
Waiting for deployment "hello" rollout to finish: 0 out of 1 new replicas have been updated...
Waiting for deployment "hello" rollout to finish: 0 of 1 updated replicas are available...
deployment "hello" successfully rolled out
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
hello   1/1     1            1           1s
Error from server (NotFound): deployments.apps "hello" not found
```

The Deployment is on the member, and the hub has none. `rollout status` watched it through the proxy the whole time.

## 6. Clean up

```shell
k3d cluster delete hub member
docker network rm multicluster
rm -rf cluster-gateway member-ca.crt
```

## Next

* [Examples](/cluster-gateway/examples) build on these two clusters: a narrower credential, a kubeconfig per cluster, identity exchange, and a Go client.
* [Register Clusters](../guides/register-clusters.md) covers the other credential types.
* With KubeVela, `vela cluster join` writes the Secret for you: see [Manage Clusters](/docs/next/platform-engineers/system-operation/managing-clusters).
