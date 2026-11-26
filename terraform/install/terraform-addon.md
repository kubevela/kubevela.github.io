---
title: Terraform
---

To provision cloud resources, you can use terraform along with related cloud provider addons.

## Enable Terraform addon

```shell
vela addon enable terraform
```

KubeVela can now run Terraform through the Terraform controller. Next, enable a provider addon for your cloud.

## Enable Terraform Provider addon

KubeVela can support the following cloud providers by enabling the Terraform provider addons.

```shell
vela addon list | grep terraform-
```

The output looks like this:

```console
terraform-alibaba  KubeVela  Kubernetes Terraform Controller for Alibaba Cloud                  [1.0.6, ...]  disabled
terraform-aws      KubeVela  Kubernetes Terraform Controller for AWS                            [1.0.3, ...]  disabled
terraform-azure    KubeVela  Kubernetes Terraform Controller for Azure                          [1.0.3, ...]  disabled
terraform-baidu    KubeVela  Kubernetes Terraform Controller Provider for Baidu Cloud           [1.0.3, ...]  disabled
terraform-ec       KubeVela  Kubernetes Terraform Controller Provider for Elastic Cloud         [1.0.2, ...]  disabled
terraform-gcp      KubeVela  Kubernetes Terraform Controller Provider for Google Cloud Platform [1.0.3, ...]  disabled
terraform-tencent  KubeVela  Kubernetes Terraform Controller Provider for Tencent Cloud         [1.0.4, ...]  disabled
terraform-ucloud   KubeVela  Kubernetes Terraform Controller Provider for UCloud                [1.0.3, ...]  disabled
```

To enable one of them, use the following command:

```shell
vela addon enable terraform-<provider-name>
```

You can also disable, upgrade, and check the status of an addon by command `vela addon`.

### Authenticate a Terraform provider

View the supported Terraform providers.

```shell
vela config-template list | grep terraform
```

For example to create a provider config for AWS.

```shell
vela config create aws -t terraform-aws AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy AWS_DEFAULT_REGION=us-east-1
```

### Provision cloud resources

After a Terraform provider is authenticated, you can [provision and/or consume cloud resources](../../tutorials/consume-cloud-services.md).
