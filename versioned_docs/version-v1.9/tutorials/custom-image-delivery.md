---
title: Custom Container Delivery
---

If the default `webservice` component type is not suitable for your team, and you want to get a more simple way to deploy your business application. This guide will help you. Before, you must have the platform manager's permission.

### Simplify the `webservice` type

The default [webservice](../end-user/components/references.md#webservice) component type has more than 10 properties. Maybe your developer only needs to configure the image path and resource limits. For the other properties, the team could set the default values.
If so, you could change the `webservice` definition.

1. Change the UI schema to hide some fields

> This way is only suitable the UI users.

![image](https://kubevela.io/images/1.5/custom-ui-schema.jpg)

On the definition detail page, users could customize the UI schema to setting the UI forms. For example, if you want to hide the ExposeType field, only need to set the disable is `true`.

```yaml
...
- jsonKey: exposeType
  uiType: Select
  label: ExposeType
  disable: true
...
```

More references: [UI Schema](../reference/ui-schema.md)

2. Change the definition and remove or add some fields

If you want to completely remove or add some fields, you should edit the component definition.

> This guide should learn the CUE language.

```bash
vela def get webservice > custom-webservice.cue
```

Refer to the [CUE Basic](../platform-engineers/cue/basic.md) and [Component Definition](../platform-engineers/components/custom-component.md) documents to learn how to custom the `custom-webservice.cue`.

After edit:

```bash
vela def apply custom-webservice.cue
```

### Create a new component type to deploy the war package

If your team uses the war package to deploy the Java application. In KubeVela you could create a new component type to deploy the War package.

```cue
"java-war": {
	alias: ""
	annotations: {}
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
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
			healthPolicy: #"""
				ready: {
					updatedReplicas:    *0 | int
					readyReplicas:      *0 | int
					replicas:           *0 | int
					observedGeneration: *0 | int
				} & {
					if context.output.status.updatedReplicas != _|_ {
						updatedReplicas: context.output.status.updatedReplicas
					}
					if context.output.status.readyReplicas != _|_ {
						readyReplicas: context.output.status.readyReplicas
					}
					if context.output.status.replicas != _|_ {
						replicas: context.output.status.replicas
					}
					if context.output.status.observedGeneration != _|_ {
						observedGeneration: context.output.status.observedGeneration
					}
				}
				isHealth: (context.output.spec.replicas == ready.readyReplicas) && (context.output.spec.replicas == ready.updatedReplicas) && (context.output.spec.replicas == ready.replicas) && (ready.observedGeneration == context.output.metadata.generation || ready.observedGeneration > context.output.metadata.generation)
				"""#
		}
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: {
			name:      context.name
			namespace: context.namespace
		}
		spec: {
			replicas: parameter.replicas
			selector: {
				matchLabels: {
					"app.oam.dev/component": context.name
				}
			}
			template: {
				metadata: {
					labels: {
						"app.oam.dev/name":      context.appName
						"app.oam.dev/component": context.name
						"app.oam.dev/revision":  context.revision
					}
				}
				spec: {
					initContainers: [{
						name:  "prepare-war"
						image: "busybox"
						if parameter["deployToRoot"] != _|_ {
							if parameter["deployToRoot"] {
								command: ["wget", "-O", "/usr/local/tomcat/webapps/ROOT.war", parameter["warURL"]]
							}
						}
						if parameter["deployToRoot"] == _|_ {
							command: ["wget", "-P", "/usr/local/tomcat/webapps/", parameter["warURL"]]
						}
						volumeMounts: [{
							name:      "webapps"
							mountPath: "/usr/local/tomcat/webapps"
						}]
					}]
					containers: [{
						name:  context.name
						image: "tomcat:" + parameter["envVersion"]
						if parameter["cpu"] != _|_ {
							resources: {
								limits: cpu:   parameter.cpu
								requests: cpu: parameter.cpu
							}
						}
						if parameter["memory"] != _|_ {
							resources: {
								limits: memory:   parameter.memory
								requests: memory: parameter.memory
							}
						}
						ports: [{
							containerPort: 8080
							name:          "webapp"
						}]
						_envs: {
							custom: *parameter["env"] | []
							inner: [
								if parameter["javaOpts"] != _|_ {
									{
										name:  "JAVA_OPTS"
										value: parameter.javaOpts
									}
								},
							]
						}
						env: _envs.custom + _envs.inner
						volumeMounts: [{
							name:      "webapps"
							mountPath: "/usr/local/tomcat/webapps"
						}]
					}]
					volumes: [{
						name: "webapps"
						emptyDir: {}
					}]
				}
			}
		}
	}

	outputs: {
		services: {
			kind:       "Service"
			apiVersion: "v1"
			metadata: {
				name:      context.name
				namespace: context.namespace
			}
			spec: {
				selector: "app.oam.dev/component": context.name
				ports: [{
					port: 8080
				}]
				type: "ClusterIP"
			}
		}
	}

	parameter: {
		// +usage=The URL of the war package.
		warURL: string
		// +usage=Select a environment version([tomcat version]-[jdk version])
		envVersion: *"8-jdk8" | "9-jdk8" | "10-jdk8" | "8-jdk11" | "9-jdk11" | "10-jdk11" | "8-jdk17" | "9-jdk17" | "10-jdk17"
		// +usage=Specifies the number of replicas.
		replicas: *1 | int
		// +usage=Define arguments by using environment variables
		env?: [...{
			name:   string
			value?: string
		}]
		// +usage=Setting the Java Opts configuration.
		javaOpts?: string
		// +usage=Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)
		cpu?: string
		// +usage=Specifies the attributes of the memory resource required for the container.
		memory?:       =~"^([1-9][0-9]{0,63})(E|P|T|G|M|K|Ei|Pi|Ti|Gi|Mi|Ki)$"
		deployToRoot?: bool
	}
}
```

Copy the definition and create a file `java-war.cue`, then:

```bash
vela def apply java-war.cue
```

Now, other developers could create the application with a war URL, for example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: nanoservice
  namespace: e2e-test
spec:
  components:
  - name: catalog
    properties:
      envVersion: 8-jdk8
      replicas: 1
      warURL: https://kubevela.io/example/java-example/nanoservice/catalog.war
    type: java-war
  - name: customer
    properties:
      envVersion: 8-jdk8
      replicas: 1
      warURL: https://kubevela.io/example/java-example/nanoservice/customer.war
    type: java-war
  - dependsOn:
    - catalog
    - customer
    name: order
    properties:
      env:
      - name: CATALOG_HOST
        value: catalog
      - name: CUSTOMER_HOST
        value: customer
      envVersion: 8-jdk8
      javaOpts: -Xms512m -Xmx512m -Xss256K
      replicas: 1
      warURL: https://kubevela.io/example/java-example/nanoservice/order.war
    traits:
    - properties:
        domains:
        - nanoservice.beijing.kubevela.net
        rules:
        - path:
            type: PathPrefix
            value: /order
          port: 8080
      type: http-route
    type: java-war
  policies:
  - name: e2e-test
    properties:
      clusters:
      - local
      namespace: e2e-test
    type: topology
  workflow:
    steps:
    - name: deploy2-e2e-test
      properties:
        policies:
        - e2e-test
      type: deploy
```

![java-app](https://kubevela.io/images/1.5/java-war.jpg)

This example includes three components, and the order service depends on the catalog and the customer services. The developer only needs to care about the war package URL and the tomcat/JRE version, they are familiar to the Java developer. The developer should upload the war package to a repository, such as Jfrog. Get a download URL to assign to the `warURL` field.

In the same way, you could create a component type to deploy the Jar package and other's binary packages.
