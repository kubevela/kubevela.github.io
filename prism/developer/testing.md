---
title: Testing
description: Prism's unit tests with envtest, code generation, and what CI runs on a pull request.
---

## Unit tests

```shell
export KUBEBUILDER_ASSETS="$(setup-envtest use 1.37.x -p path)"
make unit-test
```

```console
ok  	github.com/kubevela/prism/cmd/apiserver	0.856s	coverage: 3.1% of statements in ./...
ok  	github.com/kubevela/prism/pkg/apis/applicationresourcetracker/v1alpha1	10.942s	coverage: 3.5% of statements in ./...
ok  	github.com/kubevela/prism/pkg/apis/cluster/v1alpha1	11.982s	coverage: 11.8% of statements in ./...
ok  	github.com/kubevela/prism/pkg/apis/dynamicresource	8.686s	coverage: 14.2% of statements in ./...
ok  	github.com/kubevela/prism/pkg/apis/o11y/grafana/v1alpha1	4.898s	coverage: 8.9% of statements in ./...
ok  	github.com/kubevela/prism/pkg/apis/o11y/grafanadashboard/v1alpha1	5.496s	coverage: 15.5% of statements in ./...
ok  	github.com/kubevela/prism/pkg/apis/o11y/grafanadatasource/v1alpha1	5.600s	coverage: 14.0% of statements in ./...
ok  	github.com/kubevela/prism/pkg/dynamicapiserver	8.435s	coverage: 12.8% of statements in ./...
ok  	github.com/kubevela/prism/pkg/util/subresource	1.098s	coverage: 0.8% of statements in ./...
```

It takes about twenty seconds. `make unit-test` runs `go test -v` with coverage across the whole module and writes the profile to `/tmp/vela-prism-coverage.txt`; for one package, `go test ./pkg/apis/cluster/v1alpha1/...` is quicker.

`setup-envtest` comes from `go install sigs.k8s.io/controller-runtime/tools/setup-envtest@latest`. CI uses Kubernetes 1.37; 1.31 assets pass too.

The suites start a kube-apiserver and etcd through envtest (`test/bootstrap`), install the CRDs in `test/testdata/crds` (ResourceTracker and ManagedCluster), and exercise each API's storage against them. The dashboard and datasource suites stand an in-process HTTP server in for Grafana. Without `KUBEBUILDER_ASSETS`, each suite panics in `BeforeSuite` with `fork/exec /usr/local/kubebuilder/bin/etcd: no such file or directory`.

## Code generation

Two generators, both checked in:

| Command | Writes | When to run it |
| --- | --- | --- |
| `make generate` | `zz_generated.deepcopy.go` in each API package (`controller-gen object`) | After changing an API type. |
| `make generate-openapi` | `pkg/apis/generated/zz_generated.openapi.go` | After changing an API type. It prints `API rule violation` lines for apimachinery's own types; those are expected. |

`make reviewable` runs both, then `go fmt`, `go vet`, and copies `README.md` into `charts/`. Run it before pushing: a clean tree afterwards means nothing was out of date.

## CI

| Workflow | When | What |
| --- | --- | --- |
| `UnitTest` | Every pull request and push to `master` or `release-*` | `make unit-test` on Go 1.27.1, envtest 1.37, then uploads coverage to Codecov. Skipped when only Markdown or images change. |
| `CodeQL` | The same | Static analysis of the Go code. |
| `BuildImage` | Push to `master`, `release-*`, or a `v*` tag | Builds and pushes the image for amd64 and arm64. |
| `HelmChart` | A `v*` tag | Publishes the chart to `kubevela/charts`. |

Nothing in CI runs Prism on a cluster, so a change that alters what an API returns, or how it's installed, should be tried on k3d as in [Build and Run](./build-and-run.md#run-your-build-on-k3d), and the result described in the pull request.
