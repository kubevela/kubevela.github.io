---
title:  Kubernetes Objects
---

Use raw Kubernetes resources directly.

## How to use

For example, a Job:

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

More than one resources, you should put your main workload in the first place, vela traits will only affect on the first object:

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


## Attributes

|  NAME   | DESCRIPTION |         TYPE          | REQUIRED | DEFAULT |
|---------|-------------|-----------------------|----------|---------|
| objects |  list objects of Kubernetes resource   | [[]K8s-Object](#K8s-Object) | true     |         |

### K8s-Object

Just write the whole Kubernetes Resource in this property.