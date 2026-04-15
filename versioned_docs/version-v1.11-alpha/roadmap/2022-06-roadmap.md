---
title:  Roadmap 2022.06
---

Date: 2022-04-01 to 2022-06-31

## Core Platform

- Enhance the global security of app delivery.
  * Support multi-cluster authentication and authorization for both KubeVela Controller and VelaUX.
  * Enhance the security of KubeVela controller.

- Support observability for application delivery process.
  * Provide application topology from VelaUX and CLI.
  * Provide pod level resource status for helm chart and any Kubernetes CRD resources in topology.

- Support flexible workflow capability.
  * Condition for workflow step, such as `if always`.
  * Sub-steps for concurrency deployment.

## User Experience

- Release `VelaD` project greatly improve the efficiency of installation, deployment, and usage.
- VelaUX improve the extensible components/traits/policies/workflow-steps integration in UI to provide UI editor for definitions.


## Third-party integrations and more addons

- Provide ArgoCD integration to improve GitOps experience, that'll be alternative to FluxCD addon.
- Provide OpenKruise Rollout for better rollout. 

## Best practices

- Provide one or more best practices about how to deploy and compose cloud resources with KubeVela.