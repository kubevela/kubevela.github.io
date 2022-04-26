---
title:  资源模板
---

KubeVela 可以以资源模板的方式直接部署任何 Kubernetes 对象。比如一个 Job。

## 如何使用

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-raw
spec:
  components:
    - name: myjob
      type: raw
      properties:
        apiVersion: batch/v1
        kind: Job
        metadata:
          name: pi
        spec:
          template:
            spec:
              containers:
              - name: pi
                image: perl
                command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
              restartPolicy: Never
          backoffLimit: 4
```

## 属性说明

在 properties 字段中填写完整的 Kubernetes 资源结构体。