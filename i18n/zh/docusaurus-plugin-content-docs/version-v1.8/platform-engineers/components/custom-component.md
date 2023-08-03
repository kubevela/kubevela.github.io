---
title:  自定义组件
---

:::tip
在阅读本部分之前，请确保你已经了解 KubeVela 中 [组件定义（ComponentDefinition)](../oam/x-definition.md#组件定义（ComponentDefinition）) 的概念且学习掌握了 [CUE 的基本知识](../cue/basic.md)
:::

本节将以组件定义的例子展开说明，介绍如何使用 [CUE](../cue/basic.md) 通过组件定义 `ComponentDefinition` 来自定义应用部署计划的组件。

## 交付一个简单的自定义组件

我们可以通过 `vela def init` 来根据已有的 YAML 文件来生成一个 `ComponentDefinition` 模板。

YAML 文件：

```yaml
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

根据以上的 YAML 来生成 `ComponentDefinition`：

```shell
vela def init stateless -t component --template-yaml ./stateless.yaml -o stateless.cue
```

得到如下结果：

```shell title="stateless.cue"
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

在这个自动生成的模板中：
- The `stateless` is the name of component definition, it can be defined by yourself when initialize the component.
- `stateless.attributes.workload` indicates the workload type of this component, it can help integrate with traits that apply to this kind of workload.
- `template` is a CUE template, specifically:
    * The `output` and `outputs` fields define the resources that the component will be composed.
    * The `parameter` field defines the parameters of the component, i.e. the configurable properties exposed in the `Application` (and schema will be automatically generated based on them for end users to learn this component).
  
下面我们来给这个自动生成的自定义组件添加参数并进行赋值：

```
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

修改后可以用 `vela def vet` 做一下格式检查和校验。

```shell
vela def vet stateless.cue
```

<details>
<summary>期望输出</summary>

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


接着，让我们声明另一个名为 `task` 的组件，其原理类似。

<details>
<summary>点击查看声明 task 组件的创建过程。</summary>

```shell
vela def init task -t component -o task.cue
```

得到如下结果：

```shell
$ cat task.cue
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

修改该组件定义：

```
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

将以上两个组件定义部署到集群中：

```shell
$ vela def apply task.cue
ComponentDefinition task created in namespace vela-system.
```

</details>

这两个已经定义好的组件，最终会在应用部署计划中实例化，我们引用自定义的组件类型 `stateless`，命名为 `hello`。同样，我们也引用了自定义的第二个组件类型 `task`，并命令为 `countdown`。

然后把它们编写到应用部署计划中，如下所示：

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

以上，我们就完成了一个自定义应用组件的应用交付全过程。值得注意的是，作为管理员的我们，可以通过 CUE 提供用户所需要的任何自定义组件类型，同时也为用户提供了模板参数 `parameter` 来灵活地指定对 Kubernetes 相关资源的要求。

<details>

<summary> 了解背后的 Kubernetes 最终资源信息 </summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  ... # 隐藏一些与本小节讲解无关的信息
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
  ... # 隐藏一些与本小节讲解无关的信息
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


## 使用 CUE `Context` 获取运行时信息

KubeVela 让你可以在运行时，通过 `context` 关键字来引用一些信息。

最常用的就是应用部署计划的名称 `context.appName` 和组件的名称 `context.name`。

```cue
context: {
  appName: string
  name: string
}
```

举例来说，假设你在实现一个组件定义，希望将容器的名称填充为组件的名称。那么这样做：

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
注意 `context` 的信息会在资源部署到目标集群之前就自动注入了。
:::


在本文的最后列出了完整的 context 变量列表。


## 交付一个复合的自定义组件

除了上面这个例子外，一个组件的定义通常也会由多个 Kubernetes API 资源组成。例如，一个由 `Deployment` 和 `Service` 组成的 `webserver` 组件。CUE 同样能很好的满足这种自定义复合组件的需求。

:::tip
Compare to [using Helm](../../tutorials/helm.md), this approach gives your more flexibility as you can control the abstraction any time and integrate with traits, workflows in KubeVela better.
:::

我们会使用 `output` 这个字段来定义工作负载类型的模板，而其他剩下的资源模板，都在 `outputs` 这个字段里进行声明，格式如下：

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

回到 `webserver` 这个复合自定义组件上，它的 CUE 文件编写如下：

``` title="webserver.cue"
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

可以看到：
1. 最核心的工作负载，我们按需要在 `output` 字段里，定义了一个要交付的 `Deployment` 类型的 Kubernetes 资源。
2. `Service` 类型的资源，则放到 `outputs` 里定义。以此类推，如果你要复合第三个资源，只需要继续在后面以键值对的方式添加：

```
outputs: service: {
            apiVersion: "v1"
            kind:       "Service"
            spec: {
...
outputs: third-resource: {
            apiVersion: "v1"
            kind:       "Service"
            spec: {   
...                     
```

在理解这些之后，将上面的组件定义对象保存到 CUE 文件中，并部署到你的 Kubernetes 集群。


```shell
vela def apply webserver.cue
```

<details>
<summary>期望输出</summary>

```
ComponentDefinition webserver created in namespace vela-system.
```
</details>

然后，我们使用它们，来编写一个应用部署计划：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webserver-demo
  namespace: default
spec:
  components:
    - name: hello-world
      type: webserver
      properties:
        image: oamdev/hello-world
        port: 8000
        env:
        - name: "foo"
          value: "bar"
        cpu: "100m"
```

进行部署：

```
$ vela up -f webserver.yaml
```

最后，它将在运行时集群生成相关 Kubernetes 资源如下：

```shell
vela status webserver-demo --tree --detail
```

<details>
<summary>期望输出</summary>

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


## 自定义健康检查和状态

你可以通过自定义健康检查和状态信息，将自定义组件的真实状态反馈给最终用户。


### 健康检查

定义健康检查的字段为 `<component-type-name>.attributes.status.healthPolicy`.

如果没有定义，它的值默认是 `true`，意味着在部署完对象后就将对象的状态设置为健康。为了让组件的状态及时、准确，通常你需要为组件定义监控状态，这个过程可以通过一个 CUE 表达式完成。

在 CUE 里的关键词是 `isHealth`，CUE 表达式结果必须是 `bool` 类型。
KubeVela 运行时会一直检查 CUE 表达式，直至其状态显示为健康。每次控制器都会获取所有的 Kubernetes 资源，并将他们填充到 `context` 字段中。

所以 context 字段会包含如下信息:

```cue
context:{
  name: <component name>
  appName: <app name>
  output: <Kubernetes workload resource>
  outputs: {
    <resource1>: <Kubernetes trait resource1>
    <resource2>: <Kubernetes trait resource2>
  }
}
```

我们看看健康检查的例子：

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

你也可以在健康检查中使用 `parameter` 中定义的参数，类似如下：

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

健康检查的结果会输出到 `Application` 对象的 `.status.services` 字段中。

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

> 请参考[文档](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/component/webservice.cue#L29-L50) 查阅更多示例。

### 自定义状态

自定义状态的字段未 `<component-type-name>.attributes.status.customStatus`, 自定义状态和健康检查的原理一致。

在 CUE 中的关键词是 `message`。同时，CUE 表达式的结果必须是 `string` 类型。

`Application` 对象的 CRD 控制器都会检查 CUE 表达式，直至显示健康通过。

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

> 请参考[文档](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/component/webservice.cue#L29-L50) 查阅更多示例。


## Full available `context` in Component


|         Context Variable         |                                                                                  Description                                                                                  |    Type    |
| :------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------: |
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
| :---------------------------------: | :---------------------------------------------------------: | :----: |
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

```
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