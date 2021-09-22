---
title:  Helm 组件
---

KubeVela 的 `helm` 组件满足了用户对接 Helm Chart 的需求，你可以通过 `helm` 组件部署任意来自 Helm 仓库、Git 仓库或者 OSS bucket 的现成 Helm Chart 软件包，并对其进行参数覆盖。

## 部署来自 Helm 仓库的 Chart

来自 Helm 仓库的 Chart 包部署方式，我们以一个 redis-comp 组件为例。它是来自 [bitnami](https://charts.bitnami.com/) Helm 仓库的 Chart。Chart 类型为 `redis-cluster`，版本 `6.2.7`。

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis-comp
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        url: https://charts.bitnami.com/bitnami
        repoType: helm
EOF
```

请复制上面的代码块，直接部署到运行时集群：
```shell
application.core.oam.dev/app-delivering-chart created
```

最后我们使用 `vela ls` 来查看交付成功后的应用状态：
```shell
APP                 	COMPONENT 	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
app-delivering-chart	redis-comp	helm      	      	running	healthy	      	2021-08-28 18:48:21 +0800 CST
```

我们也看到 app-delivering-chart APP 的 PHASE 为 running，同时 STATUS 为 healthy。

### 参数说明

| 参数            | 是否可选 | 含义                                                                                                                                                                                                                                                                | 例子                               |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| repoType        | 必填     | 值为 Helm，标志 chart 来自 Helm 仓库库                                                                                                                                                                                                                                   | Helm                               |
| pullInterval    | 可选     | 与 Helm 仓库进行同步，与调谐 Helm release 的时间间隔 默认值5m（5分钟）                                                                                                                                                                                              | 10m                                |
| url             | 必填     | Helm 仓库地址，支持 http/https                                                                                                                                                                                                                                      | https://charts.bitnami.com/bitnami |
| secretRef       | 可选     | 存有拉取仓库所需凭证的 Secret 对象名，对 HTTP/S 基本鉴权 Secret 中必须包含  username 和 password 字段。对于 TLS the secret must contain a certFile and keyFile, and/or 	// caCert fields.对 TLS 鉴权 Secret 中必须包含  certFile / keyFile 字段 和/或 caCert 字段。 | sec-name                           |
| timeout         | 可选     | 拉取仓库索引的超时时间                                                                                                                                                                                                                                              | 60s                                |
| chart           | 必填     | chart 名称                                                                                                                                                                                                                                                          | redis-cluster                      |
| version         | 可选     | chart 版本，默认为*                                                                                                                                                                                                                                                 | 6.2.7                              |
| targetNamespace | 可选     | 安装 chart 的名字空间，默认由 chart 本身决定                                                                                                                                                                                                                        | your-ns                            |
| releaseName     | 可选     | 安装得到的 release 名称                                                                                                                                                                                                                                             | your-rn                            |
| values          | 可选     | 覆写 chart 的 Values.yaml ，用于 Helm 渲染。                                                                                                                                                                                                                        | 见来自 Git 仓库的例子              |


## 部署来自 OSS bucket 的 Chart

| 参数            | 是否可选 | 含义                                                                                          | 例子                        |
| --------------- | -------- | --------------------------------------------------------------------------------------------- | --------------------------- |
| repoType        | 必填     | 值为 oss 标志 chart 来自 OSS bucket                                                           | oss                         |
| pullInterval    | 可选     | 与 bucket 进行同步，与调谐 Helm release 的时间间隔 默认值5m（5分钟）                          | 10m                         |
| url             | 必填     | bucket 的 endpoint，无需填写 scheme                                                           | oss-cn-beijing.aliyuncs.com |
| secretRef       | 可选     | 保存一个 Secret 的名字，该Secret是读取 bucket 的凭证。Secret 包含 accesskey 和 secretkey 字段 | sec-name                    |
| timeout         | 可选     | 下载操作的超时时间，默认 20s                                                                  | 60s                         |
| chart           | 必填     | chart 存放路径（key）                                                                         | ./chart/podinfo-5.1.3.tgz   |
| version         | 可选     | 在 OSS 来源中，该参数不起作用                                                                 |                             |
| targetNamespace | 可选     | 安装 chart 的名字空间，默认由 chart 本身决定                                                  | your-ns                     |
| releaseName     | 可选     | 安装得到的 release 名称                                                                       | your-rn                     |
| values          | 可选     | 覆写 chart 的 Values.yaml ，用于 Helm 渲染。                                                  | 见来自 Git 仓库的例子       |
| oss.bucketName  | 必填     | bucket 名称                                                                                   | your-bucket                 |
| oss.provider    | 可选     | 可选 generic 或 aws，若从 aws EC2 获取凭证则填 aws。默认 generic。                            | generic                     |
| oss.region      | 可选     | bucket 地区                                                                                   |                             |

**使用示例**

1. （可选）如果你的 OSS bucket 需要身份验证, 创建 Secret 对象:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

2. 部署 chart
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: helm
      properties:
        repoType: oss
        # required if bucket is private
        secretRef: bucket-secret
        chart: ./chart/podinfo-5.1.3.tgz
        url: oss-cn-beijing.aliyuncs.com
        oss:
            bucketName: definition-registry
```

上面的示例中，Application 中名为 bucket-comp 的组件交付了一个来自 endpoint 为 oss-cn-beijing.aliyuncs.com 的 OSS bucket definition-registry 的 chart。Chart 路径为 ./chart/podinfo-5.1.3.tgz。

## 部署来自 Git 仓库的 Chart

| 参数            | 是否可选 | 含义                                                                                                                                                                           | 例子                                            |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| repoType        | 必填     | 值为 git 标志 chart 来自 Git 仓库                                                                                                                                              | git                                             |
| pullInterval    | 可选     | 与 Git 仓库进行同步，与调谐 Helm release 的时间间隔 默认值5m（5分钟）                                                                                                          | 10m                                             |
| url             | 必填     | Git 仓库地址                                                                                                                                                                   | https://github.com/oam-dev/terraform-controller |
| secretRef       | 可选     | 存有拉取 Git 仓库所需凭证的 Secret 对象名，对 HTTP/S 基本鉴权 Secret 中必须包含  username 和 password 字段。对 SSH 形式鉴权必须包含 identity, identity.pub 和 known_hosts 字段 | sec-name                                        |
| timeout         | 可选     | 下载操作的超时时间，默认 20s                                                                                                                                                   | 60s                                             |
| chart           | 必填     | chart 存放路径（key）                                                                                                                                                          | ./chart/podinfo-5.1.3.tgz                       |
| version         | 可选     | 在 Git 来源中，该参数不起作用                                                                                                                                                  |                                                 |
| targetNamespace | 可选     | 安装 chart 的名字空间，默认由 chart 本身决定                                                                                                                                   | your-ns                                         |
| releaseName     | 可选     | 安装得到的 release 名称                                                                                                                                                        | your-rn                                         |
| values          | 可选     | 覆写 chart 的 Values.yaml ，用于 Helm 渲染。                                                                                                                                   | 见来自 Git 仓库的例子                           |
| git.branch      | 可选     | Git 分支，默认为 master                                                                                                                                                        | dev                                             |

**使用示例**

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
   name: app-delivering-chart
spec:
   components:
     - name: terraform-controller
       type: helm
       properties:
          repoType: git
          url: https://github.com/oam-dev/terraform-controller
          chart: ./chart
          git:
          	branch: master
```

上面的示例中，Application 中名为 terraform-controller 的组件交付了一个来自 https://github.com/oam-dev/terraform-controller 的 Github 仓库的 chart。Chart 路径为 ./chart，仓库分支为 master。