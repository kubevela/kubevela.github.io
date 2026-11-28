---
title: Code Generation
description: The generated code in cluster-gateway, which Makefile target writes each part, and the one file no target regenerates.
---

Most of the generated code has a Makefile target. Change the types, then regenerate; don't edit the output by hand, with the one exception below.

| Output | Generated from | Target |
| --- | --- | --- |
| `pkg/apis/proxy/v1alpha1/zz_generated.deepcopy.go` | The `ClusterGatewayConfiguration` types | `make generate` (`controller-gen object`, v0.22.0) |
| `pkg/apis/generated/zz_generated.openapi.go` | Both API groups, plus the apimachinery types they use | `make generate-openapi` (`openapi-gen`) |
| `hack/crd/bases/proxy.open-cluster-management.io_clustergatewayconfigurations.yaml` | The `ClusterGatewayConfiguration` types | `make manifests` (`controller-gen crd`) |
| `pkg/generated/clientset/` | The `cluster.core.oam.dev/v1alpha1` types | `make client-gen` (`client-gen` v0.37.1) |
| `pkg/apis/cluster/v1alpha1/zz_generated.deepcopy.go` | The `ClusterGateway` and `VirtualCluster` types | none: see below |

`make test` and `make` run `generate` and `generate-openapi` (and `make test` also `manifests`) before they build anything, so the first three stay up to date on their own. `client-gen` isn't part of either: run it when you add a type or change what the client needs. At `v1.10.0-alpha.1`, each of these targets reproduces the committed files exactly.

`openapi-gen` prints a list of `API rule violation: names_match` lines for the apimachinery types on every run. They're expected, and don't fail the build.

## After changing an API type

```shell
make generate generate-openapi manifests
make client-gen    # if the clientset is affected
git status         # commit everything that changed
```

## The cluster API's deepcopy is kept by hand

Nothing regenerates `pkg/apis/cluster/v1alpha1/zz_generated.deepcopy.go`:

* `make generate` only covers `./pkg/apis/proxy/...`.
* `go generate ./pkg/apis/...` stops on a leftover `apiregister-gen` directive in `pkg/apis/doc.go`, and the `controller-gen` directive in `generate.go` fails on missing `go.sum` entries.
* Running `controller-gen object` on `./pkg/apis/cluster/...` stops on the REST storage fields of `ClusterGatewayHealth` and `ClusterGatewayProxy` (`invalid field type: interface{Get(...)}`), though it writes the file first.

So when you add a field to these types, update `DeepCopyInto` by hand, following the pattern of the fields around it, or run the `controller-gen` command above and keep only the hunks for your field:

```shell
controller-gen object:headerFile=hack/boilerplate.go.txt paths=./pkg/apis/cluster/...
git diff pkg/apis/cluster/v1alpha1/zz_generated.deepcopy.go
```

At `v1.10.0-alpha.1` that diff already shows one missing field: `ClusterEndpointConst.ProxyURL` isn't deep-copied.

## A tool on your PATH wins

The Makefile installs `controller-gen` and `openapi-gen` into `$GOBIN` only when `which` finds neither, and uses whatever it finds without checking the version. An older `controller-gen` from another project produces different output; a version manager's shim with no version set fails outright (`No version is set for shim: openapi-gen` with mise). If the generated files change in ways you didn't expect, check what `which controller-gen openapi-gen` finds, and install the versions the Makefile names:

```shell
go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.22.0
go install k8s.io/kube-openapi/cmd/openapi-gen@v0.0.0-20260721132016-d427ff9ee9ad
```
