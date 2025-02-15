---
title: 通过 Crossplane 部署云资源
---

教程 [部署云服务](../../../tutorials/consume-cloud-services.md)展示了如何通过 Terraform 在 CLI 和 VelaUX 上部署云服务。
本教程将讨论如何通过 [Crossplane](https://crossplane.io/) 部署云资源。

让我们以云供应商AWS为例。

## 启用插件 `crossplane-aws`

```shell
$ vela addon enable crossplane-aws
```

## 认证 Crossplane AWS Provider

提交下面的应用，你可以根据 https://aws.amazon.com/blogs/security/wheres-my-secret-access-key/ 获得 AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY。

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

## 部署云资源

我们来配置一个 S3 bucket。请提交下面的应用。

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

在应用程序变成 `running` 后，你可以通过 AWS [命令行](https://aws.amazon.com/cli/?nc1=h_ls) 或控制台访问该 bucket。

```shell
$ vela ls
APP   	COMPONENT	TYPE  	             TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME
s3-poc	dev      	crossplane-aws-s3	      	running	healthy	      	2022-06-16 15:37:15 +0800 CST

$ aws s3 ls
2022-06-16 15:37:17 kubevela-test-0714
```

## 更多

所有的 Crossplane 云资源都被定义为[ComponentDefinitions](../../../getting-started/definition.md)，并且即将在 Crossplane provider
插件中交付，如 [crossplan-aws](https://github.com/kubevela/catalog/tree/master/experimental/addons/crossplane-aws)。
如果已有的插件不满足你的需求，你可以根据以下说明定义自己的组件类型 [how to define customized component](../../../platform-engineers/components/custom-component.md)。
