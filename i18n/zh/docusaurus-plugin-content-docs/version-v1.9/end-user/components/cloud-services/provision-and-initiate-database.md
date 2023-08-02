---
title: 数据库创建和初始化
---

:::tip
请确认管理员已经安装了 [Terraform 插件](../../../reference/addons/terraform)。
:::

本教程将讨论如何为一个关系型数据库导入 SQL 文件完成初始化，并启动一个依赖数据库的应用程序。

[Favorite Links](https://github.com/kubevela-contrib/nodejs-mysql-links)是一个有趣的项目，它可以将所有你最喜欢的网络链接在一个应用程序中。
它使用 Node.js 和 MySQL。它已经被构建在一个容器镜像中 `oamdev/nodejs-mysql-links:v0.0.1`。让我们启动应用程序，看看如何提供一个数据库，并导入一个SQL
文件（这意味着创建表，并在需要时向其中插入数据）。

> 目前，它只在阿里云上工作
> ComponentDefinition [alibaba-rds-preview](https://github.com/kubevela/catalog/blob/master/addons/terraform-alibaba/definitions/terraform-alibaba-rds-preview.yaml)是阿里云 RDS xxx的功能预览，以后会并入alibaba-rds。

### 它是如何工作的

> 如果你不感兴趣，可跳过这一部分。

阿里云 RDS 预览版支持在创建 RDS 实例时导入具有这些属性的SQL文件。

| Name                | Description                                                     | Type   | Required | Default |
| ------------------- | --------------------------------------------------------------- | ------ | -------- | ------- |
| sql_file            | The name of SQL file in the bucket, like `db.sql`               | string | false    |         |
| sql_bucket_name     | The bucket name of the SQL file. like `oss://example`           | string | false    |         |
| sql_bucket_endpoint | The endpoint of the bucket. like `oss-cn-hangzhou.aliyuncs.com` | string | false    |         |

RDS 数据库创建后，OSS 中的 SQL 文件将通过 Terraform 的[`local-exec` provisioner](https://github.com/kubevela-contrib/terraform-modules/blob/master/alibaba/rds-preview/main.tf#L24-L33) 导入到数据库中。
这是由[阿里云 RDS 预览组件定义](https://github.com/kubevela/catalog/blob/master/addons/terraform-alibaba/definitions/terraform-alibaba-rds-preview.yaml#L23-L25)定义的。

### 先决条件

- 启用插件 [terraform-alibaba](../../../reference/addons/terraform)

- 记得将 SQL 文件存储在[阿里云 OSS](./terraform/alibaba-oss)

假设我们有一个OSS bucket `oss://favorite-links`，其中包含一个SQL文件 `db.sql`，而 bucket的访问地址是 `oss-cn-hongkong.aliyuncs.com`。

### 部署云资源

使用以下应用程序来部署数据库 `links`，导入SQL文件 `db.sql`，并启动应用程序 Favorite Links。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: favorite-links
spec:
  components:
    - name: web
      type: webservice
      properties:
        image: oamdev/nodejs-mysql-links:v0.0.1
        port: 4000
      traits:
        - type: service-binding
          properties:
            envMappings:
              DATABASE_HOST:
                secret: db-conn
                key: DB_PUBLIC_HOST
              DATABASE_NAME:
                secret: db-conn
                key: DATABASE_NAME
              DATABASE_USER:
                secret: db-conn
                key: DB_USER
              DATABASE_PASSWORD:
                secret: db-conn
                key: DB_PASSWORD

    - name: db
      type: alibaba-rds
      properties:
        instance_name: favorite-links
        database_name: links
        account_name: oamtest
        password: U34rfwefwefffaked
        security_ips: [ "0.0.0.0/0" ]
        privilege: ReadWrite
        sql_file: db.sql
        sql_bucket_endpoint: oss-cn-hongkong.aliyuncs.com
        sql_bucket_name: oss://favorite-links
        writeConnectionSecretToRef:
          name: db-conn

```

在应用程序成功部署后，你可以通过以下 URL 访问该 Web 应用程序。

```shell
$ vela ls
APP           	COMPONENT	TYPE               	TRAITS         	PHASE  	HEALTHY	STATUS                                       	CREATED-TIME
favorite-links	web      	webservice         	service-binding	running	healthy	Ready:1/1                                    	2022-02-21 14:15:45 +0800 CST
└─            	db       	alibaba-rds-preview	               	running	healthy	Cloud resources are deployed and ready to use	2022-02-21 14:15:45 +0800 CST

```

```shell
$ vela port-forward favorite-links 4000:4000
Forwarding from 127.0.0.1:4000 -> 4000
Forwarding from [::1]:4000 -> 4000

Forward successfully! Opening browser ...
Handling connection for 4000
Handling connection for 4000
```

![](https://kubevela-assets.oss-cn-beijing.aliyuncs.com/gifs/db-import-sql-sample-favorite-links.gif)

