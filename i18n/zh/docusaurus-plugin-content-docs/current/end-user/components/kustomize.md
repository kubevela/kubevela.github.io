---
title:  Kustomize 组件
---

KubeVela 的 [`kustomize` 组件](https://github.com/kubernetes-sigs/kustomize)满足了用户直接对接 Yaml 文件、文件夹作为组件制品的需求。无论你的 Yaml 文件/文件夹是存放在 Git 仓库还是对象存储库（如 OSS bucket），KubeVela 均能读取并交付。


## 来自 OSS bucket 


来自 OSS bucket 仓库的 YAML 文件夹部署，我们以一个名为 bucket-comp 的组件为例。组件对应的部署文件存放在云存储 OSS bucket，使用对应 bucket 名称是 definition-registry。`kustomize.yaml` 来自 `oss-cn-beijing.aliyuncs.com` 的这个地址，所在路径为 `./app/prod/`。


1. （可选）如果你的 OSS bucket 需要身份验证, 创建 Secret 对象:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

2. 部署该组件

```shell
cat <<EOF | kubectl apply -f -
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
        # 如果 bucket 是私用权限，会需要你提供
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: definition-registry
        path: ./app/prod/
EOF
```

请复制上面的代码块，直接部署到运行时集群：

```shell
application.core.oam.dev/bucket-app created
```

最后我们使用 `vela ls` 来查看交付成功后的应用状态：
```shell
vela ls
APP                 	COMPONENT  	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
bucket-app          	bucket-comp	kustomize 	      	running	healthy	      	2021-08-28 18:53:14 +0800 CST
```

bucket-app APP 的 PHASE 为 running，同时 STATUS 为 healthy。应用部署成功！

### 参数说明

| 参数           | 是否可选 | 含义                                                                                              | 例子                        |
| -------------- | -------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| repoType       | 必填     | 值为 oss 标志 kustomize 配置来自 OSS bucket                                                       | oss                         |
| pullInterval   | 可选     | 与 bucket 进行同步，与调谐 kustomize 的时间间隔 默认值5m（5分钟）                                 | 10m                         |
| url            | 必填     | bucket 的 endpoint，无需填写 scheme                                                               | oss-cn-beijing.aliyuncs.com |
| secretRef      | 可选     | 保存一个 Secret 的名字，该Secret是读取 bucket 的凭证。Secret 包含 accesskey 和 secretkey 字段     | sec-name                    |
| timeout        | 可选     | 下载操作的超时时间，默认 20s                                                                      | 60s                         |
| path           | 必填     | 包含 kustomization.yaml 文件的目录, 或者包含一组 YAML 文件（用以生成 kustomization.yaml )的目录。 | ./prod                      |
| oss.bucketName | 必填     | bucket 名称                                                                                       | your-bucket                 |
| oss.provider   | 可选     | 可选 generic 或 aws，若从 aws EC2 获取凭证则填 aws。默认 generic。                                | generic                     |
| oss.region     | 可选     | bucket 地区                                                                                       |                             |



## 来自 Git 仓库


| 参数         | 是否可选 | 含义                                                                                                                                                                           | 例子                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| repoType     | 必填     | 值为 git 标志 kustomize 配置来自 Git 仓库                                                                                                                                      | git                                             |
| pullInterval | 可选     | 与 Git 仓库进行同步，与调谐 helm release 的时间间隔 默认值5m（5分钟）                                                                                                          | 10m                                             |
| url          | 必填     | Git 仓库地址                                                                                                                                                                   | https://github.com/oam-dev/terraform-controller |
| secretRef    | 可选     | 存有拉取 Git 仓库所需凭证的 Secret 对象名，对 HTTP/S 基本鉴权 Secret 中必须包含  username 和 password 字段。对 SSH 形式鉴权必须包含 identity, identity.pub 和 known_hosts 字段 | sec-name                                        |
| timeout      | 可选     | 下载操作的超时时间，默认 20s                                                                                                                                                   | 60s                                             |
| git.branch   | 可选     | Git 分支，默认为 master                                                                                                                                                        | dev                                             |

**使用示例**

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
        path: ./app/dev/
```
