---
title:  Roadmap 2023.03
---

Date: 2023-01-01 to 2023-03-31

## Core Platform

- Support KubeVela Dynamic API in vela-prism. It will allow user to make integration with third-party APIs easily, with the use of CUE templates.
- Upgrade CUE execution engine in KubeVela and allow user to integrate customized function providers and manage CUE templates into modules.
- Support take-over policy, allowing user to adopt existing Kubernetes resources to KubeVela applications.
- Support read-only policy, allowing user to attach traits and extra capabilities (like observability) to existing resources, on top of the application model.
- Upgrade HealthScope controller which helps users to continuously track the status of applications.
- Support metadata backup and migration for data recovery of the control plane.
- Conduct load-testing experiments in multi-cluster scenario and conclude recommend settings and optimization techniques.

## Third-party integrations and more addons

- Integrate tracing and alerting tools into observability addons.

## Best practices

- Provide one or more best practices about how to use KubeVela in game/delivery/monitoring scenario.
