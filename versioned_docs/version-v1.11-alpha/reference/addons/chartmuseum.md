---
title: ChartMuseum
---

# ChartMuseum

*ChartMuseum* is an open-source **[Helm Chart Repository](https://helm.sh/docs/topics/chart_repository/)** server written in Go (Golang), with support for cloud storage backends, including [Google Cloud Storage](https://cloud.google.com/storage/), [Amazon S3](https://aws.amazon.com/s3/), [Microsoft Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/), [Alibaba Cloud OSS Storage](https://www.alibabacloud.com/product/oss), [Openstack Object Storage](https://developer.openstack.org/api-ref/object-store/), [Oracle Cloud Infrastructure Object Storage](https://cloud.oracle.com/storage), [Baidu Cloud BOS Storage](https://cloud.baidu.com/product/bos.html), [Tencent Cloud Object Storage](https://intl.cloud.tencent.com/product/cos), [Netease Cloud NOS Storage](https://www.163yun.com/product/nos), [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces/), [Minio](https://min.io/), and [etcd](https://etcd.io/).

In addition to using ChartMuseum as you regular Helm Chart registry, you can also store your custom KubeVela addons in it.

## Quick Start

### Use ChartMuseum as an addon registry

```shell
$ vela addon enable chartmuseum
```

> To customize addon parameters, either:
> - use VelaUX and fill out the form when enabling addon
> - or check out what parameters are available using `vela addon status chartmuseum -v`, and specify it using `vela addon enable chartmuseum externalPort=80`
> 
> This tutorial will assume you used the default parameters.

After successfully enabling the addon, we need to make sure ChartMuseum is accessible to you by forwarding the default port (8080):

```shell
vela port-forward -n vela-system addon-chartmuseum 8080:8080 --address 0.0.0.0
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

Your addon is available in the registry now!

```shell
$ vela addon list
NAME          REGISTRY   DESCRIPTION             AVAILABLE-VERSIONS  STATUS  
...
sample-addon  localcm    An addon for KubeVela.  [1.0.0]             disabled
```

## Usages
### Authentication

> Warning: to prevent anonymous uploads, do any of the following: 
> - set `disableAPI` to `true`
> - enable authentication

By default this addon does not have any authentication configured and allows anyone to fetch or upload charts (unless the API is disabled with `disableAPI`).

To enable Basic Auth to protect APIs, configure `basicAuth` parameters:

```json5
// +usage=Basic auth settings
basicAuth: {
	// +usage=Username for basic http authentication
	username: "user"
	// +usage=Password for basic http authentication
	password: "pswd"
}
```

### Using with local filesystem storage

By default ChartMuseum uses local filesystem storage.
But on pod recreation it will lose all charts, to prevent that, enable persistent storage.

```json5
enablePersistence: true
persistentSize:    "8Gi"
```

### Using with Alibaba Cloud OSS Storage

Make sure your environment is properly setup to access `my-oss-bucket`.

To do so, you must set the following parameters:
- `accessKeyID`
- `accessKeySecret`

```json5
// +usage=Storage backend, can be one of: local(default), alibaba, amazon, google, microsoft
storge: "alibaba"
// +usage=Alibaba Cloud storage backend settings
alibaba: {
	// +usage=OSS bucket to store charts for alibaba storage backend, e.g. my-oss-bucket
	bucket: "my-oss-bucket"
	// +usage=OSS endpoint to store charts for alibaba storage backend, e.g. oss-cn-beijing.aliyuncs.com
	endpoint: "oss-cn-beijing.aliyuncs.com"
	// +usage=Alibaba OSS access key id
	accessKeyID: "accessKeyID"
	// +usage=Alibaba OSS access key secret
	accessKeySecret: "accessKeySecret"
}
```

### Using with Microsoft Azure Blob Storage

Make sure your environment is properly setup to access `mycontainer`.

To do so, you must set the following parameters:
- `account`
- `accessKey`

Specify `custom.yaml` with such values

```json5
// +usage=Storage backend, can be one of: local(default), alibaba, amazon, google, microsoft
storage: "microsoft"
// +usage=Microsoft Azure storage backend settings
microsoft: {
	// +usage=Container to store charts for microsoft storage backend
	container: "mycontainer"
	// +usage=Azure storage account
	account: "account"
	// +usage=Azure storage account access key
	accessKey: "key"
}
```

### Using with Google Cloud Storage and a Google Service Account

```json5
// +usage=Storage backend, can be one of: local(default), alibaba, amazon, google, microsoft
storage: "google"
// +usage=GCP storage backend settings
google: {
	// +usage=GCS bucket to store charts for google storage backend, e.g. my-gcs-bucket
	bucket: "my-gcs-bucket"
	// +usage=GCP service account json file
	googleCredentialsJSON: "json"
}
```

### Using with Amazon S3
Make sure your environment is properly setup to access `my-s3-bucket`

You need at least the following permissions inside your IAM Policy
```yaml
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

#### permissions grant with access keys

Grant permissions to `special user` and use it's access keys for auth on aws

```json5
// +usage=Storage backend, can be one of: local(default), alibaba, amazon, google, microsoft
storage: "amazon"
// +usage=AWS storage backend settings
amazon: {
	// +usage=S3 bucket to store charts for amazon storage backend, e.g. my-s3-bucket
	bucket: "my-s3-bucket"
	// +usage=Region of s3 bucket to store charts, e.g. us-east-1
	region: "us-east-1"
	// +usage=AWS access key id
	accessKeyID: "keyid"
	// +usage=AWS access key secret
	accessKeySecret: "secret"
}
```