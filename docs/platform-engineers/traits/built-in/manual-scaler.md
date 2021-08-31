---
title: Manual Scaler
---

## Specification

```shell
vela show scaler 
```
```console
# Properties
+----------+--------------------------------+------+----------+---------+
|   NAME   |          DESCRIPTION           | TYPE | REQUIRED | DEFAULT |
+----------+--------------------------------+------+----------+---------+
| replicas | Specify replicas of workload   | int  | true     |       1 |
+----------+--------------------------------+------+----------+---------+
```

## How to use

```yaml
# sample-manual.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: nginx
      traits:
        - type: scaler
          properties:
            replicas: 2
        - type: sidecar
          properties:
            name: "sidecar-test"
            image: "fluentd"
    - name: backend
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
```

To scale up or scale down, you just need to modify the `replicas` field of `scaler` trait and re-apply the YAML.

