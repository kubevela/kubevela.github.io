---
title: Versions
---

KubeVela releases don't ship addons. Each addon has its own version in the catalog, and `vela addon enable` installs the newest one unless you pass `--version`. What ties an addon to KubeVela is the `system` block in its `metadata.yaml`: `system.vela` and `system.kubernetes` are the versions it works with, and enabling it anywhere else is refused (pass `--skip-version-validating` to try anyway).

## Which addons each KubeVela release can use

| KubeVela | Verified addons it can enable |
| --- | --- |
| v1.12 | All but `model-serving` (needs Kubernetes earlier than 1.22). `velaux` is v1.9.5; for the unreleased VelaUX 1.12 line see [VelaUX Versions](/velaux/reference/versions#velaux-112-on-older-kubevela-unreleased). |
| v1.11 | All but `model-serving`. |
| v1.10, v1.9 | All but `model-serving` and `cloudshell` (needs v1.11 or later). |

Since v1.11, the built-in [`helmchart`](/docs/end-user/components/references#helmchart) component deploys Helm charts without Flux, but the addons that depend on `fluxcd` still enable it. `rollout` and `traefik` can't be enabled on any release; see [Upgrade notes](#upgrade-notes).

Older KubeVela releases can still enable older versions of most addons: `vela addon status <name> -v` lists the versions the registry holds, and every version the catalog has published stays available.

## Verified addons

The `KubeVela` registry, as of the catalog's `master` on 2026-11-26. An empty cell means the addon sets no constraint.

| Addon | Version | KubeVela | Kubernetes | Depends on |
| --- | --- | --- | --- | --- |
| cert-manager | 2.2.0 | `>=v1.7.0-alpha.1` |  | fluxcd |
| chartmuseum | 4.2.1 |  |  |  |
| cloudshell | 0.0.12 | `>=v1.11.0` |  |  |
| dex | 0.7.0 | `>=v1.6.0-alpha.6` |  | velaux, fluxcd |
| flink-kubernetes-operator | 1.4.0 | `>=1.5.0-beta.3` |  | fluxcd, cert-manager |
| fluxcd | 3.0.2 | `>=1.9.0-alpha.2` |  |  |
| grafana | v0.4.4 | `>=v1.8.0-alpha.3` |  | o11y-definitions |
| ingress-nginx | 1.1.2 |  |  | fluxcd |
| keda | 2.8.3 |  |  | fluxcd |
| kruise-rollout | 1.5.2 | `>=1.8.0-alpha.3` | `>=1.19.0-0` | fluxcd |
| kube-state-metrics | v0.3.1 | `>=v1.7.0` |  |  |
| kube-trigger | 1.0.0 | `>=1.6.0` |  |  |
| kubevela-io | 1.3.0 |  |  |  |
| loki | v0.3.2 | `>=v1.7.0` |  | o11y-definitions |
| model-serving | 1.0.1 |  | `<1.22` | fluxcd |
| model-training | 1.0.1 |  |  | fluxcd |
| mysql-exporter | 0.0.1 |  |  |  |
| netlify | 10.5.2 |  |  |  |
| node-exporter | v0.3.0 | `>=v1.7.0` |  |  |
| o11y-definitions | v0.3.2 | `>=v1.7.0` |  | vela-prism |
| ocm-gateway-manager-addon | 1.4.0 |  |  |  |
| ocm-hub-control-plane | 0.6.0 |  |  |  |
| prometheus-server | v0.3.3 | `>=v1.7.0` |  | o11y-definitions |
| rollout | 1.3.3 | `>=v1.3.0-alpha.1` |  | fluxcd |
| terraform | 1.1.3 |  |  | fluxcd |
| terraform-alibaba | 1.0.6 | `>=v1.6.0-alpha.6` |  | terraform |
| terraform-aws | 1.0.3 | `>=v1.6.0-alpha.6` |  | terraform |
| terraform-azure | 1.0.3 | `>=v1.6.0-alpha.6` |  | terraform |
| terraform-baidu | 1.0.3 | `>=v1.6.0-alpha.6` |  | terraform |
| terraform-ec | 1.0.2 | `>=v1.6.0-alpha.6` |  | terraform |
| terraform-gcp | 1.0.3 | `>=v1.6.0-alpha.6` |  | terraform |
| terraform-tencent | 1.0.4 | `>=v1.6.0-alpha.6` |  | terraform |
| terraform-ucloud | 1.0.3 | `>=v1.6.0-alpha.6` |  | terraform |
| traefik | v2.6.3-3 | `>=v1.6.0-alpha.6` |  | fluxcd |
| trivy-operator | 3.1.2 | `>=v1.7.0-alpha.1` |  | fluxcd |
| vegeta | 12.8.4 |  |  |  |
| vela-core-shard-manager | v0.1.2 | `>=v1.8.0-alpha.2` |  |  |
| vela-prism | v1.6.0 | `>=v1.5.0` |  |  |
| vela-workflow | v0.7.3 | `>=v1.7.0-alpha.1` |  |  |
| velaux | v1.9.5 | `>=v1.9.0` |  |  |
| victoria-metric | 0.10.1 |  |  | o11y-definitions, fluxcd |

The experimental registry's addons and their constraints are in each one's `metadata.yaml`, under [`experimental/addons/`](https://github.com/kubevela/catalog/tree/master/experimental/addons).

## Upgrade notes

- **Lists in addon CUE.** Addon CUE is compiled as plain CUE v0.14, without the compatibility layer definitions go through, so list arithmetic (`a + b`) fails when the addon is enabled. `grafana`, `loki` and `prometheus-server` were fixed for this in the catalog; an addon of your own that joins lists with `+` needs `list.Concat`. See [Addon Application in CUE or YAML](../developer/addon-application.md).
- **Registry address.** The catalog is published at `https://kubevela.github.io/catalog/official`, which KubeVela has registered by default since v1.9.1. If `vela addon registry list` still shows `https://addons.kubevela.net` for `KubeVela`, repoint it with `vela addon registry update KubeVela --type helm --endpoint=https://kubevela.github.io/catalog/official`.
- **Addons that can't install.** `rollout` and `traefik` fetch their charts from `charts.kubevela.net`, which no longer exists. Use `kruise-rollout` and `ingress-nginx` instead.
