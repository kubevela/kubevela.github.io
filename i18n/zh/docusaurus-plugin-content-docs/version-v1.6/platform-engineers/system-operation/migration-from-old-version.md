---
title: 从旧版本进行迁移
---

本文档旨在提供在不会干扰正在运行的业务的情况下从旧版本到新版本的迁移指南。但是考虑到场景彼此不同，我们强烈建议你在实际迁移之前使用模拟环境对迁移进行测试。

KubeVela 的[发布周期](../../contributor/release-process)定为每隔 2-3 个月发布一个版本，我们将维护最近的 2 个版本。所以，我们强烈推荐你跟着社区的节奏一同升级，我们会严格遵循 [semver 版本](https://semver.org/)定义的兼容性规则。 

## 从 v1.5.x 版本 到 v1.6.x 版本

:::caution
KubeVela 在 v1.6.x 版本中将 CUE 版本从 v0.2.2 升级到了 v0.5.0-alpha1，有一些用法在升级过程中被废弃了。

如果你之前在应用中使用了 input，并且它的 parameterKey 中并不是一个标准的 CUE 变量名（如，带有 `-`，或者以数字开头等）：
```
inputs:
   - from: output
     parameterKey: data.my-input
```

请修改为：
```
inputs:
   - from: output
     parameterKey: data["my-input"]
```
:::

1. 升级 CRD，请确保在升级 helm chart 之前先升级 CRD。

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.6/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. 升级 kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.6.0 --wait
```

3. 下载并升级对应的CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.6.0
```

4. 升级 VelaUX 或其他插件

```
vela addon upgrade velaux --version 1.6.0
```

## 从 v1.4.x 版本 到 v1.5.x 版本

:::caution
注意: 升级到 v1.5.6 及以前的版本可能会触发应用重启，升级到 v1.5.7+ 可以保证已经正常运行的应用不受影响。
:::

1. 升级 CRD，请确保在升级 helm chart 之前先升级 CRD。

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.5/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. 升级 kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.5.7 --wait
```

3. 下载并升级对应的CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.5.7
```

4. 升级 VelaUX 或其他插件

```
vela addon upgrade velaux --version 1.5.7
```

## 从 v1.3.x 版本 到 v1.4.x 版本

:::danger
注意: 升级到该版本可能会触发应用重启。
:::

1. 升级 CRD，请确保在升级 helm chart 之前先升级 CRD。

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.4/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. 升级 kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.4.11 --wait
```

3. 下载并升级对应的CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.4.11
```

4. 升级 VelaUX 或其他插件

```
vela addon upgrade velaux --version 1.4.7
```

请注意，如果你使用的是 terraform 插件，你应该将 `terraform` 插件升级到 `1.0.6+` 版本以及 vela-core 升级，你可以按照以下步骤进行操作：

1. 升级 vela-core 到 v1.3.4+，所有现有的 Terraform 类型的应用程序在此过程中不会受到影响。 
2. 升级 `terrorform` 插件，否则新配置的 Terraform 类型的应用程序不会成功。 
   - 2.1 手动升级 CRD 配置 https://github.com/oam-dev/terraform-controller/blob/v0.4.3/chart/crds/terraform.core.oam.dev_configurations.yaml 
   - 2.2 将附加组件 `terraform` 升级到版本 `1.0.6+`。

## 从 v1.2.x 版本 到 v1.3.x 版本

:::danger
注意: 升级到该版本可能会触发应用重启。
:::

1. 升级 CRD，请确保在升级 helm chart 之前先升级 CRD。

```
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_applications.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_resourcetrackers.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_componentdefinitions.yaml
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/release-1.3/charts/vela-core/crds/core.oam.dev_definitionrevisions.yaml
```

2. 升级 kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.3.6 --wait
```

3. 下载并升级对应的CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.3.6
```

4. 升级 VelaUX 或其他插件

```
vela addon upgrade velaux --version 1.3.6
```

请注意，如果你使用的是 terraform 插件，你应该将 `terraform` 插件升级到 `1.0.6+` 版本以及 vela-core 升级，你可以按照以下步骤操作： 
1. 将 vela-core 升级到 v1.3.4+，所有现有的 Terraform 类型应用程序将不会在此过程中受到影响。 
2. 升级 `terrorform` 插件，否则新配置的 Terraform 类型的应用程序不会成功。 
   - 2.1 手动升级 CRD 配置 https://github.com/oam-dev/terraform-controller/blob/v0.4.3/chart/crds/terraform.core.oam.dev_configurations.yaml
   - 2.2 将附加组件 `terraform` 升级到版本 `1.0.6+`。

## 从 v1.1.x 版本到 v1.2.x 版本

:::danger
注意: 升级到该版本可能会触发应用重启。
:::

1. 检查服务是否正常运行

迁移前请确保你的所有服务都正常运行。

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
此外，还需要检查所有 KubeVela 应用的状态，包括正常运行的插件。

2. 将 CRD 更新到 v1.2.x 版本

将集群中的 CRD 更新到 v1.2.x 版本，CRD 列表如下，如果在之前没有的部分则可以省略：

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

3. 执行升级命令

升级系统到新版本：

``` shell
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.2.6 --wait
```

将 CLI 升级到与核心版本对应的 v1.2.x 版本：

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.2.6
```

4. 启用插件

升级成功后，如果需要启用插件，用户可以通过以下方式启用插件：

```shell
# View the list of addons
vela addon list
# Enable addon
vela addon enable <addon name>
```

:::tip
如果插件在升级前的版本中已经启用并且在使用中，则不需要此步骤.
:::

1. 更新 Custom Definition 

检查你的 Custom Definition 是否在新版本中正常工作，如果有任何问题，请尝试升级它们。如果你没有定义任何内容，则升级过程已经完成！

6. 迁移的常见问题
- Q：从1.1.x 版本升级到 1.2.x 版本后，申请状态变成`workflowsuspending`，使用`vela workflow resume`不起作用。 
  - A：关于资源跟踪器机制的迁移。一般可以删除已有的 resourcetracker，之后可以使用`vela workflow resume`命令。 
- Q：为什么我的应用在升级后变成了 suspend 状态？ 
  - A：如果你的应用程序在升级后暂停，请不要担心，这不会影响正在运行的业务应用。应用会在下次部署后变为正常状态。你还可以手动更改应用的任何注解来解决这个问题。