---
title: Overview
---

defkit is a Go SDK for authoring KubeVela X-Definitions (ComponentDefinition, TraitDefinition, PolicyDefinition and WorkflowStepDefinition) in Go. defkit generates the CUE for you, so most definitions need no hand-written CUE. You will still read the generated CUE when the controller reports an error, and a few advanced cases drop into CUE strings ([Raw CUE Blocks](./template-raw-cue.md)).

The controller sees an ordinary CUE definition; it doesn't know or care that Go produced it. You can mix Go-authored and CUE-authored definitions in the same cluster.

## Why Go

**Share helpers across definitions.** A Go function that sets your platform's labels is written once and called by every component in the module, as `withOwnerLabels(defkit.NewResource("apps/v1", "Deployment"))`. Change it, and every definition picks it up on the next generate.

```go
func withOwnerLabels(r *defkit.Resource) *defkit.Resource {
    vela := defkit.VelaCtx()
    return r.Set("metadata.labels[app.oam.dev/name]", vela.AppName()).
        Set("metadata.labels[app.oam.dev/component]", vela.Name())
}
```

**Generate a family of definitions in a loop.** One function, one map, and you get `worker-small`, `worker-medium` and `worker-large`, each with its own CPU request.

```go
var workerSizes = map[string]string{"small": "250m", "medium": "1", "large": "4"}

func Worker(size, cpu string) *defkit.ComponentDefinition {
    image := defkit.String("image").Description("Container image")
    return defkit.NewComponent("worker-" + size).
        Workload("apps/v1", "Deployment").
        Params(image).
        Template(func(tpl *defkit.Template) {
            tpl.Output(withOwnerLabels(defkit.NewResource("apps/v1", "Deployment")).
                Set("spec.template.spec.containers[0].image", image).
                Set("spec.template.spec.containers[0].resources.requests.cpu", defkit.Lit(cpu)))
        })
}

func init() {
    for size, cpu := range workerSizes {
        defkit.Register(Worker(size, cpu))
    }
}
```

**Refactor across a module.** Rename a helper or move a definition with your editor's Go tooling, and every caller follows. Anything left behind fails the build:

```shell
go build ./...
```

**Test with `go test`.** Render a definition in-process and check the result with table-driven cases, coverage and the CI you already run. See [Testing Definitions](./testing.md).

```go
func TestWorkerCPU(t *testing.T) {
    for size, cpu := range workerSizes {
        out := Worker(size, cpu).Render(defkit.TestContext().WithParam("image", "nginx"))
        if got := out.Get("spec.template.spec.containers[0].resources.requests.cpu"); got != cpu {
            t.Errorf("worker-%s: cpu = %v, want %s", size, got, cpu)
        }
    }
}
```

CUE definitions can be tested too, with [`vela def test`](../../cli/vela_def_test.md); defkit's advantage is that the tests are ordinary Go.

**Version and share definitions as a Go module.** Tag the module and anyone can apply a given release straight from its repository:

```shell
vela def apply-module github.com/myorg/platform-defs@v1.2.0
```

## What it costs

- **A Go toolchain and a Go module per definition set.** defkit comes from the KubeVela module, which needs Go 1.27.1 or newer.
- **The generated CUE is what runs.** When a render fails, the controller reports CUE errors against the generated template, not against your Go. Run `vela def gen-module` to see the CUE it is talking about.
- **The compiler checks your Go, not your parameter names.** `defkit.String("imagee")` in a template compiles and passes `vela def validate-module`; it fails only when an Application renders it. Declare each parameter once and use that variable in the template, so a typo becomes a compile error.
- **The builder doesn't cover every CUE construct.** For the rest, write CUE strings inside the Go definition ([Raw CUE Blocks](./template-raw-cue.md)).
- **The generated output follows the KubeVela version in your `go.mod`.** Bumping it can change the CUE a definition generates, so compare the `vela def gen-module` output before and after an upgrade.

## Choose Go or stay with CUE

| Choose Go when | Stay with CUE when |
|---|---|
| Many definitions share labels, sidecars or other structure | You have a handful of unrelated definitions |
| Your team already writes Go and runs `go test` in CI | Nobody on the team works in Go |
| You want to generate variants of one definition | Each definition is written by hand anyway |
| You want to publish versioned definitions as a Go module | You're trying an idea out once and won't keep it |
| You can read the generated CUE when a render fails | You need CUE constructs the builder doesn't cover in most definitions |

## Related

- [Manage Definition with CUE](../cue/definition-edit.md)
- [Quick Start](./quick-start.md)
- [Architecture](./architecture.md)
