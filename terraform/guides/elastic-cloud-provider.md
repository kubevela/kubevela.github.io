---
title: Terraform-ec
---

Provision [Elastic Cloud](https://www.elastic.co/guide) deployments as KubeVela components through Terraform, with the [Elastic Cloud Terraform provider](https://registry.terraform.io/providers/elastic/ec/latest/docs).

## Enable the addon

The addon needs the Terraform addon:

```shell
vela addon enable terraform
vela addon enable terraform-ec
```

## Authenticate the provider

Create the provider's credentials from an Elastic Cloud API key:

```shell
vela config create ec-provider -t terraform-ec name=ec EC_API_KEY=<KEY>
```

`name=ec` names the Terraform Provider. The addon's `elastic-ec-deployment` component type uses the Provider `ec` in the `default` namespace, so keep that name unless you set `providerRef` on your components.

## Provision a deployment

Check the component's parameters:

```shell
vela show elastic-ec-deployment
```

Then provision it by [creating an Application](../guides/consume-cloud-services.md#provision-by-creating-application). To see every Terraform component type installed, run `vela components --label type=terraform`, or read the [cloud resources list](../reference/cloud-resources-list.md).

If no component type covers what you need, write your own: see [Extend Cloud Resources](../extend/cloud-resource-component.md).
