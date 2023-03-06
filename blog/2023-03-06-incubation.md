---
title: "KubeVela brings software delivery control plane capabilities to CNCF Incubator"
author: CNCF
author_title: CNCF
author_url: https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/
author_image_url: https://avatars.githubusercontent.com/u/13455738
tags: [ KubeVela, CNCF, Incubation ]
description: "This article introduces how KubeVela brings software delivery control plane capabilities to CNCF Incubator"
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

> Originally post in [CNCF](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/).

The CNCF Technical Oversight Committee (TOC) has voted to accept KubeVela as a CNCF incubating project. 

[KubeVela](https://kubevela.io/) is an application delivery engine built with the Kubernetes control plane that makes deploying and operating applications across hybrid and multi-cloud environments easier, faster, and more reliable. KubeVela can orchestrate, deploy, and operate application components and cloud resources with a workflow-based application delivery model. The application delivery abstraction of KubeVela is powered by the [Open Application Model (OAM)](https://oam.dev/).

![image.png](/img/what-is-kubevela.png)

The KubeVela project evolved from [oam-kubernetes-runtime](https://github.com/crossplane/oam-kubernetes-runtime) and developed with [bootstrap contributions](https://github.com/kubevela/community/blob/main/OWNERS.md#bootstrap-contributors) from more than eight different organizations, including Alibaba Cloud, Microsoft, Upbound and more. It was publicly announced as an open source project in November 2020, released as v1.0 in April 2021, and accepted as a CNCF sandbox project in June 2021. The project has more than [260 contributors](https://kubevela.devstats.cncf.io/d/22/prs-authors-table?orgId=1) and committers across multiple continents from organizations like Didi, JD.com, JiHu GitLab, SHEIN, and more.

“KubeVela pioneered a path for delivering applications across multi-cloud/multi-cluster environments with unified yet extensible abstractions,” said Lei Zhang, CNCF TOC sponsor. “This innovation unlocked the next-generation software delivery experience and filled the ‘last mile’ gap in existing practices which focus on the ‘deploy’ stage rather than ‘orchestrating’. We are excited to welcome more app-centric tools/platforms in the CNCF community and look forward to watching the adoption of KubeVela grow to a new level in the fast-growing application delivery ecosystem.”

KubeVela is used in production today by multiple companies across all major public clouds and on-premises deployments. Most users are adopting KubeVela as their internal “PaaS”, as part of their CI/CD pipeline, or as an extensible DevOps kernel for building their own IDP. Public [adopters](https://github.com/kubevela/community/blob/main/ADOPTERS.md) include Alibaba, which uses KubeVela as the core to deliver and manage applications across hybrid environments; Bytedance, which uses KubeVela and Crossplane to provide advanced Gaming PaaS abilities; China Merchants Bank, which uses KubeVela to build a hybrid cloud application platform to unify the whole process from build, ship and run; and many more.  

“We’ve found capabilities such as gateway, security, and observability are being standardized with the emergence of corresponding open source tools and cloud services,” said Fang SITU, leader of aPaaS and Serverless team at Alibaba Cloud. “These capabilities can be integrated so that developers can self-serve, easily configure, automatically trigger, and get faster feedback, thereby greatly improving the application development efficiency. KubeVela is very suitable for the integration and customization of this kind of application delivery process, and it is the best practice of Platform Engineering.”

“KubeVela enables China Merchants Bank to quickly establish a large-scale unified OAM cloud native application management platform, reducing the complexity of cloud for FinTech and accelerating the standardized development and delivery of modern applications,” said Jiahang Xu, Senior Architect at China Merchants Bank and KubeVela maintainer. “KubeVela provides an application model and programmable CRD, workflow orchestration application delivery, observability, and configuration capabilities. KubeVela empowers cloud native applications along with the CNCF ecosystem.” 

![image.png](/img/kubevela-comps.png)

**Main Components:**

* [Vela Core](https://github.com/kubevela/kubevela) is the main component of KubeVela, also known as the KubeVela Control Plane. It provides operators and webhooks for rendering, orchestrating and delivering OAM applications.
* The [Vela Workflow](https://github.com/kubevela/workflow) engine translates CUE-based steps and executes them. It’s a common library that can work as a standalone engine or run inside a KubeVela application.
* **KubeVela CLI** provides various commands that help you to operate applications, such as managing definitions, viewing resources, restarting workflow, and rolling versions.
* [VelaUX](https://github.com/kubevela/velaux) is the Web UI for KubeVela. It incorporates business logic into fundamental APIs and provides out-of-box user experiences for non-k8s-expert users.
* The [Terraform Controller](https://github.com/kubevela/terraform-controller) in KubeVela allows users to use Terraform to manage cloud resources through Kubernetes Custom Resources.
* The [Cluster Gateway](https://github.com/oam-dev/cluster-gateway) provides a unified multi-cluster access interface. 
* KubeVela also has a growing [catalog](https://github.com/kubevela/catalog) with more than 50 community add-ons for integrations, including ArgoCD, FluxCD, Backstage, OpenKruise, Dapr, Crossplane, Terraform, OpenYurt and more.

**Notable Milestones:**

* \>4.7k GitHub Stars 
* \>3.5k pull requests 
* \>1.6k issues
* \>290 contributors
* \>150 Releases

Since joining the CNCF Sandbox, KubeVela has released seven minor versions to v1.7 and added five new components, including standalone workflow, VelaUX, ClusterGateway, VelaD, and Vela Prism. The number of contributors has tripled from 90+ to 290+, GitHub stars have doubled from 1900+ to 4700+, and contributing organizations have tripled from 20+ to 70+.

“KubeVela improved the developer experience when it comes to complex multi-cloud environments with their modern open source software delivery control plane,” said Chris Aniszczyk, CNCF CTO. “We look forward to supporting the community in its growth and maturity towards a graduated project.”

Looking forward, the community plans to improve the user experience for cloud resource provisioning and consumption with delivery workflow, enhance the security for the whole CI/CD delivery process in hybrid/multi-cluster scenarios, support the KubeVela Dynamic API that allows users to make integration with third-party APIs easily, and more. Visit the [roadmap](https://kubevela.io/docs/roadmap/) to learn more.

<iframe width="720" height="480" src="https://www.youtube.com/embed/p6rB3qQ2zn4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

“We’re humbled and grateful for the trust and support from users and contributors,” said Jianbo Sun, Staff Engineer at Alibaba Cloud and KubeVela maintainer. “KubeVela’s highly extensible design is very suitable for the diverse user scenarios of the community, bringing us a powerful engine to the ecosystem for application delivery. Thanks to the support and endorsement from CNCF, I believe that reaching incubation status is an important milestone for the project. The KubeVela maintainers look forward to collaborating with CNCF in our goals to make deploying and operating applications across today’s hybrid environments easier, faster and more reliable.”

“Thanks to Kubevela, the way we deploy and manage applications in Kubernetes has now become more accessible,” Daniel Higuero, CTO at Napptive and KubeVela maintainer. “The use of Application and Workflow as top-level entities greatly simplifies common processes on top of Kubernetes. The strength of the approach lies in its ability to simplify basic use cases while enabling complex ones with multi-tenant and multi-cluster support. This is combined with an inherently extensible system which supports community add-ons, allowing it to integrate with other tools and add custom definitions to tailor the experience to your use case.” 

“The CNCF community has incubated a large number of cloud native operation and atomic management capabilities,” said  QingGuo Zeng, Technical Expert at Alibaba Cloud and KubeVela maintainer. “We hope to integrate various capabilities through a unified, application-centric concept and help more and more platform developers easily implement standardized applications in enterprises. KubeVela is growing into a powerful helper for enterprises to practice Platform Engineering.”

“KubeVela aims to provide convenience and advancements of the rich cloud native infrastructures to various industries,” said Da Yin, Senior Engineer at Alibaba Cloud and KubeVela maintainer. “To meet the modern application delivery demands, KubeVela is always exploring extensible and flexible architecture and adding pioneering ideas, including multi-cluster delivery, programmable workflow, and automated observability. KubeVela also continuously cares for the security and stability of the control plane, which builds up production confidence for community adopters. We expect the openness of KubeVela could make it a frontier explorer in the cloud native era.” 

As a CNCF-hosted project, KubeVela is part of a neutral foundation aligned with its technical interests and the larger Linux Foundation, which provides governance, marketing support, and community outreach. The project joins 35 other [incubating technologies](https://www.cncf.io/projects/), including Backstage, Cilium, Istio, Knative, OpenTelemetry, and more. For more information on maturity requirements for each level, please visit the [CNCF Graduation Criteria](https://github.com/cncf/toc/blob/main/process/graduation_criteria.md).
