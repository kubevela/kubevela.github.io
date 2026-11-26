---
title: Query Resources
---

An Application hides the resources it creates. VelaQL (Vela Query Language) queries them: the pods a component runs, the endpoints it exposes, any object a definition created.

A query is a CUE file that uses the `vela/ql` package to read from the cluster and puts what it wants to return in the `status` field. You can run a query file once, or store it in the cluster as a **view**, a named query with parameters that anyone can run later.

## Run a query once

Write the query in a file, `ql.cue`:

```cue
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

Run it:

```console
$ vela ql -f ql.cue
{ \"KubeVela\":{ \"name\": \"KubeVela\", \"helm\": { \"url\": \"https://kubevela.github.io/catalog/official\" } } }
```

VelaQL prints the value of the `status` field. The [built-in operations](#built-in-velaql-operations) below list everything else the `vela/ql` package can do.

## Write a view

A view is a query with a `parameter` block, so one view serves many queries. It has two keywords:

* `parameter`: the parameters a caller passes in.
* `status`: what the query returns.

Create a file named `configmap-key.cue` that returns one key of any ConfigMap:

```cue
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

For a bigger example, the views VelaUX ships with are in the [velaux addon](https://github.com/kubevela/catalog/tree/master/addons/velaux).

## Apply the view

A view is stored as a ConfigMap in the `vela-system` namespace, named after the view, with the query in its `template` key. VelaQL only looks for views in `vela-system`, so a view anywhere else is never found.

Apply it with `vela ql apply`. The view name is taken from the file name, so this creates the view `configmap-key`:

```shell
vela ql apply -f configmap-key.cue
```

Pass a name to choose a different one: `vela ql apply my-name -f configmap-key.cue`. Applying a view with the same name again updates it.

<details>
<summary>Apply the view as a ConfigMap instead</summary>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: configmap-key
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

Save it as `configmap-key.yaml` and apply it:

```shell
vela kube apply -f configmap-key.yaml
```

`vela kube apply` does the same as `kubectl apply`, for when you don't have `kubectl`.

</details>

## Query a view from the CLI

The syntax is the view name with its parameters in braces:

```
<view-name>{parameter1=value1,parameter2=value2}
```

Parameter values can be strings, ints, floats or booleans. To query the view above:

```shell
vela ql -q "configmap-key{name=vela-addon-registry,namespace=vela-system,key=registries}"
```

The result is the same as running `ql.cue`.

## Query a view from VelaUX

VelaUX uses VelaQL for its own resource queries, and its API server exposes the same queries over HTTP. To install VelaUX:

```shell
vela addon enable velaux
```

The [VelaUX addon page](../../reference/addons/velaux.md) shows how to expose its endpoint. Assuming the API server is at `http://127.0.0.1:8000`, a query is a GET with the same statement as the CLI:

```shell
http://127.0.0.1:8000/api/v1/query?velaql="configmap-key{name=vela-addon-registry,namespace=vela-system,key=registries}"&project=<project>
```

## Who can run a view, and as whom

A view can read anything its query names, so check who can run it before you publish one.

| Run from | Runs as | What it can read |
| --- | --- | --- |
| `vela ql` | You, with your kubeconfig | Whatever your kubeconfig can read. The view itself is read from `vela-system`, so you need read access to ConfigMaps there. |
| VelaUX, with `project=<project>` | VelaUX's API server, acting for you as a member of the project | Only the project's namespaces. VelaUX checks that you have the project's query permission (`project/query`) first. |
| VelaUX, without `project` | VelaUX's API server | Every project's resources, so only an admin may run it. |

Anyone who can write ConfigMaps in `vela-system` can add or change a view, so treat that permission like write access to the queries VelaUX runs.

## Built-in VelaQL Operations

We provide the `vela/ql` package to help you query resources. The following explains the cue operators that can be used:

### ListResourcesInApp

List all resources created by Application

#### Action Parameter

- app: fill in the basic information of the application that needs to be queried, including the application name and application namespace，The `filter` field is used to filter the resources created by the application. The options include the cluster where the resource is located, the cluster namespace, and the component to which it belongs
- list: after the operation is successful, this field will be filled. `list` is a list of all resources, the k8s description of the resource is stored in the object field.
- err: if an error occurs in the operation, the error message will be displayed as a string.

```cue
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

```cue
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

```cue
#CollectPods: {
	value: {...}
	cluster: string
    list?:[... v1.Pod]
    err?: string
}
```

#### Usage
```cue
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

```cue
#Read: {
  value: {}
  err?: string
}
```

#### Usage

```cue
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

```cue
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
