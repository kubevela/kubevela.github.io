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

go get github.com/oam-dev/kubevela/pkg/definition/defkit@latest
```

## Step 1 — Migrate Parameters

Every field in a CUE `parameter:` block maps directly to a defkit constructor.

```cue title="CUE — parameter block"
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

```go title="Go — defkit"
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

cpu      := defkit.String("cpu").
               Description(`CPU request, e.g. "500m"`)

env := defkit.List("env").
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

labels := defkit.StringKeyMap("labels").
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

:::caution Breaking change: bare parameters are required by default
In defkit, a bare parameter (no `.Optional()`, no `.Default()`) compiles to a CUE required field (`field: type`). This matches the CUE convention but means you **must** call `.Optional()` for any param that was previously optional (`field?: type` in CUE). Failing to do so will make the parameter mandatory in the generated schema.
:::

## Step 2 — Migrate the Template Body

```cue title="CUE — template body"
output: {
    apiVersion: "apps/v1"
    kind: "Deployment"
    metadata: name: context.name
    spec: {
        replicas: parameter.replicas
        template: spec: containers: [{
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
```

```go title="Go — defkit template"
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
        Set("spec.template.spec.containers[0].name",  vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        Set("spec.template.spec.containers[0].ports", containerPorts).
        SetIf(cpu.IsSet(), "spec.template.spec.containers[0].resources.limits.cpu", cpu).
        SetIf(env.IsSet(), "spec.template.spec.containers[0].env", env)

    tpl.Output(deployment)
}
```

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

```cue title="CUE — trait template"
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

```go title="Go — defkit trait"
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
- `tpl.UsePatchContainer(config)` generates the full `#PatchParams`, `patchSets`, and `patch` blocks — never write them by hand.
- Simple typed fields → `PatchFields`.
- List comprehensions or complex merge logic → `CustomPatchContainerBlock` (raw CUE injected verbatim).
- `AppliesTo("deployments.apps", "statefulsets.apps")` restricts which workload GVKs the trait can attach to.

## Step 4 — Migrate Health & Status

```cue title="CUE — health and status"
isHealth: (
    context.output.status.observedGeneration ==
    context.output.metadata.generation
) && (
    context.output.status.readyReplicas ==
    context.output.status.replicas
) && (context.output.status.replicas > 0)
```

```go title="Go — defkit"
return defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").

    HealthPolicy(defkit.DeploymentHealth().Build()).
    CustomStatus(defkit.DeploymentStatus().Build()).

    HealthPolicy(
        defkit.DeploymentHealth().
            RequirePositiveReplicas(true).
            Build(),
    ).

    HealthPolicy(`isHealth: context.output.status.phase == "Running"`).

    Params(image, replicas).
    Template(webserviceTemplate)
```

**Key rules:**
- `defkit.DeploymentHealth().Build()` generates the standard Deployment readiness check.
- `defkit.DeploymentStatus().Build()` generates the standard status message.
- Pass a raw CUE string to `.HealthPolicy()` / `.CustomStatus()` when you need a non-standard workload check.

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
