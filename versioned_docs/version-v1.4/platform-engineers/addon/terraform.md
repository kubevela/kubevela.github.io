---
title: Extend Terraform Addon
---

[Terraform Controller](https://github.com/kubevela/terraform-controller) is the core controller to provision and manage
cloud resources for KubeVela. It has supported [some cloud providers](https://github.com/oam-dev/terraform-controller#supported-cloud-providers), including AWS, Azure, GCP, Alibaba Cloud,
Tencent Cloud, etc. But only [a few](../../end-user/components/cloud-services/cloud-resources-orchestration#enabling-a-cloud-provider-addon) has been supported as Terraform Addons in KubeVela.

This guide will show you how to extend a Terraform Addon to support your cloud provider.

## Choose a Cloud Provider

If the cloud provider you want to support is none of supported cloud providers in Terraform Controller, you have to support it first.
If it has been supported by Terraform Controller, you can continue to extend the addon.

## Prepare metadata for the Cloud Provider

- Clone oam-dev/catalog

```bash
$ git clone https://github.com/kubevela/catalog.git
```
  
- Prepare a metadata file

Edit the metadata file `hack/addons/terraform/terraform-provider-scaffold/metadata.yaml` for your cloud provider.

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

## Generate a Terraform Addon

Generate a Terraform Addon for your cloud provider. The generated addon code will be stored in `addons/terraform-tencent`.

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

## Verify the Terraform Addon

Enable the addon Check whether a `Provider` is created whose name is the same as your cloud provider.

```shell
$ vela addon enable ./addons/terraform-tencent TENCENTCLOUD_SECRET_ID=xxx TENCENTCLOUD_SECRET_KEY=yyy TENCENTCLOUD_REGION=ap-chengdu
I0207 10:15:14.005269   32481 apply.go:106] "patching object" name="addon-terraform-tencent" resource="core.oam.dev/v1beta1, Kind=Application"
I0207 10:15:14.138645   32481 apply.go:106] "patching object" name="addon-secret-terraform-tencent" resource="/v1, Kind=Secret"
Addon: terraform-tencent enabled Successfully.

$ kubectl get provider
NAME      STATE   AGE
tencent   ready   1d
```

You are encouraged to further verify the provider by [provision a cloud resource of your cloud provider](../../end-user/components/cloud-services/cloud-resources-orchestration).

## Submit the Terraform Addon

Push the code generated in `./addons` and make a pull request.

## Contribute documentation

Write [Terraform Addon enable doc](../../reference/addons/terraform) for your cloud provider and add it to [all supported cloud providers](../../end-user/components/cloud-services/cloud-resources-orchestration#enabling-cloud-vendor-addons).
