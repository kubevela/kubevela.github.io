---
title:  Overview of GitOps
---

GitOps is a way of delivering applications where a Git repository holds the declarative configuration, and a tool in the cluster keeps the cluster in step with it. You change what runs by merging a commit or a pull request, not by running commands against the cluster.

## What a GitOps tool does with an Application

A KubeVela Application is a plain Kubernetes custom resource. Your GitOps tool applies it from Git like any other manifest, and the KubeVela controller takes it from there. So any tool that applies manifests from a repository works: FluxCD, Argo CD, or a CI job that runs `kubectl apply`.

The GitOps tool owns one object, the Application. KubeVela owns everything the Application renders: Deployments, Services, cloud resources and so on, in whichever clusters you deliver to.

## What KubeVela adds

Applying plain manifests from Git declares the end state and stops there. With an Application in Git, you also get:

- **A delivery workflow.** Steps run in order or as a [dependency graph](../end-user/workflow/component-dependency-parameter.md), with [manual approval](../end-user/workflow/suspend.md), notifications and conditions, rather than every resource landing at once. See the [workflow overview](../end-user/workflow/overview.md).
- **Multi-cluster delivery.** One Application in one repository can place components across clusters, with per-environment overrides. See [Multi Cluster Application](./multi-cluster.md).
- **Health.** KubeVela checks each component and trait against the health policy its definition sets, and reports the result in the Application's status, so `vela status <app>` (or your GitOps tool's view of the Application) tells you whether the delivery worked, not just whether it was applied.
- **Higher-level abstractions.** Developers write components and traits; platform teams own the [definitions](../getting-started/core-concept.md) behind them, including [cloud resources](../tutorials/consume-cloud-services.md).

## Pick your tool

- **FluxCD**: enable the [`fluxcd` addon](../reference/addons/fluxcd.md) and follow [GitOps with FluxCD](../end-user/gitops/fluxcd.md). It covers syncing a configuration repository and updating images automatically.
- **Argo CD or another tool**: commit the Application YAML to the repository your tool watches. Two things are worth knowing:
  - Each time the Application's spec changes, KubeVela runs its workflow again. To decide exactly when a deploy happens, set the `app.oam.dev/publishVersion` annotation and have your CI change it. See [Publish Version](../end-user/version-control.md) and [How to control Application version in GitOps](../end-user/gitops/fluxcd.md#how-to-control-application-version-in-gitops).
  - KubeVela writes some annotations onto the Application itself: the controller sets `oam.dev/kubevela-version`, and with [authentication](../platform-engineers/auth/basic.md) on, the webhook sets `app.oam.dev/group`, plus `app.oam.dev/username` when `authentication.withUser` is on. Leave these out of the YAML in Git; KubeVela sets them.
