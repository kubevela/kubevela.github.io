---
title: Install
description: "Install the vela-workflow controller from its Helm chart or the KubeVela addon, or use the engine already inside vela-core for Application workflows."
---

What you install depends on where your workflows run:

| You want to run | Install |
| :--- | :--- |
| Workflows in Applications (`spec.workflow`) | Nothing more: vela-core embeds the engine. [Install KubeVela](/docs/next/installation/kubernetes), and its version decides the engine's (KubeVela 1.12 runs 0.8). |
| WorkflowRuns, with or without KubeVela | The `vela-workflow` controller, from its [Helm chart](#install-the-helm-chart) or the [KubeVela addon](#install-the-kubevela-addon). |

The `vela` CLI is optional for both. Its `vela workflow` commands suspend, resume, restart and read the logs of a WorkflowRun as well as an Application: see [Install the vela CLI](/docs/next/installation/kubernetes#install-vela-cli).

## Install the Helm chart

The chart installs the controller, its CRDs (`WorkflowRun`, `Workflow`, `WorkflowStepDefinition`), the admission webhook and the [built-in step types](../reference/built-in-steps.md). It needs no KubeVela, so it works on any cluster. Workflow 0.8 is a pre-release, so name the version:

```shell
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install vela-workflow kubevela/vela-workflow --version 0.8.0-alpha.2 \
  --namespace vela-system --create-namespace --wait
```

`--wait` returns once the controller is ready. A hook Job then applies the built-in step definitions, so give it a few seconds before you check them:

```shell
kubectl get pods -n vela-system
kubectl get workflowstepdefinitions -n vela-system
```

The `vela-workflow` pod should be `Running`, and the list should hold the 24 built-in step types, from `addon-operation` to `vela-cli`. This page was checked on k3s v1.35.

### Chart values worth knowing

| Value | Default | What it does |
| :--- | :--- | :--- |
| `workflow.enableCelExpressions` | `false` | Lets a WorkflowRun annotated `workflowrun.oam.dev/cel-expressions: "true"` use `$( )` expressions in properties, `forEach` items and `if`. |
| `workflow.step.forEachMaxItems` | `50` | The most items a `forEach` loop may have. |
| `workflow.backoff.maxTime.waitState`, `.failedState` | `60`, `300` | The longest wait between retries, in seconds: see [Workflow Working Mechanism](../operate/working-mechanism.md). |
| `workflow.step.errorRetryTimes` | `10` | How often a failed step is retried. |
| `workflow.http.maxTimeout`, `workflow.http.maxResponseBytes` | `60s`, `1048576` | Limits on HTTP steps: see [Workflow Outbound HTTP Protection](../operate/http-protection.md#request-limits). |
| `builtinDefinitions.job.image.*` | `alpine/k8s:1.34.13` | The image of the Job that applies the built-in step definitions. Point it at a mirror where Docker Hub isn't reachable. |
| `systemDefinitionNamespace` | the release namespace | Where the built-in step definitions are installed. |

The full list is in the chart's [README](https://github.com/kubevela/workflow/tree/main/charts/vela-workflow). Its TL;DR still names the old `charts.kubevela.net` repository and an old Kubernetes range: use `https://kubevela.github.io/charts` as above.

## Install the KubeVela addon

With KubeVela installed, the addon installs the same controller:

```shell
vela addon enable vela-workflow
```

:::caution
The addon is at `v0.7.3`, so it runs workflow 0.7 even on KubeVela 1.12. A 0.7 controller doesn't know 0.8's step features, such as `forEach` and `$( )` expressions, and its CRD drops the fields. For them, install the 0.8 chart instead of the addon.
:::

## With KubeVela on the same cluster

vela-core and the chart can share a cluster: vela-core runs Applications, the `vela-workflow` controller runs WorkflowRuns, and each keeps its own HTTP denylist (see [Install both charts together](../operate/http-protection.md#install-both-charts-together)). Install KubeVela first. A WorkflowRun step that applies an Application, such as `apply-app`, needs vela-core there to run it.

## Upgrade

```shell
helm repo update kubevela
helm show crds kubevela/vela-workflow --version <version> | kubectl apply --server-side --force-conflicts -f -
helm upgrade vela-workflow kubevela/vela-workflow --version <version> -n vela-system
```

`helm upgrade` never updates a chart's CRDs, so apply them first: a field added since your first install, such as `forEach`, is otherwise dropped by the API server without an error. What changed between versions is in [Versions](../reference/versions.md#upgrade-notes).

## Uninstall

```shell
helm uninstall vela-workflow -n vela-system
```

The CRDs stay, and so do your WorkflowRuns and Workflows. Delete the CRDs only once nothing uses them: deleting a CRD deletes every object of its kind.
