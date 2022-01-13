---
title:  Roadmap 2022.03
---

Date: 2022-01-01 to 2022-03-31

## Core Platform

- Improve cloud resource provisioning and consuming workflow.
  * Make the cloud resources provisioning workflow more reliable and observable.
  * Make it more easier for developers to contribute more cloud resources.
- Support more flexible application observability.
  * Support collect and show log, metrics and tracing data with multi-cluster.
  * Automatically generate observability dashboard for application with Grafana.
  * Allow user to define customize observability rules including logs/metrics/tracing rules.
- Enhance the security and provide secure CI/CD capability.
- Enhance the capability of multi-cluster application delivery around security, scheduling and others.


## User Experience

- Let VelaUX share the data with CLI, and applications created in CLI can be visible in VelaUX, align the model according to users feedback.
- Improve global software user experience including:
  * Raise the success rate of installation about vela-core, addons, cloud resources, etc.
  * Improve the UX of VelaUX, make it easy to learn and use.


## Third-party integrations and more addons

- Provide OpenYurt integration to improve IoT/edge experience.
- Provide ArgoCD integration to improve GitOps experience, that'll be alternative to FluxCD addon.
- Integrate with OPA/Keyverno/Cosign and other projects to provide a secure software supply chain.


## Best practices

- Provide one or more best practices about how to use KubeVela in micro-services scenario.
- Provide more capabilities about AI/ML in KubeVela.