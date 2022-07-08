---
title: Developer Overview
---

The developer guide including two parts:

1. The first part is [extension guide](#extension-guide) that introduces how to extend KubeVela, you are also very welcome to contribute your extension to the community.
2. The second part is [contribution guide](#contribution-guide) that introduces how to participate and contribute to the community.

## Extension Guide

This part is a guide to help you extend capabilities for KubeVela. Make sure you have already understand the [**core concepts**](../getting-started/core-concept) before you start.

### Extend Addons

Building or installing addons is the most important way to extend KubeVela, there's a growing [catalog](https://github.com/kubevela/catalog) of addons you can choose for installation. You can also share your platform extension by KubeVela addon registry.

* [Build Your Own Addon](../platform-engineers/addon/intro).
* [Build Your Addon Registry](../platform-engineers/addon/addon-registry).
* [Extend Cloud Resources by Addon](../platform-engineers/addon/terraform).

### Learn CUE to extend more powerful features

KubeVela use CUE as it's core engine, and you can use CUE and CRD controller to glue almost every infrastructure capabilities.
As a result, you can extend more powerful features for your platform.

- Start to [Learn CUE in KubeVela](../platform-engineers/cue/basic).
- Learn what is [CRD Controller](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) in Kubernetes.

## Contribution Guide

KubeVela project is initialized and maintained by the cloud native community since day 0 with [bootstrapping contributors from 8+ different organizations](https://github.com/kubevela/community/blob/main/OWNERS.md#bootstrap-contributors). We intend for KubeVela to have an open governance since the very beginning and donate the project to neutral foundation as soon as it's released. 

To help us create a safe and positive community experience for all, we require all participants adhere to the CNCF Community [Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md).

This part is a guide to help you through the process of contributing to KubeVela.

### Become a contributor

You can contribute to KubeVela in several ways including code and non-code contributions,
we appreciate every effort you contribute to the community. Here are some examples:

* Contribute to the codebase and docs.
* Report and triage issues.
* Organize meetups and user groups in your local area.
* Help others by answering questions about KubeVela.

### Non-code contribution

The Apache way says "Community Over Code". Although KubeVela is a CNCF/Linux project, we possess a strong resonance to it. To second and stretch this merit deeper, we regard non-coding contribution as equally important with code contribution for the community's very existence and its future growth.

- Refer to [Non-code Contribution Guide](./non-code-contribute) to know how you could help.

### Code contribution

Unsure where to begin contributing to KubeVela codebase? Start by browsing issues labeled `good first issue` or `help wanted`.

- [Good first issue](https://github.com/kubevela/kubevela/labels/good%20first%20issue) issues are generally straightforward to complete.
- [Help wanted](https://github.com/kubevela/kubevela/labels/help%20wanted) issues are problems we would like the community to help us with regardless of complexity.
- Refer to [Code Contribution Guide](./code-contribute) for more details.

Learn the [Release Process And Cadence](./release-process) to know when your code changes will be released.

### Become a community member

If you're interested to become a community member or learn more about the governance, please check the [community membership](https://github.com/kubevela/community/blob/main/community-membership.md) for details.

### Contribute to other community projects

* [VelaUX Developer Guide](https://github.com/kubevela/velaux/blob/main/CONTRIBUTING.md)
* [Terraform Controller Developer Guide](https://github.com/oam-dev/terraform-controller/blob/master/CONTRIBUTING.md)

Enjoy coding and collaboration in OSS world!
