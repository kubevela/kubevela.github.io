---
title: Restricted Access to ResourceTrackers
sidebar_label: ResourceTrackers
description: Letting users see what their Applications created, one namespace at a time, with ApplicationResourceTracker and plain RBAC.
---

A ResourceTracker is KubeVela's record of every object an Application dispatched, to which cluster, and in which revision. KubeVela reads it to work out what to update and what to garbage-collect, and the vela CLI reads it for `vela status --tree`.

ResourceTrackers are cluster-scoped, so RBAC can't narrow them to a namespace: anyone who can read one can read them all, and with them the shape of every team's workloads. `ApplicationResourceTracker` is the same object, in the Application's namespace, so a Role can grant it.

## What it holds

One ApplicationResourceTracker for each ResourceTracker whose `app.oam.dev/namespace` label names the namespace. The name drops the `-<namespace>` suffix:

| ResourceTracker | ApplicationResourceTracker | Records |
| --- | --- | --- |
| `hello-v2-team-a` | `hello-v2` in `team-a` | What generation 2 of the Application dispatched. One per live generation; older ones go once their resources are collected. |
| `hello-team-a` | `hello` in `team-a` | The root tracker, for resources kept for the Application's lifetime. Only when a policy asks for it. |
| `hello-comp-rev-team-a` | `hello-comp-rev` in `team-a` | Component revisions. Only when the Application has them. |

Labels come across unchanged, so `kubectl get apprt -n team-a -l app.oam.dev/name=hello` gives one Application's trackers. The spec is the ResourceTracker's spec, and KubeVela compresses it, so read it with `vela status --tree` rather than `-o yaml`.

It is read-only: `get` and `list`, no `watch`, no writes.

## Grant it in one namespace

The smallest grant, for one user in one namespace:

```yaml
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
    verbs: ["get", "list"]
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
  - kind: User
    name: alice
    apiGroup: rbac.authorization.k8s.io
```

For `vela status --tree --detail` to show each resource's state, the user also reads the resources themselves; the built-in `view` ClusterRole, bound in the namespace, covers Deployments, Services and the rest.

## Grant it wherever someone can view

Neither KubeVela nor Prism adds its resources to Kubernetes' built-in `view`, `edit` and `admin` roles. One ClusterRole with the aggregation labels does, so everyone who can view a namespace can see its Applications and their trackers:

```yaml
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
```

With that in place, `kubectl create rolebinding bob-view -n team-a --clusterrole=view --user=bob` is all Bob needs.

## How the vela CLI uses it

The CLI lists ResourceTrackers first. Only when that is refused (`Forbidden` or `Unauthorized`) does it list ApplicationResourceTrackers in the Application's namespace, and if Prism isn't serving them either, it fails with:

```console
Error: failed to list ResourceTrackers: no permission for ResourceTracker and vela-prism is not serving ApplicationResourceTracker: resourcetrackers.core.oam.dev is forbidden: ...
```

So a user who can read ResourceTrackers never goes through Prism, and a user who can't needs nothing more than the Role above. `vela status --tree` also lists clusters, from Cluster Gateway's `virtualclusters`: see [Clusters](./clusters.md#what-the-vela-cli-needs).

## Across namespaces

`kubectl get apprt -A` lists every ResourceTracker, mapped into its Application's namespace, and needs `list` on `applicationresourcetrackers` at the cluster scope: a ClusterRoleBinding. Granting that is the same as granting ResourceTrackers, so keep it for the people who could read those anyway.

The addon's own trackers show up too, in `vela-system`, with names like `addon-vela-prism-addon-20261127163946393`.
