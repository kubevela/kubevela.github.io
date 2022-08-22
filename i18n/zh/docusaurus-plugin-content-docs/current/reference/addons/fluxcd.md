---
title: FluxCD
---

该插件基于 [Fluxcd](https://fluxcd.io/)

## 安装

你可以通过 vela 的命令行工具，执行以下命令安装该插件。

```shell
vela addon enable fluxcd
```

如果你只想利用 fluxcd addon 部署 helm 应用，你可以执行下面的命令启只启用 helm 相关的组件：

```shell
$ vela addon enable fluxcd onlyHelmComponents=true
```

## Definitions

安装插件之后，这些 definition 将会被启用。

|名称                          | 类型           |描述|
|    :----:   |          :----: | ---|
|helm                                    |ComponentDefinition       |交付一个存储在 helm 仓库、OSS bucket 或者 git 当中 helm chart|
|kustomize                               |ComponentDefinition       |交付一个存储在 helm 仓库、OSS bucket 或者 git 当中 的 kustomize 格式的制品包|
|kustomize-json-patch                    |TraitDefinition           |为工作负载配置多个 JSON6902 patch|
|kustomize-patch                         |TraitDefinition           |为工作负载配置多个 StrategicMerge or JSON6902 patch |
|kustomize-strategy-merge                |TraitDefinition           |为工作负载配置多个 patchesStrategicMerge patch

### helm

#### 参数

| 参数      | 描述                                                                                                                                                                                                                                                                                                                                                              | 示例                            |
| --------------- | ----------- | ---------------------------------- |
| repoType        | 必填，仓库类型："helm"，"git" 或者 "oss"                                                                                                                                                                                                                                                                                                                                     | Helm                               |
| pullInterval    | 选填，仓库同步时间周期， 默认为 5m                                                                                                                                                                                                                                                                                                                                            | 5m                                 |
| url             | 必填，仓库的访问地址，git 或者 helm 仓库的 URL 或者 OSS 的 endpoint                                                                                                                                                                                                                                                                                                     | https://charts.bitnami.com/bitnami |
| secretRef       | 选填，访问仓库的 Secret 名称                                                                                                                                                                                                                                                                                                                                                 | sec-name                           |
| timeout         | 选填，从仓库下载制品包的超时时间                                                                                                                                                                                                                                                                                                | 60s                                |
| chart           | 必填，对于 git/oss 的仓库这个参数用来指定 chart 的相对路径。对于 helm 仓库用来指定 chart 名称                                                                                                                                                                                                                                                                         | redis-cluster                      |
| version         | 选填，chart 的版本                                                                                                                                                                                                                                                                                                                               | 6.2.7                              |
| targetNamespace | 选填，chart 的安装的命名空间                                                                                                                                                                                                                                                                                                       | your-ns                            |
| releaseName     | 选填，chart 的安装名称                                                                                                                                                                                                                                                                                                                                   | your-rn                            |
| values          | 选填，覆盖定义在 chart 包中 Values.yaml 的参数                                                                                                                                                                                                                                                                                             |                                    |
| installTimeout  | 选填，执行安装操作的超时时间，默认配置是 10 分钟                                                                                                                                                                                                                                                                                            | 20m                                |
| interval        | 选填，同步的时间间隔，默认是 30s                                                                                                                                                                                                                                                                                          | 1m                                 |
| oss             | 选填， The [oss](#OSS) 的仓库配置                                                                                                        |                             |
| git             | 选填， The [git](#OSS) 的仓库配置                                                                                                        |                             |

##### OSS

| 参数     | 描述                                                                                                                                           | 示例                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| bucketName | 必填， bucket 名称                                                                                                                                | your-bucket                 |
| provider   | 选填， generic 或 aws, 如果你的 OSS 验证信息需要从 EC2 中获取，请填 AWS 默认是 generic.                                               | generic                     |
| region     | 选填， bucket region                                                                                                                               |                             |

##### Git

| 参数     | 描述                                                                                                                                           | 示例                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| branch         | 选填， Git 分支, 默认是 master                                                                                                        | your-branch                 |

#### 例子

如果你的 chart 存贮在 helm repository 中，你可以通过创建以下的应用去交付这个 chart

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: helm-redis
spec:
  components:
    - name: redis
      type: helm
      properties:
        repoType: "helm"
        url: "https://charts.bitnami.com/bitnami"
        chart: "redis"
        version: "16.8.5"
        values: 
          master:
            persistence:
              size: 16Gi
          replica:
            persistence:
              size: 16Gi
```

如果你的 chart 存贮在 OSS 中，你可以通过创建以下的应用去交付这个 chart

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

如果你的 chart 存贮在 git 中，你可以通过创建以下的应用去交付这个 chart

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

### kustomize

#### 参数

| 参数     | 描述                                                                                                                                           | 示例                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| repoType       | 必填，仓库类型："helm"，"git" 或者 "oss"                                                                                                                  | oss                         |
| pullInterval   | 选填，仓库同步时间周期， 默认为 5m                                                                                                                          | 10m                         |
| url            | 必填，仓库的访问地址，git 或者 helm 仓库的 URL 或者 OSS 的 endpoint                                                                                          | oss-cn-beijing.aliyuncs.com |
| secretRef      | 选填，访问仓库的 Secret 名称                                                                                                                              | sec-name                    |
| timeout        | 选填，从仓库下载制品包的超时时间                                                                                                                            | 60s                         |
| path           | 必填，包含 kustomization.yaml 目录路径                                                                                                                   | ./prod                      |
| oss            | 选填，[oss](#OSS) 源的配置                                                                                          |                             |
| git            | 选填，[git](#OSS) 源的配置                                                                                                       |                             |
| imageRepository| 选填，[repository](#Image Repository) 镜像自动更新相关配置                                                           |                             |

##### Image Repository

| 参数        | 是否必填 | 描述                                                                                                                                                                          | 示例                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| image     | 必填     | 镜像地址                                                                                                                                              | oamdev/vela-core                                             |
| secretRef     | 选填     | 镜像的拉取密钥                                                                                                                                                 | my-secret                                             |
| policy        | 选填     | [Policy](#Image policy) 镜像更新策略        |
| filterTags    | 选填       | [FilterTags](#FilterTags) 镜像标签的过滤策略                                                                                                                      | $timestamp                                             |
| commitMessage     | 选填       | 提交信息


###### Image policy

| 参数         | 是否必填 | 描述                                                                                                                                                                           | 示例                                           |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| alphabetical.order     | 选填      | 字母表顺序排序                                                                                                                                                 | asc                                             |
| numerical.order     | 选填       | 依据数字顺序排序                                                                                                                                               | asc                                             |
| semver.range     | 选填       | 根据 semver 排序，选择符合规则的最新版本                                                                                                                                                 | '>=1.0.0 <2.0.0'                                             |


###### FilterTags

| 参数         | 是否必填 | 描述                                                                                                                                                                          | 示例                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| extract     | 选填       | 镜像 tag 提取策略                                                                                                                                                 | $timestamp                                             |
| pattern     | 选填       | 镜像过滤策略模版                                                                                                                                                 | '^master-[a-f0-9]'                                             |


#### 示例

1. 如果你的 kustomize 制品包存储在 OSS 中，你可以通过一下步骤部署它：

(非必须) 如果你的 OSS bucket 需要权限验证，你需要先通过下面的命令创建访问密钥：

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

创建应用:

```shell
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      properties:
        repoType: oss
        # If the bucket is private, you will need to provide
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: definition-registry
        path: ./app/prod/
```

2. 如果你的制品包存储在 git 中，你可以创建以下应用来部署它：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: git-app
spec:
  components:
    - name: git-comp
      type: kustomize
      properties:
        repoType: git
        url: https://github.com/<path>/<to>/<repo>
        git:
          branch: master
          provider: GitHub
        path: ./app/dev/
```

3. 如果你希望你的应用能够跟随镜像变更自动更新，你可以通过创建下面的应用：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: image-app
spec:
  components:
    - name: image
      type: kustomize
      properties:
        imageRepository:
          image: <your image>
          secretRef: imagesecret
          filterTags:
            pattern: '^master-[a-f0-9]+-(?P<ts>[0-9]+)'
            extract: '$ts'
          policy:
            numerical:
              order: asc
          commitMessage: "Image: {{range .Updated.Images}}{{println .}}{{end}}"
```