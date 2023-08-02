---
title: Terraform-ec
---

This addon contains Terraform provider for Elastic Cloud.

## About Elastic Cloud

Elastic provides flexible search, monitoring, and security solutions based on Elasticsearch.

About the Elastic Stack:

* Elasticsearch is the distributed search and analytics engine that provides a unified data store for solutions built on the Elastic Stack.

* Elastic Agent, Beats, and Logstash facilitate collecting, aggregating, and enriching your data and storing it in Elasticsearch.

* Kibana provides access to the Elastic Observability, Security, and Enterprise Search solutions, enables you to interactively explore, visualize, and share insights into your data.

Together, they form the Elastic Stack and provide powerful search, analysis, and monitoring capabilities for all types of data.

The Elastic Stack can be deployed on cloud, with marketplace support for Amazon Web Services, Google Cloud, and Microsoft Azure, or you can take the on-premises option and manage everything yourself.

The Elastic Cloud Terraform provider allows you to provision Elastic Cloud deployments on any Elastic Cloud platform, whether it’s Elasticsearch Service or Elastic Cloud Enterprise. The provider lets you manage Elastic Cloud deployments as code, and introduce DevOps-driven methodologies to manage and deploy the Elastic Stack and solutions.

Find more information in [Elastic Docs](https://www.elastic.co/guide) and [Terraform Elastic Cloud Provider](https://registry.terraform.io/providers/elastic/ec/latest/docs).


## Addon usage

### Enable addon and authenticate provider

To provision Elastic Cloud resources, you should enable Terraform addon.

```shell
vela addon enable terraform
```
Then, enable Terraform provider addon for Elastic Cloud.

```shell
vela addon enable terraform-ec
```

You can also disable, upgrade, and check the status of an addon by `vela addon` command.

After that, you can create credentials for the provider. Refer to the following command:

```shell
vela config create <Name> -t terraform-ec EC_API_KEY=<KEY>
```

## Find supported components

All supported Terraform cloud resources can be seen in the [list](https://kubevela.net/docs/end-user/components/cloud-services/cloud-resources-list). You can also filter them by command `vela components --label type=terraform`.

To check the specification of one cloud resource, use `vela show <component-type-name>`. Or just per the [official doc](https://kubevela.net/docs/end-user/components/cloud-services/cloud-resources-list).

Then, you can provision and consume the cloud resource by [creating an application](https://kubevela.net/docs/tutorials/consume-cloud-services#provision-by-creating-application).

If the provided cloud resources did't cover your needs, you can still customize the cloud resources with the flexible Terraform components. Find more information in [Extend Cloud Resources](https://kubevela.net/docs/platform-engineers/components/component-terraform). You are also encouraged to contribute the extended cloud resources to community.
