---
title:  Roadmap 2027.12
---

Date: 2027-10-01 to 2027-12-31

## Core Platform

- Clusters built from team-owned layers
  * Describe a cluster as a blueprint made of layers, such as networking, security and monitoring, each owned and versioned by a different team.
  * Blueprints are versioned, so every change is recorded and a cluster can always be traced back to the exact blueprint it runs.

- Create, adopt or connect clusters
  * Create new clusters, bring existing ones under management, or connect to clusters as they are.
  * The actual provisioning is done by existing tools such as Crossplane, Cluster API, Terraform or KRO. KubeVela coordinates the order, the ownership and the rollout.

- Ready-made building blocks for clusters
  * Provide building blocks for Helm, Kustomize, Crossplane and Terraform, plus providers for AWS EKS, Google GKE, Azure AKS and kind.
  * Reuse the same kind of definitions already used for applications, so platform teams do not have to learn a new model.
