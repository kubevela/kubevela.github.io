---
title: 环境差异化配置
---

本章节会介绍，如何使用环境差异化配置（env-binding）为应用提供差异化配置和环境调度策略。

## 背景

用户在日常开发中会经常将应用部署计划（Application）部署到不同的环境。例如，在开发环境中对应用部署计划进行调试，在生产环境中部署应用部署计划对外提供服务。
针对不同的环境，应用部署计划需要有差异化的配置。

## 如何使用

部署如下应用部署计划：

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: workflow-demo
  namespace: default
spec:
  components:
    - name: nginx-server
      type: webservice
      properties:
        image: nginx:1.21
        port: 80

  policies:
    - name: demo-policy
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
```

用户希望将应用部署计划 `workflow-demo` 部署到当前集群的测试环境的命名空间 `test` 中，并对组件 `nginx-server` 中的部分参数做修改以适配测试环境。
用户需要在应用部署计划的 `policies` 字段指定使用应用策略定义（PolicyDefinition） `env-binding` 。

同时，你需要给应用策略提供几个关键的参数，`patch` 和 `placement` 。

- `patch` 参数用来填写具体的差异化的配置信息，`patch` 中的 `components` 参数是一个组件（Component）数组，和应用部署计划中的组件数组类型一致，
  你需要通过组件名称（name）和 类型（type）指定想要修改参数的组件，在 `properties` 中填写配置后的参数。


- `placement` 参数用来指定将应用部署计划部署到目标环境中的哪一个集群或者命名空间中。`placement` 有 2 种选择器：`clusterSelector` 和 `namespaceSelector`，
   分别面向集群和命名空间的选择。

接下来我们创建示例中的应用部署计划。

> 创建应用部署计划之前需要当前集群中有名为 `test` 的命名空间，你可以通过执行 `kubectl create ns test` 来创建。

```shell
kubectl apply -f app.yaml
```

应用部署计划创建之后，在 `test` 命名空间下会创建一个配置化的应用部署计划。

```shell
$ kubectl get app -n test
NAME                       COMPONENT      TYPE         PHASE     HEALTHY   STATUS   AGE
patch-test-workflow-demo   nginx-server   webservice   running   true               22s
```

如果你想使用 `env-binding` 在多集群环境下创建应用部署计划，请参考实践案例中的 **[多集群部署](../../case-studies/workflow-with-ocm)** 。

## 附录：属性列表

环境差异化配置应用策略的所有配置项 

名称 | 描述 | 类型 | 是否必须 | 默认值
:---------- | :----------- | :----------- | :----------- | :-----------
clusterManagementEngine|集群管理方案，可选值 single-cluster（单集群部署）、ocm|string|否|当该字段为空时，默认认为用户使用 ocm 多集群管理方案
envs|环境差异化配置| env 数组|是|无

env 的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------ 
name|环境配置名称|string|是|无
patch|对应用部署计划进行差异化配置|patch 结构体|是|无
placement|资源调度策略，选择将配置化的资源部署到指定的集群上| placement 结构体|是|无

patch 的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------ 
components|对应用部署计划中的组件差异化配置| component 数组|是|无

placement 的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------ 
clusterSelector|集群选择器，通过标签或者名称筛选集群| clusterSelector 结构体|是|无
namespaceSelector|命名空间选择器，通过标签或者名称筛选命名空间| namespaceSelector 结构体|是|无

clusterSelector 的属性 （该属性只在 engine 为 ocm 时候有效）

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------
labels |集群标签| map[string]string |否|无
name |集群名称| string |否|无

namespaceSelector 的属性 （该属性只在 engine 为 single-cluster 时候有效）

名称 | 描述 | 类型 | 是否必须 | 默认值
:----------- | :------------ | :------------ | :------------ | :------------
labels |命名空间的标签| map[string]string |否|无
name |命名空间的名称| string |否|无