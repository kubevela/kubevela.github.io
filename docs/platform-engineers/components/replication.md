---
title: Component Replication
---

Sometimes you need several copies of one component in the same cluster, for example one per [OpenYurt](https://openyurt.io) node pool. The `replication` policy makes one copy per key.

No built-in component or trait type supports it. The policy only sets `context.replicaKey` while each copy renders; it is up to the definition to use that key, so an application developer can use `replication` only with a component type you have written for it. This page shows how to write one.

## How it works

An application lists the keys in a `replication` policy and passes the policy to a `deploy` workflow step; the policy has no effect anywhere else. For each key, the step renders the selected components once, with `context.replicaKey` set to that key.

A replicable definition must put `context.replicaKey` in `metadata.name`, or the copies collide. Put it in the selector labels too, so each copy's Service picks only its own pods. Guard each use with `if context.replicaKey != _|_`, so the definition still works in an application without the policy.

## Write a replicable component

The following ComponentDefinition adds the key as a suffix to its Deployment and Service names, and as an `app.oam.dev/replicaKey` label.

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

## Use it in an application

An application declares the policy in `spec.policies`, with the keys and the components to replicate (`selector`), and names it in a `deploy` step:

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

The application dispatches two Deployments and two Services, one of each per key:

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

## Combine with topology and override

A `deploy` step can take `topology`, `override` and `replication` policies together, to replicate a component and dispatch the copies to several clusters. They apply in this order:

1. `topology` picks the clusters to dispatch to. Without it, the step deploys to the `local` cluster, the hub where KubeVela runs.
2. `override` changes the component's properties. It applies to every copy of the component, so use it for what differs between clusters, not between keys.
3. `replication` turns each selected component into one copy per key.

See [Multi-cluster Application Delivery](../../end-user/policies/multi-cluster.md) for `topology`, and [Override Configuration per Cluster](../../end-user/policies/multi-cluster-override.md) for `override`, and the [policy reference](../../end-user/policies/references.md#replication) for the `replication` fields.
