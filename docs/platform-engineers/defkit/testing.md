---
title: Testing Definitions
---

Write Go unit tests for your definitions using defkit's test helpers and Gomega matchers. Unit tests run entirely in-process and do not require a cluster; E2E tests require a live KubeVela cluster.

## Unit Testing

### `defkit.TestContext()`

Creates a test context with runtime values and parameter overrides for unit-testing definitions without a cluster.

```go title="Go — defkit"
ctx := defkit.TestContext().
    WithName("my-app").
    WithNamespace("production").
    WithParam("image", "nginx:1.21").
    WithParam("replicas", 3).
    WithAppRevision("v2").
    WithClusterVersion(1, 28)
```

**Available methods:**

| Method | Description |
|---|---|
| `.WithName(name)` | Sets `context.name` — the component/trait name. |
| `.WithNamespace(ns)` | Sets `context.namespace`. Defaults to `"default"` if not set. |
| `.WithAppName(name)` | Sets `context.appName`. Use when your template references the application name. |
| `.WithAppRevision(rev)` | Sets `context.appRevision`. Use when your template uses revision labels. |
| `.WithParam(name, value)` | Sets a single parameter value. Parameters not set here use their defaults. |
| `.WithParams(map[string]any)` | Sets all parameters at once from a map. |
| `.WithClusterVersion(major, minor)` | Sets the Kubernetes cluster version. Use for version-conditional resources. |
| `.WithOutputStatus(status)` | Sets the primary output resource's status. Use for testing health policies or status expressions. |
| `.WithOutputsStatus(name, status)` | Sets a named auxiliary output's status. |
| `.WithWorkload(workload)` | Sets the workload resource for trait testing. Traits reference `context.output` to read the workload. |

### `comp.Render(ctx)`

Renders a component definition against a test context, producing the concrete Kubernetes resource map.

`comp.Render(ctx) *RenderedResource` renders the primary output with all parameter values, context references, and conditional logic resolved. Use `.Get(path string) any` to assert on specific fields. `.APIVersion()`, `.Kind()`, `.Data()` access top-level fields.

`comp.RenderAll(ctx) *RenderedOutputs` renders all outputs (primary + auxiliaries). Use when your component creates multiple resources.

```go title="Go — defkit"
rendered := comp.Render(
    defkit.TestContext().WithName("myapp"),
)

apiVersion := rendered.APIVersion()
kind        := rendered.Kind()
data        := rendered.Data()
name        := data["metadata"].(map[string]any)["name"]
```

```go title="With Ginkgo/Gomega"
It("should render with context", func() {
    rendered := comp.Render(
        defkit.TestContext().WithName("myapp"),
    )

    Expect(rendered.APIVersion()).To(Equal("apps/v1"))
    Expect(rendered.Kind()).To(Equal("Deployment"))

    data := rendered.Data()
    Expect(data["metadata"].(map[string]any)["name"]).
        To(Equal("myapp"))
})
```

## Accessor Methods

Read-only accessors used in tests to inspect the definition structure without rendering.

```go title="Go — defkit"
comp := defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").
    Params(image, replicas).
    Template(myTemplate)

comp.GetName()
comp.GetDescription()
comp.GetWorkload()
comp.GetParams()
comp.GetPlacement()

tpl := defkit.NewTemplate()
comp.GetTemplate()(tpl)

tpl.GetOutput()
tpl.GetOutputs()
```

```go title="In Ginkgo tests"
It("should have correct metadata", func() {
    Expect(comp.GetName()).To(Equal("webservice"))
    Expect(comp.GetDescription()).To(Equal("Web service"))
    Expect(comp.GetWorkload().Kind()).To(Equal("Deployment"))
})

It("should have required image param", func() {
    Expect(comp.GetParams()).To(HaveLen(2))
    Expect(comp.GetParams()[0]).To(BeRequired())
})

It("should produce a Deployment output", func() {
    tpl := defkit.NewTemplate()
    comp.GetTemplate()(tpl)
    Expect(tpl.GetOutput()).To(BeDeployment())
})
```

## Gomega Matchers

Import from `github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers`.

### Resource Kind & Version Matchers

```go title="Go — import"
import (
    . "github.com/onsi/gomega"
    . "github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers"
)

r := defkit.NewResource("apps/v1", "Deployment")

Expect(r).To(BeDeployment())
Expect(r).To(BeService())
Expect(r).To(BeConfigMap())
Expect(r).To(BeSecret())
Expect(r).To(BeIngress())
Expect(r).To(BeResourceOfKind("Deployment"))
Expect(r).To(HaveAPIVersion("apps/v1"))
```

```go title="Template assertions"
tpl := defkit.NewTemplate()
comp.GetTemplate()(tpl)

output := tpl.GetOutput()
Expect(output).To(BeDeployment())
Expect(output).To(HaveAPIVersion("apps/v1"))

outputs := tpl.GetOutputs()
Expect(outputs).To(HaveKey("service"))
Expect(outputs["service"]).To(BeService())
```

### Operation Matchers

Assert that specific `.Set()` operations exist on a resource builder, and check the total number of operations.

```go title="Go — defkit"
image    := defkit.String("image")
replicas := defkit.Int("replicas")

r := defkit.NewResource("apps/v1", "Deployment").
    Set("spec.template.spec.containers[0].image", image).
    Set("spec.replicas", replicas)

Expect(r).To(HaveSetOp("spec.template.spec.containers[0].image"))
Expect(r).NotTo(HaveSetOp("spec.volumes"))
Expect(r).To(HaveOpCount(2))
```

:::tip
Operation matchers check the builder's internal operation list — they don't require rendering the full template with a context. Use them for fast checks that verify a field is wired to a param.
:::

### Parameter Matchers

```go title="Go — defkit"
Expect(defkit.String("token").Required()).To(BeRequired())
Expect(defkit.String("tag").Optional()).To(BeOptional())

Expect(defkit.Int("replicas").Default(3)).To(HaveDefaultValue(3))
Expect(defkit.String("tag").Default("latest")).To(HaveDefaultValue("latest"))

Expect(defkit.String("image").Description("Container image")).
    To(HaveDescription("Container image"))

comp := defkit.NewComponent("test").
    Params(
        defkit.String("image"),
        defkit.Int("replicas").Default(1),
    )

Expect(comp).To(HaveParamNamed("image"))
Expect(comp).To(HaveParamNamed("replicas"))
Expect(comp).NotTo(HaveParamNamed("cpu"))
```

## Testing Placement

Test placement constraints by evaluating them against mock cluster labels using `placement.Evaluate()`.

```go title="Go — Ginkgo test"
import "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"

It("should be eligible on AWS EKS clusters", func() {
    comp := defkit.NewComponent("aws-only").
        RunOn(placement.Label("provider").Eq("aws"))

    spec := comp.GetPlacement()
    result := placement.Evaluate(spec, map[string]string{
        "provider": "aws",
    })
    Expect(result.Eligible).To(BeTrue())
})

It("should be ineligible on GCP clusters", func() {
    comp := defkit.NewComponent("aws-only").
        RunOn(placement.Label("provider").Eq("aws"))

    spec := comp.GetPlacement()
    result := placement.Evaluate(spec, map[string]string{
        "provider": "gcp",
    })
    Expect(result.Eligible).To(BeFalse())
})
```

`placement.Evaluate()` returns a result with two fields:

| Field | Type | Description |
|---|---|---|
| `result.Eligible` | `bool` | Whether the cluster matches |
| `result.Reason` | `string` | Explanation of the decision |

## Complete Unit Test Example

```go title="Go — full test file"
var _ = Describe("Webservice Component", func() {
    var comp *defkit.ComponentDefinition

    BeforeEach(func() {
        image    := defkit.String("image")
        replicas := defkit.Int("replicas").Default(1)

        comp = defkit.NewComponent("webservice").
            Workload("apps/v1", "Deployment").
            Params(image, replicas).
            Template(func(tpl *defkit.Template) {
                vela := defkit.VelaCtx()
                tpl.Output(
                    defkit.NewResource("apps/v1", "Deployment").
                        Set("metadata.name", vela.Name()).
                        Set("spec.replicas", replicas),
                )
            })
    })

    It("should have correct metadata", func() {
        Expect(comp.GetName()).To(Equal("webservice"))
        Expect(comp.GetWorkload().Kind()).To(Equal("Deployment"))
    })

    It("should require image", func() {
        Expect(comp).To(HaveParamNamed("image"))
        Expect(comp.GetParams()[0]).To(BeRequired())
    })

    It("should produce a Deployment", func() {
        tpl := defkit.NewTemplate()
        comp.GetTemplate()(tpl)
        Expect(tpl.GetOutput()).To(BeDeployment())
        Expect(tpl.GetOutput()).To(HaveSetOp("metadata.name"))
        Expect(tpl.GetOutput()).To(HaveOpCount(2))
    })

    It("should generate valid CUE", func() {
        cue := comp.ToCue()
        Expect(cue).To(ContainSubstring(`type: "component"`))
        Expect(cue).To(ContainSubstring(`image: string`))
        Expect(cue).To(ContainSubstring(`replicas: *1 | int`))
    })
})
```

## E2E Testing

E2E tests run against a live KubeVela cluster using YAML fixtures from `test/builtin-definition-example/`.

```bash title="make targets"
make test-e2e

make test-e2e-components
make test-e2e-traits
make test-e2e-policies
make test-e2e-workflowsteps

PROCS=10 E2E_TIMEOUT=10m make test-e2e-components

TESTDATA_PATH=test/my-fixtures make test-e2e
```

**Fixture directory structure:**

```
test/builtin-definition-example/
  components/      # Label("components") in Ginkgo
  traits/          # Label("traits")
  policies/        # Label("policies")
  workflowsteps/   # Label("workflowsteps")
```

Each YAML file is a complete `Application` spec that exercises the definition. Tests poll for Application readiness. Each test gets an isolated namespace `e2e-<sanitized-app-name>`.

## Running Tests

```bash title="go test"
go test ./...

go test -v ./...

go test ./components/... -run TestWebService
go test ./traits/... -run TestEnv

make test-unit
```

```bash title="Ginkgo CLI"
make install-ginkgo

ginkgo -v ./components/...
ginkgo -v ./traits/...

ginkgo --label-filter=components ./test/e2e/...
ginkgo --label-filter=traits     ./test/e2e/...
```
