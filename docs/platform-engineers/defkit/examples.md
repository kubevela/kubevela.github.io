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

    cpu    := defkit.String("cpu").Optional().Description("CPU units, e.g. `0.5`, `1`")
    memory := defkit.String("memory").Optional().Description("Memory size, e.g. `128Mi`, `1Gi`")

    return defkit.NewComponent("webservice").
        Description("Long-running, scalable containerized service with a stable network endpoint.").
        Workload("apps/v1", "Deployment").
        CustomStatus(defkit.DeploymentStatus().Build()).
        HealthPolicy(defkit.DeploymentHealth().Build()).
        Params(image, ports, env, cpu, memory).
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

```cue title="CUE — generated output (simplified)"
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
                if parameter.ports != _|_ {
                    ports: [for v in parameter.ports {
                        containerPort: v.port
                        protocol:      v.protocol
                        if v.name != _|_ { name: v.name }
                    }]
                }
                if parameter.env != _|_ { env: parameter.env }
                if parameter.cpu != _|_ {
                    resources: {
                        limits:   { cpu: parameter.cpu }
                        requests: { cpu: parameter.cpu }
                    }
                }
            }]
        }
    }
}

if len(exposePorts) > 0 {
    outputs: webserviceExpose: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: context.name
        spec: {
            selector: "app.oam.dev/component": context.name
            ports:    exposePorts
            type:     parameter.exposeType
        }
    }
}
```

## Trait Definition — Env

A complete env trait that injects and merges environment variables into running containers. Uses `tpl.UsePatchContainer` for the full patchSets/patch CUE structure and `CustomPatchContainerBlock` for complex merge logic.

```go title="Go — traits/env.go"
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func Env() *defkit.TraitDefinition {
    return defkit.NewTrait("env").
        Description("Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'").
        AppliesTo("deployments.apps", "statefulsets.apps", "daemonsets.apps", "jobs.batch").
        Template(func(tpl *defkit.Template) {
            tpl.UsePatchContainer(defkit.PatchContainerConfig{
                ContainerNameParam:    "containerName",
                DefaultToContextName:  true,
                AllowMultiple:         true,
                ContainersParam:       "containers",
                ContainersDescription: "Specify the environment variables for multiple containers",
                PatchFields: []defkit.PatchContainerField{
                    {
                        ParamName:    "replace",
                        TargetField:  "replace",
                        ParamType:    "bool",
                        ParamDefault: "false",
                        Description:  "Specify if replacing the whole environment settings for the container",
                    },
                    {
                        ParamName:   "env",
                        TargetField: "env",
                        ParamType:   "[string]: string",
                        Description: "Specify the environment variables to merge",
                    },
                    {
                        ParamName:    "unset",
                        TargetField:  "unset",
                        ParamType:    "[...string]",
                        ParamDefault: "[]",
                        Description:  "Specify which existing environment variables to unset",
                    },
                },
                CustomPatchContainerBlock: `_params: #PatchParams
name:    _params.containerName
_delKeys: {for k in _params.unset {(k): ""}}
_baseContainers: context.output.spec.template.spec.containers
_matchContainers_: [for _c_ in _baseContainers if _c_.name == name {_c_}]
if len(_matchContainers_) == 0 {
    err: "container \(name) not found"
}
if len(_matchContainers_) > 0 {
    _baseContainer: _matchContainers_[0]
    _baseEnv:       _baseContainer.env
    if _baseEnv == _|_ {
        env: [for k, v in _params.env if _delKeys[k] == _|_ {name: k, value: v}]
    }
    if _baseEnv != _|_ {
        env: [for e in _baseEnv
              if _delKeys[e.name] == _|_ && !_params.replace {
                  name: e.name
                  if _params.env[e.name] != _|_ { value: _params.env[e.name] }
                  if _params.env[e.name] == _|_ {
                      if e.value != _|_ { value: e.value }
                      if e.valueFrom != _|_ { valueFrom: e.valueFrom }
                  }
              }] + [for k, v in _params.env
              if _delKeys[k] == _|_ && (_params.replace || _baseEnvMap[k] == _|_) {
                  name: k, value: v
              }]
    }
}`,
            })
        })
}

func init() {
    defkit.Register(Env())
}
```

```cue title="CUE — generated patchSets/patch structure"
#PatchParams: {
    containerName?: *context.name | string
    containers?: [...{
        containerName?: string
        replace:  *false | bool
        env:      [string]: string
        unset:    *[] | [...string]
    }]
    replace:  *false | bool
    env:      [string]: string
    unset:    *[] | [...string]
}

patchSets: [{
    name: "container-patch"
    patches: [{
        path:  "spec/template/spec/containers/*"
        op:    "add"
        value: _
    }]
}]

patch: spec: template: spec: {
    containers: [_params: #PatchParams
        name:     _params.containerName
        _delKeys: {for k in _params.unset {(k): ""}}
        ...
    ]
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
            Description("Specify the path of the resource that allow configuration drift").
            Required(),
    )

    applyOncePolicyRule := defkit.Struct("rule").WithFields(
        defkit.Field("selector", defkit.ParamTypeStruct).
            Description("Specify how to select the targets of the rule").
            Optional().
            WithSchemaRef("ResourcePolicyRuleSelector"),
        defkit.Field("strategy", defkit.ParamTypeStruct).
            Description("Strategy for resource level configuration drift behaviour").
            WithSchemaRef("ApplyOnceStrategy").
            Required(),
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
                Description("Rules for configuring apply-once policy in resource level").
                WithSchemaRef("ApplyOncePolicyRule").
                Optional(),
        )
}

func init() {
    defkit.Register(ApplyOnce())
}
```

```cue title="CUE — generated parameter schema"
#ApplyOnceStrategy: {
    affect?: string
    path:    [...string]
}

#ApplyOncePolicyRule: {
    selector?: #ResourcePolicyRuleSelector
    strategy:  #ApplyOnceStrategy
}

#ResourcePolicyRuleSelector: {
    componentNames?: [...string]
    componentTypes?: [...string]
    oamTypes?:       [...string]
    traitTypes?:     [...string]
    resourceTypes?:  [...string]
    resourceNames?:  [...string]
}

parameter: {
    // Whether to enable apply-once for the whole application
    enable: *false | bool

    // Resource-level rules (optional)
    rules?: [...#ApplyOncePolicyRule]
}

// Example usage in an Application manifest:
//
// policies:
//   - name: my-apply-once
//     type: apply-once
//     properties:
//       enable: true
//       rules:
//         - selector:
//             componentNames: ["my-db"]
//           strategy:
//             affect: onUpdate
//             path: ["spec.replicas"]
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

```cue title="CUE — generated parameter schema"
parameter: {
    // Specify the component name to apply (required)
    component: string

    // Specify the cluster (defaults to local cluster)
    cluster: *"" | string

    // Specify the namespace (defaults to application namespace)
    namespace: *"" | string
}

// Example usage in an Application workflow:
//
// workflow:
//   steps:
//     - name: deploy-backend
//       type: apply-component
//       properties:
//         component: backend
//
//     - name: deploy-frontend
//       type: apply-component
//       properties:
//         component: frontend
//         cluster:   prod-cluster
//         namespace: production
//
// The step executor reads parameter.component, parameter.cluster,
// and parameter.namespace to locate and apply the component.
// No template function is needed because the built-in executor
// handles the apply logic.
```

:::tip Key patterns per type

**Component** — use preset health/status builders (`DeploymentHealth`, `DeploymentStatus`), `ForEachWith` for per-element logic, and `tpl.OutputsIf` for optional secondary resources.

**Trait** — `tpl.UsePatchContainer(config)` generates the full `#PatchParams`, `patchSets`, and `patch` blocks automatically. Use `CustomPatchContainerBlock` only when list comprehensions or complex merge logic is needed.

**Policy** — parameters only; use `.Helper("TypeName", struct)` for reusable named CUE types and `.WithSchemaRef()` to reference them in array element schemas.

**WorkflowStep** — often just `.Params()` with `.Category()` and `.Scope()` metadata. Add `.Template()` only when the step needs to generate resources itself.
:::
