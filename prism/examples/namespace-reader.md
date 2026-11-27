---
title: Viewers per Team Namespace
sidebar_label: Viewers per Team
description: Two teams on one hub, each able to see its own Applications' resources and nothing of the other's, using the built-in view role.
---

Two teams, `team-a` and `team-b`, each with an Application. One ClusterRole aggregated into the built-in `view` role gives every namespace viewer read access to Applications and their ApplicationResourceTrackers, so granting a team member `view` in their namespace is enough. Each sees their own Application's resources with `vela status --tree`, and is refused the other team's.

You need a cluster with KubeVela and the `vela-prism` addon: steps 1 and 2 of the [Quick Start](../getting-started/quick-start.md) make one.

## 1. Add KubeVela's resources to the view role

```shell
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: vela-app-view
  labels:
    rbac.authorization.k8s.io/aggregate-to-view: "true"
    rbac.authorization.k8s.io/aggregate-to-edit: "true"
    rbac.authorization.k8s.io/aggregate-to-admin: "true"
rules:
  - apiGroups: ["core.oam.dev"]
    resources: ["applications", "applicationrevisions"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["prism.oam.dev"]
    resources: ["applicationresourcetrackers"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: vela-cluster-viewer
rules:
  - apiGroups: ["cluster.core.oam.dev"]
    resources: ["virtualclusters"]
    verbs: ["get", "list"]
  - apiGroups: ["prism.oam.dev"]
    resources: ["clusters"]
    verbs: ["get", "list"]
EOF
```

The second role is for `vela status --tree`, which lists clusters; neither cluster list carries credentials.

## 2. Two teams, an Application each

```shell
for team in team-a team-b; do
  kubectl create namespace $team
  kubectl apply -n $team -f - <<EOF
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: web
spec:
  components:
    - name: web
      type: webservice
      properties:
        image: nginx:1.27-alpine
        ports:
          - port: 80
            expose: true
EOF
  kubectl create serviceaccount dev -n $team
  kubectl create rolebinding dev-view -n $team --clusterrole=view --serviceaccount=$team:dev
  kubectl create clusterrolebinding $team-dev-clusters --clusterrole=vela-cluster-viewer --serviceaccount=$team:dev
done
kubectl wait --for=jsonpath='{.status.status}'=running application/web -n team-a --timeout=2m
kubectl wait --for=jsonpath='{.status.status}'=running application/web -n team-b --timeout=2m
```

Each team's `dev` ServiceAccount has `view` in its own namespace, and nothing else but the cluster list.

## 3. A kubeconfig per team

```shell
for team in team-a team-b; do
  kubectl config view --minify --raw > $team.kubeconfig
  kubectl --kubeconfig $team.kubeconfig config set-credentials $team-dev \
    --token="$(kubectl create token dev -n $team --duration 1h)"
  kubectl --kubeconfig $team.kubeconfig config set-context --current --user=$team-dev
done
```

## 4. Each team sees its own

```shell
KUBECONFIG=team-a.kubeconfig kubectl get apprt -n team-a
KUBECONFIG=team-a.kubeconfig vela status web -n team-a --tree --detail
```

```console
NAME     CREATED AT
web-v1   2026-11-27T16:44:13Z
CLUSTER       NAMESPACE     RESOURCE       STATUS    APPLY_TIME          DETAIL
local     ─── team-a    ─┬─ Service/web    updated   2026-11-27 16:44:13 Type: ClusterIP  Cluster-IP: 10.43.184.192  External-IP: <none>  Port(s): 80/TCP  Age: 2s
                         └─ Deployment/web updated   2026-11-27 16:44:13 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 2s
```

## 5. And not the other's

```shell
KUBECONFIG=team-a.kubeconfig kubectl get apprt -n team-b
KUBECONFIG=team-a.kubeconfig vela status web -n team-b --tree
```

```console
Error from server (Forbidden): applicationresourcetrackers.prism.oam.dev is forbidden: User "system:serviceaccount:team-a:dev" cannot list resource "applicationresourcetrackers" in API group "prism.oam.dev" in the namespace "team-b"
Error: applications.core.oam.dev "web" is forbidden: User "system:serviceaccount:team-a:dev" cannot get resource "applications" in API group "core.oam.dev" in the namespace "team-b"
```

Nor the ResourceTrackers behind either:

```shell
KUBECONFIG=team-b.kubeconfig kubectl get resourcetrackers
```

```console
Error from server (Forbidden): resourcetrackers.core.oam.dev is forbidden: User "system:serviceaccount:team-b:dev" cannot list resource "resourcetrackers" in API group "core.oam.dev" at the cluster scope
```

## Clean up

```shell
kubectl delete namespace team-a team-b
kubectl delete clusterrolebinding team-a-dev-clusters team-b-dev-clusters
kubectl delete clusterrole vela-app-view vela-cluster-viewer
rm team-a.kubeconfig team-b.kubeconfig
```
