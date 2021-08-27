---
title: Terraform Component
---

To enable the ability to provision cloud resources by Terraform, the credential for a cloud provider needs to be applied.


### Apply the credential for a Cloud Provider

Taking Alibaba Cloud as an example, for other cloud providers, please refer to [Terraform controller getting started](https://github.com/oam-dev/terraform-controller/blob/master/getting-started.md).

```shell
$ export ALICLOUD_ACCESS_KEY=xxx; export ALICLOUD_SECRET_KEY=yyy
```

If you'd like to use Alicloud Security Token Service, also export `ALICLOUD_SECURITY_TOKEN`.
```shell
$ export ALICLOUD_SECURITY_TOKEN=zzz
```

```
$ sh https://raw.githubusercontent.com/oam-dev/terraform-controller/master/hack/prepare-alibaba-credentials.sh

$ kubectl get secret -n vela-system
NAME                                              TYPE                                  DATA   AGE
alibaba-account-creds                             Opaque                                1      11s

$ kubectl apply -f https://raw.githubusercontent.com/oam-dev/terraform-controller/master/examples/alibaba/provider.yaml
provider.terraform.core.oam.dev/default created
```