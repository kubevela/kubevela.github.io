---
title: "About Kubevela Kubecon Session: Component Contributor Architecture: Democratizing Platform Engineering With CNCF Projects"
author: Jerome Guionent
author_title: KubeVela Contributor
author_url: https://github.com/jguionnet
author_image_url: https://avatars.githubusercontent.com/u/77758298?v=4
tags: [ KubeVela, Crossplane, Guidewire, CNCF]
description: "This article describes how Guidewire is scaling platform innovation: how Guidewire built a contributor model for KubeVela."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

# Scaling Platform Innovation: How We Built a Contributor Model for KubeVela and OAM

At Guidewire, our cloud platform journey led us to a critical inflection point: how do you scale platform capabilities when your central platform team can't possibly build everything your organization needs? The answer became our OAM contributor model—a framework that empowers developers across the organization to extend platform capabilities while maintaining security, governance, and operational excellence.

## The Challenge: Balancing Innovation with Control

As our Kubernetes-based platform matured, we faced a common platform engineering challenge. Application teams needed access to AWS services and infrastructure capabilities faster than our central platform team could deliver them. Meanwhile, we couldn't simply grant broad cluster access without compromising security and stability.

Traditional Kubernetes RBAC offered two extremes: cluster administrators with sweeping permissions, or developers constrained to their namespaces. Neither fit the needs of teams who wanted to contribute new platform components built with KubeVela and Crossplane.

## Introducing the OAM Contributor Model

The OAM contributor model transforms how we extend our platform. It empowers engineering teams—we call them Component Contributors—to create, maintain, and support modular platform components (Component Definitions) that expose new capabilities to the broader development community.

These components leverage the Open Application Model and KubeVela to abstract complex infrastructure into developer-friendly interfaces. A team that needs AWS OpenSearch, for example, can now build and maintain that component themselves, making it available to everyone while the platform team focuses on foundational services.

## Defining Clear Responsibilities

Success required clarity about who owns what. Component Contributors take on comprehensive ownership:

**Technical Ownership**
- Security configuration including IAM roles and policies
- AWS service quotas and cost governance alignment
- Component versioning, upgrades, and deprecation lifecycle
- Automated testing and quality assurance

**Interface Design**
- Well-defined contracts using Crossplane XRD and OpenAPI specifications
- Sensible defaults and best practices documentation
- Clear examples and getting-started guides

**Operational Excellence**
- Training and documentation for support teams
- Automation of day-one deployment and day-two operations
- On-call support for components they own
- Serving as the technical liaison with AWS for their service domain

Meanwhile, the platform team maintains the foundation: secure development environments, component review processes, governance compliance checks, and promotion pipelines across environments.

## Solving the Permissions Challenge

The hardest technical challenge was designing appropriate access controls. Contributors needed to work with cluster-scoped resources like Crossplane Compositions and KubeVela ComponentDefinitions, but shouldn't have unrestricted cluster admin access.

We introduced a specialized `ComponentDeveloper` role with precisely scoped permissions:

- Read/write access to OAM and Crossplane resources needed for component development
- Policy enforcement preventing modifications to sensitive resources (AWS IAM, Kubernetes RBAC)
- Restrictions ensuring contributors only modify resources owned by their team
- Full visibility into providers, composite resources, and managed resources for debugging

This role is enforced through Kubernetes RBAC combined with policy engines, creating a security boundary that enables autonomy without compromising safety.

## Building for Scale

Recent improvements have focused on making the contributor experience seamless:

**Decoupled Release Cycles**
Component deployment is now independent from platform releases. Contributors can release and promote their components through development, staging, and production on their own timeline, with robust versioning and rollback capabilities.

**Enhanced Debugging**
Contributors now have visibility into the full resource hierarchy in non-production clusters—from high-level Component Definitions down through Crossplane Compositions to individual managed resources—making troubleshooting significantly faster.

**Streamlined Onboarding**
We've structured the onboarding process with future automation in mind, creating clear approval workflows and self-service documentation that reduces time-to-first-component.

## Lessons Learned

Building this model taught us several valuable lessons:

1. **Clear contracts matter more than perfect automation** - Well-defined responsibilities and interfaces enabled collaboration even before we had full automation in place.

2. **Security boundaries enable innovation** - The right RBAC model turned "we can't give you access" into "here's how you can safely do this yourself."

3. **Ownership drives quality** - When teams own the full lifecycle of their components, they invest in better documentation, testing, and operational excellence.

4. **Shared responsibility requires shared understanding** - Regular communication between contributors and the platform team ensures alignment on standards and practices.

## The Path Forward

The OAM contributor model has fundamentally changed how we scale platform capabilities at Guidewire. Instead of a central team bottleneck, we now have a growing community of contributors who extend the platform to meet their team's needs while maintaining our standards for security and reliability.

For organizations building internal developer platforms on Kubernetes, KubeVela, and Crossplane, we've found that empowering distributed contribution isn't just about tooling—it's about creating the right organizational model, clear responsibilities, and appropriate security boundaries.

As we continue to refine this approach, we're excited to share these learnings with the broader cloud-native community and learn from others solving similar challenges.

---

*This blog post accompanies our [KubeCon + CloudNativeCon North America 2025 session](https://sched.co/27Fb4) on building scalable platform engineering practices with KubeVela and the Open Application Model. We'd love to hear about your experiences with platform contribution models—find us in the hallway track or connect with the KubeVela community!*