# flink-kubernetes-operator

Apache Flink (https://github.com/apache/flink-kubernetes-operator) 的 Kubernetes operator，它允许用户通过 kubectl 等原生 k8s 工具来管理 Flink 应用程序及其生命周期。

## 安装插件

```shell
vela addon enable flink-kubernetes-operator
```

## 卸载插件

```shell
vela addon disable flink-kubernetes-operator
```

## 检查 flink-kubernetes-operator 的运行状态

由于这个插件依赖于`fluxcd`和`cert-manager`插件，所以会自动启用它们。执行下面的命令来检查它们的状态：
```shell
$ vela ls -n vela-system
APP                             COMPONENT               TYPE            TRAITS  PHASE   HEALTHY STATUS                                                          CREATED-TIME                 
addon-cert-manager              cert-manager            helm                    running healthy Fetch repository successfully, Create helm release              2022-06-16 11:50:19 +0800 CST
                                                                                                successfully                                                                                 
addon-flink-kubernetes-operator flink-namespace         raw                     running healthy                                                                 2022-06-16 11:50:20 +0800 CST
└─                              flink-operator          helm                    running healthy Fetch repository successfully, Create helm release              2022-06-16 11:50:20 +0800 CST
                                                                                                successfully                                                                                 
addon-fluxcd                    flux-system-namespace   raw                     running healthy                                                                 2022-06-16 11:47:07 +0800 CST
└─                              fluxcd-resources        k8s-objects             running healthy                                                                 2022-06-16 11:47:07 +0800 CST

```

通过显示`flink-cluster`组件的字段类型，让我们知道如何在一个应用程序中使用它们。 作为 flink 用户，你可以选择它们作为你的 flink 集群的设置参数。
```shell
vela show flink-cluster
# Properties
+--------------+-------------+--------+----------+---------------------------------------------------------------+
|     NAME     | DESCRIPTION |  TYPE  | REQUIRED |                            DEFAULT                            |
+--------------+-------------+--------+----------+---------------------------------------------------------------+
| name         |             | string | true     |                                                               |
| namespace    |             | string | true     |                                                               |
| nots         |             | string | true     |                                                             2 |
| flinkVersion |             | string | true     | v1_14                                                         |
| image        |             | string | true     | flink:latest                                                  |
| jarURI       |             | string | true     | local:///opt/flink/examples/streaming/StateMachineExample.jar |
| parallelism  |             | int    | true     |                                                             2 |
| upgradeMode  |             | string | true     | stateless                                                     |
| replicas     |             | int    | true     |                                                             1 |
| jmcpu        |             | int    | true     |                                                             1 |
| jmmem        |             | string | true     | 1024m                                                         |
| tmcpu        |             | int    | true     |                                                             1 |
| tmmem        |             | string | true     | 1024m                                                         |
+--------------+-------------+--------+----------+---------------------------------------------------------------+
```

## 在应用中运行一个 flink-cluster 类型组件的示例

首先请确保你的集群已经存在命名空间`flink-home`。

然后部署下面的应用：
```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
   name: flink-app-v1
spec:
components:
  - name: my-flink-component
    type: flink-cluster
    properties:
      name: my-flink-cluster
      namespace: flink-home
EOF      
```

检查相关资源的状态：

```shell
vela status flink-app-v1 
About:

Name:         flink-app-v1
Created at:   2022-04-22 17:33:51 +0800 CST
Status:       running

Workflow:

mode: DAG
finished: true
Suspend: false
Terminated: false
Steps
- id:n6na24x6dr
  name:my-flink-component
  type:apply-component
  phase:succeeded
  message:

Services:

- Name: my-flink-component
  Cluster: local  Namespace: default
  Type: flink-cluster
  Healthy
  No trait applied
```

你会看到你的第一个 flink-cluster 应用已经处于运行状态了。
