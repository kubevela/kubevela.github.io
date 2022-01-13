---
title: Core Concept
---

KubeVela revolves around cloud-native application delivery and management scenarios. The application delivery model behind it is [Open Application Model](../platform-engineers/oam/oam-model), or OAM for short. It describes various components and operational traits required for application as a unified, and infrastructure-independent "deployment plan". As a result, we can achieve standardized and efficient application delivery in a multi-cloud/hybrid-cloud environment. KubeVela includes the following core concepts:

## Application

An application defines the delivery and management requirements of an artifact (binary, Docker image, Helm Chart...) or cloud service included in a microservice business unit. It consists of four parts: [Component](#component), [Trait](#trait), [Workflow](#workflow) and [Policy](#policy) and its lifecycle includes:

- <b>Deploy</b> Execute Workflow. Instantiate application in one environment.
- <b>Recycle</b> Delete the instance of the application and reclaim its resources.

### Component

Component defines the artifact of application，The best practice is to having one core component and subordinate components around it. Its type decided by [Component Definition](../platform-engineers/oam/x-definition#componentdefinition) .

### Trait

Triat are plugable operations that can attach to Component, for example: scaler for replicas(manual and auto), PVC, gateway, DNS and so on. You can draw out-of-box Trait from the ecosystem or simply customize by [Trait Definition](../platform-engineers/oam/x-definition#traitdefinition).

### Workflow

Workflow allows you to define critical step in the process of application delivery, typical steps will be manual approve, data passing, release across multi-cluster, notification and etc. Its type can be defined and customized by [Workflow Step Definition](../platform-engineers/oam/x-definition#workflowstepdefinition).

### Policy

Policy defines a strategy of certain aspect for application as to quality assurance, security, firewall rules, SLO and etc. Its type can be defined and customized by [Policy Definition](../platform-engineers/oam/x-definition#policydefinition).

### Revision

Revision generates each time when the application deployed and holds all infos in one snapshot. You use it for rolling back to whichever version whenever you needed.

<!-- ## Project

Project is where you manage all the applications and collaborate with your team member. Project is one stand alone scope that separates it from other project. -->

## Environment

Environment refers to the environment for development, testing, and production and it can include multiple Targets. Only applications in the same environment can visit and share resource with each other.

- <b>Bind Application with Environment</b> The application can be bound to multiple Environments, and for each environment, you can set the unique parameter difference for each environment.

## Target

Target describes the space where the application resources actually delivered. One target describes one Kubernetes cluster and namespace, it can also describe a region or VPC for cloud providers. In the target, credentials of cloud resources created will automatically delievered to the Kubernetes cluster.

## Cluster

Import and manage your Kubernetes cluster in KubeVela。Kubernetes cluster is currently the main way for KubeVela application delivery.

## Addon

Addon is where you can freely pull in third-party capability that fulfills your need. This relies on the highly scalable design pattern of KubeVela. Each Addon will have its own [X-Definition](../platform-engineers/oam/x-definition).

## Next Step

- View [Tutorials](../deliver-app/webservice) to look on more of what you can achieve with KubeVela.
- View [How To guides](../how-to/dashboard/application/create-application) to check out more features.

