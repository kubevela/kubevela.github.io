---
title: Component Replication
---

## Background

In KubeVela, we can dispatch resources across the clusters using `deploy` workflow step and `override`, `topology`
policy.
But projects like [OpenYurt](https://openyurt.io) have finer-grained division like node pool. This requires to dispatch
some similar resources to the same cluster.
These resources are called replication. Back to the example of OpenYurt, it can integrate KubeVela and replicate the
resources then dispatch them to the different node pool.

## Usage

To replicate component, `replication` policy is added as a built-in policy. It can be only used together with `deploy`
workflow step.
If using `replication` policy in `deploy` workflow step, a new field `context.replicaKey` will be added to when
rendering the component. You can use this field to dispatch the resources to the same cluster with
different `replicaKey`.

:::note
`replication` policy is only supported in KubeVela version 1.6.0+.
:::

:::tip
`context.replicaKey` is always used in `metadata.name` in ComponentDefinition or TraitDefinition when dispatching
resources to avoid name conflict. We'll see it later in the example.
:::

## Example

The following ComponentDefinition is an example which make use of `replication` policy. It uses `context.replicaKey` to
add suffixes to resource names.

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

Copy the definition to file `replica-webservice.cue` and apply the definition:

```shell
vela def apply replica-webservice.cue
```

Then user can apply application below. Replication policy is declared in `application.spec.policies`. And it is used in
deploy step to influence its result.

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

Then application will dispatch two deployments and two services:

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

## Notice

There are three policies that can use in `deploy` step: `topology`, `override` and `replication`. They can be used
together to both replicate component and dispatch them to different clusters. Here is the rules when they are use
together:

1. The applying order of policies is `topology` -> `override` -> `replication`. More information can be found
   in [Multi cluster Application](../../case-studies/multi-cluster.md)
    - `topology` pick up which cluster to dispatch. If not used, application deploy resources to local cluster by
      default.
    - `override` modifies the component properties. If not used, no properties will be changed.
    - `replication` will turn one component into multiple ones.

:::note
By default, the hub cluster where KubeVela locates is registered as the local cluster. You can use it like a managed
cluster in spite that you cannot detach it or modify it.
:::

2. `override` and `replication` can be used together. But `override` will affect all replication of the component. It is
   mainly used to modify component properties for different clusters.
