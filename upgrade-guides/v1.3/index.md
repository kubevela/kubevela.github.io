---
title: Upgrade from v1.2 to v1.3
sidebar_label: v1.2 to v1.3
---

:::danger
Note: It may cause application workflow rerun when controller upgrade.
:::

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. Upgrade your kubevela chart

```
helm repo remove kubevela 2>/dev/null || true
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.3.6 --wait
```

3. Download and upgrade to the corresponding CLI
```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.3.6
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version=v1.3.6
```

Please note if you're using terraform addon, you should upgrade the `terraform` addon to version `1.0.6+` along with the vela-core upgrade, you can follow the following steps:

1. upgrading vela-core to v1.3.4+, all existing Terraform typed Applications won't be affected in this process.
2. upgrade the `terraform` addon, or the newly provisioned Terraform typed Applications won't become successful. 
   - 2.1 Manually upgrade the Configuration CRD: `kubectl apply -f https://raw.githubusercontent.com/oam-dev/terraform-controller/v0.4.3/chart/crds/terraform.core.oam.dev_configurations.yaml`.
   - 2.2 Upgrade add-on `terraform` to version `1.0.6+`.
