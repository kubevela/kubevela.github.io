---
title: 多环境部署
---

本章节会介绍，如何使用环境差异化配置（env-binding）为应用提供差异化配置和环境调度策略。

## 背景

在日常开发中会经常将应用部署计划（Application）部署到不同的环境。例如，在开发环境中对应用部署计划进行调试，在生产环境中部署应用部署计划对外提供服务。针对不同的环境，应用部署计划需要有差异化的配置。

## 如何使用

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app
  namespace: test
spec:
  components:
    - name: hello-world-server
      type: webservice
      properties:
        image: crccheck/hello-world 
        port: 8000
      traits:
        - type: scaler
          properties:
            replicas: 1
    - name: data-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000000'
  policies:
    - name: example-multi-env-policy
      type: env-binding
      properties:
        envs:
          - name: staging
            placement: # 选择要部署的目标集群
              clusterSelector:
                name: cluster-staging
            selector: # 选择要使用的组件
              components:
                - hello-world-server

          - name: prod
            placement:
              clusterSelector:
                name: cluster-prod
            patch: # 差异化配置该环境中的组件
              components:
                - name: hello-world-server
                  type: webservice
                  traits:
                    - type: scaler
                      properties:
                        replicas: 3

  workflow:
    steps:
      # 部署 预发 环境
      - name: deploy-staging
        type: deploy2env
        properties:
          policy: example-multi-env-policy
          env: staging
      
      # 人工确认
      - name: manual-approval 
        type: suspend

      # 部署 生产 环境
      - name: deploy-prod
        type: deploy2env
        properties:
          policy: example-multi-env-policy
          env: prod
```

> 创建应用部署计划之前需要当前集群、目标集群中均有名为 `test` 的命名空间，你可以通过执行 `kubectl create ns test` 来创建。

```shell
kubectl apply -f app.yaml
```

应用部署计划创建之后，在 `test` 命名空间下会创建一个配置化的应用部署计划。同时在子集群的 `test` 命名空间中会出现相应的资源。

```shell
$ kubectl get app -n test
NAME          COMPONENT            TYPE         PHASE     HEALTHY   STATUS   AGE
example-app   hello-world-server   webservice   running                      25s
```

如果你想使用 `env-binding` 在多集群环境下创建应用部署计划，请参考 **[应用多集群部署](../../case-studies/multi-cluster)** 。

## 参数说明

环境差异化配置应用策略的所有配置项 

| 名称                    | 描述                                                   | 类型     | 是否必须 | 默认值                                      |
| :---------------------- | :----------------------------------------------------- | :------- | :------- | :------------------------------------------ |
| envs                    | 环境配置                                               | env 数组 | 是       | 无                                          |

env 的属性

| 名称      | 描述                                                         | 类型             | 是否必须 | 默认值 |
| :-------- | :----------------------------------------------------------- | :--------------- | :------- | :----- |
| name      | 环境名称                                                     | string           | 是       | 无     |
| patch     | 对应用部署计划中的组件差异化配置                             | patch 结构体     | 是       | 无     |
| placement | 资源调度策略，选择将配置化的资源部署到指定的集群或命名空间上 | placement 结构体 | 是       | 无     |
| selector  | 为应用部署计划选择需要使用的组件，默认为空代表使用所有组件 | selector 结构体 | 否       | 无     |

patch 的属性

| 名称       | 描述                 | 类型           | 是否必须 | 默认值 |
| :--------- | :------------------- | :------------- | :------- | :----- |
| components | 需要差异化配置的组件 | component 数组 | 是       | 无     |

placement 的属性

| 名称              | 描述                                                                                                        | 类型                     | 是否必须 | 默认值 |
| :---------------- | :---------------------------------------------------------------------------------------------------------- | :----------------------- | :------- | :----- |
| clusterSelector   | 集群选择器，通过名称筛选集群                    | clusterSelector 结构体   | 是       | 无     |

selector 的属性

| 名称       | 描述                 | 类型           | 是否必须 | 默认值 |
| :--------- | :------------------- | :------------- | :------- | :----- |
| components | 需要使用的组件名称列表 | string 数组 | 否       | 无     |

clusterSelector 的属性

| 名称   | 描述     | 类型              | 是否必须 | 默认值 |
| :----- | :------- | :---------------- | :------- | :----- |
| name   | 集群名称 | string            | 否       | 无     |
