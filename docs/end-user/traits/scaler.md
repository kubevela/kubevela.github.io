---
title: Setting replicas
---

The `scaler` trait allows you to change the replicas for the component.

## Specification


```
$ vela show scaler
# Properties
+----------+--------------------------------+------+----------+---------+
|   NAME   |          DESCRIPTION           | TYPE | REQUIRED | DEFAULT |
+----------+--------------------------------+------+----------+---------+
| replicas | Specify the number of workload | int  | true     |       1 |
+----------+--------------------------------+------+----------+---------+
```

## How to use

```yaml
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend              # This is the component I want to deploy
      type: webservice
      properties:
        image: nginx
      traits:
        - type: scaler         # Set the replica to the specified value
          properties:
            replicas: 5
```
