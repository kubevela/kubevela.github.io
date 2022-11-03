---
title: 组件分裂
---

## 背景

在 KubeVela 中，我们可以使用 `deploy` 工作流步骤和 `override`， `topology` 策略。但是例如[OpenYurt](https://openyurt.io)
的项目中，有对集群具有更细粒度划分，例如"节点池"。需要将一些类似的资源下发到同一集群。这些资源称为replication。回到 OpenYurt
的例子，它可以集成 KubeVela，并将分裂出的多个相似 K8s 资源下发到不同的节点池。

## 用途

为了将一个组件分裂为多个，我们添加了一个内置策略 `replication`。它只能与 `deploy` 工作流步骤一起使用。如果在 `deploy`
工作流步骤中使用 `replication` 策略，则在渲染组件时将向上下文添加一个新字段 `context.replicaKey`
。可以向下发一些资源到集群中，他们带有不同的 `replicaKey`。

:::note
`replication` 策略仅在 KubeVela 1.6.0 以上版本中受支持。
:::

:::tip
`context.replicaKey` 经常在组件定义或运维特征定义中下发资源的 `metadata.name` 字段中使用，以避免名称冲突。我们将在后面的示例中看到它。
:::

## 范例

下面的组件定义是一个使用策略的示例 `replication`。它用 `context.replicaKey` 给的名称加上后缀。

```cue
import (
	"strconv"
)

"replica-webservice": {
	alias: ""
	annotations: {}
	attributes: {
		status: {}
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
	}
	description: "Webservice, but can be replicated"
	labels: {}
	type: "component"
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: {
			if context.replicaKey != _|_ {
				name: context.name + "-" + context.replicaKey
			}
			if context.replicaKey == _|_ {
				name: context.name
			}
		}
		spec: {
			selector: matchLabels: {
				"app.oam.dev/component": context.name
				if context.replicaKey != _|_ {
					"app.oam.dev/replicaKey": context.replicaKey
				}
			}

			template: {
				metadata: {
					labels: {
						if parameter.labels != _|_ {
							parameter.labels
						}
						"app.oam.dev/name":      context.appName
						"app.oam.dev/component": context.name
						if context.replicaKey != _|_ {
							"app.oam.dev/replicaKey": context.replicaKey
						}
					}
				}

				spec: {
					containers: [{
						name:  context.name
						image: parameter.image
						if parameter["ports"] != _|_ {
							ports: [ for v in parameter.ports {
								{
									containerPort: v.port
									name:          "port-" + strconv.FormatInt(v.port, 10)
								}}]
						}
					}]
				}
			}
		}
	}
	exposePorts: [
		for v in parameter.ports {
			port:       v.port
			targetPort: v.port
			name:       "port-" + strconv.FormatInt(v.port, 10)
		},
	]
	outputs: {
		if len(exposePorts) != 0 {
			webserviceExpose: {
				apiVersion: "v1"
				kind:       "Service"
				metadata: {
					if context.replicaKey != _|_ {
						name: context.name + "-" + context.replicaKey
					}
					if context.replicaKey == _|_ {
						name: context.name
					}
				}
				spec: {
					selector: {
						"app.oam.dev/component": context.name
						if context.replicaKey != _|_ {
							"app.oam.dev/replicaKey": context.replicaKey
						}
					}
					ports: exposePorts
				}
			}
		}
	}
	parameter: {
		// +usage=Which image would you like to use for your service
		// +short=i
		image: string
		// +usage=Which ports do you want customer traffic sent to, defaults to 80
		ports?: [...{
			// +usage=Number of port to expose on the pod's IP address
			port: int
		}]
	}
}
```

将定义复制到文件 `replica-webservice.cue` 并应用定义：

```shell
vela def apply replica-webservice.cue
```

然后，用户可以创建下面的应用程序。replication 策略是在其中的 `application.spec.policies` 字段声明。并在 `deploy`
步骤中使用它来影响其结果。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-replication-policy
spec:
  components:
    - name: hello-rep
      type: replica-webservice
      properties:
        image: crccheck/hello-world
        ports:
          - port: 80
            expose: true
  policies:
    - name: replication-default
      type: replication
      properties:
        keys: [ "beijing","hangzhou" ]
        selector: [ "hello-rep" ]

  workflow:
    steps:
      - name: deploy-with-rep
        type: deploy
        properties:
          policies: [ "replication-default" ]
```

然后，应用程序将下发两个 Deployment 和两个 Service：

```shell
vela status app-replication-policy --detail --tree
```

```shell
CLUSTER    NAMESPACE  RESOURCE                      STATUS    APPLY_TIME          DETAIL
local  ─── default─┬─ Service/hello-rep-beijing     updated   2022-11-03 11:26:03 Type: ClusterIP  Cluster-IP: 10.43.26.211  External-IP: <none>
                   │                                                              Port(s): 80/TCP  Age: 3h10m
                   ├─ Service/hello-rep-hangzhou    updated   2022-11-03 11:26:03 Type: ClusterIP  Cluster-IP: 10.43.36.44  External-IP: <none>
                   │                                                              Port(s): 80/TCP  Age: 3h10m
                   ├─ Deployment/hello-rep-beijing  updated   2022-11-03 11:26:03 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 3h10m
                   └─ Deployment/hello-rep-hangzhou updated   2022-11-03 11:26:03 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 3h10m
```

## 注意事项

在步骤中可以使用三种策略 `deploy`： `topology`、 `override` 和 `replication`。它们可以一起用于分裂组件和将组件下发到不同的集群。下面是它们一起使用时的规则：

1. 策略的应用顺序为 `topology` -> `override` -> `replication`
   。更多详细信息，可以参阅[多集群应用](../../case-studies/multi-cluster)
    - `topology` 选择要下发集群。如果不使用，则默认情况下应用程序将资源部署到 Local 群集。
    - `override` 修改组件 Properties。如果不使用，则不会更改任何属性。
    - `replication` 将一个组件分裂为多个组分裂

:::note
默认情况下，KubeVela 所在的控制集群被注册为本地集群。你可以像使用管控集群一样使用它，但是你无法 detach 或 modify 这个集群。
:::

2. `override` 并且 `replication` 可以一起使用。但 `override` 会影响所有分裂的组件。`override` 的主要用意是修改不同群集中的同一个组件的属性。
