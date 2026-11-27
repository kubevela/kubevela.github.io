---
title: Versions
description: "Which workflow engine each KubeVela release embeds, the vela-workflow chart and addon versions, and what to check when you upgrade."
---

The workflow engine has its own version, separate from KubeVela's. vela-core embeds one engine version, built in, and the `vela-workflow` controller that runs WorkflowRuns is installed on its own, from its chart or the addon. This page says which goes with which.

## Which engine each KubeVela release runs

| KubeVela | Engine in vela-core | Docs |
| :--- | :--- | :--- |
| v1.12 (v1.12.0-alpha.2) | v0.8.0-alpha.2 | [0.8](/workflow/next/getting-started/introduction) |
| v1.11.2 | v0.7.3 | [0.7](/workflow/getting-started/introduction) |
| v1.11.1 | v0.7.3 (pre-release commit) | [0.7](/workflow/getting-started/introduction) |
| v1.11.0 | v0.7.2 | [0.7](/workflow/getting-started/introduction) |
| v1.10.10 | v0.6.5 | [0.6](/workflow/0.6/getting-started/introduction) (this version) |
| v1.10.9 | v0.6.3 (pre-release commit) | [0.6](/workflow/0.6/getting-started/introduction) |
| v1.10.0 | v0.6.1 (pre-release commit) | [0.6](/workflow/0.6/getting-started/introduction) |
| v1.9.15 | v0.6.2 (pre-release commit) | [0.6](/workflow/0.6/getting-started/introduction) |
| v1.9.14 | v0.6.1 | [0.6](/workflow/0.6/getting-started/introduction) |
| v1.9.0 | v0.5.1 (pre-release commit) | not covered: see the [v1.9 KubeVela docs](/docs/v1.9/end-user/workflow/overview) |

This is what an Application's workflow runs. Patch releases not listed pin a version in between: the exact pin is in each release's `go.mod`. The same table for the other products is in KubeVela's [release notes overview](/docs/next/release-notes/overview#docs-for-the-other-products).

## The `vela-workflow` controller

WorkflowRuns are run by whichever `vela-workflow` controller you installed, whatever vela-core embeds:

| Install | Version | Engine |
| :--- | :--- | :--- |
| Chart `kubevela/vela-workflow` `0.8.0-alpha.2` | pre-release, needs `--version` or `--devel` | 0.8 |
| Chart `kubevela/vela-workflow` `0.7.3` | latest release | 0.7 |
| Chart `kubevela/vela-workflow` `0.6.5` | | 0.6 |
| Addon `vela-workflow` `v0.7.3` (`vela addon enable vela-workflow`) | what the catalog holds | 0.7 |

So on KubeVela 1.12 with the addon, an Application's workflow runs 0.8 and a WorkflowRun runs 0.7. A 0.8 feature in a WorkflowRun, such as `forEach` or `$( )` expressions, needs the 0.8 chart: see [Install](/workflow/next/getting-started/install).

## Building on the engine

If you import `github.com/kubevela/workflow` as a Go module, each line moves the toolchain and Kubernetes libraries:

| Engine | Go | `k8s.io/client-go` | controller-runtime |
| :--- | :--- | :--- | :--- |
| v0.8.0-alpha.2 | 1.27.1 | v0.37.1 | v0.25.2 |
| v0.7.3 | 1.23.8 | v0.31.10 | v0.19.7 |
| v0.6.5 | 1.23.8 | v0.31.10 | v0.19.7 |

## Upgrade notes

### 0.7 to 0.8

- **New step fields need the new CRDs.** `forEach` is a new field on the Workflow and WorkflowRun CRDs. `helm upgrade` does not update a chart's CRDs, so apply them yourself, or an older CRD drops the field and a looped step runs once:

  ```shell
  helm show crds kubevela/vela-workflow --version 0.8.0-alpha.2 | kubectl apply --server-side --force-conflicts -f -
  ```

  See [Repeating Steps with forEach](/workflow/next/guides/steps/for-each#upgrading) for the same on vela-core.
- **`$( )` expressions are off by default in a WorkflowRun.** Turn them on with the chart value `workflow.enableCelExpressions=true`, and annotate each WorkflowRun that uses them with `workflowrun.oam.dev/cel-expressions: "true"`.
- **The built-in step definitions are applied by a hook Job** after the controller is ready, on the `alpine/k8s` image. A cluster that can't pull it needs `builtinDefinitions.job.image` set to a mirror.
- **The webhook certificates are managed by the controller.** The chart no longer runs the `kube-webhook-certgen` Jobs.
- **HTTP steps are bounded.** A `request`, `webhook` or `notification` step with a timeout of `0`, a negative one or one over `workflow.http.maxTimeout` (`60s`) fails, as does a response over `workflow.http.maxResponseBytes` (1 MiB), and a step's TLS Secret is read only from the step's namespace. See [Workflow Outbound HTTP Protection](../operate/http-protection.md#upgrade-note).

The full list is in the [v0.8.0-alpha.1](https://github.com/kubevela/workflow/releases/tag/v0.8.0-alpha.1) and [v0.8.0-alpha.2](https://github.com/kubevela/workflow/releases/tag/v0.8.0-alpha.2) release notes.

### 0.6 to 0.7

The step fields are the same. 0.6.5 and 0.7.3 both carry the HTTP denylist and the request limits, so moving between those two changes nothing for an HTTP step. See the [v0.7.0](https://github.com/kubevela/workflow/releases/tag/v0.7.0) release notes.
