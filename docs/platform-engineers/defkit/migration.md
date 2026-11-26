---
title: Migrating from CUE to defkit
---

If you have existing KubeVela definitions written in raw CUE or YAML manifests, this guide shows the mechanical mapping to defkit Go code. The generated CUE output is semantically equivalent — the cluster sees the same definitions.

:::info
Existing CUE definitions continue to work alongside defkit-based definitions. You can migrate incrementally, one definition at a time.
:::

This guide covers `ComponentDefinition` and `TraitDefinition` — the most common migration targets. `PolicyDefinition` and `WorkflowStepDefinition` follow the same parameter patterns.

## Step 0 — Scaffold a new module

```bash
vela def init-module --name my-platform \
  --components webservice,worker \
  --traits scaler,env

go get github.com/oam-dev/kubevela@v1.12.0
```

Pin the KubeVela release your cluster runs. `@latest` skips pre-releases, so it can resolve to an older release than the one the scaffold pins, and that drops the API this guide uses.

### Start by wrapping your existing CUE

You don't have to rewrite a definition before you can manage it from the module. Wrap the CUE file you already have with `RawCUE`, which passes it through to the generated output unchanged:

```go title="components/webservice.go"
package components

import (
	_ "embed"

	"github.com/oam-dev/kubevela/pkg/definition/defkit"
)

//go:embed webservice.cue
var webserviceCUE string

func init() {
	defkit.Register(defkit.NewComponent("webservice").RawCUE(webserviceCUE))
}
```

Generate the module and diff it against your originals. A wrapped definition should show no change:

```bash
vela def gen-module ./my-platform -o ./generated-cue
diff ./generated-cue/components/webservice.cue ./old-definitions/webservice.cue
```

Then apply it with `vela def apply-module`, and move one definition at a time from `RawCUE` to the builder using the steps below. Run the same diff after each one, and add a [`Render()` test](./testing.md) once a definition is on the builder, so later changes are checked too.

## Step 1 — Migrate Parameters

Every field in a CUE `parameter:` block maps directly to a defkit constructor.

```cue title="CUE (parameter block)"
parameter: {
    // +usage=Container image
    image: string

    // +usage=Number of replicas
    replicas: *1 | int

    // +usage=Enable debug mode
    debug: *false | bool

    // +usage=Allowed log levels
    logLevel: *"info" | "debug" | "warn" | "error"

    // +usage=CPU request, e.g. "500m"
    cpu?: string

    // +usage=Environment variables
    env?: [...{
        name:   string
        value?: string
    }]

    // +usage=Port mappings
    ports?: [...{
        port:     int
        protocol: *"TCP" | "UDP"
        expose:   *false | bool
    }]

    // +usage=Extra labels to add
    labels?: [string]: string
}
```

```go title="Go (defkit)"
image    := defkit.String("image").
               Description("Container image")

replicas := defkit.Int("replicas").Default(1).
               Description("Number of replicas")

debug    := defkit.Bool("debug").Default(false).
               Description("Enable debug mode")

logLevel := defkit.Enum("logLevel").
               Values("info", "debug", "warn", "error").
               Default("info").
               Description("Allowed log levels")

cpu      := defkit.String("cpu").Optional().
               Description(`CPU request, e.g. "500m"`)

env := defkit.Array("env").Optional().
    Description("Environment variables").
    WithFields(
        defkit.String("name"),
        defkit.String("value").Optional(),
    )

ports := defkit.Array("ports").Optional().
    Description("Port mappings").
    WithFields(
        defkit.Int("port"),
        defkit.Enum("protocol").Values("TCP","UDP").Default("TCP"),
        defkit.Bool("expose").Default(false),
    )

labels := defkit.StringKeyMap("labels").Optional().
    Description("Extra labels to add")
```

**Mapping rules:**

| CUE | defkit |
|---|---|
| `*default \| type` | `.Default(value)` |
| `field:` (non-optional) | bare param, no modifier (this is the default) |
| `field?:` (optional, may be absent) | `.Optional()` |
| `field!:` (user must explicitly set) | `.Required()` |
| `[string]: string` | `defkit.StringKeyMap()` |
| `[...{...}]` with fixed schema | `defkit.Array().WithFields()` |
| `[...]` open/heterogeneous list | `defkit.List()` |
| `// +usage=...` comments | `.Description("...")` |

:::caution Bare parameters are mandatory
In defkit, a bare parameter (no `.Optional()`, no `.Default()`) emits a CUE field with **no marker** — `field: type`. Without a default, that field must resolve to a value at unification time, so users **must** provide it. This is stricter than the CUE `field?: type` form (which allows the field to be absent). It is NOT the `field!: type` form — that requires `.Required()`, which forces the user to set the field explicitly even if a default exists. In short:

| You write | CUE emits | Meaning |
|---|---|---|
| `defkit.String("x")` | `x: string` | mandatory unless a default satisfies it |
| `defkit.String("x").Optional()` | `x?: string` | may be absent |
| `defkit.String("x").Default("foo")` | `x: *"foo" \| string` | mandatory, but the default satisfies it |
| `defkit.String("x").Required()` | `x!: string` | user must explicitly set, even with a default |

You **must** call `.Optional()` for any param that was previously optional (`field?: type` in CUE) — otherwise users hit a "field is required" error.
:::

## Step 2 — Migrate the Template Body

```cue title="CUE (template body)"
output: {
    apiVersion: "apps/v1"
    kind: "Deployment"
    metadata: name: context.name
    spec: {
        replicas: parameter.replicas
        selector: matchLabels: "app.oam.dev/component": context.name
        template: {
            metadata: labels: "app.oam.dev/component": context.name
            spec: containers: [{
                name:  context.name
                image: parameter.image
                if parameter.cpu != _|_ {
                    resources: limits: cpu: parameter.cpu
                }
                if parameter.env != _|_ {
                    env: parameter.env
                }
                ports: [for p in parameter.ports {
                    containerPort: p.port
                    protocol:      p.protocol
                }]
            }]
        }
    }
}
```

```go title="Go (defkit template)"
func myTemplate(tpl *defkit.Template) {
    vela     := defkit.VelaCtx()
    cpu      := defkit.String("cpu")
    env      := defkit.List("env")
    ports    := defkit.Array("ports")
    replicas := defkit.Int("replicas")
    image    := defkit.String("image")

    containerPorts := defkit.NewArray().ForEachWith(ports,
        func(item *defkit.ItemBuilder) {
            v := item.Var()
            item.Set("containerPort", v.Field("port"))
            item.Set("protocol", v.Field("protocol"))
        })

    deployment := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.replicas", replicas).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name",  vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        Set("spec.template.spec.containers[0].ports", containerPorts).
        SetIf(cpu.IsSet(), "spec.template.spec.containers[0].resources.limits.cpu", cpu).
        SetIf(env.IsSet(), "spec.template.spec.containers[0].env", env)

    tpl.Output(deployment)
}
```

:::caution Deployments require selector ↔ template.labels parity
A Deployment is invalid without `spec.selector.matchLabels` matching `spec.template.metadata.labels`. Both the CUE and Go templates above use `app.oam.dev/component: context.name` (the standard KubeVela component-label convention) so the workload that lands in the cluster passes the admission webhook. If you forget this on the migration, both forms fail identically — which is itself a small proof of semantic equivalence between CUE and defkit.
:::

**Mapping rules:**

| CUE | defkit |
|---|---|
| `if parameter.x != _\|_ { ... }` | `.SetIf(x.IsSet(), path, value)` or `.If(x.IsSet())...EndIf()` |
| `[for v in parameter.ports { ... }]` | `defkit.NewArray().ForEachWith(ports, func(item) { ... })` |
| `context.name` | `defkit.VelaCtx().Name()` |
| `context.appName` | `defkit.VelaCtx().AppName()` |
| `context.namespace` | `defkit.VelaCtx().Namespace()` |
| `output: { ... }` | `tpl.Output(resource)` |
| `outputs: foo: { ... }` | `tpl.Outputs("foo", resource)` |

## Step 3 — Migrate Traits

```cue title="CUE (trait template)"
patch: spec: template: spec: containers: [{
    name: parameter.containerName
    env: [for k, v in parameter.env {
        name:  k
        value: v
    }]
}]

patchSets: [{
    name: "container-patch"
    patches: [{
        path: "spec/template/spec/containers/*"
        op:   "add"
        value: _
    }]
}]

parameter: {
    containerName: *context.name | string
    env: [string]: string
}
```

```go title="Go (defkit trait)"
func MyTrait() *defkit.TraitDefinition {
    return defkit.NewTrait("my-trait").
        Description("Inject env vars into a container").
        AppliesTo("deployments.apps").
        Template(func(tpl *defkit.Template) {
            tpl.UsePatchContainer(defkit.PatchContainerConfig{
                ContainerNameParam:   "containerName",
                DefaultToContextName: true,
                PatchFields: []defkit.PatchContainerField{
                    {
                        ParamName:   "env",
                        TargetField: "env",
                        ParamType:   "[string]: string",
                        Description: "Env vars to inject",
                    },
                },
                CustomPatchContainerBlock: `_params: #PatchParams
name: _params.containerName
env: [for k, v in _params.env { name: k, value: v }]`,
            })
        })
}

func init() { defkit.Register(MyTrait()) }
```

**Key rules:**
- `tpl.UsePatchContainer(config)` generates the `#PatchParams` helper and the `patch` block; never write them by hand.
- Simple typed fields → `PatchFields`.
- List comprehensions or complex merge logic → `CustomPatchContainerBlock` (raw CUE injected verbatim).
- `AppliesTo("deployments.apps", "statefulsets.apps")` restricts which workload GVKs the trait can attach to.

## Step 4 — Migrate Health & Status

```cue title="CUE (health and status)"
isHealth: context.output.status.observedGeneration == context.output.metadata.generation &&
  context.output.status.readyReplicas == context.output.status.replicas &&
  context.output.status.replicas > 0
```

:::caution Keep `isHealth` line-break-safe
The KubeVela controller's healthPolicy CUE evaluator is sensitive to where you break long expressions. Break **after `&&`** (or keep the whole thing on one line). **Do not** break a comparison so that `==` ends a line — `field1 ==\nfield2` evaluates to `false` even when both fields are equal. This is one of the reasons the doc recommends `HealthPolicyExpr` (Option B below): the builder emits a single-line, controller-safe expression.
:::

**Option A — use the built-in preset** (matches Deployment's standard readiness check):

```go title="Go (defkit (preset))"
return defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").
    HealthPolicy(defkit.DeploymentHealth().Build()).
    CustomStatus(defkit.DeploymentStatus().Build()).
    Params(image, replicas).
    Template(webserviceTemplate)
```

**Option B — composable health expression** (closest match to the custom CUE above; type-safe, no raw strings):

```go title="Go (defkit (HealthExpr))"
h := defkit.Health()

return defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").
    HealthPolicyExpr(h.And(
        h.Field("status.observedGeneration").Eq(h.FieldRef("metadata.generation")),
        h.Field("status.readyReplicas").Eq(h.FieldRef("status.replicas")),
        h.Field("status.replicas").Gt(0),
    )).
    CustomStatus(defkit.DeploymentStatus().Build()).
    Params(image, replicas).
    Template(webserviceTemplate)
```

**Option C — raw CUE escape hatch** (when you need CUE features the builder doesn't expose):

```go title="Go (defkit (raw))"
return defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").
    HealthPolicy(`isHealth: context.output.status.phase == "Running"`).
    CustomStatus(defkit.DeploymentStatus().Build()).
    Params(image, replicas).
    Template(webserviceTemplate)
```

**Key rules:**
- Pick ONE of `.HealthPolicy(string)` or `.HealthPolicyExpr(HealthExpression)`. Both are setters — calling them more than once on a single component overwrites the prior value. Same for `.CustomStatus(string)` / its `Expr` variants.
- `defkit.DeploymentHealth().Build()` produces the standard preset string — equivalent in spirit to the "before" CUE, but uses the consolidated `ready: {…} & {…}` shape and the `_isHealth` / disable-annotation pattern (see [Health & Status DSL](./health-status-dsl.md)).
- `defkit.DeploymentStatus().Build()` produces the standard `Ready: X/Y` status message.
- For custom checks (`replicas > 0`, specific conditions, etc.), prefer the composable `defkit.Health()` API (Option B) over raw CUE — it stays type-checked and refactor-friendly.

## Step 5 — Apply Migrated Definitions

```bash
go build ./...
vela def validate-module ./my-platform

vela def apply-module ./my-platform --dry-run

vela def apply-module ./my-platform --conflict overwrite

vela def list --namespace vela-system | grep webservice
```

:::caution Rollout tip
Keep your old CUE/YAML definitions checked in version control until you have validated the defkit-generated output end-to-end with at least one real `Application`. Use `vela def gen-module ./my-platform -o ./generated-cue` to diff the generated CUE against your originals before applying.
:::
