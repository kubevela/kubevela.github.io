---
title: Contributing to Cluster Gateway
sidebar_label: Overview
description: What you need to work on the cluster-gateway repository, how it's laid out, and how a pull request gets reviewed and merged.
---

These pages are for working on [oam-dev/cluster-gateway](https://github.com/oam-dev/cluster-gateway) itself. The parts every KubeVela repository shares (the DCO sign-off, the pull request template, labels, the code of conduct) are in KubeVela's [contribution guide](/docs/contributor/overview), and aren't repeated here.

| Page | Covers |
| --- | --- |
| [Build and Run](./build-and-run.md) | Building the binary and the image, running your build on a k3d hub with a member cluster, and running the gateway on your machine. |
| [Testing](./testing.md) | Unit tests with envtest, and the e2e suite against a cluster. |
| [Code Generation](./code-generation.md) | The generated deepcopy, OpenAPI, CRD and clientset code, and when to regenerate it. |

## Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Go | 1.27.1, from `go.mod` | Everything. With `GOTOOLCHAIN=auto` (the default) an older Go fetches it for you. |
| Docker | any recent | Building the image. |
| k3d or kind | k3d 5.x, kind 0.33 in CI | A hub cluster to run your build on, and a member cluster for it to reach. |
| Helm | 3.x | Installing the standalone chart. |
| kubectl | within one minor of the cluster | Talking to both. |
| envtest assets | Kubernetes 1.37 | The unit tests in `pkg/apis/cluster/v1alpha1` start a real kube-apiserver. |

The Makefile installs `controller-gen` and `openapi-gen` into `$GOBIN` the first time it needs them.

## Repository layout

| Path | What's in it |
| --- | --- |
| `cmd/apiserver/` | The gateway: `main.go` wires the aggregated API server, its flags and its storage. `Dockerfile` builds `oamdev/cluster-gateway`. |
| `cmd/addon-manager/` | The OCM addon manager, which installs and rotates the gateway as an Open Cluster Management addon. Its own image, `oamdev/cluster-gateway-addon-manager`. |
| `pkg/apis/cluster/v1alpha1/` | The API: `ClusterGateway` and its Secret conversion (`clustergateway_types_secret.go`), the `proxy` subresource (`clustergateway_proxy.go`), identity exchange (`clustergateway_proxy_configuration.go`), `health`, and `VirtualCluster`. Most changes land here. |
| `pkg/apis/cluster/transport/` | Round trippers that send a client-go request through the gateway; what KubeVela and [Go client](../examples/go-client.md) use. |
| `pkg/apis/proxy/v1alpha1/` | The `ClusterGatewayConfiguration` CRD the addon manager reads. |
| `pkg/apis/generated/` | Generated OpenAPI definitions. |
| `pkg/generated/clientset/` | The generated clientset for `cluster.core.oam.dev`. |
| `pkg/config/`, `pkg/options/`, `pkg/featuregates/` | The gateway's own flags, and its feature gates. |
| `pkg/util/exec/` | Running a `Dynamic` cluster's credential command, with its cache. |
| `pkg/util/`, `pkg/event/`, `pkg/metrics/` | The Secret and `ManagedCluster` caches, event handlers, and the proxy metrics. |
| `pkg/addon/` | The addon manager's controllers and agent. |
| `charts/cluster-gateway/` | The standalone chart. vela-core has its own copy of the gateway's manifests, in kubevela's `charts/vela-core/templates/cluster-gateway/`. |
| `charts/addon-manager/` | The addon manager's chart. |
| `e2e/` | The e2e suites: `roundtrip` (the default), `kubernetes`, `ocm`, `benchmark`, plus `env/prepare`, which writes a cluster Secret for the cluster you're on. |
| `examples/` | Go programs using the transport package, and a sample identity exchange configuration. |
| `hack/` | Codegen header, CRDs for the OCM types, sample cluster Secrets (`hack/samples/`), `cert-gen/gen.sh` for a serving certificate, and `patch/`, a helper shipped in the image. |
| `docs/local-run.md` | The older guide to running the gateway on kind. [Build and Run](./build-and-run.md) covers the same ground for this release. |

## Branches and versions

| Branch | What it is | Used by |
| --- | --- | --- |
| `master` | Development: the next minor release. | |
| `release-1.10` | The 1.10 line, tagged `v1.10.x`. | KubeVela 1.12 |
| `release-1.9` | The 1.9 line, tagged `v1.9.x`. | KubeVela 1.10 and 1.11 |

Branch from `master` for anything new. Fixes go to `master` first, then are backported to the release branches that need them: the repository's `RELEASE.md` describes the backport labels and the `/backport` comment, and how a release is cut and picked up by KubeVela.

## How a pull request is reviewed and merged

1. Open the pull request against `master` from your fork, with every commit signed off (`git commit -s`): the `DCO` check fails otherwise.
2. CI runs three jobs, unless the change only touches Markdown or images:

   | Check | What it runs |
   | --- | --- |
   | `test` | `make test` (codegen, `go fmt`, `go vet`, unit tests), then `make`, which builds the binary. |
   | `e2e-cluster-gateway` | Builds the image, installs the standalone chart on kind, registers the kind cluster with itself, and runs `make test-e2e`. |
   | `e2e-ocm-addon-cluster-gateway` | The same through the OCM addon manager, with `make test-e2e-ocm`. |

   Codecov reports coverage. A fork's pull request has no Codecov token, so a failed upload there doesn't fail the job.
3. A maintainer listed in `.github/CODEOWNERS` reviews it. One approval is enough to merge.
4. A maintainer merges it, and adds the `backport release-x.y` labels first if the fix belongs on a release line.

A first-time contributor's CI runs only once a maintainer approves the workflow run, so until then you'll see just the DCO check.

A change to the gateway reaches KubeVela users through a cluster-gateway release and then a KubeVela release that pins it, in both kubevela's `go.mod` and its vela-core chart. If your change needs KubeVela to change too (a new flag, a new Secret key), say so in the pull request.
