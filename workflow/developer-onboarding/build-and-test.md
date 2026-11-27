---
title: Build and Test
description: "Clone kubevela/workflow, build the controller, run the unit tests, and run the generators and linters that make reviewable checks."
---

## Get the code

Fork [kubevela/workflow](https://github.com/kubevela/workflow) on GitHub, then clone your fork with the original as `upstream`:

```shell
git clone git@github.com:<you>/workflow.git
cd workflow
git remote add upstream https://github.com/kubevela/workflow.git
```

The module path is `github.com/kubevela/workflow`, the same as the repository.

## Build

```shell
make build
```

This runs `controller-gen` for the deep-copy code, `go fmt`, `goimports` and `go vet`, then builds the controller to `bin/manager`. The first run installs `controller-gen` into `bin/` and `goimports` into your `GOBIN`, and takes a minute or so; later runs are quicker.

:::note
The Makefile installs its tools with `go install` and expects them where `GOBIN` points. If `go` on your `PATH` is a version manager's shim that sets `GOBIN` itself (mise does), `controller-gen` lands somewhere else and the build stops with `bin/controller-gen: No such file or directory`. Put the real toolchain first: `export PATH="$(dirname "$(mise which go)"):$PATH"`.
:::

`make build` can leave a one-line change in `api/v1alpha1/zz_generated.deepcopy.go`, where `goimports` names the `k8s.io/api/core/v1` import. It is formatting only: leave it out of your commit unless your change regenerates that file anyway.

## Unit tests

```shell
make test
```

`make test` regenerates the CRDs and code first (`make manifests generate fmt vet`), downloads `setup-envtest` and runs every package except `e2e/` against a local API server from the envtest assets (Kubernetes 1.37). It writes coverage to `coverage.txt`. A full run takes about a minute on a laptop:

```console
ok  	github.com/kubevela/workflow/controllers	24.449s	coverage: 72.7% of statements
ok  	github.com/kubevela/workflow/pkg/executor	11.958s	coverage: 87.1% of statements
ok  	github.com/kubevela/workflow/pkg/expressions	3.220s	coverage: 94.9% of statements
...
```

To run one package while you work, skip the generators and call `go test` with the same assets:

```shell
export KUBEBUILDER_ASSETS="$(bin/setup-envtest use 1.37 -p path)"
go test ./pkg/executor/...
```

A few specs in `pkg/executor` compare backoff times in whole seconds, and on a busy machine `Test get suspend backoff time inside a forEach` can miss by one (`Expected 29 to equal 30`). Run the package again before you go looking for a bug.

`TestGetLogsFromURL` in `pkg/utils` fetches a page from the internet, so it fails offline or behind a proxy that blocks it.

:::caution
On macOS on Apple silicon, `TestSendEmail` in `pkg/providers/email` and `pkg/providers/legacy/email` fails with `panic: permission denied`: the test patches a function at run time with `gomonkey`, which macOS does not allow there. CI runs on Linux, where it passes. Skip those two packages locally, or run them in a Linux container.
:::

## Generated files

| Target | What it regenerates |
| :--- | :--- |
| `make generate` | `zz_generated.deepcopy.go` from the types in `api/`. |
| `make manifests` | The CRDs in `charts/vela-workflow/crds/`. The WorkflowRun and Workflow CRDs come from the pinned `kubevela/pkg` module, and the WorkflowStepDefinition CRD is downloaded from kubevela's `master` branch. |
| `make helm-doc-gen` | The parameter tables in `charts/vela-workflow/README.md`, from the `@param` comments in `values.yaml`. Needs `readme-generator` (`npm install -g @bitnami/readme-generator-for-helm`). |

Because the WorkflowStepDefinition CRD follows kubevela's `master`, `make manifests` (and so `make test` and `make reviewable`) can change `charts/vela-workflow/crds/core.oam.dev_workflowstepdefinitions.yaml` when KubeVela has added a field since the last sync. Commit that only when you mean to take the new CRD; to sync from a release instead, pass `KUBEVELA_VERSION=v1.12.0-alpha.3`.

## Before you open a pull request

```shell
make reviewable
```

This runs `manifests`, `fmt`, `vet`, `lint` (golangci-lint), `staticcheck` and `helm-doc-gen`. `make check-diff` runs it and then fails if the tree changed, which is a quick way to see that nothing is left uncommitted. CI runs the lint and staticcheck parts on every PR. golangci-lint must be v2.14.0 and built with Go 1.27: an older build refuses the module's Go version with an error that reads like a finding.
