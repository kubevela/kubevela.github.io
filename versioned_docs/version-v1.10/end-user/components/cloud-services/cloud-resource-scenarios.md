---
title: Overview of Terraform
description: This section introduces some scenarios of cloud resources management
---

Here're the scenarios KubeVela already supported by Using Terraform.

## Before Starting

- Make sure you have [terraform addon](../../../reference/addons/terraform.md) enabled.
  ```
  vela addon enable terraform
  ```

:::tip
When you're using a specific cloud, you should also enable the corresponding cloud provider addon to make the component types exist.  
:::

## Provision ECS

- [Provision ECS with EIP for proxy Intranet Service](/blog/2022/06/27/terraform-integrate-with-vela#part-2-fixing-the-developer-experience-of-kubernetes-port-forwarding).

## Provision and use databases

- [Provision and Binding Cloud Resources](./provision-and-consume-database.md).
- [Secure your Database Connection](./secure-your-database-connection.md).
- [Provision an RDS instance with more than one database](./provision-an-RDS-instance-with-more-than-one-database.md).
- [Provision a Database and Import a SQL File for initialization](./provision-and-initiate-database.md).
- [Provision Instance and Database separately](./provision-instance-and-database-separately.md).

