---
title: "Why we started writing KubeVela definitions in Go"
author: Vaibhav Agrawal
author_title: KubeVela Contributor
author_url: https://github.com/vaibhav0096
author_image_url: https://github.com/vaibhav0096.png
tags: [KubeVela, defkit, Go, CUE, X-Definition, platform-engineering, CNCF, SDK]
description: "Defkit is a Go SDK for authoring KubeVela X-Definitions. You write Go, and it compiles to CUE."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

If you have written an X-Definition, you have written CUE. [Components](/docs/end-user/components/references), [traits](/docs/end-user/traits/references), [policies](/docs/end-user/policies/references), and [workflow steps](/docs/end-user/workflow/built-in-workflow-defs) all carry their logic as a CUE template, and that template is where your platform's real behaviour lives. It is what the KubeVela controller evaluates every time an `Application` renders. Change a definition and you change how every app on the platform gets delivered.

Which makes the authoring experience matter more than it first appears. A definition is some of the most consequential code a platform team writes, and it is written in a language most platform teams touch nowhere else. We felt that every time we added one, and eventually went looking for a different way to write them.

As of v1.11.0, KubeVela ships one. **Defkit** is a Go SDK for authoring X-Definitions: you write Go, and it compiles to CUE.

<!--truncate-->

One thing to be clear about up front. This is not a replacement for CUE, and it is not a change to KubeVela's runtime. CUE earns its place in the controller: it is declarative, it composes, and evaluating it in-process keeps a definition from executing arbitrary code against your cluster. All of that stays exactly as it is. Defkit sits in front of it at authoring time, and the resource that reaches your cluster is the same CUE-bearing X-Definition it has always been.

What you gain is the Go toolchain in front of your definitions: autocomplete and inline documentation from `gopls`, type checking from the compiler, tests from `go test`, distribution from `go get`. CUE has its own language server now, so the claim is not that Go has tooling where CUE has none. It is that Go's tooling is mature, and you already have it installed.

The rest of this post writes the same definition both ways, then goes under the hood to show how the compilation works and where it stops helping.

## The problem with CUE: why change?

Write a non-trivial definition and you have probably stared at a `conflicting values` error with no line number and no stack trace, left to work out for yourself which of forty fields caused it.

While CUE is a powerful configuration language, it comes with a steep learning curve and introduces friction for developers:

- **You are switching languages.** Platform engineers spend their days in Go, building controllers and tooling. Dropping into CUE to write a definition breaks that flow, and CUE's mental model is different enough that the switch is not free.
- **You cannot easily test a definition.** There is no standard, lightweight way to unit test a definition before it goes to a cluster.
- **Errors arrive late.** A CUE template is only fully constrained once real parameters are unified into it. A field the target workload rejects, or a conflict that shows up only for certain inputs, cannot surface until the definition renders. You find out from a rejected `Application`, not from your editor.
- **Sharing needs extra machinery.** A definition is a Kubernetes custom resource with the CUE embedded in it, so a shared definition arrives as YAML to copy rather than code to import. There is no way to import someone's definition and build on it.

## Defkit: the Go SDK for KubeVela

**Definition Kit (defkit) is a Go software development kit (SDK) that allows engineers to write KubeVela X-Definitions using native Go code instead of CUE.**

Think of defkit as a transparent compiler. **You write your definitions in Go, and behind the scenes, defkit automatically converts them into CUE.** You get all the benefits of CUE without ever having to look at or write CUE code yourself.

Your Go code runs on your machine, never in the cluster. Compiling is a local step: the CLI runs your Go, collects the CUE it produces, and checks that the CUE compiles. No cluster is involved. Applying is the step that sends an X-Definition resource with that CUE as a string field, exactly where a hand-written definition keeps it.

### How defkit solves the problem

Defkit brings KubeVela definitions directly into the Go ecosystem:

- **Familiar tooling:** Because a definition is ordinary Go, your existing toolchain does the work. `gopls` supplies autocomplete and inline documentation, and the compiler type-checks the builder chain. Defkit contributes the types; it does not have to reimplement an IDE.
- **Compile-time safety:** Catch configuration errors at Go compile time, not at Kubernetes deploy time.
- **Standardized testing:** You can finally use standard Go testing frameworks (like Ginkgo and Gomega) to test your definitions without needing a live Kubernetes cluster.
- **Easy distribution:** Definitions can now be packaged and versioned as standard Go modules, meaning you can easily share and import them using standard `go get` commands.

## Let's take an example

Nothing shows the difference better than writing the same component twice. Take `webservice`, the component most KubeVela users meet first: a Deployment with a configurable image and replica count. Here it is in CUE, then the same thing in defkit.

### The CUE version

A component definition in CUE comes in two parts.

The first part describes the definition itself: its `type`, a human-readable `description`, any `labels` and `annotations`, and the `attributes` block that tells KubeVela which workload this component manages. In the code block below, that is everything above `template`. All of it describes the component itself rather than the resource the component renders.

The second part is `template`, where the actual behaviour lives. `output` is the resource KubeVela renders: here, a `Deployment` that takes its name from `context.name`, its replica count from `parameter.replicas`, and its container image from `parameter.image`. `parameter` declares the inputs a user can set in their `Application`: an `image` string and a `replicas` integer defaulting to 1.

```cue
webservice: {
  type: "component"
  annotations: {}
  labels: {}
  description: "Web service component"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind: "Deployment"
      }
      type: "deployments.apps"
    }
  }
}

template: {
  output: {
    apiVersion: "apps/v1"
    kind: "Deployment"
    metadata: {
      name: context.name
    }
    spec: {
      replicas: parameter.replicas
      template: {
        spec: {
          containers: [{
            image: parameter.image
          }]
        }
      }
    }
  }
  parameter: {
    image: string
    replicas: *1 | int
  }
}
```

### The same component in defkit

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func Webservice() *defkit.ComponentDefinition {
    image    := defkit.String("image").Description("Container image to run")
    replicas := defkit.Int("replicas").Default(1).Description("Number of replicas")

    return defkit.NewComponent("webservice").
        Description("Web service component").
        Workload("apps/v1", "Deployment").
        Params(image, replicas).
        Template(webserviceTemplate)
}

func webserviceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()

    image    := defkit.String("image")
    replicas := defkit.Int("replicas")

    tpl.Output(
        defkit.NewResource("apps/v1", "Deployment").
            Set("metadata.name", vela.Name()).
            Set("spec.replicas", replicas).
            Set("spec.template.spec.containers[0].image", image),
    )
}

func init() { defkit.Register(Webservice()) }
```

If you have not read defkit code before, it goes top to bottom.

`Webservice()` is an ordinary exported function that returns a `*defkit.ComponentDefinition`. That return type is the whole contract: it is how the loader finds your definition later, with no registration file or plugin to maintain.

The two parameters are declared first, as Go values: `image` as a string, `replicas` as an int defaulting to 1. From here on they are variables, not strings you retype.

Then the builder chain assembles the definition. `NewComponent` names it, `Description` and `Workload` fill in what the CUE `attributes` block did, `Params` registers the two parameters, and `Template` names the function that builds the body.

The template lives in its own function, which is the convention across KubeVela's own definitions: it keeps the builder chain short as the template grows. A template function takes only the `*defkit.Template` and re-declares the parameters it needs by name, which is why `defkit.String("image")` appears twice. The name is the link between the declaration and the use.

Inside it, one resource: a Deployment with three fields set by dotted path, the name from the render context, the replica count from `replicas`, and the container image from `image`. Those are the same fields the CUE `output` set.

Finally, `init()` calls `defkit.Register`, which is how the module reports this definition to the CLI.

The CUE and the Go say the same thing, and the differences are all in what a compiler can see. `replicas` is a Go variable, so passing it into `Set` is the reference; there is no second copy of the name to fall out of step with, and within a function the compiler catches a misspelled variable immediately. `defkit.VelaCtx().Name()` replaces the bare `context.name`, so you reach the render context through autocomplete rather than from memory. The `Set` paths stay plain strings, and Go will not catch a typo in one of those; what it does catch is every mistake in the parameters and the builder chain around them.

You do not have to trust the compiler blindly. `ToCue()` prints exactly what defkit generates, so you can read the output instead of guessing at it:

```go
fmt.Println(Webservice().ToCue())   // prints the CUE block shown above
```

## One more example: a trait

A component defines a workload. Most of what a platform team ships on top of that is operational behaviour, and that lives in traits. So here is the same exercise again with `cpuscaler`, a trait that attaches to the `webservice` component above and scales it on CPU usage. CUE first, then defkit.

### The CUE version

A trait definition has the same two parts as a component.

The first part is the definition header. `type` is now `"trait"` rather than `"component"`, and `attributes` carries a different set of fields: instead of declaring a workload it owns, a trait declares `appliesToWorkloads`, the workload types it is allowed to attach to. `podDisruptive` tells KubeVela whether changing this trait will restart pods. A trait header can also carry `conflictsWith`, `stage` and `revisionEnabled`, none of which `cpuscaler` needs.

The second part is `template`. Note the plural: this trait uses `outputs` rather than `output`, with a name key, because it emits a resource alongside the workload rather than being the workload. The HPA points back at the Deployment through `scaleTargetRef`, taking its name from `context.name`, the same render-context value the component used. `parameter` declares five inputs, all with defaults.

```cue
cpuscaler: {
	type: "trait"
	annotations: {}
	labels: {}
	description: "Automatically scale the component based on CPU usage."
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps", "statefulsets.apps"]
	}
}

template: {
	outputs: cpuscaler: {
		apiVersion: "autoscaling/v1"
		kind:       "HorizontalPodAutoscaler"
		metadata: name: context.name
		spec: {
			scaleTargetRef: {
				apiVersion: parameter.targetAPIVersion
				kind:       parameter.targetKind
				name:       context.name
			}
			minReplicas:                    parameter.min
			maxReplicas:                    parameter.max
			targetCPUUtilizationPercentage: parameter.cpuUtil
		}
	}
	parameter: {
		// +usage=Specify the minimal number of replicas to which the autoscaler can scale down
		min: *1 | int
		// +usage=Specify the maximum number of of replicas to which the autoscaler can scale up
		max: *10 | int
		// +usage=Specify the average CPU utilization, for example, 50 means the CPU usage is 50%
		cpuUtil: *50 | int
		// +usage=Specify the apiVersion of scale target
		targetAPIVersion: *"apps/v1" | string
		// +usage=Specify the kind of scale target
		targetKind: *"Deployment" | string
	}
}
```

### The same trait in defkit

```go
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func CPUScaler() *defkit.TraitDefinition {
    min      := defkit.Int("min").Description("Specify the minimal number of replicas to which the autoscaler can scale down").Default(1)
    max      := defkit.Int("max").Description("Specify the maximum number of of replicas to which the autoscaler can scale up").Default(10)
    cpuUtil  := defkit.Int("cpuUtil").Description("Specify the average CPU utilization, for example, 50 means the CPU usage is 50%").Default(50)
    targetAPIVersion := defkit.String("targetAPIVersion").Description("Specify the apiVersion of scale target").Default("apps/v1")
    targetKind       := defkit.String("targetKind").Description("Specify the kind of scale target").Default("Deployment")

    return defkit.NewTrait("cpuscaler").
        Description("Automatically scale the component based on CPU usage.").
        AppliesTo("deployments.apps", "statefulsets.apps").
        Params(min, max, cpuUtil, targetAPIVersion, targetKind).
        Template(func(tpl *defkit.Template) {
            vela := defkit.VelaCtx()

            hpa := defkit.NewResource("autoscaling/v1", "HorizontalPodAutoscaler").
                Set("metadata.name", vela.Name()).
                Set("spec.scaleTargetRef.apiVersion", targetAPIVersion).
                Set("spec.scaleTargetRef.kind", targetKind).
                Set("spec.scaleTargetRef.name", vela.Name()).
                Set("spec.minReplicas", min).
                Set("spec.maxReplicas", max).
                Set("spec.targetCPUUtilizationPercentage", cpuUtil)

            tpl.Outputs("cpuscaler", hpa)
        })
}

func init() {
    defkit.Register(CPUScaler())
}
```

The shape should be familiar by now. `NewTrait` replaces `NewComponent` and returns a `*defkit.TraitDefinition`. The five parameters are declared first as Go values, each with a description and a default. `Params` registers them, `Template` provides the body, and `init()` registers the definition. This one uses an inline closure rather than a named function, which is the other legitimate style: the closure captures the parameter variables directly, so nothing has to be re-declared.

Two differences from the component are worth tracing back to the CUE.

`AppliesTo("deployments.apps", "statefulsets.apps")` is what produced `appliesToWorkloads` in the header. It is a variadic Go call rather than a hand-written CUE list, which means a typo in a workload type is still a string typo, but the field name itself cannot be misspelled. There is no `Workload(...)` call here, because a trait does not own a workload.

`tpl.Outputs("cpuscaler", hpa)` is what produced `outputs: cpuscaler:`. The name you pass becomes the key. Compare the component, which called `tpl.Output(deployment)` and got a bare `output:` with no name. That single letter is the difference between "this is the workload" and "this sits next to the workload", and in Go it is two distinct methods with distinct signatures rather than a spelling you have to remember.

Everything else maps the way you would now expect. Each `.Description(...)` became a `// +usage=` comment above its field, which is what `vela show` and the dashboard read. Each `.Default(1)` became `*1 | int`. Each `Set` path became a nested CUE field, and `vela.Name()` became `context.name`.

The docs carry a reference page per definition type: [ComponentDefinition](/docs/platform-engineers/defkit/definition-component/), [TraitDefinition](/docs/platform-engineers/defkit/definition-trait/), [PolicyDefinition](/docs/platform-engineers/defkit/definition-policy/) and [WorkflowStepDefinition](/docs/platform-engineers/defkit/definition-workflowstep/), each with the full chain-method list.

## Getting started

If you would rather try this than read on, the docs take you from zero to an applied definition in four steps: scaffold a module with `vela def init-module`, write the definition in Go with the fluent API, check it with `vela def validate-module`, and ship it with `vela def apply-module`.

The first three steps need no cluster, so you can write a definition and confirm it compiles before you have anywhere to deploy it. You will need Go 1.23.8 or later, CUE v0.14.1 or later, and the `vela` CLI locally; the last step needs a cluster running KubeVela v1.11.0 or later.

Start at [Manage Definition with Go (defkit)](/docs/platform-engineers/defkit/overview/) and follow the [Quick Start](/docs/platform-engineers/defkit/quick-start/) beside it. The rest of this post is what happens underneath those four commands.

## Testing definitions like code

This is the capability that is genuinely hard to get any other way. Because a definition is Go, you render it in a unit test with faked context and assert on the result: no cluster, no `kubectl apply`, no waiting.

```go
func TestWebservice(t *testing.T) {
    g := NewWithT(t)

    rendered := Webservice().Render(
        defkit.TestContext().
            WithName("frontend").
            WithNamespace("apps").
            WithParam("image", "nginx:1.27").
            WithParam("replicas", 3),
    )

    g.Expect(rendered).To(BeDeployment())
    g.Expect(rendered.Get("spec.replicas")).To(Equal(3))
    g.Expect(rendered.Get("spec.template.spec.containers[0].image")).
        To(Equal("nginx:1.27"))
}
```

`Render` runs the same compile-and-evaluate path the CLI uses, and `TestContext` fakes the inputs KubeVela would normally supply at render time: name, namespace, parameters, cluster version, prior status. The SDK also ships Gomega matchers, so assertions read at the domain level instead of picking through nested maps.

That opens up the tests you actually want to write.

- Does a default kick in when a parameter is omitted?
- Does a conditional field appear only when its flag is set?

You can check that an out-of-range value is rejected, and that health reports correctly for a given status. Each of those is a few lines of `go test`, running in CI with no cluster. Getting the same coverage against raw CUE meant applying to a live cluster and reading the result by hand.

[Testing Definitions](/docs/platform-engineers/defkit/testing/) in the docs has the full matcher list and more patterns.

## How it works

Nothing about KubeVela changed. The controller still receives an X-Definition with CUE inside it, and CUE is still what gets evaluated when your `Application` renders. Defkit lives entirely on your side of that line: it takes the Go you write and produces the CUE that goes into the resource.

What follows is the path a definition takes from a Go function to a resource in your cluster: three forms, two transitions, one driver.

### How a definition becomes CUE

Your definition exists in three forms, in this order.

The first is **Go source**: the builder chain you write. The third is **CUE text**: a string that gets embedded in an X-Definition resource. Between them sits the form that does the real work, an **in-memory model**, your definition held as Go objects rather than as text. A parameter is a struct carrying its name, type, and constraints. A resource is a struct carrying an apiVersion, a kind, and a set of field paths mapped to values. A conditional is a small expression tree.

That middle form is the one decision the whole design rests on. Because the definition exists as data before it exists as text, anything downstream can walk it: emit CUE, serialize the resource, or render it in a unit test with no cluster in sight. This middle form has a standard name in compiler design, an intermediate representation, and defkit is a compiler in the ordinary sense of the word.

![The three forms a definition takes: Go source, in-memory model, CUE text](/img/blog/defkit/definition-to-cue.webp)

### What runs when

A reasonable assumption is that some part of defkit is working while you type. It is not. When your editor tells you that `Params` will not accept a bare string, that is the Go compiler and `gopls` reading defkit's type signatures, exactly as they would for any library you imported. Defkit contributes types at that moment, not behaviour.

Defkit's own code runs only when you invoke a command. That is the whole reason compile-time safety works the way it does: the checking is done by the Go toolchain you already have, not by anything defkit executes.

![What runs at edit time versus what runs when you invoke a vela command](/img/blog/defkit/what-runs-when.webp)

### The SDK, part one: from Go source to the model

Two pieces cooperate to produce the model, and they are not sequential peers: one executes the other.

The [fluent API](/docs/platform-engineers/defkit/definition-component/) (`defkit`) is what constructs the model. This is worth stating precisely: the builder chain does not describe a definition, it assembles one. Every method call mutates an object graph. `defkit.Int("replicas").Default(1)` allocates a parameter and records a constraint on it. `Set("spec.replicas", replicas)` records a path-to-value mapping. `SetIf(cpu.IsSet(), ...)` records a conditional node. When the chain returns, the model exists.

The **Go loader** (`goloader`) is what makes that happen, and it can get there two ways.

The fast path is a small program in your own module. If `cmd/register/main.go` exists, the loader runs it: that program imports your definition packages, their `init()` functions register everything, and it prints the whole set as JSON. One `go run`, every definition. The location is a convention rather than a search: the file has to sit at exactly that path or the CLI will not use this route.

The fallback, when that file is missing, is discovery in two passes. The first pass is static analysis: scan the module for files importing `defkit`, parse them, and pick out every exported function returning a definition type. The loader now knows which definitions exist and where they live, without having run any of your code.

That is not enough. A definition's real shape only exists once the builder chain has run, because the chain is what assembles it. You cannot read a builder chain off the page and know what the finished definition looks like. You have to execute it.

So the second pass executes it. The loader scaffolds a throwaway Go module in a temp directory, runs `go mod tidy` there once, then writes a small program that imports your package, calls your function, and prints the result. It shells out to `go run` and reads stdout, several definitions at a time.

Both routes end in the same place: your code runs, and the model exists. The fast path is faster because it skips the parsing and the throwaway module; your own program already knows what to import. And either way, a definition is just an exported function in an ordinary package. Defkit needs no plugin system and no `go generate` step, because it compiles and runs your code the way `go test` does.

### The SDK, part two: from the model to CUE

The **CUE generator** (`cuegen`) is a tree walker. It traverses the model and prints text in the target language: the parameter schema, the template `output` and `outputs`, the health and status blocks, the placement constraints. It resolves field paths, turns conditional nodes into CUE `if` blocks, and generates the comprehensions behind collection pipelines.

CUE is the only compilation target. Defkit can also hand you the definition as YAML or JSON, but those are serializations rather than parallel generators: YAML gives you the Kubernetes resource with the generated CUE inside it, and JSON is how the loader carries definitions back from that subprocess. There is one generator and several ways to read its result. [Register & Output](/docs/platform-engineers/defkit/definition-register/) covers the full set.

`ToCue()` is the one to reach for. It prints exactly what the generator produced, so when a definition misbehaves you debug the CUE the controller will actually run, not a guess about it.

### The driver: from CUE to the cluster

Everything above is library code. The `vela def *-module` commands are a separate tool that consumes it and adds the one thing the SDK does not do: talk to Kubernetes.

```bash
vela def list-module     ./vela-definitions   # what the module defines
vela def validate-module ./vela-definitions   # compiles, no cluster needed
vela def apply-module    ./vela-definitions --dry-run
vela def apply-module    ./vela-definitions --conflict=overwrite
vela def gen-module      ./vela-definitions   # emit the generated CUE
```

`validate-module` and `apply-module --dry-run` are two cluster-free gates. One proves the module compiles; the other shows the CUE that would be applied. Both fit in CI before anything touches a real cluster.

**How the CLI reaches your definitions.** A definition is an exported function, and you register it so the module can find it:

```go
// components/webservice.go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func Webservice() *defkit.ComponentDefinition {
    // ... the builder chain shown earlier ...
}

// init registers the definition so the module's registry program emits it.
func init() {
    defkit.Register(Webservice())
}
```

That registry program is the fast path described above. `vela def init-module` scaffolds it for you, and it does nothing more than import your definition packages, triggering their `init()` functions, and print what got registered:

```go
// cmd/register/main.go — generated by `vela def init-module`
package main

import (
    "fmt"
    "os"

    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    _ "github.com/your-org/vela-definitions/components" // side effect: init() -> Register()
)

func main() {
    out, err := defkit.ToJSON()
    if err != nil {
        fmt.Fprintf(os.Stderr, "failed to serialize registry: %v\n", err)
        os.Exit(1)
    }
    fmt.Print(string(out))
}
```

From there it is one command. `vela def apply-module` runs that program, takes the JSON it emits, compiles each definition to CUE, and applies it. Delete the file and everything still works, just more slowly, because the CLI drops back to AST-based discovery. Everything between the exported function and the cluster is machinery you do not write by hand.

**Where defkit stops.** Nothing of defkit ships to your cluster. No CRD, no admission webhook, no controller extension, no sidecar. The only artifact that crosses is a plain X-Definition resource, identical in shape to a hand-written one. That is what makes "Go at authoring time, CUE at runtime" a statement about the architecture rather than a slogan.

![The generated CUE travels to the cluster inside a plain X-Definition resource](/img/blog/defkit/cue-to-cluster.webp)

## The API in practice

The `webservice` example was deliberately minimal. Real definitions have optional parameters, structured input, and conditional output, so this section builds one that does: `api-service`, a Deployment plus a Service that only appears if the user asks to expose a port.

Each piece below is a fragment of that one definition. The complete file is at the end, and it compiles.

**Constructors.** Every definition starts with one, and reads as a builder chain:

```go
defkit.NewComponent("api-service")    // workloads
defkit.NewTrait("cpuscaler")          // workload modifiers
defkit.NewPolicy("apply-once")        // delivery policies
defkit.NewWorkflowStep("deploy")      // workflow steps
```

Most chain methods are shared: `Description`, `Labels`, `Params`, `Helper` for named CUE types, `RunOn` and `NotRunOn` for cluster placement, `WithImports` for CUE imports, and `RawCUE` as a total escape hatch. Each type then adds what only it needs. A component has `Workload`, `AutodetectWorkload` and `PodSpecPath`. A trait has `AppliesTo`, `ConflictsWith`, `PodDisruptive` and `Stage`. A workflow step has `Category` and `Scope`. A policy has none of these, because KubeVela's engine reads policy parameters directly: a policy is `Params` and nothing else, with no template at all.

**Parameters.** A parameter is a Go value holding both its schema and its reference. Scalars first:

```go
image := defkit.String("image").
    Description("Container image to run").
    Short("i")

replicas := defkit.Int("replicas").
    Default(1).
    Description("Number of replicas")

pullPolicy := defkit.String("imagePullPolicy").
    Optional().
    Values("Always", "Never", "IfNotPresent").
    Description("Image pull policy")

cpu := defkit.String("cpu").
    Optional().
    Description("CPU request and limit, for example 500m")
```

`Optional()` makes a field optional in the schema; `Mandatory()` forces it. `Default` supplies a fallback, `Values` restricts to a fixed set, and `Short` gives the parameter a single-letter alias in the CLI. Those four produce:

```cue
parameter: {
	// +usage=Container image to run
	// +short=i
	image: string
	// +usage=Number of replicas
	replicas: *1 | int
	// +usage=Image pull policy
	imagePullPolicy?: "Always" | "Never" | "IfNotPresent"
	// +usage=CPU request and limit, for example 500m
	cpu?: string
}
```

For structured input there are `StringList` and `StringKeyMap` for the flat cases, and `List`, `Object` and `Struct` with `WithFields` when the elements have a shape:

```go
env := defkit.List("env").
    Optional().
    Description("Environment variables").
    WithFields(
        defkit.String("name").Description("Variable name"),
        defkit.String("value").Optional().Description("Variable value"),
    )

ports := defkit.List("ports").
    Optional().
    Description("Ports to open on the container").
    WithFields(
        defkit.Int("port").Description("Port number"),
        defkit.Bool("expose").Default(false).Description("Serve this port through a Service"),
    )
```

Nested field definitions are parameters themselves, so the same modifiers apply at any depth. For a field whose shape depends on a discriminator there is `OneOf` with `Variants`, and for a schema reused across several parameters there is `Helper` plus `WithSchemaRef`. [Parameter Types](/docs/platform-engineers/defkit/param-scalar-types/) has the per-type modifier list.

**The template.** `Template` takes a function. The convention in KubeVela's own definitions is a named function that re-declares the parameters it needs, which keeps the builder chain readable as the template grows:

```go
func apiServiceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()

    image      := defkit.String("image")
    replicas   := defkit.Int("replicas")
    // ... and so on for the rest
}
```

`defkit.VelaCtx()` is the render context: `vela.Name()` for the component name, `vela.AppName()` for the application name. It is what replaces bare `context.*` references in CUE.

**Resources and conditionals.** `NewResource` builds a Kubernetes object by setting dotted paths. Values are parameters, render-context calls, or literals wrapped in `defkit.Lit`. Conditionals are methods rather than CUE `if` strings: `SetIf` guards one field, `If`/`EndIf` guard a group, and `param.IsSet()` is the usual condition:

```go
deployment := defkit.NewResource("apps/v1", "Deployment").
    Set("metadata.name", vela.Name()).
    Set("spec.replicas", replicas).
    Set("spec.template.spec.containers[0].name", vela.Name()).
    Set("spec.template.spec.containers[0].image", image).
    SetIf(pullPolicy.IsSet(), "spec.template.spec.containers[0].imagePullPolicy", pullPolicy).
    If(cpu.IsSet()).
    Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
    Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
    EndIf()
```

The `If(cpu.IsSet())` block becomes exactly what you would have written by hand:

```cue
if parameter["cpu"] != _|_ {
	resources: {
		requests: cpu: parameter.cpu
		limits: cpu:   parameter.cpu
	}
}
```

**Collections.** This is where the typed API earns its keep, because comprehensions are the part of CUE most people find hardest to write. `Each` walks a list parameter, `Filter` drops elements, and `Map` reshapes each one into resource fields:

```go
containerPorts := defkit.Each(ports).
    Map(defkit.FieldMap{
        "containerPort": defkit.FieldRef("port"),
    })

servicePorts := defkit.Each(ports).
    Filter(defkit.FieldEquals("expose", true)).
    Map(defkit.FieldMap{
        "port":       defkit.FieldRef("port"),
        "targetPort": defkit.FieldRef("port"),
    })
```

Those become CUE list comprehensions:

```cue
ports: [for v in parameter.ports {
	{containerPort: v.port}
}]

ports: [for v in parameter.ports if v.expose == true {
	{port: v.port, targetPort: v.port}
}]
```

**Outputs.** `tpl.Output` emits the workload the component owns. `tpl.Outputs` adds a named sibling resource, and `tpl.OutputsIf` adds one only when a condition holds, which is what makes the Service optional here:

```go
tpl.Output(deployment)
tpl.OutputsIf(ports.IsSet(), "service", service)
```

**Health and status.** A component declares when it is healthy and what to report. Defkit ships presets for the common workloads, so most definitions need one line each rather than a hand-written CUE block:

```go
HealthPolicy(defkit.DeploymentHealth().Build()).
CustomStatus(defkit.DeploymentStatus().Build()).
```

`JobHealth` covers Jobs the same way. When a preset does not fit, `defkit.Status()` composes a message from live status fields, and `HealthPolicy` and `CustomStatus` both accept a raw CUE string as a last resort.

**All together.** Every fragment above, as one file:

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func APIService() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Container image to run").
        Short("i")
    replicas := defkit.Int("replicas").
        Default(1).
        Description("Number of replicas")
    pullPolicy := defkit.String("imagePullPolicy").
        Optional().
        Values("Always", "Never", "IfNotPresent").
        Description("Image pull policy")
    cpu := defkit.String("cpu").
        Optional().
        Description("CPU request and limit, for example 500m")
    env := defkit.List("env").
        Optional().
        Description("Environment variables").
        WithFields(
            defkit.String("name").Description("Variable name"),
            defkit.String("value").Optional().Description("Variable value"),
        )
    ports := defkit.List("ports").
        Optional().
        Description("Ports to open on the container").
        WithFields(
            defkit.Int("port").Description("Port number"),
            defkit.Bool("expose").Default(false).Description("Serve this port through a Service"),
        )

    return defkit.NewComponent("api-service").
        Description("A long-running service with an optional Service").
        Workload("apps/v1", "Deployment").
        HealthPolicy(defkit.DeploymentHealth().Build()).
        CustomStatus(defkit.DeploymentStatus().Build()).
        Params(image, replicas, pullPolicy, cpu, env, ports).
        Template(apiServiceTemplate)
}

func apiServiceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()

    image      := defkit.String("image")
    replicas   := defkit.Int("replicas")
    pullPolicy := defkit.String("imagePullPolicy")
    cpu        := defkit.String("cpu")
    env        := defkit.List("env")
    ports      := defkit.List("ports")

    deployment := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.replicas", replicas).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        SetIf(pullPolicy.IsSet(), "spec.template.spec.containers[0].imagePullPolicy", pullPolicy).
        SetIf(env.IsSet(), "spec.template.spec.containers[0].env", env).
        If(cpu.IsSet()).
        Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
        Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
        EndIf().
        SetIf(ports.IsSet(), "spec.template.spec.containers[0].ports",
            defkit.Each(ports).Map(defkit.FieldMap{
                "containerPort": defkit.FieldRef("port"),
            }))

    tpl.Output(deployment)

    service := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports", defkit.Each(ports).
            Filter(defkit.FieldEquals("expose", true)).
            Map(defkit.FieldMap{
                "port":       defkit.FieldRef("port"),
                "targetPort": defkit.FieldRef("port"),
            }))

    tpl.OutputsIf(ports.IsSet(), "service", service)
}

func init() { defkit.Register(APIService()) }
```

Drop that in a module's `components/` directory and `vela def validate-module` will compile it. To read the CUE it produces, `vela def gen-module . -o ./generated-cue`, or call `APIService().ToCue()` from a test.

## Distribution comes for free

A defkit module is a Go module, so it distributes the way Go libraries already do. A platform team publishes a definitions module; consumers `go get` it and pin a version with a Git tag. Definitions become a versioned dependency with a changelog, rather than CUE files copied between repositories.

The module commands take that seriously: they accept a module path, not just a local directory. Consuming someone else's definitions needs no clone step at all.

```bash
vela def list-module     github.com/your-org/vela-definitions
vela def validate-module github.com/your-org/vela-definitions
vela def apply-module    github.com/your-org/vela-definitions --namespace my-namespace
```

To see how a real one is laid out, [kubevela/vela-go-definitions](https://github.com/kubevela/vela-go-definitions) is KubeVela's own definitions module. Components, traits, policies and workflow steps each get their own package. The generated CUE is checked in under `vela-templates/definitions/`. And a `make reviewable` target regenerates that CUE and fails if the checked-in output has drifted from the Go.

That last habit is the one worth copying. Committing the generated CUE means a reviewer can see what a change to the Go actually did to the artifact the controller runs, in the same pull request, which is the opposite of what usually happens with generated code.

## When you still reach for CUE

Defkit compiles to CUE, and it does not claim to cover every expression CUE can represent. For the cases the fluent API does not yet model, each builder exposes a `RawCUE` escape hatch that takes CUE verbatim, traits have `TemplateBlock` for replacing just the template, and health and status accept raw strings. Defkit covers the common shape of a definition through a typed, testable API, and leaves a door back to CUE for the rest.

It is worth being equally clear about the limits of compile-time safety. Defkit moves parameter and builder-chain mistakes to `go build`, but it does not move everything. Resource field paths are plain strings, so `Set("spec.replicaz", replicas)` compiles happily and fails later. A field the target workload's schema rejects behaves the same way, and so does a conflict that only appears for certain parameter values, because that only exists once real inputs are unified in. Defkit narrows the class of errors that arrive late. It does not eliminate it.

## Takeaways

Go at authoring time, CUE at runtime. The controller's model does not change; only the authoring loop does.

A parameter is a Go value that carries its own schema. That one decision removes the stringly-typed references that make CUE definitions fragile.

`ToCue()` keeps the abstraction honest. You can always read the artifact the controller runs, so the SDK is inspectable rather than a black box.

Testability is the real win. Rendering in `go test` with fake context turns "deploy and find out" into a millisecond assertion in CI.

Distribution comes for free. Definitions ship as a versioned Go module, not as copied files.

By shifting X-Definitions from CUE to Go via the Definition Kit (defkit), KubeVela is heavily upgrading the developer experience. The fluent builder API is highly readable, brings back powerful IDE tooling, allows for easy distribution, and brings compile-time safety to application delivery.

## Learn more and join the community

Defkit is part of KubeVela, a CNCF project with an active and welcoming community. If this post got you curious, here is where to go next:

- **Docs:** the [defkit overview and guides](/docs/platform-engineers/defkit/overview/) on kubevela.io, including [Full Examples](/docs/platform-engineers/defkit/examples/) and a [migration guide](/docs/platform-engineers/defkit/migration/) if you already have CUE definitions.
- **Slack:** join the `#kubevela` [channel on CNCF Slack](https://cloud-native.slack.com/archives/C01BLQ3HTJA) and say hi. New to CNCF Slack? Grab an invite at [slack.cncf.io](https://slack.cncf.io/).
- **Examples:** a ready-to-read module of Go definitions, with tests, at [kubevela/vela-go-definitions](https://github.com/kubevela/vela-go-definitions). The `cpuscaler` trait above comes from `traits/cpuscaler.go` in that module.
- **Code:** the SDK lives in `pkg/definition/defkit` and `pkg/definition/goloader` in the [KubeVela repo](https://github.com/kubevela/kubevela).
- **Design:** the [KubeVela KEP for Go-native definitions](https://github.com/kubevela/kubevela/blob/master/design/vela-cli/kep-defkit.md).

Questions, ideas, and definition modules to share are all welcome in Slack. And if defkit falls short for something you need, that feedback is exactly what shapes the next iteration.
