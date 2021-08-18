---
title:  Helm 组件
---

## 定义

描述一个 helm chart ，来自 Helm 仓库、Git 仓库、OSS bucket。

## 示例

1. chart 来源是 helm 仓库
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        repoUrl: https://charts.bitnami.com/bitnami
        repoType: helm
```
2. chart 来源是 OSS bucket
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
3. Git 仓库来源

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
```

## 属性说明

TBD

