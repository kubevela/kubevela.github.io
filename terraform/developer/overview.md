---
title: Contributor Overview
description: How the terraform-controller repository is laid out, the tools it needs, and which branch a change goes to.
---

These pages are for working on [kubevela/terraform-controller](https://github.com/kubevela/terraform-controller) itself. The parts every KubeVela repository shares (the DCO sign-off, the PR template, labels, how to find an issue) are in the [contribution process](/docs/contributor/overview); this covers what's particular to this one.

The repository moved from `oam-dev` to the `kubevela` org on GitHub, but the Go module kept its name: import it as `github.com/oam-dev/terraform-controller`.

## Repository layout

| Path | What's there |
| --- | --- |
| `main.go` | The controller manager: flags, feature gates, the two reconcilers. |
| `api/v1beta2/`, `api/v1beta1/` | The `Configuration` (v1beta2, the stored version; v1beta1 still served) and `Provider` (v1beta1) types. vela-core imports these. |
| `api/types/` | States, constants and the names of the objects the controller creates. |
| `controllers/configuration_controller.go`, `provider_controller.go` | The reconcilers. |
| `controllers/process/` | Builds each Configuration's Terraform Job: input ConfigMap, variable Secret, init containers (`process/container/`). |
| `controllers/configuration/backend/` | The Kubernetes and S3 state backends. |
| `controllers/provider/` | Credentials per cloud: which Secret keys become which environment variables. |
| `chart/` | The Helm chart, with the CRDs in `chart/crds/` (generated). |
| `config/` | Kubebuilder kustomize scaffolding; the chart is what's released. |
| `examples/` | Configurations per cloud. `examples/random/` needs no credentials and is what the e2e tests apply. |
| `e2e/` | End-to-end tests against a cluster: `e2e/normal/` and `e2e/controllernamespace/`. |
| `gitee/` | Tests for the Gitee mirror rewrite (`githubBlocked`). |
| `hack/` | Credential helper scripts, and `hack/tool/` (the `backup_restore` tool and validation). |

## Prerequisites

| Tool | Version | For |
| --- | --- | --- |
| Go | 1.27.1 (`go.mod`, and CI) | Everything. |
| `kubectl` and a cluster | k3d or kind | Running the controller and the e2e tests. CI uses kind with Kubernetes 1.37. |
| Docker | | Building the image for e2e. |
| Helm | v3 | Installing the chart. |
| `controller-gen`, `goimports`, `golangci-lint` | v0.22.0, latest, v2.14.0 | Installed by `make` into your `GOBIN` if they are not on your `PATH`. |

The Makefile uses whatever `controller-gen` and `golangci-lint` are on your `PATH` first, and only installs its pinned versions when there are none. Tools built with an older Go than 1.27 can refuse the code: rebuild them with Go 1.27.1.

## Branches

| Branch | What it is |
| --- | --- |
| `master` | Development: the next minor release. Every change goes here first. |
| `release-0.9` | The 0.9 line (`v0.9.x`): what KubeVela 1.12 uses. Security and bug fixes only. |
| `release-0.8` | The 0.8 line (`v0.8.x`): what KubeVela 1.10 and 1.11 use. Security and bug fixes only. |

A fix reaches the release branches as a backport: see [Pull Requests and Releases](pull-requests.md).

Next: [Build and Test](build-and-test.md).
