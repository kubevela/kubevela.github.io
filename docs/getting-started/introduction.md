---
title: Introduction
slug: /
---

## What is KubeVela?

KubeVela is a modern software delivery platform that makes it easier and faster to deliver and manage applications across hybrid, multi-cloud environments. 
Applications created with KubeVela use the best practices of modern applications by default: they are able to scale with clouds, they use infrastructure as code, they are observable, and they are secure.

![](../resources/what-is-kubevela.png)


## Key Features

* **Unified Application Delivery Experience**

    KubeVela introduces a [unified and extensible model (OAM)](https://oam.dev/) that can glue and orchestrate all of your IaC based infrastructure configuration. As a result, KubeVela provides simple user experience for modern application delivery.

* **Automated Deployment across Clusters**

    KubeVela natively supports multi-cluster/hybrid-cloud scenarios such as promotion across clusters, high availability between clusters, automated cloud infrastructure provision.
    
* **Enterprise-Grade Security**

    KubeVela provides enterprise-grade security with fine-grained and custom RBAC, multi-cluster authorization, and first-class LDAP integrations.

* **Centralized Management and Observability**

    KubeVela provides a unified control plane for modeling, provisioning, and deploying applications. The centralized management reduces the burden of looking over each clusters and gives unified experience across platforms. It greatly improve efficiency around troubleshooting and debugging when things go wrong.

* **Declarative and Highly Extensible Workflow**

    KubeVela drives the delivery process with a declarative workflow, it provides automated canary and blue-green deployments with verification and rollback. After the workflow finished, it keeps the reconciliation loops to prevent any unexpected configuration drifts.


## KubeVela vs. Other Software

### KubeVela vs. CI/CD (GitHub Actions, GitLab, CircleCI, Jenkins, etc.)

KubeVela is a continuous delivery platform that works at downstream of your CI process. So you will reuse the CI process you already adopted, and KubeVela will take over CD process by empowering it with modern application delivery best practices, such as hybrid/multi-cloud promotion workflow, unified cloud resource provision/binding, and much more. KubeVela is fully declarative by design, it natively supports GitOps if you want.

> Feel free to check the [Integrating with Jenkins](./tutorials/jenkins) or [GitOps](./case-studies/gitops) documentation for more details.

### KubeVela vs. GitOps (ArgoCD, FluxCD, etc.)

KubeVela adopts your GitOps process and improves it by adding multi-cluster/hybrid-cloud capabilities:

* KubeVela has a user-friendly and programable workflow that allows you to integrate any of your delivery steps, including approval and notification flows. 
* With the help of the workflow, KubeVela can provide cross-environment promotion for your multi-cluster/hybrid-cloud applications.


### KubeVela vs. PaaS (Heroku, Cloud Foundry, etc.)

KubeVela is not a PaaS, but you can use it to add PaaS-like features to your application delivery process:

* A simple deployment abstraction for the developer
* A catalog of possible customizations(addons), managed by the platform team
* On-demand staging or development environments

Using KubeVela is a good way to get many of the benefits of a PaaS (developer productivity and peace of mind), without giving up any **flexibility** to take full control over your infrastructure and tooling.


### KubeVela vs. Helm 

Helm is a package manager for Kubernetes that provides package, install, and upgrade a set of YAML files for Kubernetes as a unit. 

KubeVela as a modern delivery system can naturally deploy Helm charts. For example, you could use KubeVela to define an application that is composed by a WordPress chart and a AWS RDS Terraform module, orchestrate the components' topology, and then deploy them to multiple environments following certain strategy.

Of course, KubeVela also supports other encapsulation formats including Kustomize etc.


### KubeVela vs. Kubernetes

KubeVela is a modern application delivery system built with cloud native stack. It leverages [Open Application Model](https://github.com/oam-dev/spec) and Kubernetes as control plane to resolve a hard problem - making shipping applications enjoyable.


Welcome onboard and sail Vela!


## What's Next

- Start to [install KubeVela](./install).
