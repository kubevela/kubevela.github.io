---
title: ChartMuseum
---

# ChartMuseum

*ChartMuseum* is an open-source **[Helm Chart Repository](https://helm.sh/docs/topics/chart_repository/)** server written in Go (Golang), with support for cloud storage backends, including [Google Cloud Storage](https://cloud.google.com/storage/), [Amazon S3](https://aws.amazon.com/s3/), [Microsoft Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/), [Alibaba Cloud OSS Storage](https://www.alibabacloud.com/product/oss), [Openstack Object Storage](https://developer.openstack.org/api-ref/object-store/), [Oracle Cloud Infrastructure Object Storage](https://cloud.oracle.com/storage), [Baidu Cloud BOS Storage](https://cloud.baidu.com/product/bos.html), [Tencent Cloud Object Storage](https://intl.cloud.tencent.com/product/cos), [Netease Cloud NOS Storage](https://www.163yun.com/product/nos), [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/), [Minio](https://min.io/), and [etcd](https://etcd.io/).

In addition to using ChartMuseum as you regular Helm Chart registry, you can also store your custom KubeVela addons in it.

## Quick Start

### Use ChartMuseum as an addon registry

:::warning
By default ChartMuseum accepts uploads from anyone who can reach it. Set `disableAPI=true` or `basicAuth.username`/`basicAuth.password` when you enable it (see [Authentication](#authentication)), and port-forward to `127.0.0.1`, not `0.0.0.0`.
:::

```shell
vela addon enable chartmuseum
```

> To customize addon parameters, either:
> - use VelaUX and fill out the form when enabling addon
> - or check out what parameters are available using `vela addon status chartmuseum -v`, and specify it using `vela addon enable chartmuseum externalPort=80`
> 
> This tutorial will assume you used the default parameters.

After successfully enabling the addon, we need to make sure ChartMuseum is accessible to you by forwarding the default port (8080):

```shell
vela port-forward -n vela-system addon-chartmuseum 8080:8080
```

> Typically, you would configure ingress (achievable using addon parameters) to make the addon accessible to the outside.

Use your newly created ChartMuseum repository (or any other Helm Chart repository) as an addon registry. We will name it `localcm`:

```shell
$ vela addon registry add localcm --type helm --endpoint=http://localhost:8080 
# If username and password is required, you can specify them with --username and --password
```

You should see it in the list now:

```shell
$ vela addon registry list
Name    	Type	URL                        
...
localcm 	helm	http://localhost:8080 
```

### Push an addon to your registry

Prepare your addon. We will create a new one named `sample-addon` here:

```shell
$ vela addon init sample-addon
# A conventional addon directory will be created
# ./sample-addon
# ├── definitions
# ├── metadata.yaml
# ├── readme.md
# ├── resources
# ├── schemas
# └── template.yaml
```

(Optional) Package your addon:

> Feel free to skip ahead. We will do this automatically for you if you don't want to package it manually.

```shell
$ vela addon package sample-addon
# You should see a package named sample-addon-1.0.0.tgz
```

Push your addon (`sample-addon`) to the registry (`localcm`) that you just added:

```shell
# Notice how we automatically package the addon for you. 
$ vela addon push sample-addon localcm
Pushing sample-addon-1.0.0.tgz to localcm(http://localhost:8080)... Done
# If you packaged it yourself, just replace `sample-addon` with `sample-addon-1.0.0.tgz`

# In addition to registry names (localcm, as we saw earlier), URLs are also supported.
# If you use URLs, you don't even have to add it as an addon registry.
$ vela addon push sample-addon-1.0.0.tgz http://localhost:8080 -f
Pushing sample-addon-1.0.0.tgz to http://localhost:8080... Done
# Notice the `-f` option.
# This is because we already pushed the exact same addon to the same registry earlier.
# We need to use `-f` to overwrite it.
```

## Parameters

Pass any of these to `vela addon enable chartmuseum` as `key=value`, using dots for nested fields (`persistence.enabled=true`).

| Parameter | Default | Description |
| --- | --- | --- |
| `image` | `ghcr.io/helm/chartmuseum:v0.15.0` | ChartMuseum image. |
| `storage` | `local` | Storage backend: `local`, `alibaba`, `amazon`, `google` or `microsoft`. |
| `alibaba.{bucket, endpoint, accessKeyID, accessKeySecret}` | | Alibaba Cloud OSS settings. Optional: `prefix`, `sse` (`AES256` or `KMS`). |
| `amazon.{bucket, region}` | | Amazon S3 settings. Optional: `prefix`, `endpoint`, `sse`, `accessKeyID`, `accessKeySecret`. |
| `google.{bucket, googleCredentialsJSON}` | | Google Cloud Storage settings. Optional: `prefix`. |
| `microsoft.{container, account, accessKey}` | | Azure Blob Storage settings. Optional: `prefix`. |
| `debug` | `false` | Show debug messages. |
| `disableAPI` | `false` | Turn off all routes under `/api`, which includes uploads. |
| `cacheRefresh` | `5m` | How often to refresh the `index-cache.yaml` cache. |
| `allowOverwrite` | `true` | Allow a chart version to be uploaded again. |
| `authAnonymousGet` | `false` | Allow anonymous GET requests when auth is on. |
| `basicAuth.{username, password}` | | Basic Auth credentials. |
| `serviceType` | `ClusterIP` | Service type: `ClusterIP`, `NodePort` or `LoadBalancer`. |
| `externalPort` | `8080` | Port ChartMuseum is reached on. |
| `persistence.enabled` | `false` | Keep charts on a PersistentVolume. Only for `local` storage. |
| `persistence.storageClassName` | | StorageClass for the PVC the addon creates. |
| `persistence.pvcName` | | Use this existing PVC instead of creating one. |
| `ingressHost.name` | | Host name for an Ingress, e.g. `cm.domain.com`. Setting it creates the Ingress. |
| `ingressHost.path` | `/` | Ingress path. |
| `ingressHost.tls` | `false` | Turn on TLS for the Ingress. |
| `ingressHost.tlsSecret` | | Secret in `vela-system` holding the TLS key and certificate, when `tls` is on. |
| `ingressHost.class` | | Ingress class name. |

## Usages
### Authentication

By default this addon has no authentication: anyone who can reach it can fetch or upload charts. To stop anonymous uploads, do one of these:

- turn off the upload API with `disableAPI=true`, or
- turn on Basic Auth:

```shell
vela addon enable chartmuseum basicAuth.username=user basicAuth.password=pswd
```

With Basic Auth on, add `authAnonymousGet=true` to let anyone fetch charts while uploads still need the password.

### Using with local filesystem storage

By default ChartMuseum uses local filesystem storage, and loses every chart when its pod is recreated. To keep them, turn on persistence:

```shell
vela addon enable chartmuseum persistence.enabled=true
```

The addon creates a PVC for you and deletes it when you disable the addon. To keep the data after that, create a PVC yourself and pass `persistence.pvcName=<your-pvc>` instead.

### Using with Alibaba Cloud OSS Storage

Make sure your environment is properly set up to access `my-oss-bucket`.

```shell
vela addon enable chartmuseum storage=alibaba \
  alibaba.bucket=my-oss-bucket \
  alibaba.endpoint=oss-cn-beijing.aliyuncs.com \
  alibaba.accessKeyID=<access-key-id> \
  alibaba.accessKeySecret=<access-key-secret>
```

### Using with Microsoft Azure Blob Storage

Make sure your environment is properly set up to access `mycontainer`.

```shell
vela addon enable chartmuseum storage=microsoft \
  microsoft.container=mycontainer \
  microsoft.account=<account> \
  microsoft.accessKey=<key>
```

### Using with Google Cloud Storage and a Google Service Account

Set `storage` to `google`, `google.bucket` to your bucket (e.g. `my-gcs-bucket`) and `google.googleCredentialsJSON` to the content of your service account's JSON key. The CLI splits values on commas, so a JSON key won't pass cleanly as `key=value`: enter it in the addon's form in VelaUX instead.

### Using with Amazon S3

Make sure your environment is properly set up to access `my-s3-bucket`.

You need at least the following permissions inside your IAM Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowListObjects",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::my-s3-bucket"
    },
    {
      "Sid": "AllowObjectsCRUD",
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-s3-bucket/*"
    }
  ]
}
```

Grant those permissions to a user and pass its access keys:

```shell
vela addon enable chartmuseum storage=amazon \
  amazon.bucket=my-s3-bucket \
  amazon.region=us-east-1 \
  amazon.accessKeyID=<access-key-id> \
  amazon.accessKeySecret=<access-key-secret>
```
