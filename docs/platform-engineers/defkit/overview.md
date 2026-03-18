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

defkit eliminates these friction points by providing a **fluent Go API** that compiles to CUE behind the scenes. Platform engineers write standard Go — with full IDE support, compile-time type checking, and `go test` — and defkit transparently generates the CUE that the KubeVela controller expects. The output is identical to hand-written CUE; the authoring experience is entirely Go.

## Benefits

### Type Safety

Catch configuration errors at Go compile time, not at Kubernetes deploy time. Full type inference for all parameter types.

### IDE Support

Full autocompletion, inline documentation, and refactoring in any Go IDE. No CUE plugin required.

### Testable

Unit-test definitions with standard `go test` and Gomega matchers. No cluster needed for unit tests.

### Distributable

Share definitions as standard Go packages via `go get`. Version-controlled alongside your platform code.

### CUE Compatible

Produces the same CUE output consumed by the KubeVela controller. Mix Go-authored and CUE-authored definitions freely.

### Fluent API

Method-chaining builder pattern makes definitions readable and concise. No YAML, no CUE schema wrestling.

:::info
Both defkit (Go) and the native CUE approach produce identical output consumed by the KubeVela controller. Choose defkit when your team is Go-proficient or when definitions require complex conditional logic and unit testing.
:::

## When to Use Go vs CUE

| Scenario | Go (defkit) | CUE |
|---|---|---|
| Team already proficient in Go | Recommended | Works too |
| Complex conditional template logic | Clearer structure | Possible, verbose |
| Unit testing without a cluster | go test + Gomega | No native support |
| Share definitions as packages | go get | Manual copying |
| Simple definitions, few parameters | Works fine | Simpler to start |
| Quick one-off experiments | Slightly more setup | Less boilerplate |

## Related

- [Manage Definition with CUE](../cue/definition-edit.md)
- [Quick Start](./quick-start.md)
- [Architecture](./architecture.md)
