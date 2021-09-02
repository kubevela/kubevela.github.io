---
title: Labels and Annotations
---

`labels` and `annotations` traits allow us to mark annotations and labels on Pod for workload.

## Specification

```shell
$ vela show annotations
# Properties
+-----------+-------------+-------------------+----------+---------+
|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+-----------+-------------+-------------------+----------+---------+
| -         |             | map[string]string | true     |         |
+-----------+-------------+-------------------+----------+---------+
```

```shell
$ vela show labels
# Properties
+-----------+-------------+-------------------+----------+---------+
|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+-----------+-------------+-------------------+----------+---------+
| -         |             | map[string]string | true     |         |
+-----------+-------------+-------------------+----------+---------+
```

They're all string Key-Value pairs.

## How to use

```shell
# myapp.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
        - type: annotations
          properties:
            "description": "web application"
```

Then the labels and annotations will mark on pods. 