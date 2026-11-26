---
title: Mysql Exporter
---

Prometheus exporter for MySQL server metrics.

Supported versions:

- MySQL >= 5.6
- MariaDB >= 10.3

:::note
Not all collection methods are supported on MySQL/MariaDB < 5.6
:::

## Usecases

:::caution
The exporter takes the password as a plain property and writes it into its Deployment's `DATA_SOURCE_NAME`, so anyone who can read the Application or that Deployment can read it. Use a MySQL user with only the grants the exporter needs.
:::

* Work as a trait.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: mysql
  namespace: default
spec:
  components:
  - name: mysql
    type: helm
    properties:
      chart: mysql
      repoType: helm
      retries: 3
      secretRef: ""
      url: https://charts.bitnami.com/bitnami
      values:
        auth:
          rootPassword: <root-password>
        primary:
          persistence:
            enabled: false
        secondary:
          persistence:
            enabled: false
      version: 9.2.0
    traits:
    - properties:
        disableAnnotation: false
        mysqlHost: mysql
        mysqlPort: 3306
        name: mysql-server-exporter
        password: <password>
        username: root
        version: v0.14.0
      type: mysql-exporter
```

* Work as a component.

> This mode also is suitable to the mysql serve that not managed by KubeVela.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: mysql
  namespace: default
spec:
  components:
  - name: mysql
    type: helm
    properties:
      chart: mysql
      repoType: helm
      retries: 3
      secretRef: ""
      url: https://charts.bitnami.com/bitnami
      values:
        auth:
          rootPassword: <root-password>
        primary:
          persistence:
            enabled: false
        secondary:
          persistence:
            enabled: false
      version: 9.2.0
  - name: mysql-exporter
    properties:
      disableAnnotation: false
      mysqlHost: mysql
      mysqlPort: 3306
      name: mysql-server-exporter
      password: <password>
      username: root
      version: v0.14.0
    type: mysql-exporter-server
```
