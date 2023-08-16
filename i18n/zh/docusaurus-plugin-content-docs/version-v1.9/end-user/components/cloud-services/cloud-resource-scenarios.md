---
title: Terraform 云资源概览
description: 该部分介绍云资源管理的一些场景
---

本节将介绍如何基于 KubeVela 和 terraform 扩展云资源能力，以及以及在社区支持的部分云厂商和资源。

## 开始之前

- 确定你已经启用了 [terraform 插件](../../../reference/addons/terraform.md) 。
  ```
  vela addon enable terraform
  ```

:::tip
当你使用具体某个云厂商的资源时，你还要启用对应的厂商 provider 插件。具体可以参考[terraform 插件](../../../reference/addons/terraform.md) 文档了解详情。
:::

## Provision ECS

- [创建 ECS 资源并结合 EIP 搭建一个内网穿透服务示例](/blog/2022/06/27/terraform-integrate-with-vela#part-2-fixing-the-developer-experience-of-kubernetes-port-forwarding).

## 部署和使用数据库

- [创建和使用云资源](./provision-and-consume-database.md)
- [安全访问数据库](./secure-your-database-connection.md)
- [RDS 实例创建多数据库](./provision-an-RDS-instance-with-more-than-one-database.md)
- [数据库创建和初始化](./provision-and-initiate-database.md)
- [创建一个数据库示例并被不同应用共享](./provision-instance-and-database-separately.md).
