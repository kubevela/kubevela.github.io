---
title: 金丝雀发布
---

本文将介绍实现金丝雀发布。

## 准备工作

1. 通过如下命令启用 [`kruise-rollout`](../../reference/addons/kruise-rollout.md) 插件，金丝雀发布依赖于 [rollouts from OpenKruise](https://github.com/openkruise/rollouts).
   
   ```shell
   vela addon enable kruise-rollout
   ```

2. 请确保在集群中至少安装一种 [ingress controllers](https://kubernetes.github.io/ingress-nginx/deploy/)。
   如果没有你也可以通过如下命令启用 [`ingress-nginx`](../../reference/addons/nginx-ingress-controller.md) 安装一个：
   
   ```shell
   vela addon enable ingress-nginx
   ```
   
   参考 [the addon doc](../../reference/addons/nginx-ingress-controller.md) 获取网关的访问地址。

3. 一些指令例如 `rollback` 依赖 vela-cli 版本 `>=1.5.0-alpha.1`，请升级cli到最新版本，不用升级Controller。

## 首次部署

当你希望在每次升级策略配置时都使用金丝雀发布，**必须**在你的组件中添加 `kruise-rollout` 特性。 
在 day-2 金丝雀发布中组件必须已经存在此特性。部署应用：

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
    type: webservice
    properties:
      image: barnett/canarydemo:v1
      ports:
      - port: 8090
    traits:
    - type: scaler
      properties:
        replicas: 5
    - type: gateway
      properties:
        domain: canary-demo.com
        http:
          "/version": 8090
    - type: kruise-rollout
      properties:
        canary:
          steps:
           # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          - weight: 20
          # The second batch of Canary releases 90% Pods, and 90% traffic imported to the new version.
          - weight: 90
          trafficRoutings:
            - type: ingress
EOF
```

下面解释了在使用了 `kruise-rollout` 运维特征之后，下次升级应用时，是如何进行金丝雀发布的，整个发布过程会分成3步：

1. 当升级到第一个批次时，会产生 `20%` 的实例数量。在我们的示例中， 我们一共设置了5个实例，它会保留所有的老的版本并创建 `5 * 20% = 1` 个金丝雀实例版本，并且导入了 `20%` 的流量。在所有都准备好后，它会等待手工批准。
   - 实例数量和导入流量的百分比默认是一致的，你可以根据 [文档](../../reference/addons/kruise-rollout.md) 配置比例。
2. 在手工批准后，会进入到第二个阶段，它会创建 `5 * 90% = 4.5` 实际上是 `5` 个实例的新版本，并且导入 `90%` 的流量。这样一来，目前系统一共有 `10` 个实例，它需要等待下一步的手工批准。
3. 在批准后，它就会利用滚动更新的机制来更新实例，在实例完成升级后，所有的流量路由都指向新的版本的实例，金丝雀发布也会被销毁。

继续示例，我们的首次部署过程和一般的部署并没有太大区别，你可以通过如下命令来检查应用的状态来确保可以进行下一步操作。

```shell
$ vela status canary-demo
About:

  Name:         canary-demo                  
  Namespace:    default                      
  Created at:   2022-06-09 16:43:10 +0800 CST
  Status:       running                      

...snip...

Services:

  - Name: canary-demo  
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:5/5
    Traits:
      ✅ scaler      ✅ gateway: No loadBalancer found, visiting by using 'vela port-forward canary-demo'
      ✅ kruise-rollout: rollout is healthy
```

如果你已经启用了 [velaux](../../reference/addons/velaux.md) 插件，你可以通过拓扑图来观察到所有的 `v1` pods 都处于 ready状态。

![image](../../resources/kruise-rollout-v1.jpg)

用上面定义的路径和 Host 访问网关：

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

主机名 `canary-demo.com` 需要和应用 `gateway` 中的特性保持一致，你可以配置 `/etc/hosts` 来通过Host地址访问网关。

## Day-2 金丝雀发布

让我们把组件的镜像版本从 `v1` 更新到 `v2`，如下所示：

```yaml
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
    type: webservice
    properties:
      image: barnett/canarydemo:v2
      ports:
      - port: 8090
    traits:
    - type: scaler
      properties:
        replicas: 5
    - type: gateway
      properties:
        domain: canary-demo.com
        http:
          "/version": 8090
    - type: kruise-rollout
      properties:
        canary:
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          - weight: 90
          trafficRoutings:
          - type: ingress
EOF
```

它会创建一个金丝雀发布并且等待手工批准，你可以检查应用的状态：

```shell
$ vela status canary-demo
About:

  Name:         canary-demo                  
  Namespace:    default                      
  Created at:   2022-06-09 16:43:10 +0800 CST
  Status:       runningWorkflow              

...snip...

Services:

  - Name: canary-demo  
    Cluster: local  Namespace: default
    Type: webservice
    Unhealthy Ready:5/5
    Traits:
      ✅ scaler      ✅ gateway: No loadBalancer found, visiting by using 'vela port-forward canary-demo'
      ❌ kruise-rollout: Rollout is in step(1/1), and you need manually confirm to enter the next step
```

应用的状态是 `runningWorkflow` 这意味着发布还没有完成。

再次查看拓扑图，你会看到 `kruise-rollout` 特性创建了一个 `v2` 实例，并且这个实例会导入流量。同时 `v1` 版本的实例还在运行中并且不会导入任何流量。

![image](../../resources/kruise-rollout-v2.jpg)

再次访问网关，你会发现访问结果中有 `20%` 的机率是 `Demo: v2`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

## 继续金丝雀发布

用户可以通过检查业务的相关指标，如：日志、Metrics等其它手段，验证金丝雀的版本访问成功后，你可以继续执行工作流，让发布继续往下进行。

```shell
vela workflow resume canary-demo
```

在多次重新访问网关后，你会发现机率大幅提升，有 `90%` 的结果是 `Demo: v2`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

## 金丝雀验证通过，全量发布

最后，你可以继续执行工作流全量发布。

```shell
vela workflow resume canary-demo
```

并多次访问网关，你会发布结果总是 `Demo: v2`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

## 金丝雀验证失败，回滚

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

再次访问网关，你会看到结果一直是 `Demo: V1`。

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

需要注意的是，任何在应用处于 `runningWorkflow` 状态时的回滚操作，都会回滚到应用最后一次成功发布的版本，所以如果你已经成功部署了 `v1` 并且升级到 `v2`， 但是如果 `v2` 失败了但是你又继续更新到 `v3`。那么从 `v3` 回滚会自动到 `v1`，这是因为 `v2` 并不是成功发布的版本。
