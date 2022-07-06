---
title: Introduction
slug: /
---

## What is KubeVela?

KubeVela is a modern software delivery control plane. The goal is to make deploying and operating applications across today's hybrid, multi-cloud environments easier, faster and more reliable.

![](../resources/what-is-kubevela.png)


## Key Features

* **Deployment as Code**

    Declare your deployment plan as workflow, run it automatically with any CI/CD or GitOps system, extend or re-program the workflow steps with CUE. No add-hoc scripts, no dirty glue code, just deploy. The deployment workflow in KubeVela is powered by [Open Application Model](https://oam.dev/).

* **Built-in security and compliance building blocks**

    Choose from the wide range of LDAP integrations we provided out-of-box, enjoy multi-cluster authorization that is fully automated, pick and apply fine-grained RBAC modules and customize them per your own supply chain requirements.
    
* **Multi-cloud/hybrid-environments app delivery as first-class citizen**

    Progressive rollout across test/staging/production environments, automatic canary, blue-green and continuous verification, rich placement strategy across clusters and clouds, fully managed cloud environments provision.


## KubeVela vs. Other Software

### KubeVela vs. CI/CD (GitHub Actions, GitLab, CircleCI, Jenkins, etc.)

KubeVela is a continuous delivery platform that works at downstream of your CI process. So you will reuse the CI process you already adopted, and KubeVela will take over CD process by empowering it with modern application delivery best practices, such as declarative deployment plan as workflow, hybrid/multi-cloud resource provision/binding, security and compliance, and much more. It natively supports GitOps if you want.

> Feel free to check the [Integrating with Jenkins](./tutorials/jenkins) or [GitOps](./case-studies/gitops) documentation for more details.

### KubeVela vs. GitOps (ArgoCD, FluxCD, etc.)

KubeVela adopts your GitOps process and improves it by adding multi-cluster/hybrid-cloud capabilities:

* KubeVela has a user-friendly workflow that allows you to extend, re-program or share any of your delivery process, including security and compliance flows. 
* KubeVela regards multi-cloud/hybrid-environments app delivery as first-class citizen, it provides rich deployment strategies across clusters and clouds with fully managed cloud environments provision.

### KubeVela vs. PaaS (Heroku, Cloud Foundry, etc.)

KubeVela shares the same goal with the traditional PaaS to provide full application deployment and management capabilities and aim to improve developer experience and efficiency.

Though the biggest difference lies in **flexibility**. KubeVela is fully programmable, all of its deployment workflow and component feature set are LEGO-style CUE modules and can be extended or removed in-place when your needs change. As a CD control plane, KubeVela allow you to take full control over your infrastructure and tooling.

### KubeVela vs. Helm 

Helm is a package manager for Kubernetes that provides package, install, and upgrade a set of YAML files for Kubernetes as a unit. 

KubeVela as a modern software delivery control plane can naturally deploy Helm charts. For example, you could use KubeVela to define an application that is composed by a WordPress chart and a AWS RDS Terraform module, orchestrate the components' topology, and then deploy them to multiple environments following certain strategy.

Of course, KubeVela also supports other encapsulation formats including Kustomize etc.


### KubeVela vs. Kubernetes

KubeVela is a modern application delivery system built with cloud native stack. It leverages [Open Application Model](https://github.com/oam-dev/spec) and Kubernetes as control plane to resolve a hard problem - making shipping applications enjoyable.


Welcome onboard and sail Vela!


## What's Next

- Start to [install KubeVela](./install).
- Learn [Core Concepts](./getting-started/core-concept) to know more about how it works.