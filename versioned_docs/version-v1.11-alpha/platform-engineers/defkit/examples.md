---
title: Full Examples
---

Complete end-to-end definition examples — one per definition type — showing real-world usage patterns with full Go code and generated CUE output.

## Component Definition — Task

A complete task component that runs a one-time Job to completion. Uses `JobHealth`/`CustomStatus` presets, `OneOf` for typed volume variants, `Each` for volumeMount/volume array mapping, and `MapVariant` for per-type volume configuration.

```go title="Go — components/task.go"
package components

import (
	"github.com/oam-dev/kubevela/pkg/definition/defkit"
)

func Task() *defkit.ComponentDefinition {
	labels := defkit.StringKeyMap("labels").Optional().Description("Specify the labels in the workload")
	annotations := defkit.StringKeyMap("annotations").Optional().Description("Specify the annotations in the workload")
	count := defkit.Int("count").Default(1).Description("Specify number of tasks to run in parallel").Short("c")
	image := defkit.String("image").Description("Which image would you like to use for your service").Short("i")
	imagePullPolicy := defkit.String("imagePullPolicy").
		Optional().
		Values("Always", "Never", "IfNotPresent").
		Description("Specify image pull policy for your service")
	imagePullSecrets := defkit.StringList("imagePullSecrets").Optional().Description("Specify image pull secrets for your service")
	restart := defkit.String("restart").Default("Never").
		Description("Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never.")
	cmd := defkit.StringList("cmd").Optional().Description("Commands to run in the container")
	env := defkit.List("env").Optional().Description("Define arguments by using environment variables").
		WithFields(
			defkit.String("name").Description("Environment variable name"),
			defkit.String("value").Optional().Description("The value of the environment variable"),
			defkit.Object("valueFrom").Optional().Description("Specifies a source the value of this var should come from").
				WithFields(
					defkit.Object("secretKeyRef").Optional().Description("Selects a key of a secret in the pod's namespace").
						WithFields(
							defkit.String("name").Description("The name of the secret in the pod's namespace to select from"),
							defkit.String("key").Description("The key of the secret to select from. Must be a valid secret key"),
						),
					defkit.Object("configMapKeyRef").Optional().Description("Selects a key of a config map in the pod's namespace").
						WithFields(
							defkit.String("name").Description("The name of the config map in the pod's namespace to select from"),
							defkit.String("key").Description("The key of the config map to select from. Must be a valid secret key"),
						),
				),
		)
	cpu := defkit.String("cpu").Optional().Description("Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)")
	memory := defkit.String("memory").Optional().Description("Specifies the attributes of the memory resource required for the container.")
	volumes := defkit.List("volumes").Optional().Description("Declare volumes and volumeMounts").
		WithFields(
			defkit.String("name"),
			defkit.String("mountPath"),
			defkit.OneOf("type").
				Description("Specify volume type, options: \"pvc\",\"configMap\",\"secret\",\"emptyDir\", default to emptyDir").
				Default("emptyDir").
				Variants(
					defkit.Variant("pvc").WithFields(
						defkit.Field("claimName", defkit.ParamTypeString),
					),
					defkit.Variant("configMap").WithFields(
						defkit.Field("defaultMode", defkit.ParamTypeInt).Default(420),
						defkit.Field("cmName", defkit.ParamTypeString),
						defkit.Field("items", defkit.ParamTypeArray).Optional().Nested(
							defkit.Struct("").WithFields(
								defkit.Field("key", defkit.ParamTypeString),
								defkit.Field("path", defkit.ParamTypeString),
								defkit.Field("mode", defkit.ParamTypeInt).Default(511),
							),
						),
					),
					defkit.Variant("secret").WithFields(
						defkit.Field("defaultMode", defkit.ParamTypeInt).Default(420),
						defkit.Field("secretName", defkit.ParamTypeString),
						defkit.Field("items", defkit.ParamTypeArray).Optional().Nested(
							defkit.Struct("").WithFields(
								defkit.Field("key", defkit.ParamTypeString),
								defkit.Field("path", defkit.ParamTypeString),
								defkit.Field("mode", defkit.ParamTypeInt).Default(511),
							),
						),
					),
					defkit.Variant("emptyDir").WithFields(
						defkit.Field("medium", defkit.ParamTypeString).Default("").Values("", "Memory"),
					),
				),
		)
	livenessProbe := defkit.Object("livenessProbe").
		Optional().
		WithSchemaRef("HealthProbe").
		Description("Instructions for assessing whether the container is alive.")
	readinessProbe := defkit.Object("readinessProbe").
		Optional().
		WithSchemaRef("HealthProbe").
		Description("Instructions for assessing whether the container is in a suitable state to serve traffic.")

	return defkit.NewComponent("task").
		Description("Describes jobs that run code or a script to completion.").
		Workload("batch/v1", "Job").
		CustomStatus(defkit.Status().
			IntField("status.active", "status.active", 0).
			IntField("status.failed", "status.failed", 0).
			IntField("status.succeeded", "status.succeeded", 0).
			Message("Active/Failed/Succeeded:\\(status.active)/\\(status.failed)/\\(status.succeeded)").
			Build()).
		HealthPolicy(defkit.JobHealth().Build()).
		Helper("HealthProbe", CronTaskHealthProbeParam()).
		Params(
			labels, annotations,
			count, image, imagePullPolicy, imagePullSecrets,
			restart, cmd, env,
			cpu, memory, volumes,
			livenessProbe, readinessProbe,
		).
		Template(taskTemplate)
}

func taskTemplate(tpl *defkit.Template) {
	vela := defkit.VelaCtx()

	labels := defkit.StringKeyMap("labels")
	annotations := defkit.StringKeyMap("annotations")
	count := defkit.Int("count")
	image := defkit.String("image")
	imagePullPolicy := defkit.String("imagePullPolicy")
	imagePullSecrets := defkit.StringList("imagePullSecrets")
	restart := defkit.String("restart")
	cmd := defkit.StringList("cmd")
	env := defkit.List("env")
	cpu := defkit.String("cpu")
	memory := defkit.String("memory")
	volumes := defkit.List("volumes")

	job := defkit.NewResource("batch/v1", "Job").
		Set("metadata.name", defkit.Interpolation(vela.AppName(), defkit.Lit("-"), vela.Name())).
		Set("spec.parallelism", count).
		Set("spec.completions", count).
		SpreadIf(labels.IsSet(), "spec.template.metadata.labels", labels).
		Set("spec.template.metadata.labels[app.oam.dev/name]", vela.AppName()).
		Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
		SetIf(annotations.IsSet(), "spec.template.metadata.annotations", annotations).
		Set("spec.template.spec.restartPolicy", restart).
		Set("spec.template.spec.containers[0].name", vela.Name()).
		Set("spec.template.spec.containers[0].image", image).
		SetIf(imagePullPolicy.IsSet(), "spec.template.spec.containers[0].imagePullPolicy", imagePullPolicy).
		SetIf(cmd.IsSet(), "spec.template.spec.containers[0].command", cmd).
		SetIf(env.IsSet(), "spec.template.spec.containers[0].env", env).
		If(cpu.IsSet()).
		Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
		Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
		EndIf().
		If(memory.IsSet()).
		Set("spec.template.spec.containers[0].resources.limits.memory", memory).
		Set("spec.template.spec.containers[0].resources.requests.memory", memory).
		EndIf().
		SetIf(volumes.IsSet(), "spec.template.spec.containers[0].volumeMounts",
			defkit.Each(volumes).Map(defkit.FieldMap{
				"mountPath": defkit.FieldRef("mountPath"),
				"name":      defkit.FieldRef("name"),
			})).
		SetIf(volumes.IsSet(), "spec.template.spec.volumes",
			defkit.Each(volumes).
				Map(defkit.FieldMap{
					"name": defkit.FieldRef("name"),
				}).
				MapVariant("type", "pvc", defkit.FieldMap{
					"persistentVolumeClaim": defkit.NestedFieldMap(defkit.FieldMap{
						"claimName": defkit.FieldRef("claimName"),
					}),
				}).
				MapVariant("type", "configMap", defkit.FieldMap{
					"configMap": defkit.NestedFieldMap(defkit.FieldMap{
						"defaultMode": defkit.FieldRef("defaultMode"),
						"name":        defkit.FieldRef("cmName"),
						"items":       defkit.OptionalFieldRef("items"),
					}),
				}).
				MapVariant("type", "secret", defkit.FieldMap{
					"secret": defkit.NestedFieldMap(defkit.FieldMap{
						"defaultMode": defkit.FieldRef("defaultMode"),
						"secretName":  defkit.FieldRef("secretName"),
						"items":       defkit.OptionalFieldRef("items"),
					}),
				}).
				MapVariant("type", "emptyDir", defkit.FieldMap{
					"emptyDir": defkit.NestedFieldMap(defkit.FieldMap{
						"medium": defkit.FieldRef("medium"),
					}),
				})).
		SetIf(imagePullSecrets.IsSet(), "spec.template.spec.imagePullSecrets",
			ImagePullSecretsTransform(imagePullSecrets))

	tpl.Output(job)
}

func init() {
	defkit.Register(Task())
}
```

```yaml title="Generated — ComponentDefinition (vela def apply-module --dry-run)"
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: Describes jobs that run code or a script to completion.
  labels: {}
  name: task
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
                apiVersion: "batch/v1"
                kind:       "Job"
                metadata: name: "\(context.appName)-\(context.name)"
                spec: {
                        parallelism: parameter.count
                        completions: parameter.count
                        template: {
                                metadata: {
                                        labels: {
                                                if parameter["labels"] != _|_ {
                                                        parameter.labels
                                                }
                                                "app.oam.dev/name":      context.appName
                                                "app.oam.dev/component": context.name
                                        }
                                        if parameter["annotations"] != _|_ {
                                                annotations: parameter.annotations
                                        }
                                }
                                spec: {
                                        restartPolicy: parameter.restart
                                        containers: [{
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
                                                if parameter["cmd"] != _|_ {
                                                        command: parameter.cmd
                                                }
                                                if parameter["env"] != _|_ {
                                                        env: parameter.env
                                                }
                                                if parameter["imagePullPolicy"] != _|_ {
                                                        imagePullPolicy: parameter.imagePullPolicy
                                                }
                                                if parameter["volumes"] != _|_ {
                                                        volumeMounts: [for v in parameter.volumes {
                                                                {
                                                                        mountPath: v.mountPath
                                                                        name:      v.name
                                                                }
                                                        }]
                                                }
                                        }]
                                        if parameter["imagePullSecrets"] != _|_ {
                                                imagePullSecrets: [for v in parameter.imagePullSecrets {name: v}]
                                        }
                                        if parameter["volumes"] != _|_ {
                                                volumes: [for v in parameter.volumes {
                                                        {
                                                                name: v.name
                                                                if v.type == "pvc" {
                                                                        persistentVolumeClaim: claimName: v.claimName
                                                                }
                                                                if v.type == "configMap" {
                                                                        configMap: {
                                                                                defaultMode: v.defaultMode
                                                                                if v.items != _|_ {
                                                                                        items: v.items
                                                                                }
                                                                                name: v.cmName
                                                                        }
                                                                }
                                                                if v.type == "secret" {
                                                                        secret: {
                                                                                defaultMode: v.defaultMode
                                                                                if v.items != _|_ {
                                                                                        items: v.items
                                                                                }
                                                                                secretName: v.secretName
                                                                        }
                                                                }
                                                                if v.type == "emptyDir" {
                                                                        emptyDir: medium: v.medium
                                                                }
                                                        }
                                                }]
                                        }
                                }
                        }
                }
        }
        parameter: {
                // +usage=Specify the labels in the workload
                labels?: [string]: string
                // +usage=Specify the annotations in the workload
                annotations?: [string]: string
                // +usage=Specify number of tasks to run in parallel
                // +short=c
                count: *1 | int
                // +usage=Which image would you like to use for your service
                // +short=i
                image: string
                // +usage=Specify image pull policy for your service
                imagePullPolicy?: "Always" | "Never" | "IfNotPresent"
                // +usage=Specify image pull secrets for your service
                imagePullSecrets?: [...string]
                // +usage=Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never.
                restart: *"Never" | string
                // +usage=Commands to run in the container
                cmd?: [...string]
                // +usage=Define arguments by using environment variables
                env?: [...{
                        // +usage=Environment variable name
                        name: string
                        // +usage=The value of the environment variable
                        value?: string
                        // +usage=Specifies a source the value of this var should come from
                        valueFrom?: {
                                // +usage=Selects a key of a secret in the pod's namespace
                                secretKeyRef?: {
                                        // +usage=The name of the secret in the pod's namespace to select from
                                        name: string
                                        // +usage=The key of the secret to select from. Must be a valid secret key
                                        key: string
                                }
                                // +usage=Selects a key of a config map in the pod's namespace
                                configMapKeyRef?: {
                                        // +usage=The name of the config map in the pod's namespace to select from
                                        name: string
                                        // +usage=The key of the config map to select from. Must be a valid secret key
                                        key: string
                                }
                        }
                }]
                // +usage=Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)
                cpu?: string
                // +usage=Specifies the attributes of the memory resource required for the container.
                memory?: string
                // +usage=Declare volumes and volumeMounts
                volumes?: [...{
                        name:      string
                        mountPath: string
                        // +usage=Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir
                        type: *"emptyDir" | "pvc" | "configMap" | "secret"
                        if type == "pvc" {
                                claimName: string
                        }
                        if type == "configMap" {
                                defaultMode: *420 | int
                                cmName:      string
                                items?: [...{
                                        key:  string
                                        path: string
                                        mode: *511 | int
                                }]
                        }
                        if type == "secret" {
                                defaultMode: *420 | int
                                secretName:  string
                                items?: [...{
                                        key:  string
                                        path: string
                                        mode: *511 | int
                                }]
                        }
                        if type == "emptyDir" {
                                medium: *"" | "Memory"
                        }
                }]
                // +usage=Instructions for assessing whether the container is alive.
                livenessProbe?: #HealthProbe
                // +usage=Instructions for assessing whether the container is in a suitable state to serve traffic.
                readinessProbe?: #HealthProbe
        }
        #HealthProbe: {
                // +usage=Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute.
                exec?: {
                        // +usage=A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures.
                        command: [...string]
                }
                // +usage=Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute.
                httpGet?: {
                        // +usage=The endpoint, relative to the port, to which the HTTP GET request should be directed.
                        path: string
                        // +usage=The TCP socket within the container to which the HTTP GET request should be directed.
                        port: int
                        httpHeaders?: [...{
                                name:  string
                                value: string
                        }]
                }
                // +usage=Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute.
                tcpSocket?: {
                        // +usage=The TCP socket within the container that should be probed to assess container health.
                        port: int
                }
                // +usage=Number of seconds after the container is started before the first probe is initiated.
                initialDelaySeconds: *0 | int
                // +usage=How often, in seconds, to execute the probe.
                periodSeconds: *10 | int
                // +usage=Number of seconds after which the probe times out.
                timeoutSeconds: *1 | int
                // +usage=Minimum consecutive successes for the probe to be considered successful after having failed.
                successThreshold: *1 | int
                // +usage=Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe).
                failureThreshold: *3 | int
        }
  status:
    customStatus: |-
      status: {
        active:    *0 | int
        failed:    *0 | int
        succeeded: *0 | int
      } & {
        if context.output.status.active != _|_ {
                active: context.output.status.active
        }
        if context.output.status.failed != _|_ {
                failed: context.output.status.failed
        }
        if context.output.status.succeeded != _|_ {
                succeeded: context.output.status.succeeded
        }
      }
      message: "Active/Failed/Succeeded:\(status.active)/\(status.failed)/\(status.succeeded)"
    healthPolicy: |-
      succeeded: *0 | int
      if context.output.status.succeeded != _|_ {
        succeeded: context.output.status.succeeded
      }
      isHealth: succeeded == context.output.spec.parallelism
  workload:
    definition:
      apiVersion: batch/v1
      kind: Job
    type: jobs.batch
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
    component := defkit.String("component").Description("Specify the component name to apply")
    cluster   := defkit.String("cluster").Default("").Description("Specify the cluster")
    namespace := defkit.String("namespace").Default("").Description("Specify the namespace")

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
        	component: string
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
