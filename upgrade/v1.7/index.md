---
title: Upgrade from v1.6 to v1.7
sidebar_label: v1.6 to v1.7
---

In v1.6.x, we've upgraded the CUE engine to v0.5.x, please make sure your customized CUE definition has the compatibility when you upgrade to v1.7.x from versions lower than v1.6.0.

:::danger
⚠️ Please make sure upgrade the CRD first.
:::

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.7.3/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.7.3/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.7.3/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.7.3/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.7.3/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. Upgrade your kubevela chart


Then you can upgrade the helm chart now:

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.7.3 --wait
```

:::caution
Since we have migrated some workflow step definitions and views from workflow addon into KubeVela core, so if you've already enable `workflow` addon before, it may cause the following error due to the helm annotation issues:

>Error: Could not install KubeVela control plane installation: error when installing/upgrading Helm Chart kubevela in namespace vela-system: rendered manifests contain a resource that already exists. Unable to continue with update: WorkflowStepDefinition "apply-deployment" in namespace "vela-system" exists and cannot be imported into the current release: invalid ownership metadata; label validation error: missing key "app.kubernetes.io/managed-by": must be set to "Helm"; annotation validation error: missing key "meta.helm.sh/release-name": must be set to "kubevela"; annotation validation error: missing key "meta.helm.sh/release-namespace": must be set to "vela-system"

You can run this script before you upgrade the helm chart ([source](https://github.com/kubevela/kubevela.github.io/blob/main/static/script/checklegacy.sh)); it only patches Helm ownership annotations and labels:

```
curl -fsSl https://kubevela.io/script/checklegacy.sh | bash
```

The script will just help patch helm annotations for you, you can also do that manually one by one like:

```
kubectl patch -n vela-system workflowstepdefinition <item> --type=merge -p '{"metadata":{"annotations":{"meta.helm.sh/release-name":"kubevela","meta.helm.sh/release-namespace":"vela-system"},"labels":{"app.kubernetes.io/managed-by":"Helm"}}}'
kubectl patch -n vela-system configMap <item> --type=merge -p '{"metadata":{"annotations":{"meta.helm.sh/release-name":"kubevela","meta.helm.sh/release-namespace":"vela-system"},"labels":{"app.kubernetes.io/managed-by":"Helm"}}}'
```
:::

3. Download and upgrade to the corresponding CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.7.3
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version=v1.7.2
```
