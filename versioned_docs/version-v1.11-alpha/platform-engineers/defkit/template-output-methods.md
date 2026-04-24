---
title: Template Output Methods
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The `*defkit.Template` context object is passed to the template function of a component or trait definition. Its **output methods** control which Kubernetes resources the definition emits. This page covers only those four methods — for the rest of the `*Template` API, see the related pages at the bottom.

## Output Methods

| Method | Applies to | Description |
|---|---|---|
| `tpl.Output(r *Resource) *Resource` | Component | Sets the primary output resource — the main Kubernetes object this component creates. Generates the `output: { ... }` block. Called exactly once per component template. |
| `tpl.Outputs(name string, r *Resource) *Resource` | Component, Trait | Adds a named auxiliary output resource. Generates `outputs: { name: { ... } }`. Use for every additional Kubernetes object the definition manages (Services, HPAs, ConfigMaps, etc.). |
| `tpl.OutputsIf(cond Condition, name string, r *Resource)` | Component, Trait | Adds an auxiliary output that only exists when the condition is true. Generates `if cond { outputs: name: { ... } }`. |
| `tpl.OutputsGroupIf(cond Condition, fn func(g *OutputGroup))` | Component, Trait | Groups multiple auxiliary outputs under a single condition. The closure adds outputs via `g.Add(name, resource)`; all of them are emitted under one shared `if cond { ... }` block. |

## Working Example — Component with `Output`, `Outputs`, `OutputsIf`

The `api-with-extras` component below emits:

- **one primary Deployment** via `tpl.Output(...)`,
- **one always-present Service** via `tpl.Outputs("service", ...)`,
- **one conditional HPA** via `tpl.OutputsIf(autoscale.IsTrue(), "hpa", ...)`.

The Go on the left and the CUE on the right are byte-for-byte what `vela def gen-module ./my-platform` produces for this component. Verified by applying the ComponentDefinition to a k3d cluster and confirming each expected Kubernetes resource materializes.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ApiWithExtras() *defkit.ComponentDefinition {
    image       := defkit.String("image").Description("Container image")
    replicas    := defkit.Int("replicas").Default(1).Description("Replica count")
    port        := defkit.Int("port").Default(8080).Description("Container and service port")
    autoscale   := defkit.Bool("autoscale").Default(false).Description("Enable horizontal pod autoscaling")
    maxReplicas := defkit.Int("maxReplicas").Default(5).Description("Max replicas when autoscaling is enabled")

    return defkit.NewComponent("api-with-extras").
        Description("API service emitting Deployment + Service, with optional HPA companion").
        Workload("apps/v1", "Deployment").
        Params(image, replicas, port, autoscale, maxReplicas).
        Template(apiWithExtrasTemplate)
}

func apiWithExtrasTemplate(tpl *defkit.Template) {
    vela        := defkit.VelaCtx()
    image       := defkit.String("image")
    replicas    := defkit.Int("replicas")
    port        := defkit.Int("port")
    autoscale   := defkit.Bool("autoscale")
    maxReplicas := defkit.Int("maxReplicas")

    // Primary output — the Deployment.
    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.replicas", replicas).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        Set("spec.template.spec.containers[0].ports[0].containerPort", port)
    tpl.Output(dep)

    // Always-present auxiliary — the Service.
    svc := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports[0].port", port).
        Set("spec.ports[0].targetPort", port)
    tpl.Outputs("service", svc)

    // Conditional auxiliary — HPA only when autoscaling is on.
    hpa := defkit.NewResource("autoscaling/v2", "HorizontalPodAutoscaler").
        Set("metadata.name", vela.Name()).
        Set("spec.scaleTargetRef.apiVersion", defkit.Lit("apps/v1")).
        Set("spec.scaleTargetRef.kind", defkit.Lit("Deployment")).
        Set("spec.scaleTargetRef.name", vela.Name()).
        Set("spec.minReplicas", replicas).
        Set("spec.maxReplicas", maxReplicas)
    tpl.OutputsIf(autoscale.IsTrue(), "hpa", hpa)
}

func init() { defkit.Register(ApiWithExtras()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"api-with-extras": {
  type: "component"
  description: "API service emitting Deployment + Service, with optional HPA companion"
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
    metadata: { name: context.name }
    spec: {
      replicas: parameter.replicas
      selector: matchLabels: "app.oam.dev/component": context.name
      template: {
        metadata: labels: "app.oam.dev/component": context.name
        spec: containers: [{
          name: context.name
          image: parameter.image
          ports: [{ containerPort: parameter.port }]
        }]
      }
    }
  }
  outputs: {
    if parameter.autoscale {
      hpa: {
        apiVersion: "autoscaling/v2"
        kind:       "HorizontalPodAutoscaler"
        metadata: { name: context.name }
        spec: {
          scaleTargetRef: {
            apiVersion: "apps/v1"
            kind: "Deployment"
            name: context.name
          }
          minReplicas: parameter.replicas
          maxReplicas: parameter.maxReplicas
        }
      }
    }
    service: {
      apiVersion: "v1"
      kind:       "Service"
      metadata: { name: context.name }
      spec: {
        selector: "app.oam.dev/component": context.name
        ports: [{ port: parameter.port, targetPort: parameter.port }]
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: string
    // +usage=Replica count
    replicas: *1 | int
    // +usage=Container and service port
    port: *8080 | int
    // +usage=Enable horizontal pod autoscaling
    autoscale: *false | bool
    // +usage=Max replicas when autoscaling is enabled
    maxReplicas: *5 | int
  }
}
```

</TabItem>
</Tabs>

Deploying this with `autoscale: true` produces a Deployment, a Service, **and** an HPA. With `autoscale: false` (the default), only the Deployment and Service are created — the `if parameter.autoscale { hpa: ... }` block evaluates away. `tpl.Output` always renders; `tpl.Outputs` always renders; `tpl.OutputsIf` renders a conditional wrapper.

## Working Example — Trait with `OutputsGroupIf`

`OutputsGroupIf` groups multiple auxiliary outputs under a single shared condition so you don't repeat the `if` guard on every `OutputsIf` call. It works on both components and traits.

The `tls-companions` trait below has one always-present `tpl.Outputs("tls-info", ...)` ConfigMap, plus a two-resource group (`tls-secret` + `tls-config`) wrapped in a shared `if parameter.enableTLS { ... }` guard.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func TLSCompanions() *defkit.TraitDefinition {
    enableTLS := defkit.Bool("enableTLS").Default(false).
        Description("Provision TLS companion resources (Secret + ConfigMap)")

    return defkit.NewTrait("tls-companions").
        Description("Emit TLS companions alongside the primary workload").
        AppliesTo("deployments.apps").
        PodDisruptive(false).
        Params(enableTLS).
        Template(func(tpl *defkit.Template) {
            // Always-present auxiliary.
            tpl.Outputs("tls-info",
                defkit.NewResource("v1", "ConfigMap").
                    Set("metadata.name", defkit.Reference(`"\(context.name)-tls-info"`)).
                    Set("data.tlsEnabled", defkit.Reference(`"\(parameter.enableTLS)"`)))

            // Grouped conditional — both resources share one `if` guard.
            tpl.OutputsGroupIf(defkit.Bool("enableTLS").IsTrue(), func(g *defkit.OutputGroup) {
                g.Add("tls-secret",
                    defkit.NewResource("v1", "Secret").
                        Set("metadata.name", defkit.Reference(`"\(context.name)-tls-cert"`)))
                g.Add("tls-config",
                    defkit.NewResource("v1", "ConfigMap").
                        Set("metadata.name", defkit.Reference(`"\(context.name)-tls-config"`)))
            })
        })
}

func init() { defkit.Register(TLSCompanions()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"tls-companions": {
  type: "trait"
  description: "Emit TLS companions alongside the primary workload"
  attributes: {
    podDisruptive: false
    appliesToWorkloads: ["deployments.apps"]
  }
}
template: {
  outputs: {
    "tls-info": {
      apiVersion: "v1"
      kind:       "ConfigMap"
      metadata: name: "\(context.name)-tls-info"
      data: tlsEnabled: "\(parameter.enableTLS)"
    }
    if parameter.enableTLS {
      "tls-config": {
        apiVersion: "v1"
        kind:       "ConfigMap"
        metadata: name: "\(context.name)-tls-config"
      }
      "tls-secret": {
        apiVersion: "v1"
        kind:       "Secret"
        metadata: name: "\(context.name)-tls-cert"
      }
    }
  }
  parameter: {
    // +usage=Provision TLS companion resources (Secret + ConfigMap)
    enableTLS: *false | bool
  }
}
```

</TabItem>
</Tabs>

Attaching this trait with `enableTLS: true` produces three companion resources (`tls-info` ConfigMap + `tls-cert` Secret + `tls-config` ConfigMap). With `enableTLS: false`, only the `tls-info` ConfigMap is created — the `if parameter.enableTLS { ... }` block collapses to nothing.

Prefer `OutputsGroupIf` over repeating `OutputsIf` with the same condition — it makes the shared guard visible in one place and produces a single `if` block in the generated CUE instead of N repeated guards.

## Reproduce

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
vela def apply-module ./my-platform --conflict overwrite
```

## Related — other `*Template` methods

The following `*defkit.Template` methods are documented on other pages:

| Method(s) | See |
|---|---|
| `tpl.Patch()`, `tpl.PatchStrategy()` | [Template Patch Methods](./template-patch-methods.md) |
| `tpl.UsePatchContainer(config)` | [Trait Patch Operations](./template-trait-patch-ops.md) |
| `tpl.Helper(name)`, `tpl.AddLetBinding(name, value)`, `tpl.StructArrayHelper`, `tpl.ConcatHelper`, `tpl.DedupeHelper` | [Helper Builder](./template-helper-builder.md) |
| `tpl.SetRawHeaderBlock()`, `tpl.SetRawOutputsBlock()`, `tpl.SetRawPatchBlock()`, `tpl.SetRawParameterBlock()` | [Raw CUE Blocks](./template-raw-cue.md) |
| `tpl.Suspend()`, `tpl.SuspendIf()`, `tpl.Builtin()`, workflow-step `tpl.Set` / `SetIf` / `SetGuardedBlock` — these live on a different Go type (`*defkit.WorkflowStepTemplate`) | [Workflow Step Actions](./template-workflowstep-actions.md) |

## Related — conceptual

- [ComponentDefinition](./definition-component.md) — where `.Template(fn)` is wired up on a component
- [TraitDefinition](./definition-trait.md) — traits can use `Outputs()` / `OutputsGroupIf()` alongside `Patch()` to emit sidecar resources
- [Resource Builder](./resource-builder.md) — how to construct the `*Resource` objects passed to `Output` / `Outputs`
