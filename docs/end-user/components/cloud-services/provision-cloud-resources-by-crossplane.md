---
title: Crossplane
---

The guide [Deploy Cloud Services](../../../tutorials/consume-cloud-services.md) shows how to provision cloud resources by Terraform in
CLI and VelaUX. This tutorial will talk about how to provision Cloud Resources by [Crossplane](https://crossplane.io/).

At present, considering the Crossplane Addon is still in experimental stage, please execute the below statement to activate addon registry by vela cli and use them. 

```shell
vela addon registry add experimental --type helm --endpoint=https://kubevela.github.io/catalog/experimental/
```

You can view the registry added by executing: 

```shell
vela addon registry list
```

The output would look like the below: 

```shell
Name            Type    URL                                                                                                      
experimental    helm    https://kubevela.github.io/catalog/experimental/ 
```

Let's take cloud provider AWS as an example.

## Enable addon `crossplane-aws`

```shell
vela addon enable crossplane-aws
```

## Authenticate AWS Provider for Crossplane

Apply the application below. You can get AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY per https://aws.amazon.com/blogs/security/wheres-my-secret-access-key/.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: aws
  namespace: vela-system
spec:
  components:
    - name: aws
      type: crossplane-aws
      properties:
        name: aws
        AWS_ACCESS_KEY_ID: xxx
        AWS_SECRET_ACCESS_KEY: yyy

```

## Provision cloud resources

Let's provision a S3 bucket. Please apply the application below.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: s3-poc
spec:
  components:
    - name: dev
      type: crossplane-aws-s3
      properties:
        name: kubevela-test-0714
        acl: private
        locationConstraint: us-east-1
```

After the application gets `running`, you can check the bucket by AWS [cli](https://aws.amazon.com/cli/?nc1=h_ls) or console.

```shell
$ vela ls
APP   	COMPONENT	TYPE  	             TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME
s3-poc	dev      	crossplane-aws-s3	      	running	healthy	      	2022-06-16 15:37:15 +0800 CST

$ aws s3 ls
2022-06-16 15:37:17 kubevela-test-0714
```

## More

All Crossplane cloud resources are defined as [ComponentDefinitions](../../../getting-started/definition.md) and are about
to be delivered in Crossplane provider addons, like [crossplane-aws](https://github.com/kubevela/catalog/tree/master/experimental/addons/crossplane-aws).
If your requirements are not met by the addons, you can define your own component type per the instructions on 
[how to define customized component](../../../platform-engineers/components/custom-component.md).
