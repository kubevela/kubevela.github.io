---
title: "LFX Mentorship: Meeting with the KubeVela Community in Open Source"
author: Junyu Liu
author_title: KubeVela Contributor
author_url: https://github.com/iyear
author_image_url: https://avatars.githubusercontent.com/u/61452000
tags: [ KubeVela, LFX, Mentorship, CNCF, CUE, Generator]
description: "This article describes the experience of participating in the LFX Mentorship program and contributing to the KubeVela community."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

Hello, I am Junyu Liu (GitHub: iyear), currently a sophomore majoring in software engineering. In this blog post, I will share my experiences as a Linux Foundation Mentorship mentee: from applying for the project to becoming part of the community.

In the spring of 2023, I was accepted as a CNCF student under the KubeVela project through LFX Mentorship. In this project, I am responsible for developing a CUE code and documentation generator based on Golang from scratch, laying the foundation for the infrastructure part of KubeVela's future extensibility.

## What is LFX Mentorship?

![LFX Mentorship](/img/blog/lfx-cue-generator/lfx-mentorship.svg)

[LFX Mentorship](https://lfx.linuxfoundation.org/tools/mentorship) is a remote learning program that provides 12 weeks of learning opportunities for open source contributors. It is led by specific mentors (usually the maintainers of the projects) who help mentees contribute to the community and projects.

Many open-source organizations or foundations use LFX Mentorship to announce projects and recruit students for development and contributions. I focused on the cloud-native and noticed that CNCF started its spring projects on LFX in February 2023. I began to explore and apply for projects that interested me.

## What is KubeVela?

![KubeVela](/img/blog/lfx-cue-generator/kubevela-logo.png)

[KubeVela](https://kubevela.io/) is a modern software delivery and management control plane. The goal is to make deploying and operating applications across today's hybrid, multi-cloud environments easier, faster and more reliable.

KubeVela originated from the Open Application Model (OAM) model based on Kubernetes, jointly launched by Alibaba Cloud and Microsoft at the end of 2019. Through continuous evolution and iteration, it has incorporated a large amount of feedback and contributions from the open-source community (especially participants from Microsoft, ByteDance, 4Paradigm, Tencent, and Full Truck Alliance). In 2020, it officially met the open-source community under the name "KubeVela" at KubeCon North America.

The KubeVela project has been developing rapidly, and its community growth trend is as follows:
![KubeVela Community](/img/blog/lfx-cue-generator/kubevela-community.png)

It is worth mentioning that in March, KubeVela was promoted to a CNCF incubation project, further proving the stability and flexibility of KubeVela in production environments.

## Project Details

**Project Name:** Support auto generation of CUE schema and docs from Go struct

**Project Description:** In KubeVela's provider system, we can use our defined Go functions in CUE schema. The Go providers usually have a parameter and return. Fields in Go providers are the same as fields in CUE schema, so it is possible and important to support automatic generation of CUE schemas and documents from Go structs.

Project Outcome: Auto-generators of CUE schemas and docs from Go structs, the capabilities should be wrapped in vela cli command.

Project Mentors: [Fog Dong](https://github.com/FogDong), [Da Yin](https://github.com/Somefive)

Project Link: https://mentorship.lfx.linuxfoundation.org/project/85f61cae-02d7-4931-8d87-d3da3128060e


## Application and Development

When browsing through the project list, KubeVela quickly became one of my candidates. Before diving into the cloud-native, I had come across the KubeVela project and attempted to understand its concepts and working principles, but due to my limited expertise, I only scratched the surface. This time, if I could familiarize myself with KubeVela through a small entry point, it would be the best contribution path. Additionally, metaprogramming and code generation are important techniques in Golang, and I also wanted to participate in this project as an opportunity for practical experience.

The project involves the core part of KubeVela: [CUE](https://cuelang.org/). This is the first concept I needed to understand. Through the [KubeVela official documentation](https://kubevela.io/zh/docs/platform-engineers/cue/basic) and [CUE Issues](https://github.com/cue-lang/cue/issues?q=is%3Aopen+is%3Aissue+label%3Ax%2Fuser%2FKubeVela), I realized that CUE is a language designed for configuration, with advantages compared to other languages in terms of programmability, automation, and integration with Golang. On the other hand, as KubeVela evolves, it continuously provides practical use cases and feedback for CUE.

After contacting the mentor, my initial goal was to create a demo as a showcase. The core part of the entire project lies in the conversion between Golang AST and CUE AST. I first found a snippet of [code](https://github.com/cue-lang/cue/blob/master/cmd/cue/cmd/get_go.go) that I could learn from. After thoroughly understanding it, I extracted the core parts, made modifications and adaptations, and implemented the struct conversion for the demo.
![DEMO](/img/blog/lfx-cue-generator/kubevela-demo.png)

By writing the demo, I gained a clearer understanding of the overall project targets. As the top-level language for users and platform developers, CUE needs to interact with Golang extensively, serving as an intermediary to connect and control cloud platforms. In many scenarios, CUE needs to maintain consistency with Golang code, or else there may be errors in the intermediate conversion. This process is time-consuming, labor-intensive and issues are only exposed at runtime, which can potentially impact the stability of production environments. The aim of this project is to solve this problem, making Golang code the single source of truth and ensuring overall configuration consistency through static code generation.

In the [project description issue](https://github.com/kubevela/kubevela/issues/5364), the mentor provided an example of generating providers. Everything became clear: I divided the CUE Generator into three layers. The bottom layer is responsible for basic and core AST conversions. The middle layer reads specific Golang code, such as providers, policies, etc. , extracts information from the Golang code, and writes it into CUE files. The top layer exposes the generation capability as a CLI to users and developers, allowing them to quickly generate CUE and documentation. When supporting more different formats of CUE in the future, the underlying transformation capabilities can be easily reused.

After further communication with the mentor, I added support for struct tags and comments and summarized some ideas into the proposal. After a series of iterations and discussions, the project has taken shape, and I am honored to have been accepted as a mentee in the LFX Mentorship program.

![Acceptance](/img/blog/lfx-cue-generator/kubevela-accept.png)

Following the initial design and demo, the formal development process went relatively smoothly, with most of the communication focused on user experience and detailed design.

The first pull request (PR) received valuable reviews as it was not split into smaller parts, and it took 50 comments before it was finally merged. Since the initial code was written in a casual manner, I also focused on refactoring parts of the code to make it more clear and robust.

From the first PR in February to the fifteenth PR at the end of May, the project is essentially complete, and all the code has been merged into the main branch. It has also passed two mentor evaluations, and I am about to graduate from the first project of LFX Mentorship program.👏

![End-Term Evaluation](/img/blog/lfx-cue-generator/kubevela-end-term.png)

## Project Outcomes

Over the past three months of development, the project has primarily produced three capabilities and two CLIs, with test coverage exceeding 90%.

The core capabilities of the project are located in the [references/cuegen](https://github.com/kubevela/kubevela/tree/master/references/cuegen) directory. It implements the basic functionality of converting Go AST to CUE AST and is accompanied by a README to provide developers with specific conversion rules. The code for the middle layer is placed in the [references/cuegen/generators](https://github.com/kubevela/kubevela/tree/master/references/cuegen/generators) directory, and generators for the provider format have been implemented so far. The documentation generation component is located in [references/docgen/provider.go](https://github.com/kubevela/kubevela/blob/master/references/docgen/provider.go).

The project has added two CLI subcommands, namely [vela def gen-cue](https://github.com/kubevela/kubevela/blob/master/references/cli/def.go#L1153) and [vela def gen-doc](https://github.com/kubevela/kubevela/blob/master/references/cli/def.go#L1205). The former generates CUE files in the corresponding format from Go code, exposing the capabilities of the middle layer as a CLI, while the latter generates documentation for CUE.

Since `vela def gen-cue` only supports one file at a time, a shell script was written to enable batch generation by traversing directories: [#6009](https://github.com/kubevela/kubevela/pull/6009)

Taking the code snippet from [kubevela/pkg/providers/kube](https://github.com/kubevela/pkg/blob/main/cue/cuex/providers/kube/kube.go) as an example, let's perform the transformation and verification.

First, convert `kube.go` to `kube.cue`:

```shell
$ vela def gen-cue \
	-t provider \
	--types *k8s.io/apimachinery/pkg/apis/meta/v1/unstructured.Unstructured=ellipsis \
	--types *k8s.io/apimachinery/pkg/apis/meta/v1/unstructured.UnstructuredList=ellipsis \
	kube.go > kube.cue
```

Then, convert `kube.cue` to `kube.md`:

```shell
$ vela def gen-doc -t provider kube.cue > kube.md
```

The final result is as follows:

![Final Generated Result](/img/blog/lfx-cue-generator/kubevela-kube.png)
## Future Outlook

Although the expected outcomes of LFX Mentorship have been fully achieved, it is only the first step for cuegen, and its derivative work will also play an important role in the future development of KubeVela. For example, based on cuegen, we can automate the generation of policy rules that are currently manually maintained. We can migrate and validate the existing providers in [kubevela/pkg](https://github.com/kubevela/pkg/tree/main/cue/cuex/providers). We can also develop scaffolding tools for user-defined providers, all of which rely on the capabilities of cuegen. These will be the key areas of my future work in the community.

In addition to the related work in the cuegen ecosystem, I will also delve into other aspects of KubeVela, such as gaining in-depth familiarity with OAM production practices and the user community, and exploring the possibilities of new features by reading the source code of Workflow component. I have also initiated an application to become a KubeVela Reviewer, aiming to contribute to the project's code quality control.

This is my first participation in the LFX Mentorship program, and throughout the three months of communication and collaboration, both mentors have provided me with a lot of help and guidance in terms of details and decision-making. We also conducted a complete demonstration of the functionality and discussed the future direction of the community through online meetings.

Open source is a process driven by interests and self-motivation. Developers can continuously improve themselves through their experiences in different communities and grow together with the community. Open source is about taking the first step with courage and trying to read the source code of projects that interest you. For students, participation in open source is primarily a learning process, and each step brings different rewards and insights. I am very grateful to have encountered the KubeVela community through LFX Mentorship, and I look forward to further deepening my involvement and contributions to the community in the future!
