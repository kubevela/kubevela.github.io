---
title:  Kustomize 组件
---

KubeVela 可以部署多种来源的 [Kustomize](https://github.com/kubernetes-sigs/kustomize) 组件，目前主要支持来自 Git 仓库和 OSS bucket。

### 来自 Git 仓库


| 参数            | 是否可选 | 含义                                                         | 例子                                            |
| --------------- | -------- | ------------------------------------------------------------ | ----------------------------------------------- |
| repoType        | 必填     | 值为 git 标志 kustomize 配置来自 Git 仓库                    | git                                             |
| pullInterval    | 可选     | 与 Git 仓库进行同步，与调谐 helm release 的时间间隔 默认值5m（5分钟） | 10m                                             |
| url             | 必填     | Git 仓库地址                                                 | https://github.com/oam-dev/terraform-controller |
| secretRef       | 可选     | 存有拉取 Git 仓库所需凭证的 Secret 对象名，对 HTTP/S 基本鉴权 Secret 中必须包含  username 和 password 字段。对 SSH 形式鉴权必须包含 identity, identity.pub 和 known_hosts 字段 | sec-name                                        |
| timeout         | 可选     | 下载操作的超时时间，默认 20s                                 | 60s                                             |
| git.branch      | 可选     | Git 分支，默认为 master                                      | dev                                             |

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

### 来自 OSS bucket 

| 参数           | 是否可选 | 含义                                                         | 例子                        |
| -------------- | -------- | ------------------------------------------------------------ | --------------------------- |
| repoType       | 必填     | 值为 oss 标志 kustomize 配置来自 OSS bucket                  | oss                         |
| pullInterval   | 可选     | 与 bucket 进行同步，与调谐 kustomize 的时间间隔 默认值5m（5分钟） | 10m                         |
| url            | 必填     | bucket 的 endpoint，无需填写 scheme                          | oss-cn-beijing.aliyuncs.com |
| secretRef      | 可选     | 保存一个 Secret 的名字，该Secret是读取 bucket 的凭证。Secret 包含 accesskey 和 secretkey 字段 | sec-name                    |
| timeout        | 可选     | 下载操作的超时时间，默认 20s                                 | 60s                         |
| path           | 必填     | 包含 kustomization.yaml 文件的目录, 或者包含一组 YAML 文件（用以生成 kustomization.yaml )的目录。 | ./prod                      |
| oss.bucketName | 必填     | bucket 名称                                                  | your-bucket                 |
| oss.provider   | 可选     | 可选 generic 或 aws，若从 aws EC2 获取凭证则填 aws。默认 generic。 | generic                     |
| oss.region     | 可选     | bucket 地区                                                  |                             |

**使用示例**

1. （可选）如果你的 OSS bucket 需要身份验证, 创建 Secret 对象:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

2. 部署该组件
```yaml
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
        # required if bucket is private
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: definition-registry
        path: ./app/prod/
            
```

## 覆写 Kustomize 配置

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      properties:
        # ...omitted for brevity
        path: ./app/
     
```

