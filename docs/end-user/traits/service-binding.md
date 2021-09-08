---
title:  Service Binding
---

Service binding trait will bind data from Kubernetes `Secret` to the application container's ENV.

## Specification

```
$ vela show service-binding
# Properties
+-------------+------------------------------------------------+------------------+----------+---------+
|    NAME     |                  DESCRIPTION                   |       TYPE       | REQUIRED | DEFAULT |
+-------------+------------------------------------------------+------------------+----------+---------+
| envMappings | The mapping of environment variables to secret | map[string]#KeySecret | true     |         |
+-------------+------------------------------------------------+------------------+----------+---------+

## KeySecret
+--------+---------------------------------------------------+-------------------+----------+---------+
|  NAME  |                    DESCRIPTION                    |       TYPE        | REQUIRED | DEFAULT |
+--------+---------------------------------------------------+-------------------+----------+---------+
| key  | if key is empty, we will use envMappings key instead              | string            | false     |         |
| secret | Kubernetes secret name | string | true     |         |
+--------+---------------------------------------------------+-------------------+----------+---------+


```

## How to use

1. Creat a Kubernetes Secret

```shell
$ kubectl create secret generic db-conn-example --from-literal=password=123  --from-literal=endpoint=https://xxx.com --from-literal=username=myname
secret/db-conn-example created
```

2. Bind the Secret into your component by `service-binding` trait

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: binding-test-comp
      type: webservice
      properties:
        image: zzxwill/flask-web-application:v0.3.1-crossplane
        ports: 80
      traits:
        - type: service-binding
          properties:
            envMappings:
              # environments refer to db-conn secret
              DB_PASSWORD:
                secret: db-conn-example
                key: password            
              endpoint:
                secret: db-conn-example          ß
              username:
                secret: db-conn-example
```
Deploy this YAML and the Secret `db-conn-example` will be binding into environment of workload.