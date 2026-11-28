---
title: VelaCtx — Runtime Context
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`defkit.VelaCtx()` returns a `*VelaContext` accessor whose methods compile to `context.*` CUE path references. Call it once at the top of your template function. Each method returns a `Value` that is never evaluated in Go: the KubeVela controller substitutes with the real runtime value when it evaluates the CUE template against an Application at deploy time.

## VelaContext Methods

### Identity accessors

| Go method | CUE path | Description |
|---|---|---|
| `vela.Name()` | `context.name` | Name of the component or trait instance as declared in the Application YAML. The most commonly set value: use it for resource names, selector labels, and log identifiers. |
| `vela.Namespace()` | `context.namespace` | Namespace where the Application is deployed. |
| `vela.AppName()` | `context.appName` | The Application CR's `.metadata.name`. Different from `Name()`, which is the component instance name within the Application. |
| `vela.AppRevision()` | `context.appRevision` | The Application's current revision string (e.g. `"myapp-v3"`). Monotonically increases on each Application update. |
| `vela.AppRevisionNum()` | `context.appRevisionNum` | The numeric revision counter (integer). Wrap in `defkit.Interpolation(...)` before placing in a Kubernetes `string` field such as an annotation value or ConfigMap `data` entry to avoid a CUE type-mismatch at apply time. |
| `vela.Revision()` | `context.revision` | The component's own revision string: a content hash that tracks individual component changes independently of the Application revision. |

:::tip
`vela.AppRevisionNum()` and `vela.ClusterVersion().Minor()` resolve to integers in CUE. Kubernetes `annotations` and ConfigMap `data` maps are typed `map[string]string`; wrap those context values with `defkit.Interpolation(...)` when assigning them to string fields.
:::

### Cluster version accessor

`vela.ClusterVersion()` returns a `*ClusterVersionRef` that exposes the target cluster's Kubernetes version. Use its sub-methods rather than the `*ClusterVersionRef` object directly; the object itself is not directly assignable to a resource field.

| Method | CUE path | Description |
|---|---|---|
| `vela.ClusterVersion()` | `context.clusterVersion` | Returns a `*ClusterVersionRef` for the target cluster. |
| `.Major()` | `context.clusterVersion.major` | K8s major version string (e.g. `"1"`). |
| `.Minor()` | `context.clusterVersion.minor` | K8s minor version integer (e.g. `33`). Most commonly used for feature gating with `defkit.Lt` / `defkit.Ge` to pick between API versions at deploy time. Wrap in `defkit.Interpolation(...)` for string fields. |
| `.GitVersion()` | `context.clusterVersion.gitVersion` | Full git version string (e.g. `"v1.33.6+k3s1"`). Includes the patch level when you need it. |

:::caution
Don't use `.Patch()`. It compiles to `context.clusterVersion.patch`, which does **not** exist at runtime: the KubeVela controller never sets that field. The patch level is in `.GitVersion()`.
:::

### Output accessors

These accessors are primarily used in **trait** templates to introspect the workload being patched. They are not meaningful inside a component template's own `output` block.

| Go expression | CUE path | Description |
|---|---|---|
| `vela.Output()` | `context.output` | References the component's primary output resource. Use in traits to read the workload's current state, for example to check whether the target resource has a `spec.template` before patching it. |
| `vela.Outputs(name)` | `context.outputs.<name>` | References a named auxiliary output by name. Use in traits or status expressions to read the state of a secondary resource that the component produced. |

Prefer `defkit.ContextOutput()` and its `.Field(path)` / `.HasPath(path)` methods when building conditional trait patches: they give you a richer fluent API over the same `context.output` path. See [Reading Component Context](./advanced-api.md#reading-component-context) and the trait example after it.

### Application accessors

| Go method | CUE path | Set for | Description |
|---|---|---|---|
| `vela.AppLabels()` | `context.appLabels` | Every definition kind | The Application's labels, as a map. |
| `vela.AppLabel(key)` | `context.appLabels["<key>"]` | Every definition kind | One of the Application's labels. |
| `vela.AppAnnotations()` | `context.appAnnotations` | Every definition kind | The Application's annotations, as a map. |
| `vela.AppAnnotation(key)` | `context.appAnnotations["<key>"]` | Every definition kind | One of the Application's annotations. |
| `vela.AppComponents()` | `context.appComponents` | Application-scoped policies | The Application's `spec.components`. |
| `vela.AppPolicies()` | `context.appPolicies` | Application-scoped policies | The Application's `spec.policies`. |
| `vela.AppWorkflow()` | `context.appWorkflow` | Application-scoped policies | The Application's `spec.workflow`. |
| `vela.Custom(path)` | `context.custom.<path>` | Components, traits, policies and workflow steps | A value an earlier [Application-scoped policy](../policy/application-scoped-policy.md) published in its `output.ctx`. It is absent unless a policy set it, so guard the read. |

### Policy accessors

| Go method | CUE path | Set for | Description |
|---|---|---|---|
| `vela.PolicyName()` | `context.policyName` | Policies | The policy's name, from its `spec.policies[]` entry. |
| `vela.PolicyType()` | `context.policyType` | Policies | The policy's definition name. |
| `vela.PolicyRevision()` | `context.policyRevision` | Application-scoped policies | The revision number of the policy's definition. |
| `vela.PolicyRevisionName()` | `context.policyRevisionName` | Application-scoped policies | The name of the policy definition's revision. |
| `vela.PolicyRevisionHash()` | `context.policyRevisionHash` | Application-scoped policies | The hash of the policy definition's revision. |

### Workflow step accessors

| Go method | CUE path | Set for | Description |
|---|---|---|---|
| `vela.StepName()` | `context.stepName` | Workflow steps | The name of the step being run. In a step template, `vela.Name()` is the Application, so read this for the step. |
| `vela.StepSessionID()` | `context.stepSessionID` | Workflow steps | The step's ID in the workflow status. |
| `vela.WorkflowName()` | `context.workflowName` | Components, traits, workflow steps, and policies other than Application-scoped ones | The name of the workflow being run, when it has one. |
| `vela.Each()` | `context.each` | Workflow steps in a `forEach` | The current pass of a `forEach`, with `.Item()`, `.ItemField(path)`, `.Index()` (from 0) and `.Key()` (the item's `forEach.key`, or its index when the loop has none). It is only set inside a `forEach`, so guard reads with `vela.Each().IsSet()`. |

## Example

Let's build a `runtime-context-demo` component that writes the identity and cluster-version accessors into a Kubernetes `Deployment` and a companion `ConfigMap`.

The template uses all six identity methods (`Name`, `Namespace`, `AppName`, `AppRevision`, `AppRevisionNum` and `Revision`) in the Deployment's labels and annotations, and the three `ClusterVersionRef` sub-methods (`Major`, `Minor` and `GitVersion`) as annotations. `defkit.Interpolation(...)` turns the integer `AppRevisionNum` and `Minor` values into strings before they go into Kubernetes string fields, and `tpl.Outputs(...)` adds the `ConfigMap` as a named auxiliary output. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func RuntimeContextDemo() *defkit.ComponentDefinition {
    image := defkit.String("image").Default("nginx:stable").Description("Container image")

    return defkit.NewComponent("runtime-context-demo").
        Description("Demonstrates every VelaCtx accessor via context.* labels and annotations").
        Workload("apps/v1", "Deployment").
        PodSpecPath("spec.template.spec").
        Params(image).
        Template(runtimeContextDemoTemplate)
}

func runtimeContextDemoTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    cv := vela.ClusterVersion()

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("metadata.namespace", vela.Namespace()).
        Set("metadata.labels[app.oam.dev/name]", vela.AppName()).
        Set("metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("metadata.labels[app.oam.dev/revision]", vela.AppRevision()).
        Set("metadata.annotations[defkit.io/component-revision]", vela.Revision()).
        Set("metadata.annotations[defkit.io/app-revision-num]", defkit.Interpolation(vela.AppRevisionNum())).
        Set("metadata.annotations[defkit.io/k8s-major]", cv.Major()).
        Set("metadata.annotations[defkit.io/k8s-minor]", defkit.Interpolation(cv.Minor())).
        Set("metadata.annotations[defkit.io/k8s-git-version]", cv.GitVersion()).
        Set("spec.replicas", defkit.Lit(1)).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image)

    tpl.Output(dep)

    configMap := defkit.NewResource("v1", "ConfigMap").
        Set("metadata.name", defkit.Interpolation(vela.Name(), defkit.Lit("-ctx"))).
        Set("metadata.namespace", vela.Namespace()).
        Set("data[component-name]", vela.Name()).
        Set("data[app-name]", vela.AppName()).
        Set("data[namespace]", vela.Namespace()).
        Set("data[app-revision]", vela.AppRevision()).
        Set("data[component-revision]", vela.Revision()).
        Set("data[cluster-git-version]", cv.GitVersion()).
        Set("data[cluster-minor]", defkit.Interpolation(cv.Minor())).
        Set("data[app-revision-num]", defkit.Interpolation(vela.AppRevisionNum()))

    tpl.Outputs("ctx-configmap", configMap)
}

func init() { defkit.Register(RuntimeContextDemo()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
"runtime-context-demo": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Demonstrates every VelaCtx accessor via context.* labels and annotations"
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
      name:      context.name
      namespace: context.namespace
      labels: {
        "app.oam.dev/name":      context.appName
        "app.oam.dev/component": context.name
        "app.oam.dev/revision":  context.appRevision
      }
      annotations: {
        "defkit.io/component-revision": context.revision
        "defkit.io/app-revision-num":   "\(context.appRevisionNum)"
        "defkit.io/k8s-major":          context.clusterVersion.major
        "defkit.io/k8s-minor":          "\(context.clusterVersion.minor)"
        "defkit.io/k8s-git-version":    context.clusterVersion.gitVersion
      }
    }
    spec: {
      replicas: 1
      selector: matchLabels: "app.oam.dev/component": context.name
      template: {
        metadata: labels: "app.oam.dev/component": context.name
        spec: containers: [{
          name:  context.name
          image: parameter.image
        }]
      }
    }
  }
  outputs: {
    "ctx-configmap": {
      apiVersion: "v1"
      kind:       "ConfigMap"
      metadata: {
        name:      "\(context.name)-ctx"
        namespace: context.namespace
      }
      data: {
        "component-name":     context.name
        "app-name":           context.appName
        "namespace":          context.namespace
        "app-revision":       context.appRevision
        "component-revision": context.revision
        "cluster-git-version": context.clusterVersion.gitVersion
        "cluster-minor":      "\(context.clusterVersion.minor)"
        "app-revision-num":   "\(context.appRevisionNum)"
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: *"nginx:stable" | string
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="ctx-demo-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ctx-demo-app
  namespace: default
spec:
  components:
    - name: ctx-demo
      type: runtime-context-demo
      properties:
        image: nginx:stable
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

### Apply and verify

Apply the definition and the Application YAML above:

```shell
vela def apply ./generated-cue/components/runtime-context-demo.cue
vela up -f ctx-demo-app.yaml
```

```
NAME           COMPONENT   TYPE                   PHASE     HEALTHY   STATUS   AGE
ctx-demo-app   ctx-demo    runtime-context-demo   running   true               61s
```

Once the Application reaches `phase: running`, verify the rendered `context.*` values against the real cluster. The Deployment annotations carry the cluster-version fields:

```shell
$ kubectl get deployment ctx-demo -n default -o json | \
    python3 -c "import sys,json; m=json.load(sys.stdin)['metadata']; \
    print(json.dumps({'labels': m['labels'], 'annotations': m['annotations']}, indent=2))"
{
  "labels": {
    "app.oam.dev/component": "ctx-demo",
    "app.oam.dev/name": "ctx-demo-app",
    "app.oam.dev/revision": "ctx-demo-app-v1"
  },
  "annotations": {
    "defkit.io/app-revision-num": "1",
    "defkit.io/component-revision": "329dd37f85f6e5ea",
    "defkit.io/k8s-git-version": "v1.33.6+k3s1",
    "defkit.io/k8s-major": "1",
    "defkit.io/k8s-minor": "33"
  }
}
```

The companion ConfigMap holds all the string-typed accessors:

```shell
$ kubectl get configmap ctx-demo-ctx -n default -o json | \
    python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['data'], indent=2))"
{
  "app-name": "ctx-demo-app",
  "app-revision": "ctx-demo-app-v1",
  "app-revision-num": "1",
  "cluster-git-version": "v1.33.6+k3s1",
  "cluster-minor": "33",
  "component-name": "ctx-demo",
  "component-revision": "329dd37f85f6e5ea",
  "namespace": "default"
}
```

Every `VelaCtx` accessor maps to a concrete value injected by the controller: `context.name` → `"ctx-demo"`, `context.appName` → `"ctx-demo-app"`, `context.namespace` → `"default"`, `context.appRevision` → `"ctx-demo-app-v1"`, `context.appRevisionNum` → `1`, `context.revision` → a component content hash, `context.clusterVersion.major` → `"1"`, `context.clusterVersion.minor` → `33`, `context.clusterVersion.gitVersion` → `"v1.33.6+k3s1"`.

## Related

- [ComponentDefinition](./definition-component.md): define workload types
- [TraitDefinition](./definition-trait.md): use `ContextOutput()` to introspect the workload
- [Resource Builder](./resource-builder.md): `Set()`, `SetIf()`, and other resource-field methods
- [Value Expressions](./value-expressions.md): `defkit.Interpolation()`, `defkit.Lt()`, `defkit.Ge()`, and other expression helpers
