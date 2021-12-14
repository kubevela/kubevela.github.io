---
title: VelaQL
---

## Introduction
velaQL(vela Query Language) is a resource query language for KubeVela, used to query application-level resource status.
​

KubeVela's Application encapsulates the underlying resources of the infra. Although it brings the convenience of shielding the underlying infrastructure to users, it also brings many inconveniences to platform developers: the monitoring of the resource status of Application creation can only rely on the CR object of Application. Moreover, the status information is simple and the real-time feedback is poor.
​

The purpose of velaQL is to help users and platform developers uncover the mystery of Application. Users can query application deployment status through velaQL, or use the extensible interface provided by velaQL to customize query resource information to improve the observability of Application.

## Usage

### Install

At present, if you want to use the query capabilities of velaQL, you need to install velaux and query the resource status with the help of apiserver. In the future, we will provide more interactive methods. Now you can install velaux with a simple command.

```shell
vela addon enable velaux
```

Assuming we started the apiserver at `http://127.0.0.1:8000`, you can use velaQL like:

```shell
http://127.0.0.1:8000/api/v1/query?velaql="write velaQL here"
```

Below we explain how to write velaQL. The basic syntax of velaQL is as follows:

```
view{parameter1=value1,parameter2=value2}
```

`view` represents a query view, which can be compared to the concept of a view in a database. 
The `view` in velaQL is a collection of resource queries on the `k8s`.

Filter conditions are placed in `{}` as the form of key-value pairs, currently the value type only supports: string, int, float, boolean.

### Query view

velaux has built-in 3 general query views. Below we will introduce the usage of these views:

#### component-pod-view  

`component-pod-view` indicates the status query of pods which created by a component.

**Parameter List**


| name | type | describe |
| --- | --- | --- |
| appName | string | application name |
| appNs | string | application namespace|
| name | string | component name |
| cluster | string | the cluster the pod is deployed to |
| clusterNs | string | the namespace the pod is deployed to |

Let's show how to use `component-pod-view` to query resources.

```shell
curl --location -g --request GET \
http://127.0.0.1:8000/api/v1/query?velaql=component-pod-view{appNs=default,appName=demo,name=demo}
```

![component-pod-view](/img/component-pod-view.png)

podList includes a list of pods created by the application.

#### pod-view 

`pod-view` queries the detailed status of a pod, including container status and pod-related events.

| name | type | describe |
| --- | --- | --- |
| name | string | pod name |
| namespace | string | pod namespace |
| cluster | string | the cluster the pod is deployed to |

Let's show how to use `pod-view` to query resources.

```shell
curl --location -g --request GET \
http://127.0.0.1:8000/api/v1/query?velaql=pod-view{name=demo-1-bf6799bb5-dpmk6,namespace=default}
```

![component-pod-view](/img/pod-view.png)

The query result contains the status information of the container and various events associated with the pod when it is created.

#### resource-view 

`resource-view` get a list of certain types of resources in the cluster。

| name | type | describe |
| --- | --- | --- |
| type | string | Resource type, optional types are "ns", "secret", "configMap", "pvc", "storageClass" |
| namespace | string | namespace |
| cluster | string | cluster |

Let's show how to use `resource-view` to query resources.

```shell
curl --location -g --request GET \
'http://127.0.0.1:8000/api/v1/query?velaql=resource-view{type=ns}'
```

![resource-view](/img/resource-view.png)

## Advanced view

In many scenarios, the built-in views cannot meet our needs, and the resources encapsulated under Application are not just the native resources of k8s. For many custom resources, users will have different query requirements. At this time, you need to write your own specific views to complete the query. This section will tell you how to write a custom view.

The current view in velaQL relies on configMap in k8s as a storage medium, You can refer to [https://github.com/oam-dev/kubevela/blob/master/test/e2e-apiserver-test/testdata/component-pod-view.yaml](https://github.com/oam-dev/kubevela/blob/master/test/e2e-apiserver-test/testdata/component-pod-view.yaml). The template in the configMap data field stores the core logic of the view, template is a query statement implemented in cue language.

Every time you use velaQL, the system will look for the configMap with the same name as the view under the vela-system namespace, and extract the template for query operations, so please ensure that your custom view is stored under vela-system.
​
The structure of a template is as follows:
```
import (
  "vela/ql"
)

// The parameter here corresponds to the parameter in velaQL
parameter: {
  appName:    string
  appNs:      string
  name?:      string
  cluster?:   string
  clusterNs?: string
}

// query statement implemented with cue
... 

// The query result of velaQL will return the content of the status field by default, 
// so please summarize the results you need to query under the status field
status: podList: {...}
```

We provide the `vela/ql` package to help you query resources. The following explains the cue operators that can be used:

### ListResourcesInApp

List all resources created by Application

#### Action Parameter

- app: fill in the basic information of the application that needs to be queried, including the application name and application namespace，The `filter` field is used to filter the resources created by the application. The options include the cluster where the resource is located, the cluster namespace, and the component to which it belongs
- list: after the operation is successful, this field will be filled. `list` is a list of all resources, the k8s description of the resource is stored in the object field.
- err: if an error occurs in the operation, the error message will be displayed as a string.

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

#### Usage

```
import (
  "vela/ql"
)

// The parameter here corresponds to the parameter in velaQL
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

// velaQL returns the value of the status field by default
status: resourcesList: resources.list
```

### CollectPods

List all pods created by the workload

#### Action Parameter

- value: definition of the workload resource you want to query
- cluster: cluster
- list: after the operation is successful, this field will be filled. `list` is a list of all pod resources
- err: if an error occurs in the operation, the error message will be displayed as a string.

```
#CollectPods: {
	value: {...}
	cluster: string
    list?:[... v1.Pod]
    err?: string
}
```

#### Usage
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

Get resource in Kubernetes cluster.

#### Action Parameter

- value: the resource metadata to be get. And after successful execution, value will be updated with resource definition in cluster.
- err:  if an error occurs, the err will contain the error message.

```
#Read: {
  value: {}
  err?: string
}
```

### Usage

```
// You can use configmap.value.data after this action.
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

List resources in the k8s cluster.

#### Action Parameter

- resource: the resource metadata to be get
- filter: namespace is used to select a namespace, and the matchingLabels field is used to filter labels
- err: if an error occurs, the err will contain the error message.

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

