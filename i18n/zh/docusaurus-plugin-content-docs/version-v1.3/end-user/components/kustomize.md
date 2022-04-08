---
title:  基于订阅模式的组件
---

KubeVela 的 [`kustomize` 组件](https://github.com/kubernetes-sigs/kustomize)满足了用户直接对接 Yaml 文件、文件夹作为组件制品的需求。无论你的 Yaml 文件/文件夹是存放在 Git 仓库还是对象存储库（如 OSS bucket），KubeVela 均能读取并交付。

除了监听文件外，该组件还能监听镜像仓库中的镜像变动并交付。

## 监听文件/文件夹

### 监听 OSS bucket 中的文件


来自 OSS bucket 仓库的 YAML 文件夹部署，我们以一个名为 bucket-comp 的组件为例。组件对应的部署文件存放在云存储 OSS bucket，使用对应 bucket 名称是 definition-registry。`kustomize.yaml` 来自 `oss-cn-beijing.aliyuncs.com` 的这个地址，所在路径为 `./app/prod/`。


1. （可选）如果你的 OSS bucket 需要身份验证, 创建 Secret 对象:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

2. 部署该组件

```shell
cat <<EOF | vela up -f -
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



### 监听 Git 仓库中的文件


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
          provider: GitHub
        path: ./app/dev/
```

## 监听镜像仓库


**使用示例**

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