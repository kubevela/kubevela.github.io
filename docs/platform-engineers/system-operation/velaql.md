---
title: Query Resources
---

## Introduction

VelaQL(Vela Query Language) is a resource query language for KubeVela, used to query status of any extended resources in application-level.

KubeVela's Application encapsulates the underlying resources from the infrastructure. It brings the infrastructure agonistic experience to app developers but also makes challenges for platform builders to maintain. For example, the monitoring of the resource status created by KubeVela Application can be hard. Moreover, the status information within Application is not detailed enough for trouble shooting and the real-time feedback is poor.

The purpose of VelaQL is to help users and platform builders to uncover the mysterious of the Application. Users can query application deployment status through VelaQL, or use the extensible interface provided by VelaQL to customize query information to improve the observability of one Application.

## Usage

### Query from CLI

KubeVela command has supported a `vela ql` command to query resources.

You can specify a query file in cue like below:

```ql.cue
import (
	"vela/ql"
)
configmap: ql.#Read & {
	value: {
		kind:       "ConfigMap"
		apiVersion: "v1"
		metadata: {
			name:      "vela-addon-registry"
			namespace: "vela-system"
		}
	}
}
status: configmap.value.data["registries"]
```

Then use the following command to query:

```console
$ vela ql -f ql.cue
{ \"KubeVela\":{ \"name\": \"KubeVela\", \"helm\": { \"url\": \"https://addons.kubevela.net\" } } }
```

It will print the value in the field `status` which is a keyword of VelaQL.

There're some [other `op` CUE operations](#built-in-velaql-operations) you can use in VelaQL.

### Create VelaQL View for Query

You can apply the view to server for re-use, either use `vela ql apply` command (recommended, requires CLI v1.5 or later) or wrap it in ConfigMap.

<details>
<summary>Instructions on using ConfigMaps</summary>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: query-config-map
  namespace: vela-system
data:
  template: |
    import (
      "vela/ql"
    )

    parameter: {
      name:      string
      namespace: string
      key:       string
    }

    configmap: ql.#Read & {
      value: {
        kind:       "ConfigMap"
        apiVersion: "v1"
        metadata: {
          name:      parameter.name
          namespace: parameter.namespace
        }
      }
    }
    status: configmap.value.data["\(parameter.key)"]
```

There're two keywords:

* The `parameter`, indicates which parameters can use in the query.
* The `status`, indicates which fields of resources will be exported.

Apply the yaml into Kubernetes:

```
vela kube apply -f query-configmap.yaml
```

> `vela kube apply` is the same with `kubectl apply` in case you don't use `kubectl` command line.

</details>


Create a file named `my-view.cue` with:

```yaml
import (
  "vela/ql"
)

parameter: {
  name:      string
  namespace: string
  key:       string
}

configmap: ql.#Read & {
  value: {
    kind:       "ConfigMap"
    apiVersion: "v1"
    metadata: {
      name:      parameter.name
      namespace: parameter.namespace
    }
  }
}
status: configmap.value.data["\(parameter.key)"]
```

There're two keywords:

* The `parameter`, indicates which parameters can use in the query.
* The `status`, indicates which fields of resources will be exported.

Create the view in Kubernetes for later use:

```shell
$ vela ql apply -f my-view.cue
```

A view named `my-view` will be created. You can use it later.

### Query from VelaQL View

Then everyone who has access to the cluster can query by re-use the view, the basic syntax is:

```
<view-name>{parameter1=value1,parameter2=value2}
```

In our example, you can query in the following command:

```
vela ql -q "query-config-map{name=vela-addon-registry,namespace=vela-system,key=registries}"
```

The result is the same.


### Query from VelaUX API

VelaUX has use VelaQL for all it's resources query. You can also integrate in this way, just install VelaUX and query the resource status with the help of its api server. You can install VelaUX addon by:

```shell
vela addon enable velaux
```

You can refer to the [velaux](../../reference/addons/velaux) doc to learn how to expose endpoint.
Assuming we started the apiserver at `http://127.0.0.1:8000`, you can use VelaQL like:

```shell
http://127.0.0.1:8000/api/v1/query?velaql="write VelaQL here"
```

The basic syntax is the same with command line.

```
view{parameter1=value1,parameter2=value2}
```

`view` represents a query view, which can be compared to the concept of a view in a database. 
The `view` in VelaQL is a collection of ConfigMap resources in the Kubernetes system, the name of the ConfigMap is also the name of the view.

Filter conditions are placed in `{}` as the form of key-value pairs, currently the value type only supports: string, int, float, boolean.

You can refer to [velaux addon repo](https://github.com/kubevela/catalog/tree/master/addons/velaux) for more view examples.

## Under the hood

In many scenarios, the built-in views cannot meet our needs, and the resources encapsulated under Application are not just the native resources of k8s. For many custom resources, users will have different query requirements. At this time, you need to write your own specific views to complete the query. This section will tell you how to write a custom view.

The current view in VelaQL relies on configMap in k8s as a storage medium, You can refer to [https://github.com/kubevela/kubevela/blob/master/test/e2e-apiserver-test/testdata/component-pod-view.yaml](https://github.com/kubevela/kubevela/blob/master/test/e2e-apiserver-test/testdata/component-pod-view.yaml). The template in the configMap data field stores the core logic of the view, template is a query statement implemented in cue language.

Every time you use VelaQL, the system will look for the configMap with the same name as the view under the vela-system namespace, and extract the template for query operations, so please ensure that your custom view is stored under vela-system.
​
The structure of a template is as follows:
```
import (
  "vela/ql"
)

// The parameter here corresponds to the parameter in VelaQL
parameter: {
  appName:    string
  appNs:      string
  name?:      string
  cluster?:   string
  clusterNs?: string
}

// query statement implemented with cue
... 

// The query result of VelaQL will return the content of the status field by default, 
// so please summarize the results you need to query under the status field
status: podList: {...}
```

## Built-in VelaQL Operations

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

// The parameter here corresponds to the parameter in VelaQL
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

// VelaQL returns the value of the status field by default
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

Happy enjoy the extensibility of VelaQL for query resources in Kubernetes with CUE.