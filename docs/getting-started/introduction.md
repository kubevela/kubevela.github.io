---
title: Introduction
slug: /
---

## What is KubeVela?

KubeVela is a modern software delivery platform that makes it easier and faster to deliver and manage applications across hybrid, multi-cloud environments. 

Using KubeVela, software teams can build cloud native applications per needs as they grow, then run them anywhere.

![](../resources/what-is-kubevela.png)


## Key Features

* **Unified Application Delivery Model**

    KubeVela introduces a [unified and cross-platform delivery model(OAM)](https://oam.dev/) that allows you to deploy any workload type, including containers, databases, or even VM instances to any cloud or Kubernetes clusters. It helps you to just write application once, and deliver it the same everywhere, no more re-writing everything from scratch for any new delivery target.

* **Intention-driven Delivery Workflow**

    The whole delivery model was fully intention-driven, having both user experience and robustness. The implementation is driven by CUE - a powerful configuration language developed at Google, and runs on Kubernetes with reconciliation loops. This allows you to design application deployment steps per needs, satisfy the fast growth of businesses requirements, while also keep your production safe with continuous enforcement.

* **Multi-cluster/Hybrid-cloud Continuous Delivery Control Plane**

    KubeVela natively supports rich continuous delivery policies in various multi-cluster/hybrid-cloud scenarios or mixed environments, it supports cross-environment promotion as well. It can enhance the CI/CD pipeline by serving as unified control plane, while it is also capable of leveraging GitOps to automate continuous delivery process in the style of IaC.


## KubeVela vs. Other Software

### KubeVela vs. CI/CD (GitHub Actions, GitLab, CircleCI, Jenkins, etc.)

KubeVela is a continuous delivery platform that works at downstream of your CI process. So you will reuse the CI process you already adopted, and KubeVela will take over CD process by empowering it with modern application delivery best practices, such as hybrid/multi-cloud promotion workflow, unified cloud resource provision/binding, and much more. KubeVela is fully declarative by design, it natively supports GitOps if you want.

> Feel free to check the [Integrating with Jenkins](./tutorials/jenkins) or [GitOps](./case-studies/gitops) documentation for more details.

### KubeVela vs. GitOps (ArgoCD, FluxCD, etc.)

KubeVela does not replace your GitOps process: it improves it by adding a unified control plane on top of it.

* KubeVela can provide cross-environment promotion for your multi-cluster/hybrid-cloud applications, it adopts major of your existing tools for the underlying GitOps driver.
* KubeVela has a user-friendly delivery model that _reduces any lock-in_, you can change any underlying tools without rewriting all your application.


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
