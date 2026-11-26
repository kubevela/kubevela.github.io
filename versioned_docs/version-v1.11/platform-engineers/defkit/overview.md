---
title: Overview
---

defkit is a Go SDK that lets platform engineers author KubeVela X-Definitions — ComponentDefinition, TraitDefinition, PolicyDefinition, WorkflowStepDefinition — using native Go code. The Go code compiles to CUE transparently: you never need to write or see CUE.

## The Problem

KubeVela's extension system (X-Definitions) is the primary way platform teams build reusable abstractions — defining how workloads run, how traits modify them, and how policies govern delivery. Today, authoring these definitions requires writing **CUE**, a specialized configuration language. This creates several friction points:

- **Language barrier** — Platform engineers must learn CUE, a niche language with limited community resources. Most teams are already proficient in Go.
- **Poor IDE experience** — CUE tooling lacks full autocompletion, inline documentation, and refactoring support that Go developers expect.
- **Late error detection** — CUE schema and template errors only surface at deployment time, not at authoring time. A typo in a CUE definition can pass through CI and fail in production.
- **No standard distribution** — There is no `go get` equivalent for CUE definitions. Teams share definitions by copying files or maintaining internal registries.
- **Difficult to test** — Unit testing CUE templates requires a running KubeVela cluster or custom evaluation harnesses. There is no native `go test` story.

## The Solution

defkit eliminates these friction points by providing a **fluent Go API** that compiles to CUE behind the scenes. Platform engineers write standard Go, with IDE support, compile-time checks of the builder calls and `go test`, and defkit generates the CUE that the KubeVela controller expects. The controller sees an ordinary CUE definition; it doesn't know or care that Go produced it.

## Benefits

- **Go types**: the Go compiler checks how you call the builder. It doesn't check parameter names: `defkit.String("imagee")` in a template compiles and fails only when an Application renders it, so declare each parameter once and use that variable in the template.
- **IDE support**: autocompletion, inline documentation and refactoring come from your usual Go tooling.
- **Testable**: unit-test definitions with `go test` and the Gomega matchers in `defkit/testing/matchers`, without a cluster.
- **Distributable**: a module is an ordinary Go module, so you can tag it and apply a release with `vela def apply-module github.com/myorg/definitions@v1.0.0`.
- **Works beside CUE**: the generated definitions are ordinary CUE definitions, so Go-authored and CUE-authored definitions mix freely.

:::tip **Choose Go (defkit)** when
Your definitions have complex conditional logic, your team is already Go-proficient, or you need to unit-test and distribute definitions as packages.
:::

:::note **Choose CUE** when
You're writing simple definitions with few parameters or doing quick one-off experiments where minimal setup matters.
:::

:::info
The controller sees an ordinary CUE definition either way. You can mix Go-authored and CUE-authored definitions in the same cluster.
:::

## Related

- [Manage Definition with CUE](../cue/definition-edit.md)
- [Quick Start](./quick-start.md)
- [Architecture](./architecture.md)
