---
title: Contributing to Prism
sidebar_label: Overview
description: What you need to work on the prism repository, how it's laid out, and how a pull request gets reviewed and merged.
---

These pages are for working on [kubevela/prism](https://github.com/kubevela/prism) itself. The parts every KubeVela repository shares (the DCO sign-off, the pull request template, labels, the code of conduct) are in KubeVela's [contribution guide](/docs/contributor/overview), and aren't repeated here.

| Page | Covers |
| --- | --- |
| [Build and Run](./build-and-run.md) | Building the binary and the image, and running your build on a k3d cluster with KubeVela. |
| [Testing](./testing.md) | Unit tests with envtest, code generation, and what CI runs. |

## Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Go | 1.27.1, from `go.mod` | Everything. With `GOTOOLCHAIN=auto` (the default) an older Go fetches it for you. |
| Docker | any recent | Building the image. |
| envtest assets | Kubernetes 1.37, as in CI (1.31 passes too) | The unit tests start a real kube-apiserver and etcd. |
| k3d | 5.x | A cluster with KubeVela to run your build on. |
| Helm, kubectl, the vela CLI | current | Installing KubeVela and Prism, and trying your change. |

## Repository layout

| Path | What's in it |
| --- | --- |
| `cmd/apiserver/` | `main.go` builds the server on `k8s.io/apiserver`: the recommended options with etcd removed, one REST storage per API, `--standalone-debug-mode`, and a post-start hook for the dynamic API. `Dockerfile` builds `oamdev/vela-prism`. |
| `pkg/apis/applicationresourcetracker/v1alpha1/` | `ApplicationResourceTracker`: the ResourceTracker conversion (`conversion.go`) and `Get`/`List` (`types.go`). |
| `pkg/apis/cluster/v1alpha1/` | `Cluster`: reading cluster Secrets and OCM ManagedClusters (`client.go`, `reader.go`), the table columns (`printer.go`), and `--storage-namespace` (`config.go`). VelaUX imports `NewClusterClient` from here. |
| `pkg/apis/o11y/config/` | `--observability-namespace`. |
| `pkg/apis/o11y/grafana/v1alpha1/` | `Grafana` and its Secret, and `request.go`, the shared Grafana HTTP client the other two use. |
| `pkg/apis/o11y/grafanadashboard/v1alpha1/`, `grafanadatasource/v1alpha1/` | Dashboards and datasources: each a `client.go` of Grafana API calls and a `conversion.go` between the object and Grafana's JSON. |
| `pkg/apis/dynamicresource/`, `pkg/dynamicapiserver/` | The dynamic API: the CUE codec, the storage over a dynamic client, and the server that adds and removes resources as ConfigMaps change. |
| `pkg/apis/generated/` | Generated OpenAPI definitions. |
| `pkg/util/subresource/` | The `<uid>@<grafana>` compound names. |
| `charts/` | The Helm chart. The `vela-prism` addon lives in [kubevela/catalog](https://github.com/kubevela/catalog/tree/master/addons/vela-prism), not here. |
| `test/` | envtest bootstrap and the CRDs it installs (ResourceTracker, ManagedCluster). |

A new API is a package under `pkg/apis/` with a type that implements the `rest` storage interfaces it supports, registered in `main.go`, plus a line in the Makefile's `generate-openapi` target. Shared helpers (the singleton clients, label selector handling, server options) come from [kubevela/pkg](https://github.com/kubevela/pkg), at a revision pinned in `go.mod`.

## Reviews and releases

[`CODEOWNERS`](https://github.com/kubevela/prism/blob/master/.github/CODEOWNERS) lists the maintainers who review every path. A pull request runs `UnitTest` and CodeQL (see [Testing](./testing.md#ci)) and is merged into `master` by a maintainer once it has at least one approval.

Pushing to `master` builds and pushes `oamdev/vela-prism:latest` (and `ghcr.io/kubevela/oamdev/vela-prism`) for amd64 and arm64; pushing a `v*` tag builds that tag. A tag also runs `HelmChart`, which publishes the chart to [kubevela/charts](https://github.com/kubevela/charts). Users get a new version through the addon, so a release isn't finished until the image in [`addons/vela-prism/parameter.cue`](https://github.com/kubevela/catalog/blob/master/addons/vela-prism/parameter.cue) in the catalog is bumped.

:::caution
`master` no longer runs with the arguments the addon and the chart pass. Its Kubernetes 0.37 libraries no longer know the `APIPriorityAndFairness` feature gate, and both installs start it with `--feature-gates=APIPriorityAndFairness=false`, so it exits at once with `invalid argument "APIPriorityAndFairness=false" for "--feature-gates" flag: unrecognized feature gate: APIPriorityAndFairness`. The next release needs that argument dropped from `charts/templates/deployment.yaml` and from the addon's `vela-prism.cue` at the same time. The chart workflow also takes its chart version from the latest `kubevela/workflow` release rather than Prism's tag.
:::
