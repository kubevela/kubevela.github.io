---
title: Testing Definitions
---

This page covers how to write Go unit tests for your definitions using defkit's test helpers and Gomega matchers.

:::tip
Before reading this section, make sure you've read [Getting Started with defkit](./overview.md). All tests use standard Go testing with the [Ginkgo](https://onsi.github.io/ginkgo/) and [Gomega](https://onsi.github.io/gomega/) frameworks.
:::

## Test Context

Use `defkit.TestContext()` to create a test context with parameters and runtime values:

```go title="test_context.go"
ctx := defkit.TestContext().
    WithName("my-app").
    WithNamespace("production").
    WithParam("image", "nginx:1.21").
    WithParam("replicas", 3)
```

### Available Context Methods

| Method | Description |
|:-------|:-----------|
| `.WithName(name)` | Set the component name |
| `.WithNamespace(ns)` | Set the application namespace |
| `.WithParam(key, value)` | Set a parameter value |
| `.WithAppRevision(rev)` | Set the application revision |
| `.WithClusterVersion(major, minor)` | Set the cluster version |

## Rendering Definitions

Render a component definition to inspect the output:

```go title="render.go"
comp := defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").
    Template(func(tpl *defkit.Template) {
        tpl.Output(
            defkit.NewResource("apps/v1", "Deployment").
                Set("metadata.name", defkit.VelaCtx().Name()).
                Set("spec.replicas", defkit.Lit(3)),
        )
    })

rendered := comp.Render(
    defkit.TestContext().WithName("myapp"),
)

// Access rendered data
data := rendered.Data()                              // full resource map
apiVersion := rendered.APIVersion()                  // "apps/v1"
kind := rendered.Kind()                              // "Deployment"
name := data["metadata"].(map[string]any)["name"]    // "myapp"
```

## Resource Matchers

Import the matchers package for Gomega assertions on resources:

```go title="import.go"
import (
    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"

    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    . "github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers"
)
```

### Kind Matchers

Assert the resource kind:

```go title="kind_matchers.go"
r := defkit.NewResource("apps/v1", "Deployment")

Expect(r).To(BeDeployment())
Expect(r).To(BeService())         // would fail
Expect(r).To(BeConfigMap())
Expect(r).To(BeSecret())
Expect(r).To(BeIngress())
Expect(r).To(BeResourceOfKind("Deployment"))
```

### API Version Matcher

```go title="version_matcher.go"
r := defkit.NewResource("apps/v1", "Deployment")
Expect(r).To(HaveAPIVersion("apps/v1"))
```

### Operation Matchers

Assert that specific Set operations exist on a resource:

```go title="op_matchers.go"
image := defkit.String("image")
replicas := defkit.Int("replicas")

r := defkit.NewResource("apps/v1", "Deployment").
    Set("spec.template.spec.containers[0].image", image).
    Set("spec.replicas", replicas)

// Check that a Set operation exists at a path
Expect(r).To(HaveSetOp("spec.template.spec.containers[0].image"))
Expect(r).NotTo(HaveSetOp("spec.volumes"))

// Check the total number of operations
Expect(r).To(HaveOpCount(2))
```

## Parameter Matchers

Assert parameter properties:

```go title="param_matchers.go"
// Required/Optional
Expect(defkit.String("image").Required()).To(BeRequired())
Expect(defkit.Int("replicas")).To(BeOptional())

// Default values
Expect(defkit.Int("replicas").Default(3)).To(HaveDefaultValue(3))
Expect(defkit.String("tag").Default("latest")).To(HaveDefaultValue("latest"))

// Description
Expect(defkit.String("image").Description("Container image")).To(HaveDescription("Container image"))
```

### Parameter Name Matcher

Check if a definition has a parameter with a specific name:

```go title="param_name.go"
comp := defkit.NewComponent("test").
    Params(
        defkit.String("image").Required(),
        defkit.Int("replicas").Default(1),
    )

Expect(comp).To(HaveParamNamed("image"))
Expect(comp).To(HaveParamNamed("replicas"))
Expect(comp).NotTo(HaveParamNamed("cpu"))
```

## Full Test Example

A complete test file for a webservice component:

```go title="webservice_test.go"
package myplatform_test

import (
    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"

    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    . "github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers"
)

var _ = Describe("Webservice Component", func() {
    var comp *defkit.ComponentDefinition

    BeforeEach(func() {
        image := defkit.String("image").Required().Description("Container image")
        replicas := defkit.Int("replicas").Default(1)
        port := defkit.Int("port").Default(80)

        comp = defkit.NewComponent("webservice").
            Description("Web service component").
            Workload("apps/v1", "Deployment").
            Params(image, replicas, port).
            Template(func(tpl *defkit.Template) {
                vela := defkit.VelaCtx()
                tpl.Output(
                    defkit.NewResource("apps/v1", "Deployment").
                        Set("metadata.name", vela.Name()).
                        Set("spec.replicas", replicas).
                        Set("spec.template.spec.containers[0].image", image).
                        Set("spec.template.spec.containers[0].ports[0].containerPort", port),
                )
                tpl.Outputs("service",
                    defkit.NewResource("v1", "Service").
                        Set("metadata.name", vela.Name()).
                        Set("spec.ports[0].port", port),
                )
            })
    })

    It("should have correct metadata", func() {
        Expect(comp.GetName()).To(Equal("webservice"))
        Expect(comp.GetDescription()).To(Equal("Web service component"))
        Expect(comp.GetWorkload().Kind()).To(Equal("Deployment"))
    })

    It("should have required image parameter", func() {
        Expect(comp).To(HaveParamNamed("image"))
        Expect(comp.GetParams()[0]).To(BeRequired())
    })

    It("should have optional replicas with default", func() {
        Expect(comp.GetParams()[1]).To(BeOptional())
        Expect(comp.GetParams()[1]).To(HaveDefaultValue(1))
    })

    It("should produce a Deployment output", func() {
        tpl := defkit.NewTemplate()
        comp.GetTemplate()(tpl)

        output := tpl.GetOutput()
        Expect(output).To(BeDeployment())
        Expect(output).To(HaveAPIVersion("apps/v1"))
        Expect(output).To(HaveSetOp("metadata.name"))
        Expect(output).To(HaveSetOp("spec.replicas"))
        Expect(output).To(HaveOpCount(4))
    })

    It("should produce a Service auxiliary output", func() {
        tpl := defkit.NewTemplate()
        comp.GetTemplate()(tpl)

        outputs := tpl.GetOutputs()
        Expect(outputs).To(HaveKey("service"))
        Expect(outputs["service"]).To(BeService())
    })

    It("should render with context", func() {
        rendered := comp.Render(
            defkit.TestContext().WithName("myapp"),
        )

        Expect(rendered.APIVersion()).To(Equal("apps/v1"))
        Expect(rendered.Kind()).To(Equal("Deployment"))

        data := rendered.Data()
        Expect(data["metadata"].(map[string]any)["name"]).To(Equal("myapp"))
    })

    It("should generate valid CUE", func() {
        cue := comp.ToCue()

        Expect(cue).To(ContainSubstring(`webservice: {`))
        Expect(cue).To(ContainSubstring(`type: "component"`))
        Expect(cue).To(ContainSubstring(`image: string`))
        Expect(cue).To(ContainSubstring(`replicas: *1 | int`))
    })
})
```

## Testing Placement

Test placement constraints by evaluating them against cluster labels:

```go title="placement_test.go"
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

## Running Tests

```bash
# Run all defkit tests
go test ./pkg/definition/defkit/...

# Run with verbose output
go test -v ./pkg/definition/defkit/...

# Run specific test suite
go test -v ./pkg/definition/defkit/ -run TestDefkit
```
