---
title:  Roadmap 2022.09
---

Date: 2022-07-01 to 2022-09-31

## Core Platform

- Upgrade CUE engine of KubeVela from 0.2 to 0.4+.
- Support KubeVela system level observability for multi-clusters.
  * Support collect and show log, metrics in a unified Grafana for all KubeVela and addon controllers with the control plane cluster.
- Support basic application level observability.
  * Support collect and show log, metrics with multi-cluster capability.
  * Automatically generate observability dashboard for application within a unified Grafana.
  * Allow user to define customize observability rules including logs and metrics.
- Support more flexible addons capability.
  * Standardized definition to make the definition(such as helm component) as one kind of addon dependency, addon can depends on a standard definition instead of any specific implementation(fluxcd or argocd).
  * Provide partial installation for addon to make it more lightweight.


## User Experience

- Provide end to end experience from source code development to multi-cluster/hybrid-cloud delivery.
- Provide application export/load capability and build a KubeVela AppStore. 

## Third-party integrations and more addons

- Integrate with OPA/Kyverno/Cosign and other projects to provide a secure software supply chain.


## Best practices

- Provide one or more best practices about how to use KubeVela in game/financial scenario.
