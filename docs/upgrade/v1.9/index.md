---
title: Upgrade from v1.8 to v1.9
sidebar_label: v1.8 to v1.9
---

Read the [v1.9.0 release notes](../../release-notes/v1.9/v1.9.0.md) before you upgrade. If you set `--pprof-addr`, `--disable-caps` or the `ApplyResourceByUpdate` feature gate in custom controller arguments, update them first; v1.9 renames or removes them.

:::caution
1. Legacy code removal. Basically you will not be able to use EnvBinding, HealthScope, ScopeDefinition and other objects in old KubeVela (`&lt;1.0`), like ApplicationConfiguration.
2. Registry migrated from kubevela.net OSS storage to GitHub pages.
> Notice: the "hub.kubevela.net", "charts.kubevela.net" and "addons.kubevela.net" will not be served in the future.
> 1. For docker images in "hub.kubevela.net", replace it with "docker.io" or "ghcr.io/kubevela".
> 2. For helm charts in "charts.kubevela.net", replace it with "kubevela.github.io/charts".
> 3. For addons in "addons.kubevela.net", replace it with "kubevela.github.io/catalog/official".
> 
> You can run the following command to update your addon registry.
> ```shell
> vela addon registry delete KubeVela
> vela addon registry add KubeVela --type helm --endpoint=https://kubevela.github.io/catalog/official
> vela addon registry add experimental --type helm --endpoint=https://kubevela.github.io/catalog/experimental
> ```
:::

1. Upgrade your kubevela chart

```
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.9.5 --wait
```
