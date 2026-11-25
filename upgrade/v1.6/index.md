---
title: Upgrade from v1.5 to v1.6
sidebar_label: v1.5 to v1.6
---

:::caution
KubeVela upgraded the CUE version from v0.2.2 to v0.5.0-alpha.1 in v1.6.0, and some usages are deprecated.

If you used an input in Application with an invalid CUE variable `parameterKey` (eg: contains `-`, or starts with a number, etc.), like:
```
inputs:
   - from: output
     parameterKey: data.my-input
```

Please modify it to:
```
inputs:
   - from: output
     parameterKey: data["my-input"]
```
:::

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.6.6/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.6.6/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.6.6/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.6.6/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.6.6/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. Upgrade your kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.6.6 --wait
```

3. Download and upgrade to the corresponding CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.6.6
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version=v1.6.6
```
