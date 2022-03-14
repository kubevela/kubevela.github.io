---
title: Annotations
---

You can add these Kubernetes annotations to the Application to customize behaviors.

| Name                                                 | type   |
| ---------------------------------------------------- | ------ |
| [app.oam.dev/service-account-name](#service-account) | string |

### Service Account

The `app.oam.dev/service-account-name` annotation allows you to specify the ServiceAccount to use to apply Components and run Workflow.
Setting this to the specific ServiceAccount name will prevent the Application to use the controller service account when applying Components and running Workflow.
This is useful in the soft-multitenancy model such as [Namespaces as a Service](https://kubernetes.io/blog/2021/04/15/three-tenancy-models-for-kubernetes/#namespaces-as-a-service).

If not defined (default), KubeVela will apply Components and run Workflow with the controller service account.
