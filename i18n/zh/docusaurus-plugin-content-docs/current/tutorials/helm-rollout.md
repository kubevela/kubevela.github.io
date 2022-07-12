---
title: 金丝雀发布
---

## 开始之前

1. 请确保你已经阅读过关于 [helm chart的基本部署](./helm) 的文档。

2. 确认你已经开启了 [`kruise-rollout`](../reference/addons/kruise-rollout) 插件，我们的金丝雀发布依赖于 [rollouts from OpenKruise](https://github.com/openkruise/rollouts)。
  ```shell
  $ vela addon enable kruise-rollout
  Addon: kruise-rollout enabled Successfully.
  ```

3. 请确保在你的集群中已经安装了一种 [ingress controllers](https://kubernetes.github.io/ingress-nginx/deploy/) 。
   如果没有安装Ingress，你也可以通过如下命令启用 [ingress-nginx](../reference/addons/nginx-ingress-controller) or [traefik](../reference/addons/traefik) 插件：
  ```shell
  vela addon enable ingress-nginx
  ```
  请参阅 [插件文档](../reference/addons/nginx-ingress-controller) 获取网关地址。

4. 一些命令比如 `rollback` 依赖 vela-cli 版本 `>=1.5.0-alpha.1`，请更新cli到最新版本。你不需要更新controller。

## 限制

一个 helm chart 会包含几乎所有功能，金丝雀发布在以下多种用例中都适用：

1. helm chart 包含指向工作负载的服务并配合Ingress路由。
2. 工作负载支持包含 Kubernetes Deployment, StatefulSet 和 [OpenKruise Cloneset](https://openkruise.io/docs/user-manuals/cloneset/)。这意识着在 helm chart 中的工作负载必须是以上三种中的一种。

默认情况下每一个 helm chart 都使用 `helm create` 命令。

## 首次部署

当你开始使用金丝雀发布时，你需要在第一次部署时添加 `kruise-rollout` 特性，这个配置会在下一次发布时生效。特性在应用中如下所示：

```yaml
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: canary-demo
  annotations:
    app.oam.dev/publishVersion: v1
spec:
  components:
  - name: canary-demo
    type: helm
    properties:
      repoType: "helm"
      url: "https://wangyikewxgm.github.io/my-charts/"
      chart: "canary-demo"
      version: "1.0.0"
    traits:
    - type: kruise-rollout
      properties:
        canary:
          # 第一批金丝雀发布有 20% Pods 和 20% 流量指向新版本，需要手工批准以完成后续操作。
          steps:
          - weight: 20
          # 第二批金丝雀发布有 90% Pods 和 90% 流量指向新版本。
          - weight: 90
          trafficRoutings:
          - type: nginx
EOF
```

这是通过 `helm create` 创建的通用的 helm chart，它包含了镜像 `barnett/canarydemo:v1`，一个服务和一个Ingress。你可以通过 [仓库](https://github.com/wangyikewxgm/my-charts/tree/main/canary-demo) 检查 chart 源。

下面是 **这一过程是如何发生的** 当升级时使用 `kruise-rollout` 特性配置后，整个过程分为三步：

1. 当开始升级时，会产生 `20%` 的副本数量。在我们的示例中， 我们一共设置了5个副本，它会保留所有的老的版本并创建 `5 * 20% = 1` 个金丝雀版本，并且负载了 `20%` 的流量。在所有都准备好后，它会等待手工批准。
   - 副本和流量的百分比默认是一致的，你可以根据 [文档](../../reference/addons/kruise-rollout) 配置副本的比例。
2. 在手工批准后，会进入到第二个阶段，它会创建 `5 * 90% = 4.5` 实际上是 `5` 个副本的新版本，并且负载 `90%` 的流量。这样一来，目前系统一共有 `10` 个副本，它需要等待下一步的手工批准。
3. 在批准后，它就会利用滚动更新的机制来更新副本，在工作负载完成升级后，所有的流量路由都指向新的工作负载，金丝雀发布也会被销毁。

让我们继续示例，我们的第一步部署过程和一般的部署并没有太大区别，你可以通过如下命令来检查应用的状态来确保可以进行下一步操作。

```shell
vela status canary-demo
```

访问网关，你会看到结果都是 `Demo: V1`
```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

## Day-2 金丝雀发布

升级 helm chart 从 `1.0.0` 到 `2.0.0`：

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: canary-demo
  annotations:
    app.oam.dev/publishVersion: v2
spec:
  components:
  - name: canary-demo
    type: helm
    properties:
      repoType: "helm"
      url: "https://wangyikewxgm.github.io/my-charts/"
      chart: "canary-demo"
      # Upgade to version 2.0.0
      version: "2.0.0"
    traits:
    - type: kruise-rollout
      properties:
        canary:
          # 第一批金丝雀发布使用 20% Pods 和 20% 流量指向新版本，后续发布需要手工确认。
          steps:
          - weight: 20
          # 第二批金丝雀发布使用 90% Pods 和 90% 流量指向新版本。
          - weight: 90
          trafficRoutings:
          - type: nginx
EOF
```

这里唯一的不同就是镜像标签。`2.0.0` 版本使用 `barnett/canarydemo:v2`。

再次访问网关，你会发布大概 20% 的机率会访问 `Demo: v2`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

另外一个例如 `continue rollout/rollback` 的操作在结果上也和服务组件相同。


## 继续金丝雀发布

通过业务相关的指标比如日志或者其他指标来验证金丝雀的版本发布成功后，你可以恢复工作流并继续后续过程。

```shell
vela workflow resume canary-demo
```

再次多次访问网关，你会发布访问 `Demo: v2` 的机率显著提升，大概在 90%。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

## 金丝雀验证通过，完成发布

最后，你可以再次恢复来完成发布过程。

```shell
vela workflow resume canary-demo
```

多次访问网关，你会发布结果一直是 `Demo: v2`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

## 金丝雀验证失败，回滚发布

如果你想取消发布过程并让应用回滚到上一个版本，并在检查后，你可以通过如下命令回滚工作流：

你需要在回滚前中止工作流：

```shell
$ vela workflow suspend canary-demo
Rollout default/canary-demo in cluster  suspended.
Successfully suspend workflow: canary-demo
```

回滚：

```shell
$ vela workflow rollback canary-demo
Application spec rollback successfully.
Application status rollback successfully.
Rollout default/canary-demo in cluster  rollback.
Successfully rollback rolloutApplication outdated revision cleaned up.
```

再次访问网关，你会看到结果一直是 `Demo: V1`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

任何在 `runningWorkflow` 过程中的回滚操作都会回滚到应用最后一次成功发布的版本，所以如果你已经成功部署了 `v1` 并且升级到 `v2`， 但是如果 `v2` 失败了但是你又继续更新到 `v3`。那么从 `v3` 回滚会自动到 `v1`，这是因为 `v2` 并不是成功发布的版本。
