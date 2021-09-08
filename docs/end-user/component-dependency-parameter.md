---
title:  Data Pass Between Components 
---

This section will introduce how to pass data between components.

## How to use

If we want to apply a WordPress server with data stored in a MySQL database, we need to pass the MySQL address to WordPress.

Apply the following `Application`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: wordpress-with-mysql
  namespace: default
spec:
  components:
    - name: mysql
      type: helm
      outputs:
        # the output is the mysql service address
        - name: mysql-svc
          exportKey: output.metadata.name + ".default.svc.cluster.local"
      properties:
        repoType: helm
        url: https://charts.bitnami.com/bitnami
        chart: mysql
        version: "8.8.2"
        values:
          global:
            storageClass: alicloud-disk-ssd
          auth:
            rootPassword: mypassword
    - name: wordpress
      type: helm
      inputs:
        # set the host to mysql service address
        - from: mysql-svc
          parameterKey: values.externalDatabase.host
      properties:
        repoType: helm
        url: https://charts.bitnami.com/bitnami
        chart: wordpress
        version: "12.0.3"
        values:
          mariadb:
            enabled: false
          externalDatabase:
            user: root
            password: mypassword
            database: mysql
            port: 3306
          service:
            type: ClusterIP
      traits:
      - type: ingress
        properties:
          domain: testsvc.example.com
          http:
            "/": 80
```

## Expected Outcome

The WordPress with MySQL has been successfully applied.