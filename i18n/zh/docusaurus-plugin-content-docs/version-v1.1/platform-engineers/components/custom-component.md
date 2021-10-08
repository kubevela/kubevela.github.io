---
title:  自定义组件入门
---

> 在阅读本部分之前，请确保你已经了解 KubeVela 中 [组件定义（ComponentDefinition](../oam/x-definition#组件定义（ComponentDefinition）) 的概念且学习掌握了 [CUE 的基本知识](../cue/basic)

本节将以组件定义的例子展开说明，介绍如何使用 [CUE](https://cuelang.org/) 通过组件定义 `ComponentDefinition` 来自定义应用部署计划的组件。

### 交付一个简单的自定义组件

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

```shell
$ cat stateless.cue
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
	parameters: {}
}
```

在这个自动生成的模板中：
- 需要 `.spec.workload` 来指示该组件的工作负载类型。
- `.spec.schematic.cue.template` 是一个 CUE 模板：
     * `output` 字段定义了 CUE 要输出的抽象模板。
     * `parameter` 字段定义了模板参数，即在应用部署计划（Application）中公开的可配置属性（KubeVela 将基于 `parameter` 字段自动生成 Json schema）。
  
下面我们来给这个自动生成的自定义组件添加参数并进行赋值：

```
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
	parameters: {
    name: string
    image: string
  }
}
```

修改后可以用 `vela def vet` 做一下格式检查和校验。

```shell
$ vela def vet stateless.cue
Validation succeed.
```

接着，让我们声明另一个名为 `task` 的组件。

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
$ vela def apply stateless.cue
ComponentDefinition stateless created in namespace vela-system.
$ vela def apply task.cue
ComponentDefinition task created in namespace vela-system.
```

这两个已经定义好的组件，最终会在应用部署计划中实例化，我们引用自定义的组件类型 `stateless`，命名为 `hello`。同样，我们也引用了自定义的第二个组件类型 `task`，并命令为 `countdown`。

然后把它们编写到应用部署计划中，如下所示：

  ```yaml
  apiVersion: core.oam.dev/v1alpha2
  kind: Application
  metadata:
    name: website
  spec:
    components:
      - name: hello
        type: stateless
        properties:
          image: crccheck/hello-world
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

#### 查看 Kubernetes 最终资源信息
<details>

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
          image: crccheck/hello-world
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


### 交付一个复合的自定义组件

除了上面这个例子外，一个组件的定义通常也会由多个 Kubernetes API 资源组成。例如，一个由 `Deployment` 和 `Service` 组成的 `webserver` 组件。CUE 同样能很好的满足这种自定义复合组件的需求。

我们会使用 `output` 这个字段来定义工作负载类型的模板，而其他剩下的资源模板，都在 `outputs` 这个字段里进行声明，格式如下：

```cue
outputs: <unique-name>: 
  <full template data>
```

回到 `webserver` 这个复合自定义组件上，它的 CUE 文件编写如下：

```
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
$ vela def apply webserver.cue
ComponentDefinition webserver created in namespace vela-system.
```

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
        image: crccheck/hello-world
        port: 8000
        env:
        - name: "foo"
          value: "bar"
        cpu: "100m"
```

进行部署：
```
$ kubectl apply -f webserver.yaml
```
最后，它将在运行时集群生成相关 Kubernetes 资源如下：

```shell
$ kubectl get deployment
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
hello-world-v1   1/1     1            1           15s

$ kubectl get svc
NAME                           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
hello-world-trait-7bdcff98f7   ClusterIP   <your ip>       <none>        8000/TCP   32s
```

## 使用 CUE `Context`

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

> 注意，`context` 的信息会在资源部署到目标集群之前就自动注入了

### CUE `context` 的配置项

|          Context 变量名          |                                                          说明                                                          |
| :------------------------------: | :--------------------------------------------------------------------------------------------------------------------: |
|      `context.appRevision`       |                                                   应用部署计划的版本                                                   |
|     `context.appRevisionNum`     | 应用部署计划的版本号(`int` 类型), 比如说如果 `context.appRevision` 是 `app-v1` 的话，`context.appRevisionNum` 会是 `1` |
|        `context.appName`         |                                                   应用部署计划的名称                                                   |
|          `context.name`          |                                                       组件的名称                                                       |
|       `context.namespace`        |                                                 应用部署计划的命名空间                                                 |
|         `context.output`         |                                  组件中渲染的工作负载 API 资源，这通常用在运维特征里                                   |
| `context.outputs.<resourceName>` |                                  组件中渲染的运维特征 API 资源，这通常用在运维特征里                                   |