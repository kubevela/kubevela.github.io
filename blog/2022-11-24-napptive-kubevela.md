---
title: Deploying your OAM applications in the Napptive cloud-native application platform
author: Daniel Higuero
author_title: Napptive CTO
author_url: https://github.com/dhiguero
author_image_url: https://avatars.githubusercontent.com/u/6400250
description: "This article introduces how KubeVela is applied in Napptive to build cloud-native application platform."
image: /img/blog/napptive-logo.png
tags: [ KubeVela, Napptive, Kubernetes, DevOps, Cloud Native, CNCF, Application delivery, Open Application Model]
hide_table_of_contents: false
---

## Application Delivery on Kubernetes

The cloud-native landscape is formed by a fast-growing ecosystem of tools with the aim of improving the development of modern applications in a cloud environment. Kubernetes has become the de facto standard to deploy enterprise workloads by improving development speed, and accommodating the needs of a dynamic environment.

Kubernetes offers a comprehensive set of entities that enables any potential application to be deployed into it, independent of its complexity. This however has a significant impact from the point of view of its adoption. Kubernetes is becoming as complex as it is powerful, and that translates into a steep learning curve for newcomers into the ecosystem. Thus, this has generated a new trend focused on providing developers with tools that improve their day-to-day activities without losing the underlying capabilities of the underlying system.

<!--truncate-->

## Napptive Application Platform

The NAPPTIVE Playground offers a cloud native application platform focused on providing a simplified method to operate on Kubernetes clusters and deploy complex applications without needing to work with low-level Kubernetes entities. This is especially important to be able to accommodate non-developer users' personas as the computing resources of a company are being consolidated in multi-purpose, multi-tenant clusters. Data scientists, business analysts, modeling experts and many more can benefit from simple solutions that do not require any type of knowledge of cloud computing infrastructures, or orchestration systems such as Kubernetes, which enable them to run their applications with ease in the existing infrastructure.

Any tool that works in this space must start by analyzing the existing abstractions. In particular, at Napptive, we focus on the Applications. This quite understood abstraction is not present in Kubernetes, requiring users to manually tag, identify and reason about the different components involved in an application. The Open Application Model provides an excellent abstraction to represent any type of application independently of the cloud provider, containerization technology, or deployment framework. The model is highly customizable by means of adding Traits, Policies, or new Component Definitions.

## KubeVela in Napptive

The Napptive Playground leverages Kubevela as the OAM runtime for Kubernetes deployments. Our Playground provides an environment abstraction with multi-tenant guarantees that is equivalent to partitioning a shared cluster by means of differentiated namespaces. The benefit of our approach is the transparency of its configuration using a higher abstraction level that does not involve any Kubernetes knowledge.

The following diagram describes the overall architecture of Napptive and Kubevela deployed in a Kubernetes cluster.

![napptive-arch](/img/blog/kubevela-napptive-1.png)

The user has the ability to interact with the cluster by using the Napptive user interface (CLI or Web UI), or by means of using the standard Kubernetes API with kubectl. Isolated environments can be easily created to establish the logical separations such as type of environment (e.g., deployment, staging, production), or purpose (e.g., projectA, projectB), or any other approach to differentiate where to deploy an application. Once the OAM application is deployed on Kubernetes, Kubevela is in charge of managing the low-level application lifecycle creating the appropriate Kubernetes entities as a result. One of the main differences with other adopters of Kubevela, is the fact that we use Kubevela in a multi-tenant environment. The following figure shows the specifics of an application deployment in this type of scenario.

![napptive-arch](/img/blog/kubevela-napptive-2.png) 

The Napptive Playground is integrated with Kubernetes RBAC and offers a native user management layer that works in both on-premise and cloud deployments. User identity is associated with each environment, and Kubevela is able to take that information to ensure that users can only access their allowed resources. Once a user deploys an OAM application, Kubevela will intercept the call and attach the user identity as an annotation. After that, the rendering process will ensure that the user has access to the entities (e.g., trait, component, policy, workflow step definitions) and that the target namespaces are also accessible by the user. Once the application render is ready, the workflow orchestrator will create the different entities in the Kubernetes namespace.

## Napptive in the Community

In terms of our involvement with the OAM/Kubevela community, it has evolved overtime from being passive members of the community simply exploring the possibilities of OAM in Kubernetes, to becoming active contributor members in different areas. In particular, we have closely worked with the core Kubevela development team to test and overcome the different challenges related to using a multi-tenant, RBAC compliance installation of Kubevela. Security in this type of installation is critical and it is one of our main focuses within the Kubevela community.  We are committed to continue working with the community not only to ensure that multi-tenancy is maintained throughout the different releases, but also to add our own perspective representing our customer use cases.

The Kubevela community is growing at a fast pace, and we try to contribute our adaptations, features, feedback, and thoughts back to the community. This type of framework is deployed in a multitude of environments. The most common one is probably where one or more clusters are inside a company. In our particular application, we are interested in exploring methods to offer computing capabilities for a variety of user personas in a shared cluster, and we contribute our view and experience in the community.

## Future Evolution

In terms of future evolution, we believe the Napptive Playground is a great tool to experience working with the Open Application Model without the need of installing new clusters and frameworks. From the point of view of our contributions in the community, we are internally working in exploring QA mechanisms that ensure that customer applications remain working after upgrades, and identifying potential incompatibilities between releases. Once that work is ready, we plan to contribute our testing environment setup back to the community so that it can be adopted in the main branch. We are also excited with new functionalities that have been recently added to Kubevela such as multi-cluster support, and are exploring methods to adopt it inside the Playground. Moreover, we are actively working on an OAM-compatible application catalog that will simplify the way organizations store and make accessible application definitions so that they can be deployed into a cluster from a central repository. The catalog focuses on the OAM entities and relies on existing container registries for storing the image.
