---
title: Install
description: Installing Prism as the vela-prism addon or from its Helm chart, and what differs between them.
---

Prism runs on the hub, in the namespace KubeVela stores its clusters in (`vela-system` unless you changed it). There are two ways to install it: the `vela-prism` addon, which is what KubeVela's own tooling and the observability addons expect, or Prism's Helm chart.

## As the addon

```shell
vela addon enable vela-prism
kubectl wait --for=condition=Available --timeout=2m \
  apiservice/v1alpha1.prism.oam.dev apiservice/v1alpha1.o11y.prism.oam.dev
```

The addon is an Application, `addon-vela-prism` in `vela-system`, deployed to the `local` cluster only. It creates:

| Object | What for |
| --- | --- |
| Deployment and Service `vela-prism`, port 9443 | The API server, image `oamdev/vela-prism:v1.7.0`. |
| APIServices `v1alpha1.prism.oam.dev`, `v1alpha1.o11y.prism.oam.dev` | Register the two API groups with the hub. |
| ServiceAccount `vela-prism` and a ClusterRole | Prism's own access: read ResourceTrackers, namespaces and OCM ManagedClusters; read and write Secrets in every namespace; create SubjectAccessReviews. |
| RoleBinding in `kube-system` to `extension-apiserver-authentication-reader` | Lets Prism read the hub's client CA, so it can authenticate requests the hub forwards. |
| ClusterRole and ClusterRoleBinding `vela-prism:prism-cluster-access-*` | Read access to `clusters.prism.oam.dev` for the `kubevela:client` group, the group `vela auth gen-kubeconfig` puts users in. |

An init container makes a self-signed CA and serving certificate, valid for ten years, and patches the CA into both APIServices. The certificate is made again each time the pod starts.

The parameters (namespace, image, CPU and memory) are on the addon's page, [vela-prism](/addons/vela-prism#parameters).

`vela addon enable` returns once the Application is deployed, a few seconds before the pod is ready, hence the `kubectl wait`.

:::note
The addon's catalog entry is labelled version `v1.6.0`, but since June 2023 it has run the `v1.7.0` image. `vela addon list` shows the label, not what runs; `kubectl get deploy vela-prism -n vela-system -o jsonpath='{.spec.template.spec.containers[0].image}'` shows the image.
:::

## From the Helm chart

The chart is published in the KubeVela chart repository. Its newest version is 1.6.0:

```shell
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install vela-prism kubevela/vela-prism --version 1.6.0 \
  --namespace vela-system --set image.tag=v1.7.0 --wait
```

Set `image.tag=v1.7.0`. The chart's default, `v1.6.0`, exits at once with a segmentation fault on arm64 nodes (Apple silicon, Graviton), so the install never becomes ready; on amd64 it runs, without the fixes in v1.7.0. Prism's README still points at `charts.kubevela.net/prism`, which no longer answers.

The chart differs from the addon in how it handles certificates: a pre-install Job (`oamdev/kube-webhook-certgen`) makes a CA and certificate into a Secret named after the release, and a post-install Job (`oamdev/cluster-gateway:v1.4.0`, used for its `patch` tool) writes the CA into the APIServices. `--set secureTLS.enabled=false` skips both and registers the APIServices with `insecureSkipTLSVerify` instead. All values are on [Configuration](../operate/configuration.md#helm-chart-values).

### The chart at v1.7.0

The chart in Prism's repository at the `v1.7.0` tag was never published. Installed from a checkout, it adds a third API group, `dynamic.prism.oam.dev`, for [dynamic resources](../guides/dynamic-resources.md), switched on by default:

```shell
git clone --depth 1 --branch v1.7.0 https://github.com/kubevela/prism.git
helm install vela-prism ./prism/charts --namespace vela-system --set image.tag=v1.7.0 --wait
```

Its `image.tag` defaults to `latest`, so set it. Read [Dynamic Resources](../guides/dynamic-resources.md) before keeping `dynamicAPI.enabled` on: until a dynamic resource is defined, that API group is unavailable, and the hub can't finish deleting namespaces while any API group is unavailable.

## Addon or chart

| | Addon | Chart 1.6.0 | Chart at v1.7.0 |
| --- | --- | --- | --- |
| Image | `v1.7.0` | `v1.6.0`, set `v1.7.0` | `latest`, set `v1.7.0` |
| API groups | `prism.oam.dev`, `o11y.prism.oam.dev` | the same | the same, plus `dynamic.prism.oam.dev` |
| Serving certificate | Init container, remade on every start | certgen Job, kept in a Secret | certgen Job, kept in a Secret |

Use the addon on a KubeVela hub. Addons that need Prism, such as `o11y-definitions`, list `vela-prism` as a dependency, so enabling one of them alongside a chart install enables the addon as well, and the two register the same APIServices. The chart suits a cluster that manages everything with Helm and uses none of those addons, or one where you want the dynamic API.

## Remove it

```shell
vela addon disable vela-prism
```

or, for the chart:

```shell
helm uninstall vela-prism -n vela-system
kubectl delete secret vela-prism -n vela-system
```

The chart's certificate Secret is made by a Job, not by Helm, so `helm uninstall` leaves it behind.

Removing Prism deletes nothing it served: ResourceTrackers, cluster Secrets, Grafana Secrets and the dashboards in Grafana all stay where they are.
