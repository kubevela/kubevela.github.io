---
title: Kruise-rollout
---

Kruise Rollout对原生Deployment、Kruise CloneSet提供渐进式交付的能力，例如：金丝雀发布、蓝绿发布、A/B Testing等，更多详情请参考：[Kruise Rollout](https://github.com/openkruise/rollouts/blob/master/docs/getting_started/introduction.md)。

本文主要介绍如何使用Kruise Rollout实现金丝雀发布。

## 准备工作

1. 安装Kruise Rollout
```shell
% vela addon enable kruise-rollout
enable addon by local dir: addons/kruise-rollout
Addon: kruise-rollout enabled Successfully.
```

2. 请保证你的集群有一种  [ingress controllers](https://kubernetes.github.io/ingress-nginx/deploy/) 正在运行。
如果没有你可以通过启用  [nginx-ingress-controller](./nginx-ingress-controller) 安装一个。

```shell
vela addon enable ingress-controller
```

请参考[文档](./nginx-ingress-controller) 获取网关的访问地址。

## 首次部署

部署应用:

```shell
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
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          trafficRoutings:
            - type: nginx
EOF
```

检查应用状态，发现应用已经出于 `Running` 状态。


```shell
$ vela status canary-demo
About:

  Name:         canary-demo                  
  Namespace:    default                      
  Created at:   2022-06-09 16:43:10 +0800 CST
  Status:       running                      

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:x6rnat7iby
    name:canary-demo
    type:apply-component
    phase:succeeded 
    message:

Services:

  - Name: canary-demo  
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:5/5
    Traits:
      ✅ scaler      ✅ gateway: No loadBalancer found, visiting by using 'vela port-forward canary-demo'
      ✅ kruise-rollout: rollout is healthy

```

用上面定义的路径和 Host 访问网关:

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
``` 

## 金丝雀发布
修改镜像标签 v1 -> v2：

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
          trafficRoutings:
          - type: nginx
EOF
```

请注意这里的 kurise-rollout 运维特征里升级策略的配置，这里的含义是先金丝雀发布一批，该批次包含了20%的实例个数，并将20%的流量导入到新版本实例中。
检查 app 的状态：
```shell
$ vela status canary-demo
About:

  Name:         canary-demo                  
  Namespace:    default                      
  Created at:   2022-06-09 16:43:10 +0800 CST
  Status:       runningWorkflow              

Workflow:

  mode: DAG
  finished: false
  Suspend: false
  Terminated: false
  Steps
  - id:8adxa11wku
    name:canary-demo
    type:apply-component
    phase:running 
    message:wait healthy

Services:

  - Name: canary-demo  
    Cluster: local  Namespace: default
    Type: webservice
    Unhealthy Ready:5/5
    Traits:
      ✅ scaler      ✅ gateway: No loadBalancer found, visiting by using 'vela port-forward canary-demo'
      ❌ kruise-rollout: Rollout is in step(1/1), and you need manually confirm to enter the next step

```

application 的状态处于 `runningWorkflow` 意味着发布尚未完成。
再次访问网关，你会发现有20%的机率看到新版本的结果 `Demo: v2`:

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

## 金丝雀验证OK，全量发布

用户通过业务的相关指标，如：日志、Metrics等其它手段，验证金丝雀版本OK之后，继续执行工作流发布继续发布。


```shell
vela workflow resume canary-demo
```

## 金丝雀验证失败，回滚

如果经过验证发现新版本有问题，你想中断发布，将应用回滚至上一个版本。可以如下操作：

```shell
vela workflow rollback canary-demo
```

回滚完成之后，访问网关，你会发现结果一直都是 `Demo: V1`：

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

## Helm 应用的金丝雀发布

### 首次部署：


```shell
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
        workloadType:
           apiVersion: apps/v1
           kind: Deployment
        canary:
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          trafficRoutings:
          - type: nginx
EOF
```

应用所使用的 chart 中包含了一个使用了 `barnett/canarydemo:v1` 镜像的 Deployment。

另外，请注意你需要天蝎 kruise-rollout trait 中 `workloadType` 的字段，因为一个 chart 中可能包含各种资源，你需要指出发布资源的类型。

部署成功之后，访问网关：
```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

### 金丝雀发布

通过下面的步骤将 chart 的版本从 `1.0.0` 更新到 `2.0.0`：


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
        workloadType:
           apiVersion: apps/v1
           kind: Deployment
        canary:
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          trafficRoutings:
          - type: nginx
EOF
```

这两个版本直接的唯一差别是，新版本的镜像使用的是 v2 版本的 `barnett/canarydemo:v2`，再次访问网关，你会发现有20%的机率看到新版本的结果 `Demo: v2`:

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

其他 `继续发布/回滚` 等操作和上面的 webservice 的类型组件完全一致。