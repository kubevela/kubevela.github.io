---
title: 扩展 Terraform 插件
---

[Terraform Controller](https://github.com/oam-dev/terraform-controller) 是为 KubeVela 提供部署和管理云资源的核心控制器。
它已经支持[一些云供应商](https://github.com/oam-dev/terraform-controller#supported-cloud-providers)，包括 AWS、Azure、GCP、阿里云，腾讯云，百度云等等。
但 KubeVela 只支持[部分云供应商](https://kubevela.io/docs/tutorials/consume-cloud-services#enabling-cloud-vendor-addons)的 Terraform Addons。

本指南将告诉你如何扩展 Terraform Addon 以支持你的云供应商。

## 选择一个云供应商

如果你想支持的云供应商不在 Terraform Controller 支持的云供应商之列，你必须先支持它。 如果它已经被Terraform Controller支持，你可以继续扩展该插件。

## 为云提供商准备 metadata

- 克隆 oam-dev/catalog

```bash
$ git clone https://github.com/kubevela/catalog.git
```

- 准备 metadata 文件

编辑你的云服务商的 metadata 文件 `hack/addons/terraform/terraform-provider-scaffold/metadata.yaml`。

```yaml
...

# -------------------------------------Configuration Metadata for a Terraform Addon-------------------------------------
# provider short name
shortCloudName: tencent

# The Cloud name of the provider
completeCloudName: Tencent Cloud

# When enabling a Terraform provider, these properties need to set for authentication. For Tencent Cloud,
# name: Environment variable name when authenticating Terraform, like https://github.com/oam-dev/terraform-controller/blob/master/controllers/provider/credentials.go#L59
# secretKey: Secret key when storing authentication information in a Kubernetes, like https://github.com/oam-dev/terraform-controller/blob/master/controllers/provider/credentials.go#L109.
cloudProperties:
  - name: TENCENTCLOUD_SECRET_ID
    secretKey: secretID
    description: Get TENCENTCLOUD_SECRET_ID per this guide https://cloud.tencent.com/document/product/1213/67093
  - name: TENCENTCLOUD_SECRET_KEY
    secretKey: secretKey
    description: Get TENCENTCLOUD_SECRET_KEY per this guide https://cloud.tencent.com/document/product/1213/67093
    # If one property is region, please set `isRegion` to true
  - name: TENCENTCLOUD_REGION
    description: Get TENCENTCLOUD_REGION by picking one RegionId from Tencent Cloud region list https://cloud.tencent.com/document/api/1140/40509#.E5.9C.B0.E5.9F.9F.E5.88.97.E8.A1.A8
    isRegion: true
```

## 生成 Terraform Addon

为你的云服务商生成一个 Terraform 插件。生成的插件代码将存储在 `addons/terraform-tencent`。

```shell
$ make terraform-addon-gen
go run hack/addons/terraform/gen.go hack/addons/terraform/provider-sample.yaml
Generating addon for provider tencent in addons/terraform-tencent
Rendering hack/addons/terraform/terraform-provider-skaffold/metadata.yaml
Rendering hack/addons/terraform/terraform-provider-skaffold/readme.md
Rendering hack/addons/terraform/terraform-provider-skaffold/resources/account-creds.cue
Rendering hack/addons/terraform/terraform-provider-skaffold/resources/parameter.cue
Rendering hack/addons/terraform/terraform-provider-skaffold/resources/provider.cue
Rendering hack/addons/terraform/terraform-provider-skaffold/template.yaml

$ ls addons/terraform-tencent
definitions   metadata.yaml readme.md     resources     template.yaml
```

## 验证 Terraform 插件

启用该插件 检查是否创建了名称与你的云提供商相同的 `Provider`。

```shell
$ vela addon enable ./addons/terraform-tencent TENCENTCLOUD_SECRET_ID=xxx TENCENTCLOUD_SECRET_KEY=yyy TENCENTCLOUD_REGION=ap-chengdu
I0207 10:15:14.005269   32481 apply.go:106] "patching object" name="addon-terraform-tencent" resource="core.oam.dev/v1beta1, Kind=Application"
I0207 10:15:14.138645   32481 apply.go:106] "patching object" name="addon-secret-terraform-tencent" resource="/v1, Kind=Secret"
Addon: terraform-tencent enabled Successfully.

$ kubectl get provider
NAME      STATE   AGE
tencent   ready   1d
```

我们鼓励你通过[部署云资源](../../tutorials/consume-cloud-services)进一步验证提供商。

## 提交 Terraform 插件

提交 `./addons` 中生成的代码，并创建一个 pull request。

## 贡献官网文档

为你的云供应商编写[Terraform Addon启用文档](../../reference/addons/terraform)，并将其添加到[所有支持的云供应商](../../tutorials/consume-cloud-services#enabling-cloud-vendor-addons)。
