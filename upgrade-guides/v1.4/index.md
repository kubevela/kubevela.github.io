---
title: Upgrade from v1.3 to v1.4
sidebar_label: v1.3 to v1.4
---

:::danger
Note: It may cause application workflow rerun when controller upgrade.
:::

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.4.14/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.4.14/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.4.14/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.4.14/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.4.14/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. Upgrade your kubevela chart

The chart repository does not publish v1.4.x, so install the chart from the v1.4.14 release tag:

```
git clone --depth 1 --branch v1.4.14 https://github.com/kubevela/kubevela.git kubevela-v1.4.14
helm upgrade -n vela-system --install kubevela ./kubevela-v1.4.14/charts/vela-core --set image.tag=v1.4.14 --wait
```

3. Download and upgrade to the corresponding CLI
```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.4.14
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version=v1.4.7
```

Please note if you're using terraform addon, you should upgrade the `terraform` addon to version `1.0.6+` along with the vela-core upgrade, you can follow the following steps:

1. upgrading vela-core to v1.3.4+, all existing Terraform typed Applications won't be affected in this process.
2. upgrade the `terraform` addon, or the newly provisioned Terraform typed Applications won't become successful. 
   - 2.1 Manually upgrade the Configuration CRD: `kubectl apply -f https://raw.githubusercontent.com/oam-dev/terraform-controller/v0.4.3/chart/crds/terraform.core.oam.dev_configurations.yaml`.
   - 2.2 Upgrade add-on `terraform` to version `1.0.6+`.
