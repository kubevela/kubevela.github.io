---
title: A Kubeconfig per Cluster
description: Write a kubeconfig whose server is a member's proxy path, then use exec, logs, port-forward and watch on the member through the hub.
---

Passing `--server` on every command gets old fast. A kubeconfig whose server is the member's proxy path makes kubectl, and anything else that reads a kubeconfig, work against the member through the hub, with your hub credentials. The member's own credential never leaves the hub.

Start from the [Quick Start](../getting-started/quick-start.md), steps 1 to 4.

## 1. Write the kubeconfig

Copy the hub's context with its credentials embedded, point the cluster at the proxy path, and give the context a name that says what it is:

```shell
kubectl --context k3d-hub config view --minify --flatten > member.kubeconfig
HUB=$(kubectl --kubeconfig member.kubeconfig config view -o jsonpath='{.clusters[0].cluster.server}')
CLUSTER=$(kubectl --kubeconfig member.kubeconfig config view -o jsonpath='{.clusters[0].name}')
kubectl --kubeconfig member.kubeconfig config set-cluster "$CLUSTER" \
  --server "$HUB/apis/cluster.core.oam.dev/v1alpha1/clustergateways/member/proxy"
kubectl --kubeconfig member.kubeconfig config rename-context \
  "$(kubectl --kubeconfig member.kubeconfig config current-context)" member-via-hub
export KUBECONFIG=$PWD/member.kubeconfig
kubectl config get-contexts
kubectl get nodes
```

```console
Cluster "k3d-hub" set.
Context "k3d-hub" renamed to "member-via-hub".
CURRENT   NAME             CLUSTER   AUTHINFO        NAMESPACE
*         member-via-hub   k3d-hub   admin@k3d-hub
NAME                  STATUS   ROLES           AGE   VERSION
k3d-member-server-0   Ready    control-plane   8m    v1.35.5+k3s1
```

The certificate authority in the file is still the hub's, which is right: kubectl talks TLS to the hub, and the gateway talks to the member.

## 2. Run something and get into it

```shell
kubectl run web --image=nginx:1.27-alpine --port=80
kubectl wait --for=condition=Ready pod/web --timeout=2m
kubectl exec web -- nginx -v
kubectl logs web --tail=2
```

```console
pod/web created
pod/web condition met
nginx version: nginx/1.27.5
2026/11/27 09:54:40 [notice] 1#1: start worker process 40
2026/11/27 09:54:40 [notice] 1#1: start worker process 41
```

`exec` upgrades the connection to a stream; the hub and the gateway pass the upgrade through to the member's kubelet.

## 3. Port-forward

```shell
kubectl port-forward pod/web 18080:80 &
sleep 3
curl -s localhost:18080 | grep '<title>'
kill %1
```

```console
<title>Welcome to nginx!</title>
```

## 4. Watch

```shell
kubectl get pods --watch --request-timeout=15s &
sleep 3
kubectl delete pod web --wait=false
sleep 8
kill %1
```

```console
NAME                     READY   STATUS    RESTARTS   AGE
hello-78bbf8c4f9-8lz59   1/1     Running   0          50s
web                      1/1     Running   0          4s
pod "web" deleted from default namespace
web                      1/1     Terminating   0          7s
web                      0/1     Completed     0          7s
```

The watch stays open through the hub because a request to the `proxy` subresource counts as long-running, so the hub's request timeout doesn't cut it off.

## One file, several clusters

Add a cluster and a context per member to the same file, each with its own proxy path, and switch with `kubectl config use-context`. The user entry is shared: it's your hub identity in every one of them.

## Clean up

```shell
unset KUBECONFIG
rm member.kubeconfig
```
