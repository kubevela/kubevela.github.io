---
title:  Component Definition
---

In this section, we will introduce how to use [CUE](../cue/basic.md) to customize components via `ComponentDefinition`. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition.md) and [how to manage definition](../cue/definition-edit.md).

## Declare `ComponentDefinition`

First, generate `ComponentDefinition` scaffolds via `vela def init` with existed YAML file.

The YAML file:

```yaml title="stateless.yaml"
apiVersion: "apps/v1"
kind: "Deployment"
spec:
  selector:
    matchLabels:
      "app.oam.dev/component": "name"
  template:
    metadata:
      labels:
        "app.oam.dev/component": "name"
    spec:
      containers: 
      - name: "name"
        image: "image"
```

Generate `ComponentDefinition` based on the YAML file:

```shell
vela def init stateless -t component --template-yaml ./stateless.yaml -o stateless.cue
```

It generates a file:

```cue title="stateless.cue"
stateless: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "<change me> apps/v1"
		kind:       "<change me> Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {
		spec: {
			selector: matchLabels: "app.oam.dev/component": "name"
			template: {
				metadata: labels: "app.oam.dev/component": "name"
				spec: containers: [{
					name:  "name"
					image: "image"
				}]
			}
		}
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	outputs: {}
	parameter: {}
}
```

In detail:
- The `stateless` is the name of component definition, it can be defined by yourself when initialize the component.
- `stateless.attributes.workload` indicates the workload type of this component, it can help integrate with traits that apply to this kind of workload.
- `template` is a CUE template, specifically:
    * The `output` and `outputs` fields define the resources that the component will be composed.
    * The `parameter` field defines the parameters of the component, i.e. the configurable properties exposed in the `Application` (and schema will be automatically generated based on them for end users to learn this component).

Add parameters in this auto-generated custom component file :

```cue
stateless: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {
		spec: {
			selector: matchLabels: "app.oam.dev/component": parameter.name
			template: {
				metadata: labels: "app.oam.dev/component": parameter.name
				spec: containers: [{
					name:  parameter.name
					image: parameter.image
				}]
			}
		}
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	outputs: {}
	parameter: {
    name: string
    image: string
  }
}
```

You can use `vela def vet` to validate the format:

```shell
vela def vet stateless.cue
```

<details>
<summary>expected output</summary>

```
Validation succeed.
```
</details>

Apply above `ComponentDefinition` to your Kubernetes cluster to make it work:

```shell
vela def apply stateless.cue
```

<details>
<summary>expected output</summary>

```
ComponentDefinition stateless created in namespace vela-system.
```
</details>

Then the end user can check the schema and use it in an application now:

```
vela show stateless
```

<details>
<summary>expected output</summary>

```
# Specification
+-------+-------------+--------+----------+---------+
| NAME  | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-------+-------------+--------+----------+---------+
| name  |             | string | true     |         |
| image |             | string | true     |         |
+-------+-------------+--------+----------+---------+
```
</details>


Declare another component named `task` which is an abstraction for run-to-completion workload works the same.

<details>
<summary>Check the details for another example to define a task based component.</summary>

```shell
vela def init task -t component -o task.cue
```

It generates a file:

```cue
// $ cat task.cue
task: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "<change me> apps/v1"
		kind:       "<change me> Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {}
	parameter: {}
}
```

Edit the generated component file:

```cue
task: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "batch/v1"
		kind:       "Job"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
  output: {
    apiVersion: "batch/v1"
    kind:       "Job"
    spec: {
      parallelism: parameter.count
      completions: parameter.count
      template: spec: {
        restartPolicy: parameter.restart
        containers: [{
          image: parameter.image
          if parameter["cmd"] != _|_ {
            command: parameter.cmd
          }
        }]
      }
    }
  }
	parameter: {
    count:   *1 | int
    image:   string
    restart: *"Never" | string
    cmd?: [...string]
  }
}
```

Apply above `ComponentDefinition` files to your Kubernetes cluster to make it work:

```shell
$ vela def apply task.cue
ComponentDefinition task created in namespace vela-system.
```
</details>

Now let's use the `stateless` and `task` component type.

## Declare an `Application` using this component

The `ComponentDefinition` can be instantiated in `Application` abstraction as below:

  ```yaml
  apiVersion: core.oam.dev/v1beta1
  kind: Application
  metadata:
    name: website
  spec:
    components:
      - name: hello
        type: stateless
        properties:
          image: oamdev/hello-world
          name: mysvc
      - name: countdown
        type: task
        properties:
          image: centos:7
          cmd:
            - "bin/bash"
            - "-c"
            - "for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done"
  ```

<details>
<summary> Learn Details Under The Hood </summary>

Above application resource will generate and manage following Kubernetes resources in your target cluster based on the `output` in CUE template and user input in `Application` properties.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  ... # skip tons of metadata info
spec:
  template:
    spec:
      containers:
        - name: mysvc
          image: oamdev/hello-world
    metadata:
      labels:
        app.oam.dev/component: mysvc
  selector:
    matchLabels:
      app.oam.dev/component: mysvc
---
apiVersion: batch/v1
kind: Job
metadata:
  name: countdown
  ... # skip tons of metadata info
spec:
  parallelism: 1
  completions: 1
  template:
    metadata:
      name: countdown
    spec:
      containers:
        - name: countdown
          image: 'centos:7'
          command:
            - bin/bash
            - '-c'
            - for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done
      restartPolicy: Never
```  
</details>

You can also use [dry run](../debug/dry-run.md) to show what the yaml results will be rendered for debugging.


## CUE `Context` for runtime information

KubeVela allows you to reference the runtime information of your application via `context` keyword.

The most widely used context is application name(`context.appName`) component name(`context.name`).

```cue
context: {
  appName: string
  name: string
}
```

For example, let's say you want to use the component name filled in by users as the container name in the workload instance:

```cue
parameter: {
    image: string
}
output: {
  ...
    spec: {
        containers: [{
            name:  context.name
            image: parameter.image
        }]
    }
  ...
}
```

:::tip
Note that `context` information are auto-injected before resources are applied to target cluster.
:::

The list of [all available context variables](#full-available-context-in-component) are listed at last of this doc.

## Compose resources in one component

It's common that a component definition is composed by multiple API resources, for example, a `webserver` component that is composed by a Deployment and a Service. CUE is a great solution to achieve this in simplified primitives.

:::tip
Compare to [using Helm](../../tutorials/helm.md), this approach gives your more flexibility as you can control the abstraction any time and integrate with traits, workflows in KubeVela better.
:::

KubeVela requires you to define the template of main workload in `output` section, and leave all the other resource templates in `outputs` section with format as below:

```cue
output: {
  <template of main workload structural data>
}
outputs: {
  <unique-name>: {
    <template of auxiliary resource structural data>
  }
}
```

:::note
The reason for this requirement is KubeVela needs to know it is currently rendering a workload so it could do some "magic" by traits such like patching annotations/labels or other data during it.
:::

Below is the example for `webserver` definition, let's use a demo to show how to use it: 

```cue title="webserver.cue"
webserver: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    spec: {
      selector: matchLabels: {
        "app.oam.dev/component": context.name
      }
      template: {
        metadata: labels: {
          "app.oam.dev/component": context.name
        }
        spec: {
          containers: [{
            name:  context.name
            image: parameter.image

            if parameter["cmd"] != _|_ {
              command: parameter.cmd
            }

            if parameter["env"] != _|_ {
              env: parameter.env
            }

            if context["config"] != _|_ {
              env: context.config
            }

            ports: [{
              containerPort: parameter.port
            }]

            if parameter["cpu"] != _|_ {
              resources: {
                limits:
                  cpu: parameter.cpu
                requests:
                  cpu: parameter.cpu
              }
            }
          }]
        }
      }
    }
  }
  // an extra template
  outputs: service: {
    apiVersion: "v1"
    kind:       "Service"
    spec: {
      selector: {
        "app.oam.dev/component": context.name
      }
      ports: [
        {
          port:       parameter.port
          targetPort: parameter.port
        },
      ]
    }
  }
	parameter: {
    image: string
    cmd?: [...string]
    port: *80 | int
    env?: [...{
      name:   string
      value?: string
      valueFrom?: {
        secretKeyRef: {
          name: string
          key:  string
        }
      }
    }]
    cpu?: string
  }
}
```

Apply to your Kubernetes cluster:

```shell
vela def apply webserver.cue
```

<details>
<summary>expected output</summary>

```
ComponentDefinition webserver created in namespace vela-system.
```
</details>

The user could now declare an `Application` with it:

```yaml title="webserver-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webserver-demo
  namespace: default
spec:
  components:
    - name: hello-webserver
      type: webserver
      properties:
        image: oamdev/hello-world
        port: 8000
        env:
        - name: "foo"
          value: "bar"
        cpu: "100m"
```

Create this application by:

```
vela up -f webserver-app.yaml
```

Then you can check the resources and find the results:

```shell
vela status webserver-demo --tree --detail
```

<details>
<summary>expected output</summary>

```console
CLUSTER       NAMESPACE     RESOURCE                                             STATUS    APPLY_TIME          DETAIL
local     ─── default   ─┬─ Service/hello-webserver-auxiliaryworkload-685d98b6d9 updated   2022-10-15 21:58:35 Type: ClusterIP
                         │                                                                                     Cluster-IP: 10.43.255.55
                         │                                                                                     External-IP: <none>
                         │                                                                                     Port(s): 8000/TCP
                         │                                                                                     Age: 66s
                         └─ Deployment/hello-webserver                           updated   2022-10-15 21:58:35 Ready: 1/1  Up-to-date: 1
                                                                                                               Available: 1  Age: 66s
```
</details>


## Define health check and status message for component

You can also define health check policy and status message when a component deployed and tell the real status to end users.

### Health check

The spec of health check is `<component-type-name>.attributes.status.healthPolicy`.

If not defined, the health result will always be `true`, which means it will be marked as healthy immediately after resources applied to Kubernetes. You can define a CUE expression in it to notify if the component is healthy or not.

The keyword is `isHealth`, the result of CUE expression must be `bool` type.

KubeVela runtime will evaluate the CUE expression periodically until it becomes healthy. Every time the controller will get all the Kubernetes resources and fill them into the `context` variables.

So the context will contain following information:

```cue
context:{
  name: <component name>
  appName: <app name>
  output: <K8s workload resource>
  outputs: {
    <resource1>: <K8s trait resource1>
    <resource2>: <K8s trait resource2>
  }
}
```

The example of health check likes below:

```cue
webserver: {
	type: "component"
  ...
	attributes: {
		status: {
			healthPolicy: #"""
        isHealth: (context.output.status.readyReplicas > 0) && (context.output.status.readyReplicas == context.output.status.replicas)
        """#
    }
  }
}
```

You can also use the `parameter` defined in the template like:

```
webserver: {
	type: "component"
  ...
	attributes: {
		status: {
			healthPolicy: #"""
        isHealth: (context.output.status.readyReplicas > 0) && (context.output.status.readyReplicas == parameter.replicas)
        """#
    }
  }
template: {
	parameter: {
    replicas: int
  } 
  ...
}
```

The health check result will be recorded into the corresponding component in `.status.services` of `Application` resource.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
status:
  ...
  services:
  - healthy: true
    name: myweb
    ...
  status: running
```

> Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/component/webservice.cue#L29-L50) for more examples.

### Custom Status

The spec of custom status is `<component-type-name>.attributes.status.customStatus`, it shares the same mechanism with the health check.

The keyword in CUE expression is `message`, the result must be `string` type.

Application CRD controller will evaluate the CUE expression after the health check succeed.

The example of custom status likes below:

```cue
webserver: {
	type: "component"
  ...
	attributes: {
		status: {
			customStatus: #"""
				ready: {
					readyReplicas: *0 | int
				} & {
					if context.output.status.readyReplicas != _|_ {
						readyReplicas: context.output.status.readyReplicas
					}
				}
				message: "Ready:\(ready.readyReplicas)/\(context.output.spec.replicas)"
				"""#
    }
  }
}
```

The message will be recorded into the corresponding component in `.status.services` of `Application` resource like below.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
status:
  ...
  services:
  - healthy: false
    message: Ready:1/1
    name: express-server
```

> Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/component/webservice.cue#L29-L50) for more examples.

### Detailed Status
In addition to `healthPolicy` and `customStatus`, KubeVela supports a third status mechanism: `details`, which allows components to expose structured and detailed diagnostic information to the Application resource.

This is especially helpful in multi-output components, enabling users to understand granular health or operational states of different resources.

You define this under `attributes.status.details`, using either native CUE syntax or a CUE string expression.

#### Native CUE Format
Use native CUE to define detailed status as a structured map. Public fields (no prefix) will be exported as strings to the Application’s `.status.services[].status`

**Note:** Native CUE syntax is currently available only on the `attributes.status.details` field and is unsupported for `healthPolicy` and `customStatus`

```cue
attributes: {
  status: {
    details: {
      readyCount:      *context.output.status.readyReplicas | 0
      readyPct:        *"\($internal.pctRunning)%" | "0%"
      unavailablePct:  *"\($internal.pctUnavailable)%" | "0%"
      degraded:        *$internal.pctRunning < 80 | false    // must be at least 80% of replicas ready

      // Private fields are supported with `$` prefix
      $internal: {
        pctRunning: *((context.output.status.readyReplicas / context.output.spec.replicas) * 100) | 0
        pctUnavailable: *((context.output.status.unavailableReplicas / context.output.spec.replicas) * 100) | 0
      }
    }
  }
}
```
**Important Notes:**
- Public fields (readyCount, degraded, etc.) must return a `bool`, `int`, or `string`. Their stringified value will appear in the Application status.
- Private fields (prefixed with `$`) can be any type (including nested structs and lists) and are not exported to the Application status.
- Private fields can be referenced by public fields and other private fields.
- When using native CUE struct syntax, all public values are stringified before being stored in the Application status.
These string values are then recompiled back to CUE expressions during evaluation by the runtime.
- For consistency, the `vela def get <component>` command will always return the definition using native CUE formatting, even if the original status block was provided as a string.
- It is recommended to make use of defaults to account for missing values to ensure the status block is always complete,
  e.g. `*context.output.status.readyReplicas | 0`

#### String Expression Format
Alternatively, you can use a CUE string literal to define the details block.

```cue
attributes: {
  status: {
    details: #"""
      readyCount:      *context.output.status.readyReplicas | 0
      readyPct:        *"\($internal.pctRunning)%" | "0%"
      unavailablePct:  *"\($internal.pctRunning)%" | "0%"
      degraded:        *$internal.pctRunning < 80 | false    // must be at least 80% of replicas ready

      // Private fields are supported with `$` prefix
      $internal: {
        pctRunning: *((context.output.status.readyReplicas / context.output.spec.replicas) * 100) | 0
        pctUnavailable: *((context.output.status.unavailableReplicas / context.output.spec.replicas) * 100) | 0
      }
    """#
  }
}
```

String expressions behave identically to native CUE structs and support the same rules regarding public/private fields and type restrictions.

#### Result in Application Status
Only public fields appear in .status.services[].status:
```yaml
...
status:
  services:
    - name: mycomponent
      healthy: true
      message: "Ready:2/2"
      status:
        readyCount:      "2"
        readyPct:        "100%"
        unavailablePct:  "0%"
        degraded:        "false"
...
```

To inspect this via CLI:
```bash
vela status <app-name> -n <app-namespace>
```

## Full available `context` in Component


|         Context Variable         |                                                                                  Description                                                                                  |    Type    |
|:--------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:----------:|
|        `context.appName`         |                                                    The app name corresponding to the current instance of the application.                                                     |   string   |
|       `context.namespace`        |          The target namespace of the current resource is going to be deployed, it can be different with the namespace of application if overridden by some policies.          |   string   |
|        `context.cluster`         |           The target cluster of the current resource is going to be deployed, it can be different with the namespace of application if overridden by some policies.           |   string   |
|      `context.appRevision`       |                                                The app version name corresponding to the current instance of the application.                                                 |   string   |
|     `context.appRevisionNum`     |                                               The app version number corresponding to the current instance of the application.                                                |    int     |
|          `context.name`          |                                                 The component name corresponding to the current instance of the application.                                                  |   string   |
|        `context.revision`        |                                                              The version name of the current component instance.                                                              |   string   |
|         `context.output`         |                                                        The object structure after instantiation of current component.                                                         | Object Map |
| `context.outputs.<resourceName>` |                                                    Structure after instantiation of current component auxiliary resources.                                                    | Object Map |
|      `context.workflowName`      |                                                                  The workflow name specified in annotation.                                                                   |   string   |
|     `context.publishVersion`     |                                                         The version of application instance specified in annotation.                                                          |   string   |
|       `context.appLabels`        |                                                                The labels of the current application instance.                                                                | Object Map |
|     `context.appAnnotations`     |                                                             The annotations of the current application instance.                                                              | Object Map |
|       `context.replicaKey`       | The key of replication in context. Replication is an internal policy, it will replicate resources with different keys specified.  (This feature will be introduced in v1.6+.) |   string   |


### Cluster Version

|          Context Variable           |                         Description                         |  Type  |
|:-----------------------------------:|:-----------------------------------------------------------:|:------:|
|   `context.clusterVersion.major`    |    The major version of the runtime Kubernetes cluster.     | string |
| `context.clusterVersion.gitVersion` |      The gitVersion of the runtime Kubernetes cluster.      | string |
|  `context.clusterVersion.platform`  | The platform information of the runtime Kubernetes cluster. | string |
|   `context.clusterVersion.minor`    |    The minor version of the runtime Kubernetes cluster.     |  int   |

The cluster version context info can be used for graceful upgrade of definition. For example, you can define different API according to the cluster version.

```
 outputs: ingress: {
	if context.clusterVersion.minor < 19 {
		apiVersion: "networking.k8s.io/v1beta1"
	}
	if context.clusterVersion.minor >= 19 {
		apiVersion: "networking.k8s.io/v1"
	}
	kind: "Ingress"
}
```

Or use string contain pattern for this usage:

```
import "strings"

if strings.Contains(context.clusterVersion.gitVersion, "k3s") {
     provider: "k3s"
}
if strings.Contains(context.clusterVersion.gitVersion, "aliyun") {
     provider: "aliyun"
}
```

## Component definition in Kubernetes

KubeVela is fully programmable via CUE, while it leverage Kubernetes as control plane and align with the API in yaml.
As a result, the CUE definition will be converted as Kubernetes API when applied into cluster.

The component definition will be in the following API format:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: <ComponentDefinition name>
  annotations:
    definition.oam.dev/description: <Function description>
spec:
  workload: # Workload Capability Indicator
    definition:
      apiVersion: <Kubernetes Workload resource group>
      kind: <Kubernetes Workload types>
  schematic:  # Component description
    cue: # Details of components defined by CUE language
      template: <CUE format template>
```

You can check the detail of this format [here](../oam/x-definition.md).

## More examples to learn

You can check the following resources for more examples:

- Builtin component definitions in the [KubeVela github repo](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/component).
- Definitions defined in addons in the [catalog repo](https://github.com/kubevela/catalog/tree/master/addons).