---
title: VelaQL
---

## 简介
velaQL(全称vela Query Language)，是面向 KubeVela 的资源查询语言，用于查询应用级别的资源状态。	
​

KubeVela 的 Application 对象对底层资源进行封装，虽然给用户带来了屏蔽了底层基础架构的便捷，但是也给平台开发者带来了诸多不便: 对Application创建资源状态的监控，只能依赖Application的状态透出，但状态信息简略、状态实时反馈性差，
Application 的抽象功能对用户屏蔽了实际创建出的资源，当 Application 的状态和实际部署资源状态出现偏差时，用户也很难排查出问题。
​

velaQL的目的是帮用户和平台开发者揭开 Application 的神秘面纱，用户可以通过 velaQL 查询应用部署状态，或者利用 velaQL 提供的可扩展接口自定义查询资源信息，提升Application的可观测性，能够在应用出现问题时及时做出响应。

## 使用

### 安装

目前想要使用 velaQL 的查询能力，需要安装 velaux，借助 apiserver 的能力进行状态查询，未来我们会提供更多的交互方式。现在只需一个简单的指令就能安装 velaux。

```shell
vela addon enable velaux
```

确保 velaux 安装成功之后，可以通过访问 apiserver 暴露出的服务接口进行状态查询。假设我们在 `http://127.0.0.1:8000` 启动了 apiserver 服务。通过下面的方式使用 velaQL

```shell
http://127.0.0.1:8000/api/v1/query?velaql=此处填写查询语句
```

下面我们讲解如何编写 velaQL，从命名上可以看出 velaQL 对标的是 PromQL ，我们期望能够成为应用监控领域的 Prometheus。
在查询语法上，我们也和 PromQL 对齐，提供了和 PromQL 类似的查询语句，方便用户简单快捷的查询应用状态。velaQL的基本语法如下：

```
view{parameter1=value1,parameter2=value2}
```

其中 `view` 代表查询视图，可以类比于数据库中视图的概念，velaQL 中的 `view` 是一个对 `k8s`这个“数据库”进行资源状态查询的集合。
大括号内是一组kv键值对的集合，使用逗号隔开，代表了进行查询时的过滤条件。目前 value 类型只支持：字符串、整数类型、浮点数、布尔类型。

### 查询视图

velaux 内置了3种通用的查询视图，方便用户查询，下面我们分别介绍这几种视图的使用方法：

#### component-pod-view  

`component-pod-view` 表示对应用下某个组件创建出的 pod 的状态查询。

| 参数名 | 类型 | 描述 |
| --- | --- | --- |
| appName | string | 应用名称 |
| appNs | string | 应用所在的命名空间 |
| name | string | 组件名称 |
| cluster | string | 组件创建出的资源所在的集群 |
| clusterNs | string | 组件创建出的资源所在的命名空间 |

我们演示一下使用 `component-pod-view` 查询资源后的结果。

```shell
curl --location -g --request GET \
http://127.0.0.1:8000/api/v1/query?velaql=component-pod-view{appNs=default,appName=demo,name=demo}
```

![component-pod-view 查询结果](/img/component-pod-view.png)

查询结果返回的 podList 是应用创建出的 pod 列表。

#### pod-view 

`pod-view` 对一个 pod 详细状态的查询，包括容器状态以及 pod 相应的事件。

| 参数名 | 类型 | 描述 |
| --- | --- | --- |
| name | string | pod名称 |
| namespace | string | pod所在的命名空间 |
| cluster | string | pod所在的集群 |

我们演示使用 `pod-view` 查询资源后的结果。

```shell
curl --location -g --request GET \
http://127.0.0.1:8000/api/v1/query?velaql=pod-view{name=demo-1-bf6799bb5-dpmk6,namespace=default}
```

![component-pod-view 查询结果](/img/pod-view.png)

查询结果中包含了pod中容器的状态信息，以及pod在创建和执行时产生的各种事件。

#### resource-view 

`resource-view` 获取集群中某类资源的列表。

| 参数名 | 类型 | 描述 |
| --- | --- | --- |
| type | string | 资源类型，可选类型有 "ns"、"secret"、"configMap"、"pvc"、"storageClass" |
| namespace | string | 资源所在的命名空间 |
| cluster | string | 资源所在的集群 |

我们演示一下使用`resource-view`查询资源后的结果。

```shell
curl --location -g --request GET \
'http://127.0.0.1:8000/api/v1/query?velaql=resource-view{type=ns}'
```

![resource-view 查询结果](/img/resource-view.png)

## 视图进阶

在很多场景下，内置的视图不能满足我们的需求，Application 下封装的资源也都不仅仅是 k8s 的原生资源。针对很多自定义的资源，用户会有不同的查询需求，这时候你需要自己编写特定的视图来完成查询。本节就来告诉大家如何编写一个自定义的视图。

目前velaQL中的视图依赖 k8s 中的 configMap 作为存储介质，你可以参考：[https://github.com/kubevela/kubevela/blob/master/test/e2e-apiserver-test/testdata/component-pod-view.yaml](https://github.com/kubevela/kubevela/blob/master/test/e2e-apiserver-test/testdata/component-pod-view.yaml)。configMap data 字段中的 template 存储着视图的核心逻辑，template 是一段 cue 语言描述的查询语句。

每次使用 velaQL 时，系统都会从 vela-system 命名空间下查找和视图同名的 configMap 提取出 template 来进行查询操作，所以请保证你的自定义视图存储在 vela-system 下。
​
一个 template 的整体结构如下：
```
import (
  "vela/ql"
)

// parameter 和 velaQL 中的参数一一对应
parameter: {
  appName:    string
  appNs:      string
  name?:      string
  cluster?:   string
  clusterNs?: string
}

... 
用 cue 来实现的查询语句

// velaQL 的查询结果会默认返回 status 字段的内容，所以请把需要查询的结果汇总在 status 字段下 
status: podList: {...}
```

我们提供了 `vela/ql` 包帮助你查询资源。下面介绍可使用的 cue 操作符:

### ListResourcesInApp

列出Application创建的所有资源

#### 操作参数

- app: 填写需要查询的应用的基本信息，包括应用名称，应用命名空间，app 下的 filter 字段用于筛选应用创建出的资源，可筛选项包括资源所在的集群、集群命名空间以及所在组件
- list: 操作成功执行后，会获取到查询结果，list 是一个由所有资源组成的列表，资源的 k8s 描述存储在 object 字段
- err: 如果读取操作发生错误，这里会以字符串的方式指示错误信息

```
#ListResourcesInApp: {
	app: {
		name:      string
		namespace: string
		filter?: {
			cluster?:          string
			clusterNamespace?: string
			components?: [...string]
		}
	}
	list?: [...{
		cluster:   string
		component: string
		revision:  string
		object: {...}
	}]
  err?: string
}
```

#### 用法示例

```
import (
  "vela/ql"
)

// parameter 和velaQL中的参数一一对应
parameter: {
  appName:    string
  appNs:      string
  name?:      string
  cluster?:   string
  clusterNs?: string
}

resources: ql.#ListResourcesInApp & {
  app: {
    name:      parameter.appName
    namespace: parameter.appNs
    filter: {
      if parameter.cluster != _|_ {
        cluster: parameter.cluster
      }
      if parameter.clusterNs != _|_ {
        clusterNamespace: parameter.clusterNs
      }
      if parameter.name != _|_ {
        components: [parameter.name]
      }
    }
  }
}

// velaQL 默认返回 status 字段的值
status: resourcesList: resources.list
```

### CollectPods

列出某一工作负载下创建的所有 pods

#### 操作参数

- value: 想要查询的工作负载资源的定义
- cluster: 工作负载所在的集群
- list: 操作成功执行后，会获取到查询结果，list是一个由所有pod资源组成的列表
- err: 如果读取操作发生错误，这里会以字符串的方式指示错误信息。

```
#CollectPods: {
	value: {...}
	cluster: string
    list?:[... v1.Pod]
    err?: string
}
```

#### 用法示例
```
import (
  "vela/ql"
)

parameter: {
    name: string
}

resources: ql.#CollectPods & {
  value: {
    kind: "Deployment"
    apiVersion: "apps/v1"
    metadata: name: parameter.name
  }
}

status: pods: resources.list
```

### Read

读取 k8s 集群中的资源。

#### 操作参数

- value: 需要用户描述读取资源的元数据，比如 kind、name 等，操作完成后，集群中资源的数据会被填充到 value 上。
- err: 如果读取操作发生错误，这里会以字符串的方式指示错误信息。

```
#Read: {
  value: {}
  err?: string
}
```

#### 用法示例

```
// 操作完成后，你可以通过 configmap.value.data 使用 configmap 里面的数据
configmap: ql.#Read & {
   value: {
      kind: "ConfigMap"
      apiVersion: "v1"
      metadata: {
        name: "configmap-name"
        namespace: "configmap-ns"
      }
   }
}
```

### List

列出 k8s 集群中的某类资源。

#### 操作参数

- resource: 需要用户描述读取资源的元数据，apiVersion、Kind 
- filter: namespace用于选择命名空间，matchingLabels 字段填写筛选标签
- err: 如果读取操作发生错误，这里会以字符串的方式指示错误信息。

```
#List: {
	cluster:   *"" | string
	resource: {
		apiVersion: string
		kind:       string
	}
	filter?: {
		namespace?: *"" | string
		matchingLabels?: {...}
	}
	list?: {...}
    err?: string
}
```

