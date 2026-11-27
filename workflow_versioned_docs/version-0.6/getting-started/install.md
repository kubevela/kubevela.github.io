---
title: Install
description: "Install the vela-workflow 0.6.5 controller from its Helm chart or the KubeVela addon, or use the engine already inside vela-core for Application workflows."
---

What you install depends on where your workflows run:

| You want to run | Install |
| :--- | :--- |
| Workflows in Applications (`spec.workflow`) | Nothing more: vela-core embeds the engine. [Install KubeVela](/docs/v1.10/installation/kubernetes); KubeVela 1.10 runs workflow 0.6. |
| WorkflowRuns, with or without KubeVela | The `vela-workflow` controller, from its [Helm chart](#install-the-helm-chart) or the [KubeVela addon](#install-the-kubevela-addon). |

The `vela` CLI is optional for both. Its `vela workflow` commands suspend, resume, restart and read the logs of a WorkflowRun as well as an Application: see [Install the vela CLI](/docs/v1.10/installation/kubernetes#install-vela-cli).

## Install the Helm chart

The chart installs the controller, its CRDs (`WorkflowRun`, `Workflow`, `WorkflowStepDefinition`), the admission webhook and the [built-in step types](../reference/built-in-steps.md). It needs no KubeVela, so it works on any cluster:

```shell
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install vela-workflow kubevela/vela-workflow --version 0.6.5 \
  --namespace vela-system --create-namespace --wait
```

Check the controller and the step types:

```shell
kubectl get pods -n vela-system
kubectl get workflowstepdefinitions -n vela-system
```

The `vela-workflow` pod should be `Running`, and the list should hold the 24 built-in step types, from `addon-operation` to `vela-cli`.

The chart's values, such as the backoff limits (`workflow.backoff.maxTime.*`, `workflow.step.errorRetryTimes`) and the HTTP limits (`workflow.http.maxTimeout`, `workflow.http.maxResponseBytes`), are in its [README](https://github.com/kubevela/workflow/tree/v0.6.5/charts/vela-workflow). Its TL;DR still names the old `charts.kubevela.net` repository and an old Kubernetes range: use `https://kubevela.github.io/charts` as above.

## Install the KubeVela addon

With KubeVela installed, the addon installs the same controller:

```shell
vela addon enable vela-workflow
```

The addon is at `v0.7.3`, so on KubeVela 1.10 it installs workflow 0.7, not 0.6. Install the `0.6.5` chart instead to keep the WorkflowRun controller on the same engine as vela-core.

## With KubeVela on the same cluster

vela-core and the chart can share a cluster: vela-core runs Applications, the `vela-workflow` controller runs WorkflowRuns, and each keeps its own HTTP denylist (see [Install both charts together](../operate/http-protection.md#install-both-charts-together)). A WorkflowRun step that applies an Application, such as `apply-app`, needs vela-core there to run it.

## Upgrade and uninstall

`helm upgrade` never updates a chart's CRDs, so apply them before you upgrade:

```shell
helm show crds kubevela/vela-workflow --version <version> | kubectl apply --server-side --force-conflicts -f -
helm upgrade vela-workflow kubevela/vela-workflow --version <version> -n vela-system
```

What changed between versions is in [Versions](../reference/versions.md#upgrade-notes). `helm uninstall vela-workflow -n vela-system` removes the controller and leaves the CRDs, with your WorkflowRuns and Workflows.
