---
title: Testing Definitions
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Test a defkit definition at three levels, from fastest to slowest:

| Level | What it checks | Tool | Needs |
|---|---|---|---|
| Go unit tests | Parameters, template wiring, rendered values, placement | `defkit.TestContext()`, `comp.Render()`, the matchers | `go test` |
| CUE tests | Trait patches, health and status, against the generated CUE | `vela def test` | the `vela` CLI |
| On a cluster | Admission, the controller, real health | `vela def apply-module`, `vela up` | a KubeVela cluster |

Go unit tests run in-process and give the fastest feedback, but `Render()` only resolves the template: it doesn't apply a trait's patch or evaluate a health policy. Check those against the generated CUE with [`vela def test`](../../cli/vela_def_test.md), which computes them the way the controller does.

## Set up the test suite

The tests on this page use [Ginkgo](https://onsi.github.io/ginkgo/) and [Gomega](https://onsi.github.io/gomega/). Ginkgo only runs specs in a package that has a suite file, so add one next to your definitions, for example `my-platform/components/components_suite_test.go`:

```go title="components_suite_test.go"
package components_test

import (
    "testing"

    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
)

func TestComponents(t *testing.T) {
    RegisterFailHandler(Fail)
    RunSpecs(t, "Components Suite")
}
```

Without it, `go test` finds no specs and passes without running anything.

If you don't use Ginkgo, the same calls work in a plain Go test with Gomega's `NewWithT`:

```go
func TestTestingDemoImage(t *testing.T) {
    g := NewWithT(t)
    rendered := components.TestingDemo().Render(
        defkit.TestContext().WithParam("image", "nginx:1.25"),
    )
    g.Expect(rendered.Get("spec.template.spec.containers[0].image")).To(Equal("nginx:1.25"))
}
```

## `defkit.TestContext()` Builder

`defkit.TestContext()` returns a `*TestContextBuilder` that supplies mock runtime values (component name, namespace, parameters, cluster version) to `comp.Render()` and `comp.RenderAll()`. Defaults: `name="test-component"`, `namespace="default"`, `appName="test-app"`, `appRevision="test-app-v1"`, `clusterMajor=1`, `clusterMinor=28`.

| Method | Description |
|---|---|
| `defkit.TestContext() *TestContextBuilder` | Creates a new test context builder with the defaults above. Call the methods below to override individual fields. |
| `.WithName(name string) *TestContextBuilder` | Sets `context.name`, the component or trait name that `defkit.VelaCtx().Name()` resolves to in the template. |
| `.WithNamespace(ns string) *TestContextBuilder` | Sets `context.namespace`. |
| `.WithAppName(name string) *TestContextBuilder` | Sets `context.appName`. Use when the template references the application name. |
| `.WithAppRevision(rev string) *TestContextBuilder` | Sets `context.appRevision`. Use when the template uses revision labels. |
| `.WithParam(name string, value any) *TestContextBuilder` | Sets a single parameter value. Parameters not set here resolve to nil in `comp.Render()`. |
| `.WithParams(params map[string]any) *TestContextBuilder` | Sets multiple parameter values at once from a map. |
| `.WithClusterVersion(major, minor int) *TestContextBuilder` | Sets the Kubernetes cluster version. Use for templates with `defkit.Lt(vela.ClusterVersion().Minor(), ...)` version guards. |
| `.WithOutputStatus(status map[string]any) *TestContextBuilder` | Stores a simulated status for the primary output, readable from `ctx.Build().OutputStatus()`. `Render()` doesn't evaluate health policies; see [Test health and status](#test-health-and-status). |
| `.WithOutputsStatus(name string, status map[string]any) *TestContextBuilder` | Stores a simulated status for a named auxiliary output, readable from `ctx.Build().OutputsStatus(name)`. |
| `.WithWorkload(workload *defkit.Resource) *TestContextBuilder` | Stores a workload resource, readable from `ctx.Build().Workload()`. Traits have no `Render()`; see [Test a trait patch](#test-a-trait-patch). |
| `.Build() *TestRuntimeContext` | Constructs the immutable runtime context. `Render()` and `RenderAll()` call it for you; call it directly only to inspect context fields in an assertion. |

## `comp.Render()` and `comp.RenderAll()`

Render executes the component template in-process with a fully resolved test context. All parameter references, `context.name`, `context.namespace`, `SetIf` conditions, and `If`/`EndIf` blocks are evaluated against the values supplied in the `TestContextBuilder`.

| Method | Description |
|---|---|
| `comp.Render(ctx *TestContextBuilder, opts ...RenderOption) *RenderedResource` | Executes the template and returns the primary `output` resource with all values resolved. Returns `nil` if the template sets no primary output. |
| `comp.RenderAll(ctx *TestContextBuilder, opts ...RenderOption) *RenderedOutputs` | Executes the template and returns a `*RenderedOutputs` containing `Primary *RenderedResource` and `Auxiliary map[string]*RenderedResource`. Auxiliary resources gated by `tpl.OutputsIf(cond, ...)` are included only when the condition is true against the test context. |
| `defkit.SkipCompile() RenderOption` | Turns off the compile check described below. |

Before rendering, both methods compile the definition's generated CUE and **panic** if it doesn't compile, so a definition that renders in Go but that KubeVela would refuse fails its tests. The panic names the definition and the CUE error:

```
panic: defkit: generated CUE for component "broken": expected operand, found '}' (and 1 more errors)
```

The error is in the CUE that `comp.ToCue()` prints; fix the definition. Pass `defkit.SkipCompile()` only when a test means to render a definition whose generated CUE doesn't compile on its own:

```go
rendered := comp.Render(ctx, defkit.SkipCompile())
```

### `*RenderedResource` Accessors

| Method | Description |
|---|---|
| `.APIVersion() string` | Returns the resource's API version (e.g. `"apps/v1"`). |
| `.Kind() string` | Returns the resource kind (e.g. `"Deployment"`). |
| `.Data() map[string]any` | Returns the full resolved resource data as a map. |
| `.Get(path string) any` | Retrieves a resolved value at the given path. Supports dot-notation (`"spec.replicas"`), array indices (`"spec.containers[0].image"`), and bracket notation (`"metadata.labels[app.oam.dev/name]"`). Returns `nil` if the path does not exist or the field was not set for the given test parameters. |

## Accessor Methods (Structure Inspection)

These methods on `*ComponentDefinition` (and its siblings `TraitDefinition`, `PolicyDefinition`, `WorkflowStepDefinition`) let you inspect the definition's declared structure without rendering.

| Method | Description |
|---|---|
| `comp.GetName() string` | Returns the definition name passed to `defkit.NewComponent(name)`. |
| `comp.GetDescription() string` | Returns the description set by `.Description(...)`. |
| `comp.GetWorkload() WorkloadType` | Returns a `WorkloadType` with `.APIVersion()` and `.Kind()` methods. |
| `comp.GetParams() []Param` | Returns all `Param` values registered via `.Params(...)`. Each element implements `Name() string`, `IsRequired() bool`, `IsOptional() bool`, `HasDefault() bool`, `GetDefault() any`, and `GetDescription() string`. Find a parameter by name here to test how the definition declares it. |
| `comp.GetTemplate() func(tpl *Template)` | Returns the template closure. Invoke it with `defkit.NewTemplate()` to inspect the output and outputs builders without a test context: `tpl := defkit.NewTemplate(); comp.GetTemplate()(tpl)`. |
| `tpl.GetOutput() *Resource` | Returns the primary output resource builder (nil if the template calls no `tpl.Output(...)`). |
| `tpl.GetOutputs() map[string]*Resource` | Returns all auxiliary resource builders keyed by their names. Resources registered with `tpl.OutputsIf(...)` are present in the map regardless of the condition. |
| `comp.GetPlacement() placement.PlacementSpec` | Returns the `PlacementSpec` with `.RunOn []placement.Condition` and `.NotRunOn []placement.Condition`. Pass it to `placement.Evaluate()` in placement tests. |
| `comp.ToCue() string` | Generates the full CUE definition string. Use in assertions that verify the generated CUE shape (parameter types, defaults, directives). |

## Gomega Matchers

Import the matchers package with a dot-import, `import . "github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers"`, so matcher names are unqualified in test files.

### Resource Kind and Version Matchers

Apply to any `*defkit.Resource`: a raw builder (`defkit.NewResource(...)`) or the value returned by `tpl.GetOutput()` and `tpl.GetOutputs()["name"]`.

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

Operation matchers inspect the builder's internal `Set` operation list. They run in-process and need no test context, which makes them the fastest way to check that a field path is wired.

| Matcher | Description |
|---|---|
| `HaveSetOp(path string)` | Passes when the resource has a `Set` operation registered at exactly `path`. Use this to assert that a required field is wired. |
| `HaveOpCount(n int)` | Passes when the total number of `Set` operations on the resource equals `n`. Use as a completeness check after verifying individual paths with `HaveSetOp`. |

:::tip
`HaveSetOp` and `HaveOpCount` count the raw operations on the builder, not the resolved fields. A `SetIf` creates one operation whether or not its condition is true at render time. Use `rendered.Get(path)` after `comp.Render()` to assert the resolved value; use `HaveSetOp` to assert the template wiring itself.
:::

### Parameter Matchers

Apply to a `Param`. Test the parameters the definition declares, found by name in `comp.GetParams()`: a parameter you build in the test only tests defkit.

| Matcher | Description |
|---|---|
| `BeRequired()` | Passes when `param.IsRequired()` returns `true`, which it does only after `.Required()`. |
| `BeOptional()` | Passes when `param.IsOptional()` returns `true`, which it does only after `.Optional()`. |
| `HaveDefaultValue(v any)` | Passes when `param.HasDefault()` is true and `param.GetDefault()` equals `v`. |
| `HaveDescription(desc string)` | Passes when `param.GetDescription()` equals `desc` exactly. |
| `HaveParamNamed(name string)` | Applies to a `*defkit.ComponentDefinition`. Passes when any param in `comp.GetParams()` has `Name() == name`. |

:::caution
A param with neither `.Required()` nor `.Optional()` fails both `BeRequired()` and `BeOptional()`. In the generated CUE it has no marker, so the Application has to set it unless it has a default.
:::

## Placement Testing Helpers

Test placement constraints by evaluating them against a mock cluster label map. Import `"github.com/oam-dev/kubevela/pkg/definition/defkit/placement"`.

| Function | Signature | Description |
|---|---|---|
| `placement.Evaluate` | `func Evaluate(spec PlacementSpec, labels map[string]string) PlacementResult` | Checks whether a cluster represented by `labels` satisfies the placement spec. Returns a `PlacementResult` with `.Eligible bool`, `.Reason string`, `.MatchedRunOn []string`, and `.MatchedNotRunOn []string`. Empty `labels` means no labels, so `Exists()`, `Eq()` and `In()` conditions on RunOn fail. |
| `placement.ValidatePlacement` | `func ValidatePlacement(spec PlacementSpec) error` | Detects logically conflicting constraints, such as the same label required in both `RunOn` and `NotRunOn`. Returns `*ValidationError` or `nil`. |

Get the `PlacementSpec` for any definition with `comp.GetPlacement()`. The same method is available on `TraitDefinition`, `PolicyDefinition`, and `WorkflowStepDefinition`.

## Example: test a component

The `testing-demo` component is a `Deployment` with an optional `Service`, a `RunOn` placement rule, and the `DeploymentHealth()` and `DeploymentStatus()` presets from the [Health & Status DSL](./health-status-dsl.md). Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md) (Go module `github.com/myorg/my-platform`), put the definition, the suite file above and the test below in `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go: defkit">

```go title="testing_demo.go"
package components

import (
    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"
)

func TestingDemo() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Required().
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
        Template(testingDemoTemplate).
        HealthPolicy(defkit.DeploymentHealth().Build()).
        CustomStatus(defkit.DeploymentStatus().Build())
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
<TabItem value="go-test" label="Go: test">

```go title="testing_demo_test.go"
package components_test

import (
    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"

    "github.com/myorg/my-platform/components"

    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"
    . "github.com/oam-dev/kubevela/pkg/definition/defkit/testing/matchers"
)

// param returns the parameter the definition declares under name.
func param(comp *defkit.ComponentDefinition, name string) defkit.Param {
    for _, p := range comp.GetParams() {
        if p.Name() == name {
            return p
        }
    }
    Fail("no parameter named " + name)
    return nil
}

var _ = Describe("TestingDemo Component", func() {
    var comp *defkit.ComponentDefinition

    BeforeEach(func() {
        comp = components.TestingDemo()
    })

    Describe("accessor methods", func() {
        It("GetName returns the definition name", func() {
            Expect(comp.GetName()).To(Equal("testing-demo"))
        })

        It("GetWorkload returns Deployment workload type", func() {
            wl := comp.GetWorkload()
            Expect(wl.APIVersion()).To(Equal("apps/v1"))
            Expect(wl.Kind()).To(Equal("Deployment"))
        })

        It("GetParams returns all parameters", func() {
            Expect(comp.GetParams()).To(HaveLen(3))
            Expect(comp).To(HaveParamNamed("image"))
            Expect(comp).NotTo(HaveParamNamed("cpu"))
        })

        It("GetPlacement returns placement spec from RunOn", func() {
            spec := comp.GetPlacement()
            Expect(spec.RunOn).To(HaveLen(1))
            Expect(spec.NotRunOn).To(BeEmpty())
        })
    })

    Describe("parameters", func() {
        It("requires image", func() {
            image := param(comp, "image")
            Expect(image).To(BeRequired())
            Expect(image).To(HaveDescription("Container image"))
        })

        It("defaults replicas to 1", func() {
            Expect(param(comp, "replicas")).To(HaveDefaultValue(1))
        })

        It("leaves port optional", func() {
            Expect(param(comp, "port")).To(BeOptional())
        })
    })

    Describe("template wiring", func() {
        var tpl *defkit.Template

        BeforeEach(func() {
            tpl = defkit.NewTemplate()
            comp.GetTemplate()(tpl)
        })

        It("outputs an apps/v1 Deployment", func() {
            Expect(tpl.GetOutput()).To(BeDeployment())
            Expect(tpl.GetOutput()).To(HaveAPIVersion("apps/v1"))
        })

        It("wires the fields it sets", func() {
            Expect(tpl.GetOutput()).To(HaveSetOp("spec.replicas"))
            Expect(tpl.GetOutput()).To(HaveSetOp("spec.template.spec.containers[0].image"))
            Expect(tpl.GetOutput()).NotTo(HaveSetOp("spec.template.spec.serviceAccountName"))
            Expect(tpl.GetOutput()).To(HaveOpCount(7))
        })

        It("declares the service output", func() {
            Expect(tpl.GetOutputs()["service"]).To(BeService())
        })
    })

    Describe("rendering", func() {
        It("resolves context and parameters", func() {
            rendered := comp.Render(
                defkit.TestContext().
                    WithName("my-app").
                    WithNamespace("production").
                    WithParam("image", "nginx:1.25"),
            )
            Expect(rendered.Kind()).To(Equal("Deployment"))
            Expect(rendered.Get("metadata.name")).To(Equal("my-app"))
            Expect(rendered.Get("metadata.namespace")).To(Equal("production"))
            Expect(rendered.Get("spec.template.spec.containers[0].image")).To(Equal("nginx:1.25"))
        })

        It("uses the replicas it is given", func() {
            rendered := comp.Render(
                defkit.TestContext().
                    WithParams(map[string]any{
                        "image":    "busybox:latest",
                        "replicas": 2,
                    }),
            )
            Expect(rendered.Get("spec.replicas")).To(Equal(2))
        })

        It("omits the Service when port is not set", func() {
            outputs := comp.RenderAll(
                defkit.TestContext().WithParam("image", "nginx:1.25"),
            )
            Expect(outputs.Primary.Kind()).To(Equal("Deployment"))
            Expect(outputs.Auxiliary).NotTo(HaveKey("service"))
        })

        It("adds the Service when port is set", func() {
            outputs := comp.RenderAll(
                defkit.TestContext().
                    WithParam("image", "nginx:1.25").
                    WithParam("port", 8080),
            )
            Expect(outputs.Auxiliary).To(HaveKey("service"))
            Expect(outputs.Auxiliary["service"].Get("spec.ports[0].port")).To(Equal(8080))
        })
    })

    Describe("placement", func() {
        It("runs on a production cluster", func() {
            result := placement.Evaluate(comp.GetPlacement(), map[string]string{
                "environment": "production",
            })
            Expect(result.Eligible).To(BeTrue())
        })

        It("skips a development cluster", func() {
            result := placement.Evaluate(comp.GetPlacement(), map[string]string{
                "environment": "development",
            })
            Expect(result.Eligible).To(BeFalse())
            Expect(result.Reason).To(ContainSubstring("runOn conditions not satisfied"))
        })

        It("has no conflicting constraints", func() {
            Expect(placement.ValidatePlacement(comp.GetPlacement())).To(BeNil())
        })
    })

    Describe("generated CUE", func() {
        It("marks image required and port optional", func() {
            cue := comp.ToCue()
            Expect(cue).To(ContainSubstring(`image!: string`))
            Expect(cue).To(ContainSubstring(`replicas: *1 | int`))
            Expect(cue).To(ContainSubstring(`port?: int`))
        })
    })
})
```

</TabItem>
<TabItem value="cue" label="CUE: generated">

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
		status: {
			customStatus: #"""
				ready: {
					readyReplicas: *0 | int
				} & {
					if context.output.status.readyReplicas != _|_ {
						readyReplicas: context.output.status.readyReplicas
					}
				}
				message: "Ready:\(ready.readyReplicas)/\(context.output.spec.replicas)"
				"""#
			healthPolicy: #"""
				ready: {
					updatedReplicas:    *0 | int
					readyReplicas:      *0 | int
					replicas:           *0 | int
					observedGeneration: *0 | int
				} & {
					if context.output.status.updatedReplicas != _|_ {
						updatedReplicas: context.output.status.updatedReplicas
					}
					if context.output.status.readyReplicas != _|_ {
						readyReplicas: context.output.status.readyReplicas
					}
					if context.output.status.replicas != _|_ {
						replicas: context.output.status.replicas
					}
					if context.output.status.observedGeneration != _|_ {
						observedGeneration: context.output.status.observedGeneration
					}
				}
				_isHealth: (context.output.spec.replicas == ready.readyReplicas) && (context.output.spec.replicas == ready.updatedReplicas) && (context.output.spec.replicas == ready.replicas) && (ready.observedGeneration == context.output.metadata.generation || ready.observedGeneration > context.output.metadata.generation)
				isHealth: *_isHealth | bool
				if context.output.metadata.annotations != _|_ {
					if context.output.metadata.annotations["app.oam.dev/disable-health-check"] != _|_ {
						isHealth: true
					}
				}
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
			namespace: context.namespace
		}
		spec: {
			replicas: parameter.replicas
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
				}
			}
		}
	}
	outputs: {
		if parameter["port"] != _|_ {
			service: {
				apiVersion: "v1"
				kind:       "Service"
				metadata: {
					name: context.name
				}
				spec: {
					selector: {
						"app.oam.dev/component": context.name
					}
					ports: [
						if parameter["port"] != _|_ {
							{
								port: parameter.port
							}
						},
					]
				}
			}
		}
	}
	parameter: {
		// +usage=Container image
		image!: string
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

Run the specs. `-v` shows Ginkgo's progress; without it, `go test` prints only the package line.

```shell
cd my-platform
go test ./components/... -v
```

```
=== RUN   TestComponents
Running Suite: Components Suite - /home/me/my-platform/components
=================================================================
Random Seed: 1795540998

Will run 18 of 18 specs
••••••••••••••••••

Ran 18 of 18 Specs in 0.004 seconds
SUCCESS! -- 18 Passed | 0 Failed | 0 Pending | 0 Skipped
--- PASS: TestComponents (0.00s)
PASS
ok  	github.com/myorg/my-platform/components	0.624s
```

Then generate the CUE that the next two sections test:

```shell
vela def gen-module . -o ./generated-cue
```

`gen-module` names each file after the Go function, lowercased: `TestingDemo()` becomes `generated-cue/components/testingdemo.cue`.

## Test a trait patch

A trait has no `Render()` in Go: its work is the patch, and CUE applies that. Test it with a `vela/test` case against the generated trait instead. Given this trait in `my-platform/traits/`:

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go: defkit">

```go title="replicas_demo.go"
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ReplicasDemo() *defkit.TraitDefinition {
    replicas := defkit.Int("replicas").
        Default(1).
        Description("Number of replicas")

    return defkit.NewTrait("replicas-demo").
        Description("Sets the replicas of a Deployment").
        AppliesTo("deployments.apps").
        Params(replicas).
        Template(func(tpl *defkit.Template) {
            tpl.Patch().Set("spec.replicas", replicas)
        })
}

func init() { defkit.Register(ReplicasDemo()) }
```

</TabItem>
<TabItem value="cue" label="CUE: generated">

```cue
"replicas-demo": {
	type: "trait"
	annotations: {}
	labels: {}
	description: "Sets the replicas of a Deployment"
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: {
	patch: spec: replicas: parameter.replicas
	parameter: {
		// +usage=Number of replicas
		replicas: *1 | int
	}
}
```

</TabItem>
</Tabs>

Keep the CUE tests in a directory of their own, for example `my-platform/cuetests/`, since `gen-module` rewrites `generated-cue/`. A case names its definition by path, relative to the test file:

```cue title="cuetests/replicas-demo_test.cue"
import "vela/test"

"patches the workload's replicas": test.#TraitRender & {
	definition: "../generated-cue/traits/replicasdemo"
	parameter: replicas: 3
	workload: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: name: "shop"
		spec: template: spec: containers: [{name: "shop", image: "nginx:1.25"}]
	}
	expect: output: spec: replicas: 3
}
```

`workload` is the object the trait patches, written the way your component renders it. A patch merges into the workload, so it can't change a field the workload already sets: with `spec: replicas: 1` in `workload`, the case fails with `spec.replicas: conflicting values 3 and 1`, just as the Application would.

## Test health and status

`Render()` doesn't evaluate `healthPolicy` or `customStatus`. A `#ComponentStatus` case renders the component, merges `observed` over the result as the cluster would report it, and checks the health and message the controller would compute:

```cue title="cuetests/testing-demo_test.cue"
import "vela/test"

_demo: {
	definition: "../generated-cue/components/testingdemo"
	context: name: "shop"
	parameter: {
		image:    "nginx:1.25"
		replicas: 2
	}
}

"healthy once every replica is ready": test.#ComponentStatus & _demo & {
	observed: output: {
		metadata: generation: 1
		status: {
			observedGeneration: 1
			replicas:           2
			updatedReplicas:    2
			readyReplicas:      2
		}
	}
	expect: {
		healthy: true
		message: "Ready:2/2"
	}
}

"not healthy while a replica is starting": test.#ComponentStatus & _demo & {
	observed: output: {
		metadata: generation: 1
		status: {
			observedGeneration: 1
			replicas:           2
			updatedReplicas:    2
			readyReplicas:      1
		}
	}
	expect: {
		healthy: false
		message: "Ready:1/2"
	}
}

"not healthy before the Deployment reports status": test.#ComponentStatus & _demo & {
	expect: healthy: false
}
```

`DeploymentHealth()` also compares `status.observedGeneration` with `metadata.generation`, so `observed` sets both, as a real Deployment does. The last case is a fresh Deployment that has no status yet.

Run the CUE tests:

```shell
vela def test ./cuetests -v
```

```
ok   cuetests/replicas-demo_test.cue:3 replicas-demo / patches the workload's replicas
ok   cuetests/testing-demo_test.cue:12 testing-demo / healthy once every replica is ready
ok   cuetests/testing-demo_test.cue:28 testing-demo / not healthy while a replica is starting
ok   cuetests/testing-demo_test.cue:44 testing-demo / not healthy before the Deployment reports status
4 passed, 0 failed
```

See [`vela def test`](../../cli/vela_def_test.md) for the other case types (`#TraitStatus`, `#PolicyRender`, `#WorkflowStepExec` and more) and for filtering by label.

## Check it on a cluster

Unit and CUE tests don't prove that KubeVela accepts the definition, or that the workload goes healthy on a real cluster. For that, apply the module to a test cluster (k3d or kind with KubeVela installed), deploy the Application, and wait for it to report healthy:

```shell
# testing-demo has RunOn(environment != development)
kubectl create configmap vela-cluster-identity -n vela-system \
  --from-literal=environment=production
vela def apply-module .
vela up -f testing-demo-app.yaml
kubectl wait application/testing-demo-app -n default \
  --for=jsonpath='{.status.services[0].healthy}'=true --timeout=2m
```

Then check what was rendered. The Deployment and Service are named after the component (`context.name`), not the Application:

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
kubectl delete traitdefinition replicas-demo -n vela-system
kubectl delete configmap vela-cluster-identity -n vela-system
```

## See Also

- [Testing CUE Definitions](../cue/definition-testing.md): testing definitions written in CUE, with `vela def test`
- [ComponentDefinition](./definition-component.md): define workload types
- [TraitDefinition](./definition-trait.md): patch workloads with traits
- [Health & Status DSL](./health-status-dsl.md): the presets and expressions tested above
- [Cluster Placement](./cluster-placement.md): `placement.Evaluate()` and `placement.ValidatePlacement()` in depth
- [`vela def test`](../../cli/vela_def_test.md): every CUE test case type and flag
- [Quick Start](./quick-start.md): scaffolding a `my-platform` module
