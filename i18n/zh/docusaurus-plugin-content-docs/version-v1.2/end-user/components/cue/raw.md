---
title:  资源模板
---

KubeVela 可以以资源模板的方式直接部署任何 Kubernetes 对象。

## 如何使用

比如一个 Job。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-raw
spec:
  components:
    - name: myjob
      type: k8s-objects
      properties:
        objects:
        - apiVersion: batch/v1
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

也支持多个资源，但是要把你的主要工作负载放在第一个，KubeVela 的 traits 只会对第一个位置的 Kubernetes 对象生效。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-stateful-service
spec:
  components:
    - name: my-sts
      type: k8s-objects
      properties:
        objects:
        - apiVersion: apps/v1
          kind: StatefulSet
          metadata:
            name: web
          spec:
            selector:
              matchLabels:
                app: nginx # has to match .spec.template.metadata.labels
            serviceName: "nginx"
            replicas: 3 # by default is 1
            template:
              metadata:
                labels:
                  app: nginx # has to match .spec.selector.matchLabels
              spec:
                terminationGracePeriodSeconds: 10
                containers:
                - name: nginx
                  image: k8s.gcr.io/nginx-slim:0.8
                  ports:
                  - containerPort: 80
                    name: web
                  volumeMounts:
                  - name: www
                    mountPath: /usr/share/nginx/html
            volumeClaimTemplates:
            - metadata:
                name: www
              spec:
                accessModes: [ "ReadWriteOnce" ]
                storageClassName: "my-storage-class"
                resources:
                  requests:
                    storage: 1Gi
        - apiVersion: v1
          kind: Service
          metadata:
            name: nginx
            labels:
              app: nginx
          spec:
            ports:
            - port: 80
              name: web
            clusterIP: None
            selector:
              app: nginx
```


## 属性说明


|  字段名称   | 描述 |        类型          | 是否必填 | 默认值 |
|---------|-------------|-----------------------|----------|---------|
| objects |  Kubernetes 资源列表   | [[]K8s-Object](#K8s-Object) | true     |         |

### K8s-Object

列表中的元素为完整的 Kubernetes 资源结构体。