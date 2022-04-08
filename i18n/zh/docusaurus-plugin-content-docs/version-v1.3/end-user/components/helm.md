---
title:  部署 Helm 组件
---

KubeVela 的 `helm` 组件满足了用户对接 Helm Chart 的需求，你可以通过 `helm` 组件部署任意来自 Helm 仓库、Git 仓库或者 OSS bucket 的现成 Helm Chart 软件包，并对其进行参数覆盖。

## 部署来自 Helm 仓库的 Chart

来自 Helm 仓库的 Chart 包部署方式，我们以一个 redis-comp 组件为例。它是来自 [bitnami](https://charts.bitnami.com/) Helm 仓库的 Chart。Chart 类型为 `redis-cluster`，版本 `6.2.7`。

```shell
cat <<EOF | vela up -f -
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

## 部署来自 OSS bucket 的 Chart

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