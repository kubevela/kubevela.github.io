---
title: Migrate from Old Versions
---

This doc aims to provide a migration guide from old versions to the new ones without disturb the running business. However scenarios are different from each other, we strongly recommend you to test the migration with a simulation environment before real migration for your production.

KubeVela has [release cadence](../../contributor/release-process.md) for every 2-3 months, we'll only maintain for the last 2 releases. As a result, you're highly recommended to upgrade along with the community. We'll strictly align with the [semver version rule](https://semver.org/) for compatibility.

## From v1.11.x to v1.12.x

### Config templates and configs

v1.12 turns config templates and configs into Kubernetes resources, `ConfigTemplate` and `Config`,
reconciled by the controller; see [Config Template](../../reference/config-template.md). Your v1.11
templates and configs keep working without changes.

1. Apply the two new CRDs. Helm does not upgrade the CRDs in a chart's `crds/` directory:

```
kubectl apply -f https://raw.githubusercontent.com/kubevela/kubevela/release-1.12/charts/vela-core/crds/config.oam.dev_configtemplates.yaml
kubectl apply -f https://raw.githubusercontent.com/kubevela/kubevela/release-1.12/charts/vela-core/crds/config.oam.dev_configs.yaml
```

2. Upgrade your kubevela chart:

```
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.12.0 --wait
```

3. Upgrade the `vela` CLI. An older CLI keeps working, but it writes v1.11 objects.

4. (Optional) Move your v1.11 templates and configs to the new resources with
   `vela config-template migrate`, or once at controller startup with the
   `AutoMigrateLegacyConfigs` feature gate. See
   [Migrate Configs to ConfigTemplate and Config](config-migration.md), which also covers rolling
   back.

Check these changes before you upgrade:

- **New configs and templates are resources.** `vela config create` and
  `vela config-template apply` create `Config` and `ConfigTemplate` resources, and fail if the CRDs
  are not installed. The `create-config` workflow step creates a `Config` owned by the Application,
  waits until it is `Available`, and fails if the Config goes to `Error`.
- **`system` scope only in `vela-system`.** A template with `scope: "system"` can be applied only
  in `vela-system`; `vela config-template apply -f <file> -n <other namespace>` is refused. A v1.11
  template ConfigMap outside `vela-system` is treated as namespace-scoped, whatever its label says.
- **Using a template from another namespace needs permission.** A new Config may use a
  namespace-scoped template from another namespace only if the user creating it can `get` that
  ConfigTemplate. Existing v1.11 configs keep working, and migration records them as allowed. See
  [Scope](../../reference/config-template.md#scope-who-may-use-a-template).
- **The controller publishes to Nacos.** For a template with a `nacos` block, the controller, not
  the CLI, now publishes each Config. The controller's pods must be able to reach the Nacos server
  at the address in the endpoint config; in v1.11 only the machine running the CLI had to. The
  result is in the Config's `NacosSynced` condition: a publish the server refuses shows `False`
  with reason `PublishFailed`. Deleting a Config does not delete its Nacos entry.
- **Sensitive Nacos endpoints need a mark.** If the config that holds a Nacos server's address and
  credentials is sensitive, its owner must annotate it `config.oam.dev/nacos-endpoint: "true"`
  (the Config, or the v1.11 Secret if it was not migrated) before Configs can publish through it.
- **Sensitive rules are enforced.** A template's `sensitive` can be turned on, but not back off. A
  sensitive template takes properties only from a Secret (`propertiesFrom`); `vela config create`
  does this for you. A Config that reads its properties from a Secret is always sensitive, whatever
  its template says. A sensitive config's properties are never returned by `vela config` reads,
  the `read-config` and `list-config` workflow steps, or CueX; Applications can still mount its
  Secret. See [Sensitive templates](../../reference/config-template.md#sensitive-templates).

## From v1.10.x to v1.11.x

v1.11.x upgrades the underlying CUE engine from v0.9.2 to v0.14.1. CUE v0.14 turns previously-tolerated syntax (list arithmetic, unquoted error field labels) into hard errors, and enables two new experimental evaluator behaviors (`evalv3`, `keepvalidators`) that can change how existing definitions behave.

:::note
This upgrade is non-breaking by default. The controller renders legacy definitions through an automatic compatibility layer, and the Helm chart disables the two breaking CUE experiments out of the box. See [CUE 0.14 Compatibility Layer](cue-compatibility-layer.md) for the full reference, flags, and CLI tooling to find and permanently fix affected definitions.
:::

1. Upgrade your kubevela chart

```
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.11.0 --wait
```

2. (Optional, recommended) Scan for definitions relying on the compatibility layer, and permanently upgrade them:

```
vela def compatibility-check definitions
vela def upgrade my-definition.cue
```

### Toolchain and dependency bumps

v1.11.x also raises the Go toolchain and Kubernetes client library versions used to build and run KubeVela:

- **Go**: `1.22.0` → `1.23.8` ([#6767](https://github.com/kubevela/kubevela/pull/6767))
- **Kubernetes client libraries** (`k8s.io/api`, `k8s.io/client-go`, `k8s.io/apimachinery`, etc.): `v0.29.2` → `v0.31.10`, and `sigs.k8s.io/controller-runtime`: `v0.17.6` → `v0.19.7` ([#6837](https://github.com/kubevela/kubevela/pull/6837))
- E2E tests and envtest now run against Kubernetes `v1.31` (previously `v1.29`)

These are neither breaking for end users nor for existing Application/Definition YAML. They matter if you build custom controllers, providers, or addons against KubeVela's Go modules — bump your own `go.mod` and vendored `k8s.io`/`controller-runtime` versions accordingly to stay within a compatible range. The supported Kubernetes cluster version for running KubeVela itself remains `>= v1.19 && <= v1.31` (see [Kubernetes Requirements](../../installation/kubernetes.mdx)).

## From v1.8.x to v1.9.x

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

## From v1.7.x to v1.8.x

These isn't too much work to be done for upgrading from v1.7.x to v1.8.x for usage.

1. Upgrade your kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.8.2 --wait
```

## From v1.6.x to v1.7.x

In v1.6.x, we've upgraded the CUE engine to v0.5.x, please make sure your customized CUE definition has the compatibility when you upgrade to v1.7.x from versions lower than v1.6.0.

:::danger
⚠️ Please make sure upgrade the CRD first.
:::

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart.

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.7/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.7/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.7/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.7/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.7/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
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

You can execute this script to solve it before upgrade helm chart:

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

## From v1.5.x to v1.6.x

:::caution
KubeVela had upgraded the CUE version from v0.2.2 to v0.5.0-alpha1 in v1.6.x, and some usages are deprecated.

If you used an input in Application with a invalid CUE variable `parameterKey` (eg: contains `-`, or starts with a number, etc.), like:
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

## From v1.4.x to v1.5.x

:::caution
Note: Please upgrade to v1.5.10+ to avoid application workflow rerun when controller upgrade.
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
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.5.10 --wait
```

3. Download and upgrade to the corresponding CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.5.10
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux --version=v1.5.6
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
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.4.14 --wait
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
vela addon upgrade velaux --version=v1.3.6
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