---
title: 金丝雀发布
---

## 准备工作

1. 请确保你已经阅读过关于 [helm chart的基本部署](./helm) 的文档。

2. 确认你已经启用了 [`kruise-rollout`](../reference/addons/kruise-rollout.md) 插件，我们的金丝雀发布依赖于 [rollouts from OpenKruise](https://github.com/openkruise/rollouts)，可通过如下命令启用插件。
   
   ```shell
   $ vela addon enable kruise-rollout
   Addon: kruise-rollout enabled Successfully.
   ```

3. 请确保在你的集群中有一种 [ingress controllers](https://kubernetes.github.io/ingress-nginx/deploy/) 。
   如果没有安装Ingress，你也可以通过如下命令启用 [ingress-nginx](../reference/addons/nginx-ingress-controller.md) 或 [traefik](../reference/addons/traefik.md) 插件：
   
   ```shell
   vela addon enable ingress-nginx
   ```
   
   请参考 [插件文档](../reference/addons/nginx-ingress-controller.md) 获取网关的访问地址。

4. 一些命令比如 `rollback` 依赖 vela-cli 版本 `>=1.5.0-alpha.1`，请更新cli到最新版本。不需要更新controller。

## 限制

一个 helm chart 包含几乎所有功能，金丝雀发布在以下多种用例中都适用：

1. 实例部署支持 Kubernetes Deployment, StatefulSet 和 [OpenKruise Cloneset](https://openkruise.io/docs/user-manuals/cloneset/)。这意味着在 helm chart 中的实例必须是以上三种中的一种。

默认情况下每一个 helm chart 都使用 `helm create` 命令。

## 首次部署

当你开始使用金丝雀发布时，你需要在第一次部署应用时添加 `kruise-rollout` 特性，这个配置会在下一次发布时生效。特性在应用中的配置如下所示：

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
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          # The second batch of Canary releases 90% Pods, and 90% traffic imported to the new version.
          - weight: 90
          trafficRoutings:
          - type: nginx
EOF
```

这是通过 `helm create` 创建的通用的 helm chart，它包含了镜像 `barnett/canarydemo:v1`，一个 Service 和一个 Ingress 。你可以通过 [仓库](https://github.com/wangyikewxgm/my-charts/tree/main/canary-demo) 查看 chart 源。

下面是 **这一过程是如何发生的** 当应用使用 `kruise-rollout` 运维特征里升级策略的配置，整个过程分为三步：

1. 当开始升级时，会产生 `20%` 的实例数量。在我们的示例中， 我们一共设置了5个实例，它会保留所有的老的版本并创建 `5 * 20% = 1` 个金丝雀版本，并且导入了 `20%` 的流量到新版本中。在所有都准备好后，它会等待手工批准。
   - 实例数量和导入流量的百分比默认是一致的，你可以根据 [文档](../../reference/addons/kruise-rollout.md) 配置比例。
2. 在手工批准后，会进入到第二个阶段，它会创建 `5 * 90% = 4.5` 实际上是 `5` 个实例的新版本，并且导入 `90%` 的流量到新版本中。这样一来，目前系统一共有 `10` 个实例，它需要等待下一步的手工批准。
3. 在批准后，它就会利用滚动更新的机制来更新实例，在实例完成升级后，所有的流量都指向新的实例，金丝雀发布也会被销毁。

我们的首次部署和一般的部署并没有太大区别，你可以通过如下命令来检查应用的状态来确保可以进行下一步操作。

```shell
vela status canary-demo
```

访问网关，你会看到结果都是 `Demo: V1`

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

## Day-2 金丝雀发布

将 helm chart 版本从 `1.0.0` 更新到 `2.0.0`：

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
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          # The second batch of Canary releases 90% Pods, and 90% traffic imported to the new version.
          - weight: 90
          trafficRoutings:
          - type: nginx
EOF
```

两个版本唯一的区别就是镜像标签。`2.0.0` 版本使用 `barnett/canarydemo:v2`。

再次访问网关，你会发现有 20% 的机率会返回新版本的 `Demo: v2`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

其他 `继续发布/回滚` 等操作和上面的 webservice 的类型组件完全一致。

## 金丝雀验证

用户通过业务的相关指标，如：日志、Metrics等其它手段，验证金丝雀版本OK之后，继续执行工作流发布继续发布。

```shell
vela workflow resume canary-demo
```

再次多次访问网关，你会发布访问 `Demo: v2` 的机率显著提升，大概在 90%。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

## 金丝雀验证通过，全量发布

最后，你可以再次执行工作流来完成全量发布。

```shell
vela workflow resume canary-demo
```

多次访问网关，你会发布结果一直是 `Demo: v2`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

## 金丝雀验证失败，回滚发布

如果经过验证发现新版本有问题，你想中断发布，将应用回滚至上一个版本。可以如下操作：

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

在回滚完成后，再次访问网关，你会看到返回的结果一直是 `Demo: V1`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

任何在 `runningWorkflow` 过程中的回滚操作都会回滚到应用最后一次成功发布的版本，所以如果你已经成功部署了 `v1` 并且升级到 `v2`， 但是如果 `v2` 失败了但是你又继续更新到 `v3`。那么从 `v3` 回滚会自动到 `v1`，这是因为 `v2` 并不是成功发布的版本。
