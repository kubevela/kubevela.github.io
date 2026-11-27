---
title: Contributing to Workflow
description: "Where things are in the kubevela/workflow repository, what you need installed, and how a pull request gets reviewed and merged."
---

This part of the docs is for working on the engine itself, in [kubevela/workflow](https://github.com/kubevela/workflow): the WorkflowRun controller, the step executor, the CUE providers (`vela/kube`, `vela/http` and the rest) and the built-in step definitions. KubeVela imports this module, so a change here reaches an Application's workflow once vela-core bumps its pin.

The shared parts of contributing, such as signing off commits, the PR template and labels, are the same as for KubeVela: see the [contribution overview](/docs/next/contributor/overview). These pages cover what is particular to this repository.

## What's where

| Path | What it holds |
| :--- | :--- |
| `api/v1alpha1/` | The `WorkflowRun` and `Workflow` Go types and their generated deep-copy code. |
| `cmd/` | The controller's `main`: flags, the webhook's TLS, the HTTP denylist setup. |
| `controllers/` | The WorkflowRun reconciler. |
| `pkg/executor/` | Runs the steps of a workflow: modes, retries, backoff, suspend. |
| `pkg/generator/` | Turns a WorkflowRun into a workflow instance and its task runners. |
| `pkg/tasks/` | Step types: the built-in `suspend` and `step-group`, and CUE-templated custom steps. |
| `pkg/providers/` | The CUE packages a step can import: `vela/kube`, `vela/http`, `vela/email`, `vela/builtin`, `vela/config`, `vela/metrics`, `vela/time` and `vela/util`. `legacy/` holds the `vela/op` versions. |
| `pkg/expressions/` | `$( )` expressions in step properties, `forEach` items and `if`. |
| `pkg/utils/httpguard/` | The outbound HTTP guard: denylist, redirects, request limits. |
| `pkg/webhook/` | The WorkflowRun admission webhook. |
| `charts/vela-workflow/` | The Helm chart: CRDs, controller, webhook, and the built-in step definitions under `definitions/`. |
| `e2e/` | End-to-end tests, run against a cluster with the controller installed from the chart. |
| `examples/` | Example WorkflowRuns and Workflow templates. |
| `makefiles/`, `hack/` | Build, dependency and e2e targets, and the e2e chart patch. |

## Prerequisites

| Tool | Version | Used for |
| :--- | :--- | :--- |
| Go | 1.27.1 (`go.mod`) | everything |
| Docker | any recent | the image for e2e |
| k3d | any recent | a local cluster |
| kubectl, Helm | Helm 3 | installing the chart |
| envtest assets | Kubernetes 1.37 | unit tests: `make test` installs `setup-envtest` and runs it |
| golangci-lint | v2.14.0 | `make lint`, as CI runs it |
| staticcheck | v0.8.1 | `make staticcheck` |
| readme-generator-for-helm | any (npm) | `make helm-doc-gen`, part of `make reviewable` |

The `release-0.7` and `release-0.6*` branches build with Go 1.23.8.

## Branches and releases

- **`main`** is where every change lands first.
- **`release-0.x`** branches carry the releases of each line: `release-0.8` the 0.8 pre-releases, `release-0.7` the 0.7 patches (v0.7.3), `release-0.6-vela-1.10` the 0.6 patches for KubeVela 1.10 (v0.6.5), and `release-0.6` the commits KubeVela 1.9 pins. A change that belongs in one gets a `backport release-0.x` label on its PR, and the backport action opens the cherry-pick PR when the original merges. Leave the label to a maintainer if you're unsure.
- Tags (`v0.8.0-alpha.2`, `v0.7.3`) publish the image `oamdev/vela-workflow` and the chart to `https://kubevela.github.io/charts`.

## How a pull request is reviewed and merged

1. **Title.** The PR title checker wants a prefix: `Fix:`, `Feat:`, `Docs:`, `Test:`, `Chore:`, `CI:`, `Perf:`, `Refactor:`, `Revert:` or `Style:`, or a scoped form such as `Fix(http):`. A title without one gets the `title-needs-formatting` label and a failed check.
2. **Sign-off.** Every commit needs a `Signed-off-by` line (`git commit -s`): the DCO check refuses the PR otherwise.
3. **Checks.** CI runs unit tests (`make test`), staticcheck, golangci-lint, the e2e suite on k3d, and a webhook upgrade test. A first-time contributor's runs wait until a maintainer approves them.
4. **Review.** Every path is owned by the maintainers in `.github/CODEOWNERS`; a maintainer's approval is needed to merge. Run `make reviewable` before you ask for review, so generated files, formatting and the chart README are in step.
5. **Docs.** A new feature or option needs a docs change in [kubevela/kubevela.io](https://github.com/kubevela/kubevela.io), under `workflow/`.

## Next

- [Build and Test](build-and-test.md): build the controller, run the unit tests and the generators.
- [Run Locally](run-locally.md): run the controller against a k3d cluster, and run the e2e suite.
