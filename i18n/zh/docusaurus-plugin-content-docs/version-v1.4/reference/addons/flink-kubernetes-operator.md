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
# Specification
+--------------+------------------------------------------------------------------------------------------------------+--------+----------+---------+
|     NAME     |                                             DESCRIPTION                                              |  TYPE  | REQUIRED | DEFAULT |
+--------------+------------------------------------------------------------------------------------------------------+--------+----------+---------+
| name         | Specify the flink cluster name.                                                                      | string | true     |         |
| namespace    | Specify the namespace for flink cluster to install.                                                  | string | true     |         |
| nots         | Specify the taskmanager.numberOfTaskSlots, e.g "2".                                                  | string | true     |         |
| flinkVersion | Specify the flink cluster version, e.g "v1_14".                                                      | string | true     |         |
| image        | Specify the image for flink cluster to run, e.g "flink:latest".                                      | string | true     |         |
| jarURI       | Specify the uri for the jar of the flink cluster job, e.g                                            | string | true     |         |
|              | "local:///opt/flink/examples/streaming/StateMachineExample.jar".                                     |        |          |         |
| parallelism  | Specify the parallelism of the flink cluster job, e.g 2.                                             | int    | true     |         |
| upgradeMode  | Specify the upgradeMode of the flink cluster job, e.g "stateless".                                   | string | true     |         |
| replicas     | Specify the replicas of the flink cluster jobManager, e.g 1.                                         | int    | true     |         |
| jmcpu        | Specify the cpu of the flink cluster jobManager, e.g 1.                                              | int    | true     |         |
| jmmem        | Specify the memory of the flink cluster jobManager, e.g "1024m".                                     | string | true     |         |
| tmcpu        | Specify the cpu of the flink cluster taskManager, e.g 1.                                             | int    | true     |         |
| tmmem        | Specify the memory of the flink cluster taskManager, e.g "1024m".                                    | string | true     |         |
+--------------+------------------------------------------------------------------------------------------------------+--------+----------+---------+

```

## 在应用中运行一个 flink-cluster 类型组件的示例

首先请确保你的集群已经存在命名空间`flink-cluster`。

然后部署下面的应用：
```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: flink-app-v1
  namespace: vela-system
spec:
  components:
  - name: my-flink-component
    type: flink-cluster
    properties:
      name: my-flink-cluster
      namespace: flink-cluster
      nots: '2'
      flinkVersion: v1_14
      image: flink:latest
      jarURI: local:///opt/flink/examples/streaming/StateMachineExample.jar
      parallelism: 2
      upgradeMode:  stateless
      replicas: 1
      jmcpu: 1
      jmmem: 1024m
      tmcpu: 1
      tmmem: 1024m
EOF      
```

检查部署出来的flink集群状态
```shell
vela ls  -n vela-system | grep app
flink-app-v1                    my-flink-component      flink-cluster                   running healthy                                                               2022-07-30 18:53:34 +0800 CST


```
使用port-forward暴露flink集群的WebUI，则可在浏览器中访问到flink集群（如在浏览器中输入http://localhost:8888即可）
```shell
kubectl get svc -n flink-cluster | grep rest
my-flink-cluster-rest   ClusterIP   192.168.149.175   <none>        8081/TCP            17m


kubectl port-forward service/my-flink-cluster-rest 8888:8081 -n flink-cluster
Forwarding from 127.0.0.1:8888 -> 8081


