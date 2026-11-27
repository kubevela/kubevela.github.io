---
title: Introduction
description: What Prism is, who it's for, and how it relates to KubeVela.
---

Prism adds Kubernetes APIs to a KubeVela control plane for things KubeVela keeps in a shape that's awkward to grant access to. It is an aggregated API server: it registers its API groups with the hub's kube-apiserver, so `kubectl`, RBAC, client-go and anything else that speaks Kubernetes can use them like any built-in resource.

It has no etcd and stores nothing of its own. Every object it serves is built, on each request, from something that already exists: a ResourceTracker, a cluster Secret, a Grafana instance's HTTP API.

| API | Group | What it is |
| --- | --- | --- |
| `ApplicationResourceTracker` (`apprt`) | `prism.oam.dev/v1alpha1` | A namespaced view of KubeVela's cluster-scoped ResourceTrackers, so a Role in a namespace can let someone see what that namespace's Applications created. Read-only. |
| `Cluster` (`vela-clusters`) | `prism.oam.dev/v1alpha1` | The clusters KubeVela manages, without their credentials. Read-only. |
| `Grafana` | `o11y.prism.oam.dev/v1alpha1` | Access to a Grafana instance: its endpoint and a credential, kept in a Secret. |
| `GrafanaDashboard`, `GrafanaDatasource` | `o11y.prism.oam.dev/v1alpha1` | A Grafana instance's dashboards and datasources, read and written through Grafana's HTTP API. |

```shell
kubectl get apprt -n team-a        # what team-a's Applications created
kubectl get vela-clusters          # the managed clusters, no credentials
kubectl get grafanadashboards      # dashboards in the Grafana named "default"
```

## Who it's for

* **Platform teams handing out access.** ResourceTrackers are cluster-scoped and record every object every Application dispatched, and cluster Secrets hold credentials. Neither is safe to hand to an application team. Prism's views of them can be granted per namespace, or with no credentials in them, using plain RBAC.
* **Application teams on a shared hub.** With read access to `apprt` in their namespace, `vela status --tree` works for them without any cluster-wide permission.
* **Anyone managing Grafana as code.** Dashboards and datasources become Kubernetes objects, so an Application, a GitOps tool or `kubectl apply` can manage them, and Grafana stays the only place they're stored.

## How it relates to KubeVela

Prism isn't part of vela-core. It installs as the [`vela-prism` addon](/addons/vela-prism), into `vela-system`, and runs beside the controller. From there:

* The vela CLI uses it without being told. When a user can't list ResourceTrackers, `vela status --tree` and the other commands that read them fall back to `ApplicationResourceTracker` in the Application's namespace.
* The observability addons build on it. `o11y-definitions` depends on `vela-prism`, and its `grafana-dashboard`, `grafana-datasource` and `import-grafana-dashboard` definitions, and the `grafana` config template, all write Prism objects. See [Customize Dashboard](/docs/next/platform-engineers/operations/o11y/dashboard) and [Cloud Service Integration](/docs/next/platform-engineers/operations/o11y/integration).
* VelaUX imports Prism's Go code for listing clusters, but reads the cluster Secrets with its own client, so it doesn't need Prism running.

How KubeVela's own permissions work, and where Prism fits in them, is in the KubeVela docs under [Underlying Mechanism](/docs/next/platform-engineers/auth/advance#access-resources-with-limited-privileges).

These pages describe Prism v1.7.0, the image the `vela-prism` addon runs. [Versions](../reference/versions.md) lists what each KubeVela release gets, and where the published Helm chart (v1.6.0) differs.

## Where next

* [Install](./install.md): the addon, or the Helm chart.
* [Quick Start](./quick-start.md): a namespace user reading their Application's resources, on a k3d cluster.
* [How Prism Serves Its APIs](../concepts/projections.md): what each API reads and writes, and whose permissions apply.
