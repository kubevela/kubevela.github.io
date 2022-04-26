---
title: 调配和使用云资源
---

> ⚠️ 本章节前置要求你的平台运维人员已经安装了 [cloud resources related capabilities](../platform-engineers/cloud-services)。

## 单一应用（单一云资源）调配和使用云资源

检查云资源组件的参数：

```shell
$ kubectl vela show alibaba-rds

# Properties
+---------------+------------------------------------------------+--------+----------+--------------------+
|     NAME      |                  DESCRIPTION                   |  TYPE  | REQUIRED |      DEFAULT       |
+---------------+------------------------------------------------+--------+----------+--------------------+
| engine        | RDS engine                                     | string | true     | mysql              |
| engineVersion | The version of RDS engine                      | string | true     |                8.0 |
| instanceClass | The instance class for the RDS                 | string | true     | rds.mysql.c1.large |
| username      | RDS username                                   | string | true     |                    |
| secretName    | Secret name which RDS connection will write to | string | true     |                    |
+---------------+------------------------------------------------+--------+----------+--------------------+
```

以 ENV 的方式，使用服务绑定 trait 把云资源绑定到 workload 上。

如下示例，创建了一个包含云资源调配组件和使用组件的应用：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: express-server
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
                secret: db-conn
                key: password                                     # 1) If the env name is different from secret key, secret key has to be set.
              endpoint:
                secret: db-conn                                   # 2) If the env name is the same as the secret key, secret key can be omitted.
              username:
                secret: db-conn

    - name: sample-db
      type: alibaba-rds
      properties:
        name: sample-db
        engine: mysql
        engineVersion: "8.0"
        instanceClass: rds.mysql.c1.large
        username: oamtest
        secretName: db-conn

```

安装并验证应用

```shell
$ kubectl get application
NAME     AGE
webapp   46m

$ kubectl port-forward deployment/express-server 80:80
Forwarding from 127.0.0.1:80 -> 80
Forwarding from [::1]:80 -> 80
Handling connection for 80
Handling connection for 80
```

![](../resources/crossplane-visit-application.jpg)

## 单一应用（两个云资源）调配和使用云资源

基于上面的小节 `单一应用（单一云资源）调配和使用云资源`

更新应用，让应用同时使用 OSS 云资源

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: express-server
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
                secret: db-conn
                key: password                                     # 1) If the env name is different from secret key, secret key has to be set.
              endpoint:
                secret: db-conn                                   # 2) If the env name is the same as the secret key, secret key can be omitted.
              username:
                secret: db-conn
              # environments refer to oss-conn secret
              BUCKET_NAME:
                secret: oss-conn
                key: Bucket

    - name: sample-db
      type: alibaba-rds
      properties:
        name: sample-db
        engine: mysql
        engineVersion: "8.0"
        instanceClass: rds.mysql.c1.large
        username: oamtest
        secretName: db-conn

    - name: sample-oss
      type: alibaba-oss
      properties:
        name: velaweb
        secretName: oss-conn
```

安装并验证应用

```shell
$ kubectl port-forward deployment/express-server 80:80
Forwarding from 127.0.0.1:80 -> 80
Forwarding from [::1]:80 -> 80
Handling connection for 80
Handling connection for 80
```

![](../resources/crossplane-visit-application-v2.jpg)

## 在不同的应用中调配和使用云资源

在此小节中，一个应用调配云资源，另外一个应用使用云资源

### 调配云资源

创建[应用](../application)，实例化 `alibaba-rds` 类型 workload 的 RDS 组件来提供云资源

因为我们已经使用 ComponentDefinition 声明了 RDS 实例组件，并命名为 `alibaba-rds`，所以应用中定义的组件应该使用此类型。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: baas-rds
spec:
  components:
    - name: sample-db
      type: alibaba-rds
      properties:
        name: sample-db
        engine: mysql
        engineVersion: "8.0"
        instanceClass: rds.mysql.c1.large
        username: oamtest
        secretName: db-conn
```

安装应用，RDS 实例就会自动地被调配（可能需要一段时间才能正常起来，大概2分钟）。同时，和应用相同的命名空间下会创建名为 `db-conn` 的 secret。

```shell
$ kubectl get application
NAME       AGE
baas-rds   9h

$ kubectl get rdsinstance
NAME           READY   SYNCED   STATE     ENGINE   VERSION   AGE
sample-db-v1   True    True     Running   mysql    8.0       9h

$ kubectl get secret
NAME                                              TYPE                                  DATA   AGE
db-conn                                           connection.crossplane.io/v1alpha1     4      9h

$ ✗ kubectl get secret db-conn -o yaml
apiVersion: v1
data:
  endpoint: xxx==
  password: yyy
  port: MzMwNg==
  username: b2FtdGVzdA==
kind: Secret
```

### 使用云资源

在此小节，我们会演示另外一个组件怎样使用 RDS 实例。

> 注意：如果该云资源有独立的生命周期，我们建议将云资源定义为一个独立的应用。

创建应用来使用云资源

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: express-server
      type: webconsumer
      properties:
        image: zzxwill/flask-web-application:v0.3.1-crossplane
        ports: 80
        dbSecret: db-conn
```

```shell
$ kubectl get application
NAME       AGE
baas-rds   10h
webapp     14h

$ kubectl get deployment
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   1/1     1            1           9h

$ kubectl port-forward deployment/express-server 80:80
```

我们看到云资源已经正常地被应用使用了

![](../../resources/crossplane-visit-application.jpg)
