---
title: Quick Start
description: A k3d cluster with KubeVela and Prism, an Application in a team namespace, and a user who can see what it created without any cluster-wide permission.
---

This puts KubeVela and Prism on a local [k3d](https://k3d.io) cluster, deploys an Application into a `team-a` namespace, and gives a user, `alice`, read access to that namespace only. Alice can't read ResourceTrackers, but `vela status --tree` still works for her, because Prism serves the same information in her namespace. It takes about ten minutes.

You need Docker, k3d 5.x, kubectl, Helm and the [vela CLI](/docs/installation/kubernetes#install-vela-cli).

## 1. Create a cluster with KubeVela

```shell
k3d cluster create prism-demo --no-lb --wait
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install kubevela kubevela/vela-core --namespace vela-system --create-namespace --wait
```

k3d makes `k3d-prism-demo` your current context, and every command below uses it.

## 2. Enable Prism

```shell
vela addon enable vela-prism
```

```console
Addon vela-prism enabled successfully.
Please access addon-vela-prism from the following endpoints:
+---------+------------+--------------------------------+-----------------------------+-------+
| CLUSTER | COMPONENT  |    REF(KIND/NAMESPACE/NAME)    |          ENDPOINT           | INNER |
+---------+------------+--------------------------------+-----------------------------+-------+
| local   | vela-prism | Service/vela-system/vela-prism | vela-prism.vela-system:9443 | true  |
+---------+------------+--------------------------------+-----------------------------+-------+
```

The command returns once the addon's Application is deployed, which can be a few seconds before Prism's pod is ready and the hub has checked its APIs (they show `False (EndpointsNotFound)` meanwhile). Wait for both API groups:

```shell
kubectl wait --for=condition=Available --timeout=2m \
  apiservice/v1alpha1.prism.oam.dev apiservice/v1alpha1.o11y.prism.oam.dev
```

```console
apiservice.apiregistration.k8s.io/v1alpha1.prism.oam.dev condition met
apiservice.apiregistration.k8s.io/v1alpha1.o11y.prism.oam.dev condition met
```

## 3. Deploy an Application in a team namespace

```shell
kubectl create namespace team-a
kubectl apply -f - <<EOF
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: hello
  namespace: team-a
spec:
  components:
    - name: hello
      type: webservice
      properties:
        image: nginx:1.27-alpine
        ports:
          - port: 80
            expose: true
EOF
kubectl wait --for=jsonpath='{.status.status}'=running application/hello -n team-a --timeout=2m
```

KubeVela records what it created in a ResourceTracker named `hello-v1-team-a`. ResourceTrackers are cluster-scoped, so the only way to let someone read this one is to let them read all of them.

## 4. Make a user who can only see team-a

Alice is a ServiceAccount here, so this runs anywhere; any user or group works the same way. She gets the built-in `view` role in `team-a`, plus a Role for the two KubeVela resources `view` doesn't cover: Applications, and Prism's `applicationresourcetrackers`.

```shell
kubectl create serviceaccount alice -n team-a
kubectl create rolebinding alice-view -n team-a --clusterrole=view --serviceaccount=team-a:alice
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-viewer
  namespace: team-a
rules:
  - apiGroups: ["core.oam.dev"]
    resources: ["applications"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["prism.oam.dev"]
    resources: ["applicationresourcetrackers"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: alice-app-viewer
  namespace: team-a
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: app-viewer
subjects:
  - kind: ServiceAccount
    name: alice
    namespace: team-a
EOF
```

`vela status --tree` also lists the managed clusters, so Alice needs to read those too. Both cluster lists carry no credentials: Cluster Gateway's `virtualclusters`, which the CLI reads, and Prism's own `clusters`:

```shell
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: vela-cluster-viewer
rules:
  - apiGroups: ["cluster.core.oam.dev"]
    resources: ["virtualclusters"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["prism.oam.dev"]
    resources: ["clusters"]
    verbs: ["get", "list", "watch"]
EOF
kubectl create clusterrolebinding alice-cluster-viewer --clusterrole=vela-cluster-viewer --serviceaccount=team-a:alice
```

Then a kubeconfig for her, from your current one with her token in place of your credentials:

```shell
kubectl config view --minify --raw > alice.kubeconfig
kubectl --kubeconfig alice.kubeconfig config set-credentials alice \
  --token="$(kubectl create token alice -n team-a --duration 1h)"
kubectl --kubeconfig alice.kubeconfig config set-context --current --user=alice
```

## 5. Look as Alice

ResourceTrackers are closed to her:

```shell
KUBECONFIG=alice.kubeconfig kubectl get resourcetrackers
```

```console
Error from server (Forbidden): resourcetrackers.core.oam.dev is forbidden: User "system:serviceaccount:team-a:alice" cannot list resource "resourcetrackers" in API group "core.oam.dev" at the cluster scope
```

Prism's view of them, in her namespace, is open:

```shell
KUBECONFIG=alice.kubeconfig kubectl get apprt -n team-a
```

```console
NAME       CREATED AT
hello-v1   2026-11-27T16:39:23Z
```

The name loses its `-team-a` suffix: the namespace is now the object's namespace. Another namespace's trackers stay closed:

```shell
KUBECONFIG=alice.kubeconfig kubectl get apprt -n vela-system
```

```console
Error from server (Forbidden): applicationresourcetrackers.prism.oam.dev is forbidden: User "system:serviceaccount:team-a:alice" cannot list resource "applicationresourcetrackers" in API group "prism.oam.dev" in the namespace "vela-system"
```

And the vela CLI, which normally reads ResourceTrackers, falls back to Prism when it's refused:

```shell
KUBECONFIG=alice.kubeconfig vela status hello -n team-a --tree --detail
```

```console
CLUSTER       NAMESPACE     RESOURCE         STATUS    APPLY_TIME          DETAIL
local     ─── team-a    ─┬─ Service/hello    updated   2026-11-27 16:39:23 Type: ClusterIP  Cluster-IP: 10.43.140.50  External-IP: <none>  Port(s): 80/TCP  Age: 3s
                         └─ Deployment/hello updated   2026-11-27 16:39:23 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 3s
```

Without Prism, the same command fails with `no permission for ResourceTracker and vela-prism is not serving ApplicationResourceTracker`.

## Clean up

```shell
k3d cluster delete prism-demo
rm alice.kubeconfig
```

## Where next

* [Restricted Access to ResourceTrackers](../guides/resource-trackers.md): what the view holds, and the RBAC patterns for it.
* [Cluster List for Users](../examples/cluster-list.md): letting users see the clusters without their credentials.
* [Grafana with kubectl](../examples/grafana-with-kubectl.md): the other half of Prism.
