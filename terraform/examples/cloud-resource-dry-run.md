---
title: Render a Cloud Resource Without a Cloud
description: Dry-run an Application with an Alibaba Cloud OSS bucket to see the Configuration KubeVela hands to terraform-controller, without credentials or a cluster.
---

Provisioning a real cloud resource needs an account and credentials. Seeing what KubeVela would ask terraform-controller to do does not: `vela dry-run` renders the Application into the `Configuration` it would create. That's the quickest check of a component's properties, and of what a ComponentDefinition you are writing produces.

## 1. Get the component type

The `alibaba-oss` type comes from the `terraform-alibaba` addon. On a cluster with the addon enabled, `vela dry-run` reads it from there. Without one, take the definition from the [catalog](https://github.com/kubevela/catalog/tree/master/addons/terraform-alibaba/definitions):

```shell
mkdir -p defs
curl -fsSL -o defs/alibaba-oss.yaml \
  https://raw.githubusercontent.com/kubevela/catalog/master/addons/terraform-alibaba/definitions/terraform-alibaba-oss.yaml
```

:::caution Set the Terraform type in a local definition
The definition leaves `schematic.terraform.type` out, as the CRD defaults it to `hcl` on the cluster. Offline, nothing applies that default, and the rendered Configuration has no `hcl` at all. Add the line before you dry-run:

```shell
sed -i.bak 's/^    terraform:$/    terraform:\n      type: hcl/' defs/alibaba-oss.yaml
```
:::

## 2. Dry-run the Application

Save this as `oss.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: provision-cloud-resource-sample
spec:
  components:
    - name: sample-oss
      type: alibaba-oss
      properties:
        bucket: vela-website-0911
        acl: private
        writeConnectionSecretToRef:
          name: oss-conn
```

```shell
vela dry-run -f oss.yaml -d defs --offline
```

```yaml
---
# Application(provision-cloud-resource-sample) -- Component(sample-oss)
---

apiVersion: terraform.core.oam.dev/v1beta2
kind: Configuration
metadata:
  annotations:
    cloud-resource/console-url: https://oss.console.aliyun.com/bucket/oss-{REGION}/{BUCKET_NAME}/overview
    cloud-resource/identifier: BUCKET_NAME
    definition.oam.dev/description: Terraform configuration for Alibaba Cloud OSS
      object
    definition.oam.dev/verified: "true"
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: sample-oss
    app.oam.dev/name: provision-cloud-resource-sample
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: alibaba-oss
  name: sample-oss
  namespace: default
spec:
  gitRef: {}
  hcl: |-
    resource "alicloud_oss_bucket" "bucket-acl" {
      bucket = var.bucket
      acl = var.acl
    }
    output "BUCKET_NAME" {
      value = "${alicloud_oss_bucket.bucket-acl.bucket}"
      description = "The name of the bucket"
    }
    output "BUCKET_ENDPOINT" {
      value = "${alicloud_oss_bucket.bucket-acl.bucket}.${alicloud_oss_bucket.bucket-acl.extranet_endpoint}"
      description = "The endpoint of the bucket"
    }
    variable "bucket" {
      description = "OSS bucket name"
      default = "vela-website"
      type = string
    }
    variable "acl" {
      description = "OSS bucket ACL, supported 'private', 'public-read', 'public-read-write'"
      default = "private"
      type = string
    }
  variable:
    acl: private
    bucket: vela-website-0911
  writeConnectionSecretToRef:
    name: oss-conn
    namespace: default
status:
  apply: {}
  destroy: {}

---
```

## Reading it

- `variable` is the component's properties, less the ones the controller takes for itself (`writeConnectionSecretToRef`, `providerRef`, `customRegion`, ...).
- `writeConnectionSecretToRef.namespace` is filled in with the Application's namespace.
- There is no `providerRef`, so the controller would use the Provider `default` in `default`: the one `vela config create ... -t terraform-alibaba name=default` makes. Add `providerRef` to the properties to pick another.
- The outputs, `BUCKET_NAME` and `BUCKET_ENDPOINT`, are the keys the `oss-conn` Secret would get.

To provision it for real, set up the provider and follow [Provision Cloud Resources](../guides/consume-cloud-services.md).
