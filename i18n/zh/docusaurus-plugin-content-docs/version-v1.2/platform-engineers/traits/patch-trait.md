---
title:  补丁型特征
---

在自定义运维特征中，使用补丁型特征是一种比较常用的形式。

它让我们可以修改、补丁某些属性给组件对象（一般是工作负载）来完成特定操作，比如更新 `sidecar` 和节点亲和性（node affinity）的规则（并且，这个操作一定是在资源往集群部署前就已经生效）。

当我们的组件是从第三方提供并自定义而来的时候，由于它们的模版往往是固定不可变的，所以能使用补丁型特征就显得尤为有用了。

> 尽管运维特征是由 CUE 来定义，它能打补丁的组件类型并不限，不管是来自 CUE、Helm 还是其余支持的模版格式

下面，我们通过一个节点亲和性（node affinity）的例子，讲解如何使用补丁型特征：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "affinity specify node affinity and toleration"
  name: node-affinity
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: {
        	spec: template: spec: {
        		if parameter.affinity != _|_ {
        			affinity: nodeAffinity: requiredDuringSchedulingIgnoredDuringExecution: nodeSelectorTerms: [{
        				matchExpressions: [
        					for k, v in parameter.affinity {
        						key:      k
        						operator: "In"
        						values:   v
        					},
        				]}]
        		}
        		if parameter.tolerations != _|_ {
        			tolerations: [
        				for k, v in parameter.tolerations {
        					effect:   "NoSchedule"
        					key:      k
        					operator: "Equal"
        					value:    v
        				}]
        		}
        	}
        }

        parameter: {
        	affinity?: [string]: [...string]
        	tolerations?: [string]: string
        }
```

具体来说，我们上面的这个补丁型特征，假定了使用它的组件对象将会使用 `spec.template.spec.affinity` 这个字段。因此，我们需要用 `appliesToWorkloads` 来指明，让当前运维特征被应用到拥有这个字段的对应工作负载实例上。

另一个重要的字段是 `podDisruptive`，这个补丁型特征将修改 Pod 模板字段，因此对该运维特征的任何字段进行更改，都会导致 Pod 重启。我们应该增加 `podDisruptive` 并且设置它的值为 true，以此告诉用户这个运维特征生效后将导致 Pod 重新启动。

现在用户只需要，声明他们希望增加一个节点亲和性的规则到组件实例当中：

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/testapp:v1
      traits:
        - type: "node-affinity"
          properties:
            affinity:
              server-owner: ["owner1","owner2"]
              resource-pool: ["pool1","pool2","pool3"]
            tolerations:
              resource-pool: "broken-pool1"
              server-owner: "old-owner"
```

### 待解决的短板

默认来说，补丁型特征是通过 CUE 的 `merge` 操作来实现的。它有以下限制：

- 不能处理有冲突的字段名
  - 比方说，在一个组件实例中已经设置过这样的值 `replicas=5`，那一旦有运维特征实例，尝试给 `replicas` 字段的值打补丁就会失败。所以我们建议你提前规划好，不要在组件和运维特征之间使用重复的字段名。
- 数组列表被补丁时，会按索引顺序进行合并。如果数组里出现了重复的值，将导致问题。为了规避这个风险，请查询后面的解决方案。

### 策略补丁

策略补丁，通过增加注解（annotation）而生效，并支持如下两种模式。

> 请注意，这里开始并不是 CUE 官方提供的功能, 而是 KubeVela 扩展开发而来

#### 1. 使用 `+patchKey=<key_name>` 注解

这个注解，是给数组列表打补丁用的。它的执行方式也不遵循 CUE 官方的方式，而是将每一个数组列表视作对象，并执行如下的策略：
 - 如果发现重复的键名，补丁数据会直接替换掉它的值
 - 如果没有重复键名，补丁则会自动附加这些数据

下面来看看，一个使用 'patchKey' 的策略补丁：
 
```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "add sidecar to the app"
  name: sidecar
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: {
        	// +patchKey=name
        	spec: template: spec: containers: [parameter]
        }
        parameter: {
        	name:  string
        	image: string
        	command?: [...string]
        }
```
在上述的这个例子中，我们定义了要 `patchKey` 的字段 `name`，是来自容器的参数键名。如果工作负载中并没有同名的容器，那么一个 sidecar 容器就会被加到 `spec.template.spec.containers` 数组列表中。如果工作负载中有重名的 `sidecar` 运维特征，则会执行 merge 操作而不是附加。

如果 `patch` 和 `outputs` 同时存在于一个运维特征定义中，`patch` 会率先被执行然后再渲染 `outputs`。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "expose the app"
  name: expose
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: {spec: template: metadata: labels: app: context.name}
        outputs: service: {
        	apiVersion: "v1"
        	kind:       "Service"
        	metadata: name: context.name
        	spec: {
        		selector: app: context.name
        		ports: [
        			for k, v in parameter.http {
        				port:       v
        				targetPort: v
        			},
        		]
        	}
        }
        parameter: {
        	http: [string]: int
        }
```
在上面这个运维特征定义中，我们将会把一个 `Service` 添加到给定的组件实例上。同时会先去给工作负载类型打上补丁数据，然后基于模版里的 `outputs` 渲染余下的资源。

#### 2. 使用 `+patchStrategy=retainkeys` 注解

这个注解的策略，与 Kubernetes 官方的 [retainkeys](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/update-api-object-kubectl-patch/#use-strategic-merge-patch-to-update-a-deployment-using-the-retainkeys-strategy) 策略类似。

在一些场景下，整个对象需要被一起替换掉，使用 `retainkeys` 就是最适合的办法。

假定一个 `Deployment` 对象是这样编写的：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: retainkeys-demo
spec:
  selector:
    matchLabels:
      app: nginx
  strategy:
    type: rollingUpdate
    rollingUpdate:
      maxSurge: 30%
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: retainkeys-demo-ctr
        image: nginx
```

现在如果我们想替换掉 `rollingUpdate` 策略，你可以这样写：

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: TraitDefinition
metadata:
  name: recreate
spec:
  appliesToWorkloads:
    - deployments.apps
  extension:
    template: |-
      patch: {
         spec: {
              // +patchStrategy=retainKeys
              strategy: type: "Recreate"
           }
      }        
```

这个 YAML 资源将变更为：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: retainkeys-demo
spec:
  selector:
    matchLabels:
      app: nginx
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: retainkeys-demo-ctr
        image: nginx
```
## 更多补丁型特征的使用场景

补丁型特征，针对组件层面做些整体操作时，非常有用。我们看看还可以满足哪些需求：

### 增加标签

比如说，我们要给组件实例打上 `virtualgroup` 的通用标签。

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "Add virtual group labels"
  name: virtualgroup
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: {
        	spec: template: {
        		metadata: labels: {
        			if parameter.scope == "namespace" {
        				"app.namespace.virtual.group": parameter.group
        			}
        			if parameter.scope == "cluster" {
        				"app.cluster.virtual.group": parameter.group
        			}
        		}
        	}
        }
        parameter: {
        	group: *"default" | string
        	scope:  *"namespace" | string
        }
```

然后这样用就可以了:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  ...
      traits:
      - type: virtualgroup
        properties:
          group: "my-group1"
          scope: "cluster"
```

### 增加注解

与通用标签类似，你也可以给组件实例打补丁，增加一些注解。注解的格式，必须是 JSON。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "Specify auto scale by annotation"
  name: kautoscale
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: false
  schematic:
    cue:
      template: |
        import "encoding/json"

        patch: {
        	metadata: annotations: {
        		"my.custom.autoscale.annotation": json.Marshal({
        			"minReplicas": parameter.min
        			"maxReplicas": parameter.max
        		})
        	}
        }
        parameter: {
        	min: *1 | int
        	max: *3 | int
        }
```

### 增加 Pod 环境变量

给 Pod 去注入环境变量也是非常常见的操作。

> 这种使用方式依赖策略补丁而生效, 所以记得加上 `+patchKey=name`

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "add env into your pods"
  name: env
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: {
        	spec: template: spec: {
        		// +patchKey=name
        		containers: [{
        			name: context.name
        			// +patchKey=name
        			env: [
        				for k, v in parameter.env {
        					name:  k
        					value: v
        				},
        			]
        		}]
        	}
        }

        parameter: {
        	env: [string]: string
        }
```

### 基于外部鉴权服务注入 `ServiceAccount`

在这个场景下，service-account 是从一个鉴权服务中动态获取、再通过打补丁给到应用的。

我们这里展示的是，将 UID token 放进 `HTTP header` 的例子。你也可以用 `HTTP body` 来完成需求。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "dynamically specify service account"
  name: service-account
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        processing: {
        	output: {
        		credentials?: string
        	}
        	http: {
        		method: *"GET" | string
        		url:    parameter.serviceURL
        		request: {
        			header: {
        				"authorization.token": parameter.uidtoken
        			}
        		}
        	}
        }
        patch: {
        	spec: template: spec: serviceAccountName: processing.output.credentials
        }

        parameter: {
        	uidtoken:   string
        	serviceURL: string
        }
```

### 增加 `InitContainer`

[`InitContainer`](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-initialization/#create-a-pod-that-has-an-init-container) 常用于预定义镜像内的操作，并且在承载应用的容器运行前就跑起来。

看看示例:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "add an init container and use shared volume with pod"
  name: init-container
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: {
        	spec: template: spec: {
        		// +patchKey=name
        		containers: [{
        			name: context.name
        			// +patchKey=name
        			volumeMounts: [{
        				name:      parameter.mountName
        				mountPath: parameter.appMountPath
        			}]
        		}]
        		initContainers: [{
        			name:  parameter.name
        			image: parameter.image
        			if parameter.command != _|_ {
        				command: parameter.command
        			}

        			// +patchKey=name
        			volumeMounts: [{
        				name:      parameter.mountName
        				mountPath: parameter.initMountPath
        			}]
        		}]
        		// +patchKey=name
        		volumes: [{
        			name: parameter.mountName
        			emptyDir: {}
        		}]
        	}
        }

        parameter: {
        	name:  string
        	image: string
        	command?: [...string]
        	mountName:     *"workdir" | string
        	appMountPath:  string
        	initMountPath: string
        }
```

用法像这样:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/testapp:v1
      traits:
        - type: "init-container"
          properties:
            name:  "install-container"
            image: "busybox"
            command:
            - wget
            - "-O"
            - "/work-dir/index.html"
            - http://info.cern.ch
            mountName: "workdir"
            appMountPath:  "/usr/share/nginx/html"
            initMountPath: "/work-dir"
```