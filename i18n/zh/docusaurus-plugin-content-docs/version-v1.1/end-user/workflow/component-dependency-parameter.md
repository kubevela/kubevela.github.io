---
title:  应用组件间的依赖和参数传递
---

本节将介绍如何在 KubeVela 中进行组件间的依赖关系和参数传递。

> 由于本节示例中使用了 helm 功能，所以需要开启 fluxcd 插件：
> ```shell
> vela addon enable fluxcd
> ```

## 依赖关系

在 KubeVela 中，可以在组件中通过 `dependsOn` 来指定组件间的依赖关系。

如：A 组件依赖 B 组件，需要在 B 组件完成部署后再进行部署：

```yaml
...
components:
  - name: A
    type: helm
    dependsOn:
      - B
  - name: B
    type: helm
```

在这种情况下，KubeVela 会先部署 B，当 B 组件的状态可用时，再部署 A 组件。

### 如何使用

假设我们需要在本地启动一个 MySQL 集群，那么我们需要：

1. 部署一个 Secret 作为 MySQL 的密码。
2. 部署 MySQL controller。
2. 部署 MySQL 集群。

部署如下文件：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: mysql
  namespace: default
spec:
  components:
    - name: mysql-secret
      type: raw
      properties:
        apiVersion: v1
        kind: Secret
        metadata:
          name: mysql-secret
        type: kubernetes.io/opaque
        stringData:
          ROOT_PASSWORD: test
    - name: mysql-controller
      type: helm
      properties:
        repoType: helm
        url: https://presslabs.github.io/charts
        chart: mysql-operator
        version: "0.4.0"
    - name: mysql-cluster
      type: raw
      dependsOn:
        - mysql-controller
        - mysql-secret
      properties:
        apiVersion: mysql.presslabs.org/v1alpha1
        kind: MysqlCluster
        metadata:
          name: mysql-cluster
        spec:
          replicas: 1
          secretName: mysql-secret
```

### 期望结果

查看集群中的应用：

```shell
$ vela ls
APP  	COMPONENT       	TYPE	TRAITS	PHASE          	HEALTHY	STATUS	CREATED-TIME
mysql	mysql-secret    	raw 	      	runningWorkflow	       	      	2021-10-14 12:09:55 +0800 CST
├─ 	mysql-controller	helm	      	runningWorkflow	       	      	2021-10-14 12:09:55 +0800 CST
└─ 	mysql-cluster   	raw 	      	runningWorkflow	       	      	2021-10-14 12:09:55 +0800 CST
```

一开始，由于 mysql-controller 尚未部署成功，三个组件状态均为 runningWorkflow。

```shell
$ vela ls
APP  	COMPONENT       	TYPE	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME
mysql	mysql-secret    	raw 	      	running	healthy	      	2021-10-14 12:09:55 +0800 CST
├─ 	mysql-controller	helm	      	running	healthy	      	2021-10-14 12:09:55 +0800 CST
└─ 	mysql-cluster   	raw 	      	running	       	      	2021-10-14 12:09:55 +0800 CST
```

可以看到，所有组件都已成功运行.其中 `mysql-cluster` 组件的部署依赖于 `mysql-controller` 和 `mysql-secret` 部署状态达到 `healthy`。

> `dependsOn` 会根据组件是否 `healthy` 来确定状态，若已 `healthy`，则表示该组件已成功运行，可以部署下一个组件。
> 如果你向自定义组件的健康状态，请查看 [状态回写](../../platform-engineers/traits/status)


## 参数传递

除了显示指定依赖关系以外，还可以在组件中通过 outputs 和 inputs 来指定要传输的数据。

### Outputs

outputs 由 `name` 和 `valueFrom` 组成。`name` 声明了这个 output 的名称，在 input 中将通过 `name` 引用 output。

`valueFrom` 有以下几种写法：
1. 直接通过字符串表示值，如：`valueFrom: testString`。
2. 通过表达式来指定值，如：`valueFrom: output.metadata.name`。注意，`output` 为固定内置字段，指向组件中被部署在集群里的资源。
3. 通过 `+` 来任意连接以上两种写法，最终值是计算后的字符串拼接结果，如：`valueFrom: output.metadata.name + "testString"`。

### Inputs

inputs 由 `from` 和 `parameterKey` 组成。`from` 声明了这个 input 从哪个 output 中取值，`parameterKey` 为一个表达式，将会把 input 取得的值赋给对应的字段。

如：
1. 指定 inputs:

```yaml
...
- name: wordpress
  type: helm
  inputs:
    - from: mysql-svc
      parameterKey: properties.values.externalDatabase.host
```

2. 经过渲染后，该组件的 `properties.values.externalDatabase.host` 字段中会被赋上值，效果如下所示：

```yaml
...
- name: wordpress
  type: helm
  properties:
    values:
      externalDatabase:
        host: <input value>
```

### 如何使用

假设我们希望在本地启动一个 WordPress，而这个 Wordpress 的数据存放在一个 MySQL 数据库中，我们需要将这个 MySQL 的地址传递给 WordPress。

部署如下应用部署计划：

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
        # 将 service 地址作为 output
        - name: mysql-svc
          valueFrom: output.metadata.name + ".default.svc.cluster.local"
      properties:
        repoType: helm
        url: https://charts.bitnami.com/bitnami
        chart: mysql
        version: "8.8.2"
        values:
          auth:
            rootPassword: mypassword
    - name: wordpress
      type: helm
      inputs:
        # 将 mysql 的 service 地址赋值到 host 中
        - from: mysql-svc
          parameterKey: properties.values.externalDatabase.host
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
```

### 期望结果

查看集群中的应用：

```shell
$ vela ls

APP                 	COMPONENT	TYPE	TRAITS	PHASE          	HEALTHY	STATUS	CREATED-TIME
wordpress-with-mysql	mysql    	helm	running	                healthy	        2021-10-12 18:04:10 +0800 CST
└─                	    wordpress	helm	running	                healthy	       	2021-10-12 18:04:10 +0800 CST
```

WordPress 已被成功部署，且与 MySQL 正常连接。