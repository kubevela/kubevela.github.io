---
title: 云服务
---

对云资源的集成需求往往是最频繁出现，比如你可能希望数据库、中间件等服务使用阿里云、AWS 等云厂商的，以获得生产级别的可用性并免去运维的麻烦。Terraform 是目前业内支持云资源最广泛也最受欢迎的组件，KubeVela 对 Terraform 进行了额外的支持，使得我们可以通过 Kubernetes CRD 的方式配合 Terraform 使用任意的云资源。

目前，需要你的平台管理员阅读[Terraform 组件](../../platform-engineers/components/component-terraform)后，进行开发然后部署为内置组件提供给你。