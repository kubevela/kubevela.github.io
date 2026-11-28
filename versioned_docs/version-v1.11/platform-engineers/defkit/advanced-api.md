---
title: Advanced API Methods
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Additional methods used in complex definitions — patch container fields, array builders, field transformations, workflow op builders, and cross-cutting validators. The section snippets below show the API surface for each method; the three [Complete Examples](#complete-example--trait) at the end stitch them together into working trait, component, and workflow-step definitions whose generated CUE has been validated against the defkit module loader.

## Patch Container Fields

### `defkit.PatchField()`

Defines a single patch field for container mutation. Chain: `.Strategy(strategy)` (retainKeys, merge, replace), `.NotEmpty()` (reject empty values), `.Description(text)`.

Applies to: **Trait**

```go title="Go — defkit"
defkit.PatchField("image").Strategy("retainKeys").Description("Container image")
```

```cue title="CUE — generated"
// +patchStrategy=retainKeys
image: string
```

### `defkit.PatchFields()`

Groups multiple `PatchField` definitions into a config used in `PatchContainerConfig`.

Applies to: **Trait**

```go title="Go — defkit"
defkit.PatchFields(
    defkit.PatchField("image").Strategy("retainKeys"),
    defkit.PatchField("resources"),
)
// Used with:
tpl.UsePatchContainer(defkit.PatchContainerConfig{
    PatchFields: defkit.PatchFields(...),
})
```

```cue title="CUE — generated"
#PatchParams: {
  image?:     string
  resources?: {...}
}
```

## Resource-Producing Traits

Traits can create new resources (e.g., a Service) instead of patching the workload. Use `tpl.Outputs()` inside the trait template — the same method used in component templates — to emit auxiliary resources.

Applies to: **Trait**

```go title="Go — defkit"
trait := defkit.NewTrait("expose").
    Description("Expose workload via Service").
    AppliesTo("deployments.apps").
    Stage("PostDispatch").
    Params(
        defkit.Int("port").Default(80).Description("Service port"),
        defkit.String("type").Default("ClusterIP").Description("Service type"),
    ).
    Template(func(tpl *defkit.Template) {
        service := defkit.NewResource("v1", "Service").
            Set("metadata.name", defkit.VelaCtx().Name()).
            Set("spec.type", defkit.ParamRef("type")).
            Set("spec.ports[0].port", defkit.ParamRef("port"))
        tpl.Outputs("service", service)
    })
```

```cue title="CUE — generated"
expose: {
    type: "trait"
    annotations: {}
    description: "Expose workload via Service"
    attributes: {
        podDisruptive: false
        stage:         "PostDispatch"
        appliesToWorkloads: ["deployments.apps"]
    }
}
template: {
    outputs: service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: context.name
        spec: {
            type: parameter.type
            ports: [{
                port: parameter.port
            }]
        }
    }
    parameter: {
        // +usage=Service port
        port: *80 | int
        // +usage=Service type
        type: *"ClusterIP" | string
    }
}
```

## Reading Component Context

Traits can inspect the component's output resource using `ContextOutput()`. `.Field(path)` accesses a nested field for use in patches or conditions. `.HasPath(path)` returns a boolean condition — true if the path exists in the output.

Applies to: **Trait**

```go title="Go — defkit"
ref := defkit.ContextOutput()

templateRef := defkit.ContextOutput().Field("spec.template")

hasTemplate := defkit.ContextOutput().HasPath("spec.template")

patch := defkit.NewPatchResource()
patch.If(hasTemplate).
    Set("spec.template.metadata.labels.app", defkit.Lit("test")).
    EndIf()
```

```cue title="CUE — generated"
// .HasPath("spec.template")
context.output.spec.template != _|_

// .Field("spec.template")
context.output.spec.template
```

## Array Builders

### `defkit.NewArray().Item()` / `defkit.NewArrayElement()`

Builds a CUE array literal with explicit items. Use when you need to construct an array value inline (not iterate over params). `NewArrayElement` builds a single object element supporting the same `.Set()`, `.SetIf()` methods as `NewResource`.

```go title="Go — defkit"
defkit.NewArray().Item(
    defkit.NewArrayElement().Set("kind", defkit.Lit("ServiceAccount")),
)

vela := defkit.VelaCtx()
defkit.NewArrayElement().
    Set("name", vela.Name()).
    Set("namespace", vela.Namespace())
```

```cue title="CUE — generated"
[{kind: "ServiceAccount"}]

{name: context.name, namespace: context.namespace}
```

### `defkit.OpenArray()`

Parameter type for an array with open schema (no element type constraint).

```go title="Go — defkit"
defkit.OpenArray("items")
```

```cue title="CUE — generated"
items: [...{...}]
```

### `defkit.DynamicMap()`

Replaces the entire `parameter` block with a dynamic map. When a definition uses `DynamicMap`, the `parameter` schema becomes `[string]: T` rather than a named-field struct.

```go title="Go — defkit"
defkit.DynamicMap().ValueTypeUnion("string | null")
```

```cue title="CUE — generated"
parameter: [string]: string | null
```

## Field Reference & Transformation

### `defkit.ParameterField()` / `defkit.ParamPath()`

`ParameterField` returns the value at a dot-notation path inside `parameter`. `ParamPath` returns a reference that supports `.IsSet()` as a condition.

Applies to: **Template**

```go title="Go — defkit"
defkit.ParameterField("strategy.type")
defkit.ParamPath("podAffinity.required").IsSet()
```

```cue title="CUE — generated"
parameter.strategy.type
parameter.podAffinity.required != _|_
```

### `defkit.FieldRef()`

Inside a `ForEachIn` / `From` iteration context, references a field of the current element by name.

Applies to: **Template**

```go title="Go — defkit"
defkit.ForEachIn(constraints).MapFields(defkit.FieldMap{
    "maxSkew": defkit.FieldRef("maxSkew"),
})
```

```cue title="CUE — generated"
[for v in parameter.constraints {
    maxSkew: v.maxSkew
}]
```

### `defkit.ForEachIn()`

Transforms an array parameter by mapping each element's fields. Returns a CUE list comprehension.

Applies to: **Template**

```go title="Go — defkit"
defkit.ForEachIn(constraints).MapFields(defkit.FieldMap{
    "maxSkew":           defkit.FieldRef("maxSkew"),
    "topologyKey":       defkit.FieldRef("topologyKey"),
    "whenUnsatisfiable": defkit.FieldRef("whenUnsatisfiable"),
})
```

```cue title="CUE — generated"
[for v in parameter.constraints {
    maxSkew:           v.maxSkew
    topologyKey:       v.topologyKey
    whenUnsatisfiable: v.whenUnsatisfiable
}]
```

### `defkit.From()`

Similar to `ForEachIn` but with filter and guard support. `.Filter(cond)` filters elements, `.Guard(cond)` wraps the whole expression in an if-guard.

Applies to: **Template**

```go title="Go — defkit"
defkit.From(privileges).
    Filter(defkit.FieldEquals("scope", "cluster")).
    Guard(privileges.IsSet())
```

```cue title="CUE — generated"
if parameter["privileges"] != _|_ {
    [for v in parameter.privileges
     if v.scope == "cluster" { v }]
}
```

### `defkit.LenGt()`

Returns a condition that is true when the length of an array expression is greater than `n`.

Applies to: **Template**

```go title="Go — defkit"
defkit.LenGt(clusterPrivsRef, 0)
```

```cue title="CUE — generated"
len(_clusterPrivileges) > 0
```

## Workflow Op Builders

Pre-built builders for common workflow step actions. Each generates the appropriate CUE action block with the correct import.

| Constructor | Chain Methods | Description |
|---|---|---|
| `KubeRead(apiVersion, kind)` | `.Name(v)`, `.Namespace(v)`, `.NamespaceIf(cond, v)`, `.Cluster(v)` | Reads a Kubernetes resource by GVK and name. Generates `kube.#Read`. |
| `KubeApply(objectValue)` | `.Cluster(v)` | Applies (creates/updates) a Kubernetes resource. Generates `kube.#Apply`. |
| `HTTPPost(url Value)` | `.Body(v)`, `.Header(key, value)` | Makes an HTTP POST request. Generates `http.#HTTPDo` with method POST. |
| `ConvertString(input)` | — | Converts a value to a string. Generates `util.#ConvertString`. |
| `WaitUntil(continueExpr)` | `.Guard(guards...)`, `.MessageIf(cond, val)` | Pauses the workflow until a condition becomes true. Generates `builtin.#ConditionalWait`. |
| `Fail(message Value)` | — | Fails the workflow step with an error message. Generates `builtin.#Fail`. |

## Validators & Conditional Params

**Validator Builder**: `Validate(message string) *Validator`

| Method | Description |
|---|---|
| `.FailWhen(cond Condition)` | Condition that triggers validation failure. |
| `.OnlyWhen(guard Condition)` | Guard: only run this validator when guard is true. |
| `.WithName(name string)` | Custom CUE name (`_validateName`). |

Attach to definitions via `.Validators(...)` on Component, ArrayParam, or MapParam.

**ConditionalParams**: `ConditionalParams(branches...)` with `WhenParam(cond).Params(...)` and `.Validators(...)` for conditional parameter visibility.

## Complete Example — Trait

The `advanced-api-trait` trait exposes the workload via a Service (resource-producing) and patches the pod template with two labels — one always-present, one only added when the workload has a `spec.template` path. It exercises `tpl.Outputs(...)` for the auxiliary resource, `defkit.ContextOutput().HasPath(...)` for reading the component's output shape, and `tpl.Patch().Set(...).SetIf(cond, ...)` for the conditional patch block.

The trait runs at `PreDispatch` so the workload patches land on the dispatched Deployment. (A `PostDispatch` trait can still `tpl.Outputs(...)` companion resources, but its `tpl.Patch(...)` calls won't take effect on the workload itself, which has already been sent to the cluster.)

Drop the file below into `my-platform/traits/`. The CUE tab shows what `vela def gen-module` generates; the module passes `vela def validate-module` and `vela def apply-module`, and an Application referencing this trait was verified end-to-end on a k3d cluster (the rendered Deployment carries both `metadata.labels.managedBy: advanced-api-trait` and `spec.template.metadata.labels.exposedBy: advanced-api-trait`, plus an accompanying `Service`).

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func AdvancedAPITrait() *defkit.TraitDefinition {
    port := defkit.Int("port").Default(80).Description("Service port")
    typ := defkit.String("type").
        Values("ClusterIP", "NodePort", "LoadBalancer").
        Default("ClusterIP").
        Description("Service type")

    return defkit.NewTrait("advanced-api-trait").
        Description("Expose the workload via a Service and label the pod template").
        AppliesTo("deployments.apps").
        Stage("PreDispatch").
        PodDisruptive(false).
        Params(port, typ).
        Template(advancedAPITraitTemplate)
}

func advancedAPITraitTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()

    // Resource-producing trait: emit a Service alongside the workload.
    svc := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.type", defkit.ParamRef("type")).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports[0].port", defkit.ParamRef("port")).
        Set("spec.ports[0].targetPort", defkit.ParamRef("port"))
    tpl.Outputs("service", svc)

    // Context-aware patch: always add a managedBy label, and only add
    // the exposedBy label when the workload has spec.template.
    hasTemplate := defkit.ContextOutput().HasPath("spec.template")
    tpl.Patch().
        Set("metadata.labels.managedBy", defkit.Lit("advanced-api-trait")).
        SetIf(hasTemplate,
            "spec.template.metadata.labels.exposedBy",
            defkit.Lit("advanced-api-trait"))
}

func init() { defkit.Register(AdvancedAPITrait()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"advanced-api-trait": {
    type: "trait"
    annotations: {}
    labels: {}
    description: "Expose the workload via a Service and label the pod template"
    attributes: {
        podDisruptive: false
        stage:         "PreDispatch"
        appliesToWorkloads: ["deployments.apps"]
    }
}
template: {
    patch: {
        metadata: labels: managedBy: "advanced-api-trait"
        if context.output.spec.template != _|_ {
            spec: template: metadata: labels: exposedBy: "advanced-api-trait"
        }
    }
    outputs: service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: context.name
        spec: {
            type: parameter.type
            selector: "app.oam.dev/component": context.name
            ports: [{
                port:       parameter.port
                targetPort: parameter.port
            }]
        }
    }
    parameter: {
        // +usage=Service port
        port: *80 | int
        // +usage=Service type
        type: *"ClusterIP" | "NodePort" | "LoadBalancer"
    }
}
```

</TabItem>
</Tabs>

> **Note.** Both label keys above use plain identifiers (`managedBy`, `exposedBy`) because the patch-tree CUE generator does not currently quote bracket-key paths like `labels[kubevela.io/exposed-by]` the way `tpl.Output(...)` does — those would render as a bare list expression and fail CUE parsing. For Kubernetes-style dotted/hyphenated label keys, set them via `tpl.Outputs(...)` on a separate resource or use simple identifier keys inside `tpl.Patch()`.

## Complete Example — Component template

The `advanced-api-component` component exercises the template internals from the [Array Builders](#array-builders), [Field Reference & Transformation](#field-reference--transformation), and [Validators & Conditional Params](#validators--conditional-params) sections in a single definition. It builds a Deployment with topology spread constraints transformed from a typed array parameter, optional tolerations gated by `ParamPath().IsSet()`, a fixed `initContainer` built with `NewArray().Item(NewArrayElement()...)`, a cross-field `Validators(...)` rule, and a `ConditionalParams(...)` block that surfaces `maxSurge` only under the `RollingUpdate` strategy.

Drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func AdvancedAPIComponent() *defkit.ComponentDefinition {
    image := defkit.String("image").Description("Container image")
    replicas := defkit.Int("replicas").Default(3).Description("Replica count")
    strategy := defkit.String("strategy").
        Values("Recreate", "RollingUpdate").
        Default("RollingUpdate").
        Description("Deployment strategy")

    constraints := defkit.Array("constraints").
        Description("Topology spread constraints").
        Optional()

    tolerations := defkit.OpenArray("tolerations").
        Description("Pod tolerations (open shape)")

    rollingOK := defkit.Validate("strategy=RollingUpdate requires replicas>=2").
        WithName("_validateRolling").
        OnlyWhen(defkit.String("strategy").Eq("RollingUpdate")).
        FailWhen(defkit.Int("replicas").Lt(2))

    conditional := defkit.ConditionalParams(
        defkit.WhenParam(defkit.String("strategy").Eq("RollingUpdate")).Params(
            defkit.Int("maxSurge").Default(1).Description("Max surge during rollout"),
        ),
    )

    return defkit.NewComponent("advanced-api-component").
        Description("Deployment with topology spread constraints and conditional rollout surge").
        Workload("apps/v1", "Deployment").
        PodSpecPath("spec.template.spec").
        Params(image, replicas, strategy, constraints, tolerations).
        Validators(rollingOK).
        ConditionalParams(conditional).
        Template(advancedAPIComponentTemplate)
}

func advancedAPIComponentTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    replicas := defkit.Int("replicas")
    strategy := defkit.String("strategy")
    constraints := defkit.Array("constraints")
    tolerations := defkit.OpenArray("tolerations")

    // ForEachIn + MapFields + FieldRef: map each constraint to its k8s shape.
    constraintList := defkit.ForEachIn(constraints).MapFields(defkit.FieldMap{
        "maxSkew":           defkit.FieldRef("maxSkew"),
        "topologyKey":       defkit.FieldRef("topologyKey"),
        "whenUnsatisfiable": defkit.FieldRef("whenUnsatisfiable"),
    })

    // LenGt: only emit topologySpreadConstraints when the param has entries.
    hasConstraints := defkit.LenGt(constraints, 0)

    // ParamPath().IsSet(): gate tolerations on whether the user set it.
    hasTolerations := defkit.ParamPath("tolerations").IsSet()

    // NewArray + NewArrayElement: build a fixed initContainer list value.
    initContainers := defkit.NewArray().Item(
        defkit.NewArrayElement().
            Set("name", defkit.Lit("logger")).
            Set("image", defkit.Lit("busybox:latest")),
    )

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.replicas", replicas).
        Set("spec.strategy.type", strategy).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        SetIf(hasConstraints, "spec.template.spec.topologySpreadConstraints", constraintList).
        SetIf(hasTolerations, "spec.template.spec.tolerations", tolerations).
        Set("spec.template.spec.initContainers", initContainers)

    tpl.Output(dep)
}

func init() { defkit.Register(AdvancedAPIComponent()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"advanced-api-component": {
    type: "component"
    annotations: {}
    labels: {}
    description: "Deployment with topology spread constraints and conditional rollout surge"
    attributes: {
        workload: {
            definition: {
                apiVersion: "apps/v1"
                kind:       "Deployment"
            }
            type: "deployments.apps"
        }
    }
}
template: {
    output: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
        metadata: {
            name: context.name
        }
        spec: {
            replicas: parameter.replicas
            strategy: {
                type: parameter.strategy
            }
            selector: {
                matchLabels: {
                    "app.oam.dev/component": context.name
                }
            }
            template: {
                metadata: {
                    labels: {
                        "app.oam.dev/component": context.name
                    }
                }
                spec: {
                    containers: [{
                        name: context.name
                        image: parameter.image
                    }]
                    initContainers: [{
                        image: "busybox:latest"
                        name:  "logger"
                    }]
                    if len(parameter.constraints) > 0 {
                        topologySpreadConstraints: [for v in parameter.constraints {
                            maxSkew:           v.maxSkew
                            topologyKey:       v.topologyKey
                            whenUnsatisfiable: v.whenUnsatisfiable
                        }]
                    }
                    if parameter.tolerations != _|_ {
                        tolerations: parameter.tolerations
                    }
                }
            }
        }
    }
    parameter: {
        // +usage=Container image
        image: string
        // +usage=Replica count
        replicas: *3 | int
        // +usage=Deployment strategy
        strategy: *"RollingUpdate" | "Recreate"
        // +usage=Topology spread constraints
        constraints?: [..._]
        // +usage=Pod tolerations (open shape)
        tolerations: _
        if parameter.strategy == "RollingUpdate" {
            _validateRolling: {
                "strategy=RollingUpdate requires replicas>=2": true
                if parameter.replicas < 2 {
                    "strategy=RollingUpdate requires replicas>=2": false
                }
            }
        }
        if parameter.strategy == "RollingUpdate" {
            // +usage=Max surge during rollout
            maxSurge: *1 | int
        }
    }
}
```

</TabItem>
</Tabs>

## Complete Example — WorkflowStep

The `advanced-api-workflowstep` step reads a Secret, base64-decodes one of its keys, writes the decoded value into a target ConfigMap, waits for the apply to settle, and POSTs the value to a webhook URL. It exercises every op builder from the [Workflow Op Builders](#workflow-op-builders) table: `KubeRead`, `Fail` (gated on a parameter flag), `ConvertString` paired with `base64.Decode(...)`, `KubeApply` with a value built inline via `NewArrayElement()`, `WaitUntil(...).Guard(...).MessageIf(...)`, and `HTTPPost(...).Body(...).Header(...)`.

`WithImports("vela/kube", "vela/http", "vela/util", "vela/builtin", "encoding/base64")` is mandatory — defkit's op builders emit `kube.#Read`, `kube.#Apply`, `util.#ConvertString`, `builtin.#Fail`, `builtin.#ConditionalWait`, and `http.#HTTPDo` without auto-injecting their imports, so the generated CUE fails OpenAPI-schema generation if any of these packages is missing.

The example below was verified end-to-end on a k3d cluster against a Secret containing a `greeting: "hello from defkit"` key — the step produces a ConfigMap whose `data.value` is the decoded greeting and POSTs it to the supplied URL.

Drop the file below into `my-platform/workflowsteps/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package workflowsteps

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func AdvancedAPIWorkflowstep() *defkit.WorkflowStepDefinition {
    secretName := defkit.String("secretName").Description("Source Secret name")
    secretKey := defkit.String("secretKey").Description("Data key inside the Secret")
    targetName := defkit.String("targetName").Description("Target ConfigMap name")
    namespace := defkit.String("namespace").Default("default").
        Description("Namespace for source Secret and target ConfigMap")
    webhookURL := defkit.String("webhookURL").Description("Webhook URL for the notification")
    panicMode := defkit.Bool("panicMode").Default(false).
        Description("If true, abort the workflow before doing anything")

    return defkit.NewWorkflowStep("advanced-api-workflowstep").
        Description("Read a Secret value, decode it, write a ConfigMap, and POST a notification").
        Category("Resource Management").
        Scope("Application").
        WithImports("vela/kube", "vela/http", "vela/util", "vela/builtin", "encoding/base64").
        Params(secretName, secretKey, targetName, namespace, webhookURL, panicMode).
        Template(advancedAPIWorkflowstepTemplate)
}

func advancedAPIWorkflowstepTemplate(tpl *defkit.WorkflowStepTemplate) {
    // KubeRead: fetch the source Secret.
    tpl.Set("read", defkit.KubeRead("v1", "Secret").
        Name(defkit.ParamRef("secretName")).
        Namespace(defkit.ParamRef("namespace")))

    // Fail: abort immediately when panicMode=true. Gate Fail on a parameter
    // rather than on a prior action's $returns — the workflow engine
    // evaluates top-level conditionals before the action runs, so
    // `Not(PathExists("read.$returns.value.data"))` would fire on the
    // first cycle even when the Secret has data.
    panicMode := defkit.Bool("panicMode")
    tpl.SetIf(
        panicMode.IsTrue(),
        "fail",
        defkit.Fail(defkit.Lit("workflow aborted by panicMode=true")),
    )

    // ConvertString: base64-decode the targeted Secret key into a string.
    tpl.Set("decoded", defkit.ConvertString(
        defkit.Reference("base64.Decode(null, read.$returns.value.data[parameter.secretKey])"),
    ))

    // KubeApply: write the decoded value into a ConfigMap. Build the target
    // value with NewArrayElement (which implements Value, unlike NewResource).
    target := defkit.NewArrayElement().
        Set("apiVersion", defkit.Lit("v1")).
        Set("kind", defkit.Lit("ConfigMap")).
        Set("metadata", defkit.NewArrayElement().
            Set("name", defkit.ParamRef("targetName")).
            Set("namespace", defkit.ParamRef("namespace"))).
        Set("data", defkit.NewArrayElement().
            Set("value", defkit.Reference("decoded.$returns.str")))
    tpl.Set("apply", defkit.KubeApply(target))

    // WaitUntil: wait for the apply to settle, guarded by metadata presence.
    tpl.Set("wait", defkit.WaitUntil(
        defkit.Reference("apply.$returns.value.metadata.name != _|_"),
    ).Guard(
        defkit.Reference("apply.$returns.value.metadata"),
    ).MessageIf(
        defkit.PathExists("apply.$returns.value.metadata.name"),
        defkit.Reference("apply.$returns.value.metadata.name"),
    ))

    // HTTPPost: notify the webhook with the decoded value.
    tpl.Set("notify", defkit.HTTPPost(defkit.ParamRef("webhookURL")).
        Body(defkit.Reference("decoded.$returns.str")).
        Header("Content-Type", "text/plain"))
}

func init() { defkit.Register(AdvancedAPIWorkflowstep()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
import (
    "vela/kube"
    "vela/http"
    "vela/util"
    "vela/builtin"
    "encoding/base64"
)

"advanced-api-workflowstep": {
    type: "workflow-step"
    annotations: {
        "category": "Resource Management"
    }
    labels: {
        "scope": "Application"
    }
    description: "Read a Secret value, decode it, write a ConfigMap, and POST a notification"
}
template: {
    read: kube.#Read & {
        $params: value: {
            apiVersion: "v1"
            kind:       "Secret"
            metadata: {
                name:      parameter.secretName
                namespace: parameter.namespace
            }
        }
    }
    if parameter.panicMode {
        fail: builtin.#Fail & {
            $params: message: "workflow aborted by panicMode=true"
        }
    }
    decoded: util.#ConvertString & {
        $params: bt: base64.Decode(null, read.$returns.value.data[parameter.secretKey])
    }
    apply: kube.#Apply & {
        $params: value: {
            apiVersion: "v1"
            kind:       "ConfigMap"
            metadata: {
                name:      parameter.targetName
                namespace: parameter.namespace
            }
            data: {
                value: decoded.$returns.str
            }
        }
    }
    wait: builtin.#ConditionalWait & {
        if apply.$returns.value.metadata != _|_ {
            $params: continue: apply.$returns.value.metadata.name != _|_
        }
        if apply.$returns.value.metadata.name != _|_ {
            $params: message: apply.$returns.value.metadata.name
        }
    }
    notify: http.#HTTPDo & {
        $params: {
            method: "POST"
            url:    parameter.webhookURL
            request: {
                body: decoded.$returns.str
                header: "Content-Type": "text/plain"
            }
        }
    }
    parameter: {
        // +usage=Source Secret name
        secretName: string
        // +usage=Data key inside the Secret
        secretKey: string
        // +usage=Target ConfigMap name
        targetName: string
        // +usage=Namespace for source Secret and target ConfigMap
        namespace: *"default" | string
        // +usage=Webhook URL for the notification
        webhookURL: string
        // +usage=If true, abort the workflow before doing anything
        panicMode: *false | bool
    }
}
```

</TabItem>
</Tabs>

Reproduce the CUE for any of the three examples above with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

## Related

- [TraitDefinition](./definition-trait.md) — `defkit.NewTrait` chain and trait-specific helpers
- [ComponentDefinition](./definition-component.md) — `defkit.NewComponent` chain and template output methods
- [WorkflowStepDefinition](./definition-workflowstep.md) — `defkit.NewWorkflowStep` chain and op-builder usage
- [Template Patch Methods](./template-patch-methods.md) — full surface of `tpl.Patch()` and `tpl.UsePatchContainer()`
- [Template Workflow Step Actions](./template-workflowstep-actions.md) — additional workflow step actions beyond the op builders here
- [Collections API](./collections-api.md) — higher-level array-transformation pipelines built on `From()` and `Each()`
