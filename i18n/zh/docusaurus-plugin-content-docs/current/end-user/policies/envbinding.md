---
title: 多环境部署
---

本章节会介绍，如何使用环境差异化配置（env-binding）为应用提供差异化配置和环境调度策略。

## 背景

在日常开发中会经常将应用部署计划（Application）部署到不同的环境。例如，在开发环境中对应用部署计划进行调试，在生产环境中部署应用部署计划对外提供服务。针对不同的环境，应用部署计划需要有差异化的配置。

## 如何使用

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: policy-demo
  namespace: default
spec:
  components:
    - name: nginx-server
      type: webservice
      properties:
        image: nginx:1.21
        port: 80

  policies:
    - name: my-policy
      type: env-binding
      properties:
        clusterManagementEngine: single-cluster
        envs:
          - name: test
            patch:
              components:
                - name: nginx-server
                  type: webservice
                  properties:
                    image: nginx:1.20
                    port: 80
            placement:
              namespaceSelector:
                name: test
  workflow:
    steps:
      - name: deploy-test-env
        type: multi-env
        properties:
          # 指定 policy 名称
          policy: my-policy
          # 指定 policy 中的 env 名称
          env: test

```

> 创建应用部署计划之前需要当前集群中有名为 `test` 的命名空间，你可以通过执行 `kubectl create ns test` 来创建。

```shell
kubectl apply -f app.yaml
```

应用部署计划创建之后，在 `test` 命名空间下会创建一个配置化的应用部署计划。

```shell
$ kubectl get app -n test
NAME          COMPONENT      TYPE         PHASE     HEALTHY   STATUS   AGE
policy-demo   nginx-server   webservice   running   true               65s
```

如果你想使用 `env-binding` 在多集群环境下创建应用部署计划，请参考 **[应用多集群部署](../multi-app-env-cluster)** 。

## 附录：属性列表

环境差异化配置应用策略的所有配置项 

名称 | 描述 | 类型 | 是否必须 | 默认值
:---------- | :----------- | :----------- | :----------- | :-----------
clusterManagementEngine|集群管理方案，可选值 single-cluster（单集群部署）、ocm|string|否|当该字段为空时，默认使用 ocm 多集群管理方案
envs|环境配置| env 数组|是|无

env 的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------ 
name|环境名称|string|是|无
patch|对应用部署计划中的组件差异化配置|patch 结构体|是|无
placement|资源调度策略，选择将配置化的资源部署到指定的集群或命名空间上| placement 结构体|是|无

patch 的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------ 
components|需要差异化配置的组件| component 数组|是|无

placement 的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------ 
clusterSelector|集群选择器，通过标签或者名称筛选集群，该属性只在 clusterManagementEngine 为 ocm 时候有效| clusterSelector 结构体|是|无
namespaceSelector|命名空间选择器，通过标签或者名称筛选命名空间，该属性只在 clusterManagementEngine 为 single-cluster 时候有效| namespaceSelector 结构体|是|无

clusterSelector 的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------
labels |集群标签| map[string]string |否|无
name |集群名称| string |否|无

namespaceSelector 的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------
labels |命名空间的标签| map[string]string |否|无
name |命名空间的名称| string |否|无