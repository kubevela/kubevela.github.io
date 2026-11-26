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

## Install

```shell
vela addon enable mysql-exporter
```

To remove it:

```shell
vela addon disable mysql-exporter
```

The examples below also deploy MySQL itself with the `helm` component type, which needs the [fluxcd](./fluxcd.md) addon: `vela addon enable fluxcd`.

## Trait or component

The addon gives you two ways to run the exporter:

- Use the `mysql-exporter` trait when the MySQL server is a component of the same Application.
- Use the `mysql-exporter-server` component to scrape a MySQL server KubeVela doesn't manage. Set `mysqlHost` to that server's address.

:::caution
The exporter takes the password as a plain property and writes it into its Deployment's `DATA_SOURCE_NAME`, so anyone who can read the Application or that Deployment can read it. Use a MySQL user with only the grants the exporter needs.
:::

## As a trait

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

The trait runs the exporter as a Deployment and a Service named `<component>exporter`, here `mysqlexporter`.

## As a component

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
```

The component runs the exporter as a Deployment and a Service named after the component, here `mysql-exporter`.

## See the metrics

The exporter serves metrics on port 9104. Forward the Service and check that it can reach MySQL:

```shell
kubectl port-forward -n default svc/mysqlexporter 9104:9104
curl -s http://127.0.0.1:9104/metrics | grep mysql_up
```

```console
# HELP mysql_up Whether the MySQL server is up.
# TYPE mysql_up gauge
mysql_up 1
```

`mysql_up 0` means the exporter is running but can't log in to MySQL: check `mysqlHost`, `username` and `password`. For the component, forward `svc/mysql-exporter` instead.

Unless you set `disableAnnotation: true`, the exporter's pods carry the `prometheus.io/scrape` annotations, so a Prometheus that discovers pods by annotation scrapes them without more setup.
