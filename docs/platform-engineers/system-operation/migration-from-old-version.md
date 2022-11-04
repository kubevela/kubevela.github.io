---
title: Migrate from Old Versions
---

This doc aims to provide a migration guide from old versions to the new ones without disturb the running business. However scenarios are different from each other, we strongly recommend you to test the migration with a simulation environment before real migration for your production.

KubeVela has [release cadence](../../contributor/release-process) for every 2-3 months, we'll only maintain for the last 2 releases. As a result, you're highly recommended to upgrade along with the community. We'll strictly align with the [semver version rule](https://semver.org/) for compatibility.

## From v1.5.x to v1.6.x

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. Upgrade your kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.6.0 --wait
```

3. Download and upgrade to the corresponding CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.6.0
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version 1.6.0
```

## From v1.4.x to v1.5.x

:::caution
Note: Please upgrade to v1.5.7+ to avoid application workflow rerun when controller upgrade.
:::

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. Upgrade your kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.5.7 --wait
```

3. Download and upgrade to the corresponding CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.5.7
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version 1.5.6
```

## From v1.3.x to v1.4.x

:::danger
Note: It may cause application workflow rerun when controller upgrade.
:::

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. Upgrade your kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.4.11 --wait
```

3. Download and upgrade to the corresponding CLI
```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.4.11
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version 1.4.7
```

Please note if you're using terraform addon, you should upgrade the `terraform` addon to version `1.0.6+` along with the vela-core upgrade, you can follow the following steps:

1. upgrading vela-core to v1.3.4+, all existing Terraform typed Applications won't be affected in this process.
2. upgrade the `terrorform` addon, or the newly provisioned Terraform typed Applications won't become successful. 
   - 2.1 Manually upgrade CRD Configuration https://github.com/oam-dev/terraform-controller/blob/v0.4.3/chart/crds/terraform.core.oam.dev_configurations.yaml.
   - 2.2 Upgrade add-on `terraform` to version `1.0.6+`.


## From v1.2.x to v1.3.x

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
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.3.6 --wait
```

3. Download and upgrade to the corresponding CLI
```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.3.6
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version 1.3.6
```

Please note if you're using terraform addon, you should upgrade the `terraform` addon to version `1.0.6+` along with the vela-core upgrade, you can follow the following steps:

1. upgrading vela-core to v1.3.4+, all existing Terraform typed Applications won't be affected in this process.
2. upgrade the `terrorform` addon, or the newly provisioned Terraform typed Applications won't become successful. 
   - 2.1 Manually upgrade CRD Configuration https://github.com/oam-dev/terraform-controller/blob/v0.4.3/chart/crds/terraform.core.oam.dev_configurations.yaml.
   - 2.2 Upgrade add-on `terraform` to version `1.0.6+`.

## From v1.1.x to v1.2.x

:::danger
Note: It will cause application workflow rerun when controller upgrade.
:::

1. Check the service running normally

Make sure all your services are running normally before migration.

```
$ kubectl get all -n vela-system

NAME                                            READY   STATUS    RESTARTS   AGE
pod/kubevela-cluster-gateway-5bff6d564d-rhkp7   1/1     Running   0          16d
pod/kubevela-vela-core-b67b87c7-9w7d4           1/1     Running   1          16d

NAME                                       TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
service/kubevela-cluster-gateway-service   ClusterIP   172.16.236.150   <none>        9443/TCP   16d
service/vela-core-webhook                  ClusterIP   172.16.54.195    <none>        443/TCP    284d

NAME                                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/kubevela-cluster-gateway   1/1     1            1           16d
deployment.apps/kubevela-vela-core         1/1     1            1           284d
```

In addition, it's also necessary to check the status of all the KubeVela applications including addons running normally.

2. update the CRD to v1.2.x

Update the CRD in the cluster to v1.2.x, the CRD list is as follows, some of them can be omitted if you don't have them before:

```shell
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_envbindings.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_healthscopes.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_manualscalertraits.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_policydefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_scopedefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_traitdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_workflowstepdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/core.oam.dev_workloaddefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.2/charts/vela-core/crds/standard.oam.dev_rollouts.yaml
```

3. Execute the upgrade command

This step will upgrade the system to the new version:

``` shell
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.2.6 --wait
```

Upgrade the CLI to v1.2.x corresponding the the core version:

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.2.6
```

4. Enable addon

After the upgrade succeed, users can use the following methods to enable addons if they need to be enabled:

```shell
# View the list of addons
vela addon list
# Enable addon
vela addon enable <addon name>
```

:::tip
This step is not required if the addon is already enabled and used in the pre-upgrade version
:::

1. Update Custom Definition

Check if your custom definition works in the new version, try to upgrade them if there're any issues.
If you haven't defined any, the normal upgrade process is completed!

6. Common Questions for this migration

- Q: After upgrading from 1.1.x to 1.2.x, the application status becomes `workflowsuspending`, and using `vela workflow resume` doesn't work.
  - A: There're migration about the resource tracker mechanism. Generally, you can delete the existing resourcetracker, after that you can use `vela workflow resume` command.
- Q: Why the status of my application become suspend after the upgrade?
  - A: Don't worry if your application become suspend after the upgrade, this won't affect the running business application. It will become normal after you deploy the application next time. You can also manually change any annotation of the application to resolve it.