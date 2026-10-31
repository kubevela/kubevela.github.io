---
title: Testing Definitions
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

defkit ships two testing surfaces that let you verify definitions without deploying to a cluster. **Unit tests** use `defkit.TestContext()` and `comp.Render()` to resolve parameters and context references in-process — no Kubernetes required. **E2E tests** apply real `Application` manifests against a live KubeVela cluster and poll for readiness. Start with unit tests for fast feedback on template logic, parameter wiring, and CUE shape; add E2E tests when you need to verify webhook admission, health evaluation, or cross-component interactions.

## `defkit.TestContext()` Builder

`defkit.TestContext()` returns a `*TestContextBuilder` that supplies mock runtime values — component name, namespace, parameters, cluster version, and simulated output status — to `comp.Render()` and `comp.RenderAll()`. Defaults: `name="test-component"`, `namespace="default"`, `appName="test-app"`, `appRevision="test-app-v1"`, `clusterMajor=1`, `clusterMinor=28`.

| Method | Description |
|---|---|
| `defkit.TestContext() *TestContextBuilder` | Creates a new test context builder pre-loaded with sensible defaults. Call builder methods below to override individual fields. |
| `.WithName(name string) *TestContextBuilder` | Sets `context.name` — the component or trait name resolved by `defkit.VelaCtx().Name()` in the template. |
| `.WithNamespace(ns string) *TestContextBuilder` | Sets `context.namespace`. |
| `.WithAppName(name string) *TestContextBuilder` | Sets `context.appName`. Use when the template references the application name. |
| `.WithAppRevision(rev string) *TestContextBuilder` | Sets `context.appRevision`. Use when the template uses revision labels. |
| `.WithParam(name string, value any) *TestContextBuilder` | Sets a single parameter value. Parameters not set here produce a nil value when resolved by `comp.Render()`. |
| `.WithParams(params map[string]any) *TestContextBuilder` | Sets multiple parameter values at once from a map. |
| `.WithClusterVersion(major, minor int) *TestContextBuilder` | Sets the Kubernetes cluster version. Use for templates with `defkit.Lt(vela.ClusterVersion().Minor(), ...)` version guards. |
| `.WithOutputStatus(status map[string]any) *TestContextBuilder` | Sets the simulated primary output status. Use for testing health policies or status expressions that read `context.output.status`. |
| `.WithOutputsStatus(name string, status map[string]any) *TestContextBuilder` | Sets status for a named auxiliary output. Use when the template reads `context.outputs.<name>.status`. |
| `.WithWorkload(workload *defkit.Resource) *TestContextBuilder` | Sets the workload resource for trait testing. Traits read the workload via `context.output` in the patch block. |
| `.Build() *TestRuntimeContext` | Constructs the immutable runtime context. Called internally by `Render()` and `RenderAll()`; call it directly only when you need to inspect context fields in a test assertion. |

## `comp.Render()` and `comp.RenderAll()`

Render executes the component template in-process with a fully resolved test context. All parameter references, `context.name`, `context.namespace`, `SetIf` conditions, and `If`/`EndIf` blocks are evaluated against the values supplied in the `TestContextBuilder`.

| Method | Description |
|---|---|
| `comp.Render(ctx *TestContextBuilder) *RenderedResource` | Executes the template and returns the primary `output` resource with all values resolved. Returns `nil` if the template sets no primary output. |
| `comp.RenderAll(ctx *TestContextBuilder) *RenderedOutputs` | Executes the template and returns a `*RenderedOutputs` containing `Primary *RenderedResource` and `Auxiliary map[string]*RenderedResource`. Auxiliary resources gated by `tpl.OutputsIf(cond, ...)` are included only when the condition evaluates to true against the test context. |

### `*RenderedResource` Accessors

| Method | Description |
|---|---|
| `.APIVersion() string` | Returns the resource's API version (e.g. `"apps/v1"`). |
| `.Kind() string` | Returns the resource kind (e.g. `"Deployment"`). |
| `.Data() map[string]any` | Returns the full resolved resource data as a map. |
| `.Get(path string) any` | Retrieves a resolved value at the given path. Supports dot-notation (`"spec.replicas"`), array indices (`"spec.containers[0].image"`), and bracket notation (`"metadata.labels[app.oam.dev/name]"`). Returns `nil` if the path does not exist or the field was not set for the given test parameters. |

## Accessor Methods (Structure Inspection)

These methods on `*ComponentDefinition` (and its siblings `TraitDefinition`, `PolicyDefinition`, `WorkflowStepDefinition`) let you inspect the definition's declared structure without rendering. Use them in the `BeforeEach` or early `It` blocks of a Ginkgo suite to confirm the definition was wired correctly.

| Method | Description |
|---|---|
| `comp.GetName() string` | Returns the definition name passed to `defkit.NewComponent(name)`. |
| `comp.GetDescription() string` | Returns the description set by `.Description(...)`. |
| `comp.GetWorkload() WorkloadType` | Returns a `WorkloadType` with `.APIVersion()` and `.Kind()` methods. |
| `comp.GetParams() []Param` | Returns all `Param` values registered via `.Params(...)`. Each element implements `Name() string`, `IsRequired() bool`, `IsOptional() bool`, `HasDefault() bool`, `GetDefault() any`, and `GetDescription() string`. |
| `comp.GetTemplate() func(tpl *Template)` | Returns the template closure. Invoke it with `defkit.NewTemplate()` to inspect the output and outputs builders without a test context: `tpl := defkit.NewTemplate(); comp.GetTemplate()(tpl)`. |
| `tpl.GetOutput() *Resource` | Returns the primary output resource builder (nil if the template calls no `tpl.Output(...)`). |
| `tpl.GetOutputs() map[string]*Resource` | Returns all auxiliary resource builders keyed by their names. Resources registered with `tpl.OutputsIf(...)` are present in the map regardless of the condition. |
| `comp.GetPlacement() placement.PlacementSpec` | Returns the `PlacementSpec` with `.RunOn []placement.Condition` and `.NotRunOn []placement.Condition`. Pass it to `placement.Evaluate()` in placement tests. |
| `comp.ToCue() string` | Generates the full CUE definition string. Use in assertions that verify the generated CUE shape (parameter types, defaults, directives). |

## Gomega Matchers

Import the matchers package with a dot-import — `import . "github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers"` — so matcher names are unqualified in test files. The full import path is `github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers`.

### Resource Kind and Version Matchers

Apply to any `*defkit.Resource` — either a raw builder (`defkit.NewResource(...)`) or the value returned by `tpl.GetOutput()` and `tpl.GetOutputs()["name"]`.

| Matcher | Description |
|---|---|
| `BeDeployment()` | Passes when the resource's `.Kind()` is `"Deployment"`. |
| `BeService()` | Passes when the resource's `.Kind()` is `"Service"`. |
| `BeConfigMap()` | Passes when the resource's `.Kind()` is `"ConfigMap"`. |
| `BeSecret()` | Passes when the resource's `.Kind()` is `"Secret"`. |
| `BeIngress()` | Passes when the resource's `.Kind()` is `"Ingress"`. |
| `BeResourceOfKind(kind string)` | Passes when the resource's `.Kind()` equals the given string. Use for any kind not covered by the named matchers above. |
| `HaveAPIVersion(version string)` | Passes when the resource's `.APIVersion()` equals the given string (e.g. `"apps/v1"`, `"v1"`). |

### Operation Matchers

Operation matchers inspect the builder's internal `Set` operation list. They run in-process and do not require rendering with a test context, making them the fastest way to verify that a field path is wired to the right value.

| Matcher | Description |
|---|---|
| `HaveSetOp(path string)` | Passes when the resource has a `Set` operation registered at exactly `path`. Use this to assert that a required field is wired. |
| `HaveOpCount(n int)` | Passes when the total number of `Set` operations on the resource equals `n`. Use as a completeness check after verifying individual paths with `HaveSetOp`. |

:::tip
`HaveSetOp` and `HaveOpCount` count the raw operations on the builder — not the resolved rendered fields. A `SetIf` creates one operation regardless of whether the condition is true at render time. Use `rendered.Get(path)` after `comp.Render()` to assert the resolved value; use `HaveSetOp` to assert the template wiring itself.
:::

### Parameter Matchers

Apply to any `Param` value (e.g. `defkit.String("name")`, `defkit.Int("replicas").Default(1).Optional()`).

| Matcher | Description |
|---|---|
| `BeRequired()` | Passes when `param.IsRequired()` returns `true`. A param is required only when `.Required()` has been called on it — a plain `defkit.String("name")` is neither required nor optional by default. |
| `BeOptional()` | Passes when `param.IsOptional()` returns `true`. A param is optional only when `.Optional()` has been called on it. |
| `HaveDefaultValue(v any)` | Passes when `param.HasDefault()` is true and `param.GetDefault()` equals `v`. |
| `HaveDescription(desc string)` | Passes when `param.GetDescription()` equals `desc` exactly. |
| `HaveParamNamed(name string)` | Applies to a `*defkit.ComponentDefinition`. Passes when any param in `comp.GetParams()` has `Name() == name`. Use as a quick existence check without iterating `GetParams()` by hand. |

:::caution
`BeRequired()` and `BeOptional()` are independent — a param with neither `.Required()` nor `.Optional()` called will fail both matchers. This mirrors CUE semantics where a field with no marker is neither explicitly required nor optional.
:::

## Placement Testing Helpers

Test placement constraints by evaluating them against a mock cluster label map. Import `"github.com/oam-dev/kubevela/pkg/definition/defkit/placement"`.

| Function | Signature | Description |
|---|---|---|
| `placement.Evaluate` | `func Evaluate(spec PlacementSpec, labels map[string]string) PlacementResult` | Checks whether a cluster represented by `labels` satisfies the placement spec. Returns a `PlacementResult` with `.Eligible bool`, `.Reason string`, `.MatchedRunOn []string`, and `.MatchedNotRunOn []string`. Empty `labels` means no labels — `Exists()` / `Eq()` / `In()` conditions on RunOn will fail. |
| `placement.ValidatePlacement` | `func ValidatePlacement(spec PlacementSpec) error` | Detects logically conflicting constraints at definition-build time — e.g. the same label required in both `RunOn` and `NotRunOn`. Returns `*ValidationError` or `nil`. Call this in a `BeforeSuite` or early `It` to catch mis-wired placement before rendering. |

Obtain the `PlacementSpec` for any definition with `comp.GetPlacement()` (returns `placement.PlacementSpec` with `.RunOn` and `.NotRunOn` slices). The same method is available on `TraitDefinition`, `PolicyDefinition`, and `WorkflowStepDefinition`.

## Example

Let's build a `testing-demo` component — a `Deployment` with an optional `Service` auxiliary — and exercise every API listed above in a single `_test.go` file: `defkit.TestContext()` with `.WithName`, `.WithNamespace`, `.WithAppRevision`, `.WithClusterVersion`, `.WithParam`, `.WithParams`; `comp.Render()` with `.APIVersion()`, `.Kind()`, `.Get(path)`; `comp.RenderAll()` with `.Primary` and `.Auxiliary`; `comp.GetName()`, `.GetDescription()`, `.GetWorkload()`, `.GetParams()`, `.GetTemplate()`, `.GetPlacement()`; `tpl.GetOutput()`, `.GetOutputs()`; matchers `BeDeployment()`, `BeService()`, `BeResourceOfKind()`, `HaveAPIVersion()`, `HaveSetOp()`, `HaveOpCount()`, `BeRequired()`, `BeOptional()`, `HaveDefaultValue()`, `HaveDescription()`, `HaveParamNamed()`; and `placement.Evaluate()` plus `placement.ValidatePlacement()`. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop both files below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import (
    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"
)

func TestingDemo() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Container image")
    replicas := defkit.Int("replicas").
        Default(1).
        Description("Number of replicas")
    port := defkit.Int("port").
        Optional().
        Description("Container port to expose")

    return defkit.NewComponent("testing-demo").
        Description("Demonstrates defkit's testing surface: TestContext, Render, matchers, and placement.Evaluate").
        Workload("apps/v1", "Deployment").
        RunOn(
            placement.Label("environment").Ne("development"),
        ).
        Params(image, replicas, port).
        Template(testingDemoTemplate)
}

func testingDemoTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    replicas := defkit.Int("replicas")
    port := defkit.Int("port")

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("metadata.namespace", vela.Namespace()).
        Set("spec.replicas", replicas).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image)

    tpl.Output(dep)

    svc := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        SetIf(port.IsSet(), "spec.ports[0].port", port)

    tpl.OutputsIf(port.IsSet(), "service", svc)
}

func init() { defkit.Register(TestingDemo()) }
```

</TabItem>
<TabItem value="go-test" label="Go — test">

```go
package components_test

import (
    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"

    "my-platform/components"

    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"
    . "github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers"
)

var _ = Describe("TestingDemo Component", func() {

    Describe("accessor methods", func() {
        var comp *defkit.ComponentDefinition

        BeforeEach(func() {
            comp = components.TestingDemo()
        })

        It("GetName returns the definition name", func() {
            Expect(comp.GetName()).To(Equal("testing-demo"))
        })

        It("GetWorkload returns Deployment workload type", func() {
            wl := comp.GetWorkload()
            Expect(wl.APIVersion()).To(Equal("apps/v1"))
            Expect(wl.Kind()).To(Equal("Deployment"))
        })

        It("HaveParamNamed matches named parameters", func() {
            Expect(comp).To(HaveParamNamed("image"))
            Expect(comp).To(HaveParamNamed("replicas"))
            Expect(comp).To(HaveParamNamed("port"))
            Expect(comp).NotTo(HaveParamNamed("cpu"))
        })

        It("GetParams returns all parameters", func() {
            Expect(comp.GetParams()).To(HaveLen(3))
        })

        It("GetTemplate returns the template function", func() {
            tpl := defkit.NewTemplate()
            comp.GetTemplate()(tpl)
            Expect(tpl.GetOutput()).NotTo(BeNil())
        })

        It("GetPlacement returns placement spec from RunOn", func() {
            spec := comp.GetPlacement()
            Expect(spec.RunOn).To(HaveLen(1))
            Expect(spec.NotRunOn).To(BeEmpty())
        })
    })

    Describe("parameter matchers", func() {
        It("BeRequired matches a required parameter", func() {
            image := defkit.String("image").Required()
            Expect(image).To(BeRequired())
        })

        It("BeOptional matches an optional parameter", func() {
            port := defkit.Int("port").Optional()
            Expect(port).To(BeOptional())
        })

        It("HaveDefaultValue matches a parameter with a specific default", func() {
            replicas := defkit.Int("replicas").Default(1)
            Expect(replicas).To(HaveDefaultValue(1))
        })

        It("HaveDescription matches the description set on a parameter", func() {
            image := defkit.String("image").Description("Container image")
            Expect(image).To(HaveDescription("Container image"))
        })
    })

    Describe("template output matchers", func() {
        var tpl *defkit.Template

        BeforeEach(func() {
            tpl = defkit.NewTemplate()
            components.TestingDemo().GetTemplate()(tpl)
        })

        It("BeDeployment matches the primary output", func() {
            Expect(tpl.GetOutput()).To(BeDeployment())
        })

        It("HaveAPIVersion matches the primary output API version", func() {
            Expect(tpl.GetOutput()).To(HaveAPIVersion("apps/v1"))
        })

        It("BeResourceOfKind matches an arbitrary kind", func() {
            Expect(tpl.GetOutput()).To(BeResourceOfKind("Deployment"))
        })

        It("HaveSetOp checks that a field path is wired", func() {
            Expect(tpl.GetOutput()).To(HaveSetOp("metadata.name"))
            Expect(tpl.GetOutput()).To(HaveSetOp("spec.replicas"))
            Expect(tpl.GetOutput()).To(HaveSetOp("spec.template.spec.containers[0].image"))
            Expect(tpl.GetOutput()).NotTo(HaveSetOp("spec.template.spec.serviceAccountName"))
        })

        It("HaveOpCount counts all Set operations on the primary output", func() {
            Expect(tpl.GetOutput()).To(HaveOpCount(7))
        })

        It("GetOutputs exposes auxiliary resources keyed by name", func() {
            Expect(tpl.GetOutputs()).To(HaveKey("service"))
            Expect(tpl.GetOutputs()["service"]).To(BeService())
        })
    })

    Describe("comp.Render with TestContext", func() {
        var comp *defkit.ComponentDefinition

        BeforeEach(func() {
            comp = components.TestingDemo()
        })

        It("resolves context.name into metadata.name", func() {
            rendered := comp.Render(
                defkit.TestContext().
                    WithName("my-app").
                    WithParam("image", "nginx:1.25"),
            )
            Expect(rendered.APIVersion()).To(Equal("apps/v1"))
            Expect(rendered.Kind()).To(Equal("Deployment"))
            Expect(rendered.Get("metadata.name")).To(Equal("my-app"))
        })

        It("resolves context.namespace into metadata.namespace", func() {
            rendered := comp.Render(
                defkit.TestContext().
                    WithName("my-app").
                    WithNamespace("production").
                    WithParam("image", "nginx:1.25"),
            )
            Expect(rendered.Get("metadata.namespace")).To(Equal("production"))
        })

        It("resolves image parameter", func() {
            rendered := comp.Render(
                defkit.TestContext().
                    WithName("my-app").
                    WithParam("image", "redis:7"),
            )
            Expect(rendered.Get("spec.template.spec.containers[0].image")).To(Equal("redis:7"))
        })

        It("resolves overridden replicas", func() {
            rendered := comp.Render(
                defkit.TestContext().
                    WithName("my-app").
                    WithParam("image", "nginx:1.25").
                    WithParam("replicas", 3),
            )
            Expect(rendered.Get("spec.replicas")).To(Equal(3))
        })

        It("WithAppRevision is reflected in context", func() {
            ctx := defkit.TestContext().
                WithName("my-app").
                WithAppRevision("v5").
                WithParam("image", "nginx:1.25")
            Expect(ctx.Build().AppRevision()).To(Equal("v5"))
        })

        It("WithClusterVersion is reflected in context", func() {
            ctx := defkit.TestContext().
                WithClusterVersion(1, 30).
                WithParam("image", "nginx:1.25")
            major, minor := ctx.Build().ClusterVersion()
            Expect(major).To(Equal(1))
            Expect(minor).To(Equal(30))
        })

        It("RenderAll omits service auxiliary when port is not set", func() {
            outputs := comp.RenderAll(
                defkit.TestContext().
                    WithName("my-app").
                    WithParam("image", "nginx:1.25"),
            )
            Expect(outputs.Primary.Kind()).To(Equal("Deployment"))
            Expect(outputs.Auxiliary).NotTo(HaveKey("service"))
        })

        It("RenderAll includes service auxiliary when port is set", func() {
            outputs := comp.RenderAll(
                defkit.TestContext().
                    WithName("my-app").
                    WithParam("image", "nginx:1.25").
                    WithParam("port", 8080),
            )
            Expect(outputs.Auxiliary).To(HaveKey("service"))
            Expect(outputs.Auxiliary["service"].Kind()).To(Equal("Service"))
        })

        It("WithParams sets all parameters at once", func() {
            rendered := comp.Render(
                defkit.TestContext().
                    WithName("bulk-app").
                    WithParams(map[string]any{
                        "image":    "busybox:latest",
                        "replicas": 2,
                    }),
            )
            Expect(rendered.Get("metadata.name")).To(Equal("bulk-app"))
            Expect(rendered.Get("spec.replicas")).To(Equal(2))
        })
    })

    Describe("placement.Evaluate", func() {
        var comp *defkit.ComponentDefinition

        BeforeEach(func() {
            comp = components.TestingDemo()
        })

        It("is eligible on a production cluster", func() {
            spec := comp.GetPlacement()
            result := placement.Evaluate(spec, map[string]string{
                "environment": "production",
            })
            Expect(result.Eligible).To(BeTrue())
        })

        It("is ineligible on a development cluster", func() {
            spec := comp.GetPlacement()
            result := placement.Evaluate(spec, map[string]string{
                "environment": "development",
            })
            Expect(result.Eligible).To(BeFalse())
            Expect(result.Reason).To(ContainSubstring("runOn conditions not satisfied"))
        })

        It("placement.ValidatePlacement reports no conflict for this definition", func() {
            spec := comp.GetPlacement()
            Expect(placement.ValidatePlacement(spec)).To(BeNil())
        })
    })

    Describe("CUE generation", func() {
        It("ToCue produces valid CUE referencing parameter names", func() {
            cue := components.TestingDemo().ToCue()
            Expect(cue).To(ContainSubstring(`type: "component"`))
            Expect(cue).To(ContainSubstring(`image: string`))
            Expect(cue).To(ContainSubstring(`replicas: *1 | int`))
            Expect(cue).To(ContainSubstring(`port?: int`))
        })
    })
})
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"testing-demo": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Demonstrates defkit's testing surface: TestContext, Render, matchers, and placement.Evaluate"
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
    }
    spec: {
      replicas: parameter.replicas
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
    if parameter["port"] != _|_ {
      service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: context.name
        spec: {
          selector: "app.oam.dev/component": context.name
          ports: [{
            port: parameter.port
          }]
        }
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: string
    // +usage=Number of replicas
    replicas: *1 | int
    // +usage=Container port to expose
    port?: int
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="testing-demo-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testing-demo-app
  namespace: default
spec:
  components:
    - name: testing-demo
      type: testing-demo
      properties:
        image: nginx:stable
        replicas: 1
        port: 8080
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

### Apply and verify

The `testing-demo` component exercises a purely unit-level testing surface — `comp.Render()`, `comp.RenderAll()`, accessor methods, Gomega matchers, and `placement.Evaluate()` all run in-process. No cluster is required to run the test suite. Use `-v` to see the Ginkgo dots; without it, `go test` prints only the package-level pass line.

```shell
go test -v ./components/...
```

```
Running Suite: Components Suite - my-platform/components
=========================================================
Random Seed: 1779035494

Will run 237 of 237 specs
••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

Ran 237 of 237 Specs in 0.040 seconds
SUCCESS! -- 237 Passed | 0 Failed | 0 Pending | 0 Skipped
--- PASS: TestComponents (0.05s)
PASS
ok      my-platform/components    0.056s
```

All 237 specs pass, including the `TestingDemo Component` suite that exercises every method in the tables above.

The same definition deploys cleanly against a live cluster — useful as a smoke test that your unit-tested template renders to a valid Kubernetes object the controller accepts:

```shell
# placement RunOn requires environment != development
kubectl create configmap vela-cluster-identity -n vela-system \
  --from-literal=environment=production
vela def apply ./vela-templates/definitions/component/testing-demo.cue
vela up -f testing-demo-app.yaml   # type: testing-demo, properties: image+replicas+port
```

```
NAME               COMPONENT      TYPE           PHASE     HEALTHY   STATUS   AGE
testing-demo-app   testing-demo   testing-demo   running   true               15s
```

The rendered Deployment and Service are named after the component (`context.name`), not the Application — `metadata.name` in the template is set to `vela.Name()`, which resolves to the component name (`testing-demo`).

```shell
kubectl get deployment testing-demo -o jsonpath='{.spec.replicas} {.spec.template.spec.containers[0].image}'
# 1 nginx:stable
kubectl get service testing-demo -o jsonpath='{.spec.ports}'
# [{"port":8080,"protocol":"TCP","targetPort":8080}]
```

Clean up:

```shell
vela delete testing-demo-app --namespace default -y
kubectl delete componentdefinition testing-demo -n vela-system
kubectl delete configmap vela-cluster-identity -n vela-system
```

## See Also

- [ComponentDefinition](./definition-component.md) — define workload types
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [PolicyDefinition](./definition-policy.md) — define application policies
- [WorkflowStepDefinition](./definition-workflowstep.md) — define workflow steps
- [Cluster Placement](./cluster-placement.md) — `placement.Evaluate()` and `placement.ValidatePlacement()` in depth
- [Quick Start](./quick-start.md) — scaffolding a `my-platform` module
