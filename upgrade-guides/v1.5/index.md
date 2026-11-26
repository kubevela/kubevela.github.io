---
title: Upgrade from v1.4 to v1.5
sidebar_label: v1.4 to v1.5
---

:::caution
Note: Please upgrade to v1.5.10+ to avoid application workflow rerun when controller upgrade.
:::

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.5.11/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.5.11/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.5.11/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.5.11/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.5.11/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. Upgrade your kubevela chart

```
helm repo remove kubevela 2>/dev/null || true
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.5.11 --wait
```

3. Download and upgrade to the corresponding CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.5.11
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version=v1.5.6
```
