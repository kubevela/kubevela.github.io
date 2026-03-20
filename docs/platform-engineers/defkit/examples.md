---
title: Full Examples
---

Complete end-to-end definition examples — one per definition type — showing real-world usage patterns with full Go code and generated CUE output.

## Component Definition — Webservice

A complete webservice component that deploys a Deployment with configurable image, ports, environment variables, and resource limits. Uses `DeploymentHealth` and `DeploymentStatus` presets. Demonstrates `ForEachWith` for port name generation and `ForEachWithGuardedFiltered` for an optional Service output.

```go title="Go — components/webservice.go"
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func Webservice() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Which image would you like to use for your service").Short("i")

    ports := defkit.Array("ports").Optional().
        Description("Which ports do you want customer traffic sent to, defaults to 80").
        WithFields(
            defkit.Int("port").
                Description("Number of port to expose on the pod's IP address"),
            defkit.String("name").Optional().Description("Name of the port"),
            defkit.Enum("protocol").Values("TCP", "UDP", "SCTP").Default("TCP"),
            defkit.Bool("expose").Default(false).
                Description("Specify if the port should be exposed"),
        )

    env := defkit.List("env").Optional().
        Description("Define arguments by using environment variables").
        WithFields(
            defkit.String("name").
                Description("Environment variable name"),
            defkit.String("value").
                Description("The value of the environment variable"),
        )

    cpu        := defkit.String("cpu").Optional().Description("CPU units, e.g. `0.5`, `1`")
    memory     := defkit.String("memory").Optional().Description("Memory size, e.g. `128Mi`, `1Gi`")
    exposeType := defkit.Enum("exposeType").
        Values("ClusterIP", "NodePort", "LoadBalancer").
        Default("ClusterIP").
        Description(`Specify what kind of Service you want. options: "ClusterIP", "NodePort", "LoadBalancer"`)

    return defkit.NewComponent("webservice").
        Description("Long-running, scalable containerized service with a stable network endpoint.").
        Workload("apps/v1", "Deployment").
        CustomStatus(defkit.DeploymentStatus().Build()).
        HealthPolicy(defkit.DeploymentHealth().Build()).
        Params(image, ports, env, cpu, memory, exposeType).
        Template(webserviceTemplate)
}

func webserviceTemplate(tpl *defkit.Template) {
    vela   := defkit.VelaCtx()
    image  := defkit.String("image")
    ports  := defkit.Array("ports")
    env    := defkit.List("env")
    cpu    := defkit.String("cpu")
    memory := defkit.String("memory")

    containerPorts := defkit.NewArray().ForEachWith(ports, func(item *defkit.ItemBuilder) {
        v := item.Var()
        item.Set("containerPort", v.Field("port"))
        item.Set("protocol", v.Field("protocol"))
        item.IfSet("name", func() {
            item.Set("name", v.Field("name"))
        })
    })

    deployment := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("metadata.labels[app.oam.dev/name]", vela.AppName()).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        SetIf(ports.IsSet(), "spec.template.spec.containers[0].ports", containerPorts).
        SetIf(env.IsSet(), "spec.template.spec.containers[0].env", env).
        If(cpu.IsSet()).
            Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
            Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
        EndIf().
        If(memory.IsSet()).
            Set("spec.template.spec.containers[0].resources.limits.memory", memory).
            Set("spec.template.spec.containers[0].resources.requests.memory", memory).
        EndIf()

    tpl.Output(deployment)

    exposeType := defkit.String("exposeType")
    exposePortsArray := defkit.NewArray().ForEachWithGuardedFiltered(
        ports.IsSet(),
        defkit.FieldEquals("expose", true),
        ports,
        func(item *defkit.ItemBuilder) {
            v := item.Var()
            item.Set("port", v.Field("port"))
            item.Set("targetPort", v.Field("port"))
        },
    )
    exposePorts := tpl.Helper("exposePorts").
        FromArray(exposePortsArray).AfterOutput().Build()

    service := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports", exposePorts).
        Set("spec.type", exposeType)

    tpl.OutputsIf(exposePorts.NotEmpty(), "webserviceExpose", service)
}

func init() {
    defkit.Register(Webservice())
}
```

```yaml title="Generated — ComponentDefinition (vela def apply-module --dry-run)"
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: Long-running, scalable containerized service with a stable network endpoint.
  labels: {}
  name: webservice
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "apps/v1"
        	kind:       "Deployment"
        	metadata: {
        		name: context.name
        		labels: "app.oam.dev/name": context.appName
        	}
        	spec: {
        		selector: matchLabels: "app.oam.dev/component": context.name
        		template: {
        			metadata: labels: "app.oam.dev/component": context.name
        			spec: containers: [{
        				name:  context.name
        				image: parameter.image
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
        				if parameter["ports"] != _|_ {
        					ports: [
        						for v in parameter.ports {
        							containerPort: v.port
        							protocol:      v.protocol
        							if v.name != _|_ {
        								name: v.name
        							}
        						},
        					]
        				}
        				if parameter["env"] != _|_ {
        					env: parameter.env
        				}
        			}]
        		}
        	}
        }
        exposePorts: [
        	if parameter["ports"] != _|_ for v in parameter.ports if v.expose == true {
        		port:       v.port
        		targetPort: v.port
        	},
        ]
        outputs: {
        	if len(exposePorts) != 0 {
        		webserviceExpose: {
        			apiVersion: "v1"
        			kind:       "Service"
        			metadata: name: context.name
        			spec: {
        				selector: "app.oam.dev/component": context.name
        				ports: exposePorts
        				type:  parameter.exposeType
        			}
        		}
        	}
        }
        parameter: {
        	// +usage=Which image would you like to use for your service
        	// +short=i
        	image?: string
        	// +usage=Which ports do you want customer traffic sent to, defaults to 80
        	ports?: [...{
        		// +usage=Number of port to expose on the pod's IP address
        		port?: int
        		// +usage=Name of the port
        		name?:    string
        		protocol: *"TCP" | "UDP" | "SCTP"
        		// +usage=Specify if the port should be exposed
        		expose: *false | bool
        	}]
        	// +usage=Define arguments by using environment variables
        	env?: [...{
        		// +usage=Environment variable name
        		name?: string
        		// +usage=The value of the environment variable
        		value?: string
        	}]
        	// +usage=CPU units, e.g. `0.5`, `1`
        	cpu?: string
        	// +usage=Memory size, e.g. `128Mi`, `1Gi`
        	memory?: string
        	// +usage=Specify what kind of Service you want. options: "ClusterIP", "NodePort", "LoadBalancer"
        	exposeType: *"ClusterIP" | "NodePort" | "LoadBalancer"
        }
  status:
    customStatus: |-
      ready: {
      	readyReplicas: *0 | int
      } & {
      	if context.output.status.readyReplicas != _|_ {
      		readyReplicas: context.output.status.readyReplicas
      	}
      }
      message: "Ready:\(ready.readyReplicas)/\(context.output.spec.replicas)"
    healthPolicy: |-
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
      _isHealth: (context.output.spec.replicas == ready.readyReplicas) && (context.output.spec.replicas == ready.updatedReplicas) && (context.output.spec.replicas == ready.replicas) && (ready.observedGeneration == context.output.metadata.generation || ready.observedGeneration > context.output.metadata.generation)
      isHealth: *_isHealth | bool
      if context.output.metadata.annotations != _|_ {
      	if context.output.metadata.annotations["app.oam.dev/disable-health-check"] != _|_ {
      		isHealth: true
      	}
      }
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
    type: deployments.apps
```

## Trait Definition — CPUScaler

A complete cpuscaler trait that creates an HPA resource to automatically scale the component based on CPU usage. Demonstrates `tpl.Outputs()` for emitting a secondary resource from a trait.

```go title="Go — traits/cpuscaler.go"
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func CPUScaler() *defkit.TraitDefinition {
    min      := defkit.Int("min").Description("Specify the minimal number of replicas to which the autoscaler can scale down").Default(1)
    max      := defkit.Int("max").Description("Specify the maximum number of of replicas to which the autoscaler can scale up").Default(10)
    cpuUtil  := defkit.Int("cpuUtil").Description("Specify the average CPU utilization, for example, 50 means the CPU usage is 50%").Default(50)
    targetAPIVersion := defkit.String("targetAPIVersion").Description("Specify the apiVersion of scale target").Default("apps/v1")
    targetKind       := defkit.String("targetKind").Description("Specify the kind of scale target").Default("Deployment")

    return defkit.NewTrait("cpuscaler").
        Description("Automatically scale the component based on CPU usage.").
        AppliesTo("deployments.apps", "statefulsets.apps").
        Params(min, max, cpuUtil, targetAPIVersion, targetKind).
        Template(func(tpl *defkit.Template) {
            vela := defkit.VelaCtx()

            hpa := defkit.NewResource("autoscaling/v1", "HorizontalPodAutoscaler").
                Set("metadata.name", vela.Name()).
                Set("spec.scaleTargetRef.apiVersion", targetAPIVersion).
                Set("spec.scaleTargetRef.kind", targetKind).
                Set("spec.scaleTargetRef.name", vela.Name()).
                Set("spec.minReplicas", min).
                Set("spec.maxReplicas", max).
                Set("spec.targetCPUUtilizationPercentage", cpuUtil)

            tpl.Outputs("cpuscaler", hpa)
        })
}

func init() {
    defkit.Register(CPUScaler())
}
```

```yaml title="Generated — TraitDefinition (vela def apply-module --dry-run)"
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: Automatically scale the component based on CPU usage.
  labels: {}
  name: cpuscaler
  namespace: vela-system
spec:
  appliesToWorkloads:
    - deployments.apps
    - statefulsets.apps
  podDisruptive: false
  schematic:
    cue:
      template: |
        outputs: cpuscaler: {
        	apiVersion: "autoscaling/v1"
        	kind:       "HorizontalPodAutoscaler"
        	metadata: name: context.name
        	spec: {
        		scaleTargetRef: {
        			apiVersion: parameter.targetAPIVersion
        			kind:       parameter.targetKind
        			name:       context.name
        		}
        		minReplicas:                    parameter.min
        		maxReplicas:                    parameter.max
        		targetCPUUtilizationPercentage: parameter.cpuUtil
        	}
        }
        parameter: {
        	// +usage=Specify the minimal number of replicas to which the autoscaler can scale down
        	min: *1 | int
        	// +usage=Specify the maximum number of of replicas to which the autoscaler can scale up
        	max: *10 | int
        	// +usage=Specify the average CPU utilization, for example, 50 means the CPU usage is 50%
        	cpuUtil: *50 | int
        	// +usage=Specify the apiVersion of scale target
        	targetAPIVersion: *"apps/v1" | string
        	// +usage=Specify the kind of scale target
        	targetKind: *"Deployment" | string
        }
```

## Policy Definition — Apply Once

A complete apply-once policy that allows configuration drift for applied resources. Demonstrates `defkit.NewPolicy` with inline `Helper` type definitions and `WithSchemaRef` for type reuse across params.

```go title="Go — policies/apply_once.go"
package policies

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ApplyOnce() *defkit.PolicyDefinition {
    applyOnceStrategy := defkit.Struct("strategy").WithFields(
        defkit.Field("affect", defkit.ParamTypeString).
            Description("When the strategy takes effect, e.g. onUpdate, onStateKeep").
            Optional(),
        defkit.Field("path", defkit.ParamTypeArray).
            Of(defkit.ParamTypeString).
            Description("Specify the path of the resource that allow configuration drift"),
    )

    applyOncePolicyRule := defkit.Struct("rule").WithFields(
        defkit.Field("selector", defkit.ParamTypeStruct).
            Description("Specify how to select the targets of the rule").
            Optional().
            WithSchemaRef("ResourcePolicyRuleSelector"),
        defkit.Field("strategy", defkit.ParamTypeStruct).
            Description("Specify the strategy for configuring the resource level configuration drift behaviour").
            WithSchemaRef("ApplyOnceStrategy"),
    )

    resourcePolicyRuleSelector := defkit.Struct("selector").
        WithFields(RuleSelectorFields()...)

    return defkit.NewPolicy("apply-once").
        Description("Allow configuration drift for applied resources, " +
            "delivery the resource without continuously reconciliation.").
        Helper("ApplyOnceStrategy", applyOnceStrategy).
        Helper("ApplyOncePolicyRule", applyOncePolicyRule).
        Helper("ResourcePolicyRuleSelector", resourcePolicyRuleSelector).
        Params(
            defkit.Bool("enable").
                Description("Whether to enable apply-once for the whole application").
                Default(false),
            defkit.Array("rules").
                Description("Specify the rules for configuring apply-once policy in resource level").
                WithSchemaRef("ApplyOncePolicyRule").
                Optional(),
        )
}

func init() {
    defkit.Register(ApplyOnce())
}
```

```yaml title="Generated — PolicyDefinition (vela def apply-module --dry-run)"
apiVersion: core.oam.dev/v1beta1
kind: PolicyDefinition
metadata:
  annotations:
    definition.oam.dev/description: Allow configuration drift for applied resources, delivery the resource without continuously reconciliation.
  labels: {}
  name: apply-once
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        #ApplyOnceStrategy: {
        	// +usage=When the strategy takes effect, e.g. onUpdate, onStateKeep
        	affect?: string
        	// +usage=Specify the path of the resource that allow configuration drift
        	path: [...string]
        }
        #ApplyOncePolicyRule: {
        	// +usage=Specify how to select the targets of the rule
        	selector?: #ResourcePolicyRuleSelector
        	// +usage=Strategy for resource level configuration drift behaviour
        	strategy: #ApplyOnceStrategy
        }
        #ResourcePolicyRuleSelector: {
        	// +usage=Select resources by component names
        	componentNames?: [...string]
        	// +usage=Select resources by component types
        	componentTypes?: [...string]
        	// +usage=Select resources by oamTypes (COMPONENT or TRAIT)
        	oamTypes?: [...string]
        	// +usage=Select resources by trait types
        	traitTypes?: [...string]
        	// +usage=Select resources by resource types (like Deployment)
        	resourceTypes?: [...string]
        	// +usage=Select resources by their names
        	resourceNames?: [...string]
        }
        parameter: {
        	// +usage=Whether to enable apply-once for the whole application
        	enable: *false | bool
        	// +usage=Rules for configuring apply-once policy in resource level
        	rules?: [...#ApplyOncePolicyRule]
        }
```

:::info
Policies use only `.Params()` — no `.Template()` — because KubeVela's built-in engine processes policy params directly. `.Helper("TypeName", struct)` registers a named CUE type (`#TypeName`) that can be referenced via `.WithSchemaRef("TypeName")` in other params.
:::

## WorkflowStep Definition — Apply Component

A complete apply-component workflow step. The simplest definition type — workflow steps often require no template at all because the step execution is handled by KubeVela's built-in step executor.

```go title="Go — workflowsteps/apply_component.go"
package workflowsteps

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ApplyComponent() *defkit.WorkflowStepDefinition {
    component := defkit.String("component").
        Required().
        Description("Specify the component name to apply")

    cluster := defkit.String("cluster").
        Default("").
        Description("Specify the cluster")

    namespace := defkit.String("namespace").
        Default("").
        Description("Specify the namespace")

    return defkit.NewWorkflowStep("apply-component").
        Description("Apply a specific component and its corresponding traits in application").
        Category("Application Delivery").
        Scope("Application").
        Params(component, cluster, namespace)
}

func init() {
    defkit.Register(ApplyComponent())
}
```

```yaml title="Generated — WorkflowStepDefinition (vela def apply-module --dry-run)"
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  annotations:
    custom.definition.oam.dev/category: Application Delivery
    definition.oam.dev/description: Apply a specific component and its corresponding traits in application
  labels:
    custom.definition.oam.dev/scope: Application
  name: apply-component
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        parameter: {
        	// +usage=Specify the component name to apply
        	component!: string
        	// +usage=Specify the cluster
        	cluster: *"" | string
        	// +usage=Specify the namespace
        	namespace: *"" | string
        }
```

:::tip Key patterns per type

**Component** — use preset health/status builders (`DeploymentHealth`, `DeploymentStatus`), `ForEachWith` for per-element logic, and `tpl.OutputsIf` for optional secondary resources.

**Trait** — use `tpl.Outputs(name, resource)` to emit secondary resources (HPA, Service, etc.). Use `tpl.UsePatchContainer(config)` when the trait needs to mutate container specs (env vars, resource limits, volume mounts).

**Policy** — parameters only; use `.Helper("TypeName", struct)` for reusable named CUE types and `.WithSchemaRef()` to reference them in array element schemas.

**WorkflowStep** — often just `.Params()` with `.Category()` and `.Scope()` metadata. Add `.Template()` only when the step needs to generate resources itself.
:::
