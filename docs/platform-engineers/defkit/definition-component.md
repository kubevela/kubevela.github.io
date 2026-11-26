---
title: ComponentDefinition
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`defkit.NewComponent(name string) *ComponentDefinition` starts a ComponentDefinition builder. You chain methods on it to set the workload type, the parameters and the template, then register it with `defkit.Register()`.

## Chain Methods

### Metadata

| Method | Description |
|---|---|
| `.Description(desc string)` | Sets the description shown in `vela show` and VelaUX. Generates `description: "..."` in the definition header. |
| `.Annotations(map[string]string)` | Sets annotations on the `ComponentDefinition` itself, not on the workload. Use them for UI hints, categories or your own tooling. |
| `.Labels(map[string]string)` | Sets labels on the `ComponentDefinition` itself. `ui-hidden: "true"` hides it from VelaUX; any other label works for filtering definitions. |
| `.Version(v string)` | Sets the definition version. Use it when several versions of the same definition sit side by side, so an Application can pick one. |

### Workload

| Method | Description |
|---|---|
| `.Workload(apiVersion, kind string)` | Declares the main Kubernetes resource the component creates, e.g. `"apps/v1", "Deployment"`. KubeVela uses it to know what the component manages and to point traits at it. Generates `attributes: workload: {definition: {apiVersion, kind}, type: "deployments.apps"}`; the `type` is worked out from the GVK (drop it with `OmitWorkloadType()`). |
| `.AutodetectWorkload()` | Sets the workload type to `"autodetects.core.oam.dev"`, so KubeVela reads the workload type from the `output` resource at runtime. Use it when the output's apiVersion or kind varies, e.g. a CronJob that switches between `batch/v1beta1` and `batch/v1` by cluster version, or `k8s-objects`, where the user picks the kind. |
| `.OmitWorkloadType()` | Leaves the `type:` field out of the `workload:` block and keeps `definition: {apiVersion, kind}`. Use it with `Workload()` for a custom resource the generator can't work out a type for, e.g. a Crossplane claim such as `"database.example.com/v1alpha1", "PostgreSQL"`. |
| `.ChildResourceKind(apiVersion, kind, selector)` | Declares a kind of child resource the component creates beside its main output. KubeVela uses it to track ownership and garbage-collect those resources; the selector picks out the instances that belong to the component. |
| `.PodSpecPath(path string)` | Tells KubeVela where the PodSpec sits in the output resource, e.g. `"spec.template.spec"` for a Deployment. Traits that change containers, volumes or other pod fields use this path to find what to patch. |

### Parameters & Template

| Method | Description |
|---|---|
| `.Params(params ...Param)` | Adds parameters, which become the `parameter: {...}` block in the generated CUE. They are the inputs shown in `vela show` and checked when an Application is applied, and they are written in the order you pass them. |
| `.Param(param Param)` | Adds one parameter. Same as `Params()`, for building the list up one at a time. |
| `.Template(fn func(tpl *Template))` | Takes the template function, where you define the output resources, patches, template helpers and let-bindings with `tpl.Output()`, `tpl.Outputs()` and the rest. It becomes the `template: {...}` block. |
| `.Helper(name string, param Param)` | Adds a named schema type: a CUE definition `#Name` built from the parameter's schema, written into the `template:` block (e.g. `#HealthProbe: {path: string, port: int}`) for parameters or outputs to refer to. Not to be confused with template helpers (`tpl.Helper(name)`), which compute a list from a parameter; see [Template helpers](./collections-api.md#template-helpers-tplhelper). |
| `.Validators(validators ...*Validator)` | Adds rules that check several parameters together, e.g. "if A is set then B must be set too". Each becomes a `_validate*` block in the parameter schema. Build them with `Validate(msg).FailWhen(cond)`, or with `ValidateValue(message Value)` when the message is built from an expression, so it can say which entry failed. |
| `.ConditionalParams(block *ConditionalParamBlock)` | Adds parameters that only exist when another parameter has a given value, e.g. `strategy` and `maxSurge` only when `kind == "Deployment"`. Generates `if parameter.kind == "Deployment" {...}` blocks in the parameter schema. |

### Health & Status

| Method | Description |
|---|---|
| `.CustomStatus(expr string)` | Sets a raw CUE expression for `status: customStatus:`, the message `vela status` shows (e.g. `"Ready: 3/3"`). The [Health & Status DSL](./health-status-dsl.md) builds the same thing without raw CUE. |
| `.HealthPolicy(expr string)` | Sets a raw CUE expression for `status: healthPolicy:`. It must set `isHealth` to `true` or `false`, which decides whether KubeVela sees the component as healthy. For the builder, use `HealthPolicyExpr()`. |
| `.HealthPolicyExpr(expr HealthExpression)` | Sets the health policy from a typed `HealthExpression`, e.g. `Health().Condition("Ready").IsTrue()`, in place of a raw CUE string. The condition lookup and the `isHealth` line are generated for you. |
| `.StatusDetails(details string)` | Sets a raw CUE expression for `status: details:`, the structured status VelaUX shows beside the message. |

### Placement

| Method | Description |
|---|---|
| `.RunOn(conditions ...placement.Condition)` | Installs the definition only on clusters whose identity labels match the conditions. `vela def apply-module` skips it on any other cluster. Build conditions with `placement.Label("key").Eq("value")`; see [Cluster Placement](./cluster-placement.md). |
| `.NotRunOn(conditions ...placement.Condition)` | Skips the definition on clusters whose labels match the conditions. If any `NotRunOn` condition matches, the definition is skipped even when `RunOn` matches too. |

### Namespace Restrictions & Quota

| Method | Description |
|---|---|
| `.RestrictNamespaces(namespaces ...string)` | Limits the definition to namespaces matching any of the names or `path.Match` globs, e.g. `RestrictNamespaces("team-a", "tenant-*")`. An Application in any other namespace can't use it. |
| `.RestrictNamespaceSelector(selector *metav1.LabelSelector)` | Limits the definition to namespaces whose labels match the selector, e.g. `RestrictNamespaceSelector(defkit.MatchLabels(map[string]string{"tier": "platform"}))`. With `RestrictNamespaces` as well, a namespace that matches either is allowed. |
| `.Quota(entries ...*NamespaceQuota)` | Caps how many times each namespace may use the definition, counted across all its Applications. Start each entry with `defkit.QuotaFor(namespaces...)`, `defkit.QuotaForSelector(selector)` or `defkit.DefaultQuota()` (every namespace no earlier entry matched, so it goes last), then set `.Warn(n)` to admit with a warning from `n` uses and `.Limit(n)` to refuse past `n`; `Limit(0)` forbids it. The first entry matching a namespace applies. |

These generate `attributes: restrictions: {...}` in the definition header, e.g. `Quota(defkit.QuotaFor("team-dev").Limit(3), defkit.DefaultQuota().Warn(5))` gives `quota: [{namespaces: ["team-dev"], limit: 3}, {warn: 5}]`.

### Inheritance

| Method | Description |
|---|---|
| `.Extends(parent)`, `.Abstract()`, `defkit.ComponentRef(name)` | Builds the component on top of a parent component, or marks it as one that only exists to be extended. The template calls the parent with `tpl.Super()` and can drop or require the parent's outputs. See [Write inheritance with DefKit](../cue/definition-inheritance.md#write-inheritance-with-defkit) for the full set of methods and the CUE each one produces. |

### Escape Hatches

| Method | Description |
|---|---|
| `.RawCUE(cue string)` | Uses the given CUE as the whole definition, as written, and skips the builder; every other method is ignored. Use it for a definition the builder can't express, or while you migrate existing CUE. |
| `.WithImports(imports ...string)` | Adds CUE imports to the generated definition, e.g. `"strings"` or `"strconv"`. The generator spots the imports that helpers such as `StringsToLower()` need on its own; use this for anything it misses, or for your own packages. |

### Output

| Method | Description |
|---|---|
| `.ToCue() string` | Generates the whole definition as CUE, ready to apply as an X-Definition: parameters, template, outputs, health policy, validators and placement. |
| `.ToCueWithImports(imports ...string) string` | Same as `ToCue()`, with extra imports added at the top, without changing the definition itself. |
| `.ToParameterSchema() string` | Generates only the `parameter: {...}` block, without the rest of the definition. Handy for docs, schema checks, or reusing the schema elsewhere. |
| `.ToYAML() ([]byte, error)` | Generates the `ComponentDefinition` as a Kubernetes manifest for `kubectl apply`, with the CUE template in `.spec.schematic.cue.template`. |

## Example

Let's build an `api-service` component: a definition for internal HTTP services that render to a Kubernetes `Deployment`. Users only need to give it a container image. The replica count (2 by default), the rollout strategy (`RollingUpdate` by default) and extra env vars are optional, and a validator refuses `RollingUpdate` with fewer than 2 replicas.

The definition uses most of the chain methods: metadata (`Description`, `Labels`), workload (`Workload`, `PodSpecPath`), typed parameters with a value list and defaults, a `Validators(...)` rule across two parameters, a `Template(...)`, health through `HealthPolicyExpr`, status through `StatusDetails`, and `WithImports("strings")` for the `strings.ToLower(...)` call in the template. Building on the `my-platform` module from [Quick Start](./quick-start.md), put the file below in `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func APIService() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Container image")
    replicas := defkit.Int("replicas").Default(2).
        Description("Desired replica count")
    strategy := defkit.String("strategy").
        Values("Recreate", "RollingUpdate").
        Default("RollingUpdate").
        Description("Deployment strategy")
    env := defkit.List("env").Optional().
        Description("Extra environment variables (Kubernetes envVar list)")

    rollingOK := defkit.Validate(
        "strategy=RollingUpdate requires replicas>=2").
        WithName("_validateRolling").
        OnlyWhen(defkit.String("strategy").Eq("RollingUpdate")).
        FailWhen(defkit.Int("replicas").Lt(2))

    return defkit.NewComponent("api-service").
        Description("Internal HTTP API backed by a Deployment").
        Labels(map[string]string{"tier": "api"}).
        Workload("apps/v1", "Deployment").
        PodSpecPath("spec.template.spec").
        Params(image, replicas, strategy, env).
        Validators(rollingOK).
        Template(apiServiceTemplate).
        HealthPolicyExpr(
            defkit.Health().Condition("Available").IsTrue()).
        StatusDetails(`replicas: parameter.replicas`).
        WithImports("strings")
}

func apiServiceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    replicas := defkit.Int("replicas")
    strategy := defkit.String("strategy")
    env := defkit.List("env")

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("metadata.labels[app.oam.dev/component]",
            defkit.StringsToLower(vela.Name())).
        Set("spec.replicas", replicas).
        Set("spec.strategy.type", strategy).
        Set("spec.selector.matchLabels[app.oam.dev/component]",
            vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]",
            vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        SetIf(env.IsSet(),
            "spec.template.spec.containers[0].env", env)

    tpl.Output(dep)
}

func init() { defkit.Register(APIService()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
import (
  "strings"
)

"api-service": {
  type: "component"
  annotations: {}
  labels: {
    "tier": "api"
  }
  description: "Internal HTTP API backed by a Deployment"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
      }
      type: "deployments.apps"
    }
    status: {
      healthPolicy: #"""
        _availableCond: [ for c in *context.output.status.conditions | [] if c.type != _|_ if c.type == "Available" { c } ]
        isHealth: len([ for c in _availableCond if c.status != _|_ if c.status == "True" { c } ]) > 0
        """#
      details: #"""
        replicas: parameter.replicas
        """#
    }
  }
}
template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: {
      name: context.name
      labels: {
        "app.oam.dev/component": strings.ToLower(context.name)
      }
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
            if parameter["env"] != _|_ {
              env: parameter.env
            }
          }]
        }
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: string
    // +usage=Desired replica count
    replicas: *2 | int
    // +usage=Deployment strategy
    strategy: *"RollingUpdate" | "Recreate"
    // +usage=Extra environment variables (Kubernetes envVar list)
    env?: [..._]
    if parameter.strategy == "RollingUpdate" {
      _validateRolling: {
        "strategy=RollingUpdate requires replicas>=2": true
        if parameter.replicas < 2 {
          "strategy=RollingUpdate requires replicas>=2": false
        }
      }
    }
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="orders.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: orders
spec:
  components:
    - name: orders-api
      type: api-service
      properties:
        image: nginx:1.27
```

</TabItem>
</Tabs>

Reproduce the generated CUE with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

### Check it

`vela dry-run` renders the Application against the generated definition without installing anything. With only the image set, you get a Deployment with 2 replicas and the `RollingUpdate` strategy:

```shell
vela dry-run -d ./generated-cue/components/api-service.cue -f orders.yaml
```

Now set `replicas: 1` under `properties` in `orders.yaml` and run it again. The validator refuses it:

```
Error: cannot generate manifests from components and traits: evaluate base template app=orders in namespace=default: validation failed for workload orders-api:

Parameter errors:
  parameter._validateRolling."strategy=RollingUpdate requires replicas>=2": conflicting values false and true
```

Setting `strategy: Recreate` as well makes `replicas: 1` valid again. When you're happy with it, install the module and deploy:

```shell
vela def apply-module ./my-platform --conflict overwrite
vela up -f orders.yaml
```

## Related

- [Register & Output](./definition-register.md): `defkit.Register()` and the output methods
- [TraitDefinition](./definition-trait.md): patch workloads with traits
- [Cluster Placement](./cluster-placement.md): install a definition only on matching clusters
- [Quick Start](./quick-start.md): an end-to-end example
