---
title: Introduction
description: What the Terraform controller is, who it is for, and how KubeVela uses it to provision cloud resources.
---

[terraform-controller](https://github.com/kubevela/terraform-controller) runs Terraform from inside Kubernetes. You give it Terraform (inline HCL, or a module in a git repository) as a `Configuration` object, and it runs `terraform init` and `terraform apply` in a Job, keeps the state in the cluster, and writes the Terraform outputs into a Secret your workloads can read. Delete the `Configuration` and it runs `terraform destroy`.

It is how KubeVela provisions cloud resources: an RDS database, an OSS or S3 bucket, a VPC, a DNS zone. The resource sits in the same Application as the workload that uses it, and the connection details reach that workload as a Secret, with no hand-off between teams.

## Who it is for

| You are | You use |
| --- | --- |
| An application team on KubeVela | Cloud resource component types (`alibaba-rds`, `aws-s3`, ...) in an Application, and the Secret they write. Start with [Provision Cloud Resources](../guides/consume-cloud-services.md). |
| A platform engineer | The `terraform` addon, a provider addon per cloud, and your own component types built from Terraform modules: [Extend Cloud Resources](../extend/cloud-resource-component.md). |
| Running Terraform on Kubernetes without KubeVela | The controller's Helm chart and the `Configuration` and `Provider` objects directly. The [Quick Start](quick-start.md) does exactly that. |

## How it relates to KubeVela

```
Application ──▶ vela-core ──▶ Configuration ──▶ terraform-controller ──▶ Job: terraform init / apply
 (component       renders the   (terraform.core.      watches it                     │
  type alibaba-   component     oam.dev/v1beta2)                                     ▼
  rds, ...)                                         Provider ◀── credentials     cloud API
                                                    Secret   ◀── outputs  (writeConnectionSecretToRef)
```

- A component type whose definition has a `schematic.terraform` block is rendered by vela-core as a `Configuration`, with the component's properties as Terraform variables. See [How It Works](../concepts/how-it-works.md).
- The [`terraform` addon](install.md) installs the controller. Each provider addon (`terraform-alibaba`, `terraform-aws`, ...) adds that cloud's component types and a config template for its credentials.
- vela-core is built against the controller's Go API types, so each KubeVela release pins a controller version: the [Versions](../versions.md) page has the table.

This section follows terraform-controller as it is now (v0.9.1, which KubeVela 1.12 pins), and is not versioned with KubeVela.

## Where to next

- [Install](install.md) the controller, through the addon or the Helm chart.
- Run the [Quick Start](quick-start.md): one Terraform resource, end to end, with no cloud account.
- Pick a [guide](/terraform/guides) or a worked [example](/terraform/examples).
- [Provision ECS with an EIP to reach intranet services](/blog/2022/06/27/terraform-integrate-with-vela#part-2-fixing-the-developer-experience-of-kubernetes-port-forwarding), a walkthrough on the blog.
