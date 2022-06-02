---
title: 内置组件列表
---

本文档将展示所有内置组件的参数列表。

## Webservice

### 描述

定义一个长期运行的，可伸缩的容器化的服务，并且会暴露一个服务端点用来接受来自客户的外部流量。

### 参数定义

 字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 cmd | 容器的启动命令 | []string | false |
 env | 容器中的环境变量 | [[]env](#env) | false |
 volumeMounts |  | [volumeMounts](#volumemounts) | false |
 labels | 工作负载的标签 | map[string]string | false |
 annotations | 工作负载的注解 | map[string]string | false |
 image | 使用的镜像 | string | true |
 ports | 承接用户流量的端口，默认 80 | [[]ports](#ports) | false |
 imagePullPolicy | 镜像拉取策略，可选值为（"Always"，"Never" 或者 "IfNotPresent"）| string | false |
 cpu |  CPU 核数 `0.5` (0.5 CPU 核), `1` (1 CPU 核) | string | false |
 memory | 所需要的内存大小 | string | false |
 livenessProbe | 判断容器是否存活的探针 | [livenessProbe](#livenessprobe) | false |
 readinessProbe | 判断容器是否就绪，能够接受用户流量的探针 | [readinessProbe](#readinessprobe) | false |
 imagePullSecrets | 容器的镜像拉取密钥 | []string | false |
 hostAliases | 定义容器内的 hostAliases | [[]hostAliases](#hostaliases) | true |



#### readinessProbe

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个 | [exec](#exec) | false |
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个 | [httpGet](#httpget) | false |
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个 | [tcpSocket](#tcpsocket) | false |
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查 | int | true | 0
 periodSeconds | 定义每次检查之间的时间间隔 | int | true | 10
 timeoutSeconds | 定义检查的超时时间      | int | true | 1
 successThreshold | 定义检查成功多少次之后判断容器已经就绪 | int | true | 1
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康 | int | true | 3


##### tcpSocket

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 port | TCP 检查的端口号 | int | true |


##### httpGet

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 path | 定义服务端点请求的路径 | string | true |
 port | 定义服务端点的端口号 | int | true |
 httpHeaders | 检查请求中的请求头 | [[]httpHeaders](#httpheaders) | false |


###### httpHeaders

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 value |  | string | true |


##### exec

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败 | []string | true |


##### hostAliases

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 ip |  | string | true |
 hostnames |  | []string | true |

#### ports

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name | 端口名称 | string | false |
 port | 端口号 | int | true |
 protocol | 端口协议类型 UDP， TCP， 或者 SCTP | string | true | TCP
 expose | 端口是否需要暴露 | bool | true | false


#### volumeMounts

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 pvc | 挂载一个 PVC 卷  | [[]pvc](#pvc) | false |
 configMap | 挂载一个 configmap 卷 | [[]configMap](#configmap) | false |
 secret | 挂载一个 secret 卷 | [[]secret](#secret) | false |
 emptyDir | 挂载一个 emptyDir 的卷 | [[]emptyDir](#emptydir) | false |
 hostPath | 挂载主机目录卷 | [[]hostPath](#hostpath) | false |


##### hostPath

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 path |  | string | true |
 name |  | string | true |
 mountPath |  | string | true |


##### emptyDir

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 medium |  | string | true | empty


##### secret

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 defaultMode |  | int | true | 420
 items |  | [[]items](#items) | false |
 secretName |  | string | true |


###### items

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 path |  | string | true |
 key |  | string | true |
 mode |  | int | true | 511


##### configMap

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 defaultMode |  | int | true | 420
 cmName |  | string | true |
 items |  | [[]items](#items) | false |


###### items

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 path |  | string | true |
 key |  | string | true |
 mode |  | int | true | 511


##### pvc

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 claimName | PVC 名称 | string | true |


#### env

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name | 环境变量的名称 | string | true |
 value | 环境变量的值 | string | false |
 valueFrom | 从哪个资源中读取环境变量的定义 | [valueFrom](#valuefrom) | false |


##### valueFrom

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 secretKeyRef | secret 键的引用 | [secretKeyRef](#secretkeyref) | false |
 configMapKeyRef | configmap 键的引用 | [configMapKeyRef](#configmapkeyref) | false |


###### configMapKeyRef

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name | configmap 名称 | string | true |
 key | configmap 中的键名 | string | true |


###### secretKeyRef

字段名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name | secret 名称 | string | true |
 key | secret 中的键名 | string | true |

### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        port: 8080
        cpu: "0.1"
        env:
          - name: FOO
            value: bar
          - name: FOO
            valueFrom:
              secretKeyRef:
                name: bar
                key: bar
```

## Worker

定义一个长期运行的，可伸缩的容器化的服务，并且不会暴露承接用户流量的网络端点。

### Parameters

| NAME             | DESCRIPTION                                                                               | TYPE                              | REQUIRED | DEFAULT |
| ---------------- | ----------------------------------------------------------------------------------------- | --------------------------------- | -------- | ------- |
| cmd              | 容器的启动命令                                                          | []string                          | false    |         |
| env              | 容器中的环境变量                                           | [[]env](#env)                     | false    |         |
| image            | 使用的镜像                                        | string                            | true     |         |
| imagePullPolicy  | 镜像拉取策略，可选值为（"Always"，"Never" 或者 "IfNotPresent"）                                              | string                            | false    |         |
| cpu              | CPU 核数 `0.5` (0.5 CPU 核), `1` (1 CPU 核)          | string                            | false    |         |
| memory           | 所需要的内存大小               | string                            | false    |         |
| volumeMounts |  | [volumeMounts](#volumemounts) | false |
| livenessProbe    | 判断容器是否存活的探针                                | [livenessProbe](#livenessProbe)   | false    |         |
| readinessProbe   | 判断容器是否就绪，能够接受用户流量的探针 | [readinessProbe](#readinessProbe) | false    |         |
| imagePullSecrets | 容器的镜像拉取密钥                                               | []string                          | false    |         |

### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-worker
spec:
  components:
    - name: myworker
      type: worker
      properties:
        image: "busybox"
        cmd:
          - sleep
          - "1000"
```

## Task

定义一个只执行一次代码或者脚本的任务。

### Parameters

| NAME             | DESCRIPTION                                                                                      | TYPE                              | REQUIRED | DEFAULT |
| ---------------- | ------------------------------------------------------------------------------------------------ | --------------------------------- | -------- | ------- |
| cmd              | 容器的启动命令                                                                | []string                          | false    |         |
| env              | 容器中的环境变量                                                  | [[]env](#env)                     | false    |         |
| count            | 定义任务执行的并行度                                                      | int                               | true     | 1       |
| restart          | 定义失败重启策略，可选值为 Never 或者 OnFailure，默认是 OnFailure | string                            | true     | Never   |
| image            | 使用的镜像                                               | string                            | true     |         |
| cpu              | CPU 核数 `0.5` (0.5 CPU 核), `1` (1 CPU 核)                 | string                            | false    |         |
| memory           | 所需要的内存大小                      | string                            | false    |         |
| volumeMounts     |  | [volumeMounts](#volumemounts) | false |
| livenessProbe    | 判断容器是否存活的探针                                       | [livenessProbe](#livenessProbe)   | false    |         |
| readinessProbe   | 判断容器是否就绪，能够接受用户流量的探针        | [readinessProbe](#readinessProbe) | false    |         |
| labels           | 工作负载的标签                                                               | []string                          | false    |         |
| annotations      | 工作负载的注解                                                      | []string                          | false    |         |
| imagePullPolicy  | 镜像拉取策略，可选值为（"Always"，"Never" 或者 "IfNotPresent"）        | string                            | false    |         |
| imagePullSecrets | 容器的镜像拉取密钥                                                  | []string                          | false    |         |

### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-worker
spec:
  components:
    - name: mytask
      type: task
      properties:
        image: perl
        count: 10
        cmd: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
```

## Cron Task

定义一个周期性运行代码或者脚本的任务。

### Parameters

| NAME                       | DESCRIPTION                                                                                      | TYPE                              | REQUIRED | DEFAULT |
|----------------------------|--------------------------------------------------------------------------------------------------|-----------------------------------|----------|---------|
| cmd                        | 容器的启动命令                                                                 | []string                          | false    |         |
| env                        | 容器中的环境变量                                                  | [[]env](#env)                     | false    |         |
| schedule                   | 执行规则 [Cron 规范](https://en.wikipedia.org/wiki/Cron)                        | string                            | true     |         |
| suspend                    | 是否暂停执行                                                                   | bool                              | false    | false   |
| concurrencyPolicy          | 定义任务如何处理任务的重叠运行，可选值为 "Allow"，"Forbid" 或者 "Replace"，默认值为 Allow                | string                            | false    | Allow   |
| successfulJobsHistoryLimit | 保留多少个已经成功完成的任务记录                                              | int                               | false    | 3       |
| failedJobsHistoryLimit     | 保留多少个已经失败的任务记录                                                      | int                               | false    | 1       |
| count                      | 每次任务执行的并行度                                                      | int                               | true     | 1       |
| restart                    | 定义失败重启策略，可选值为 Never 或者 OnFailure，默认是 OnFailure | string                            | true     | Never   |
| image                      | 容器使用的镜像                                               | string                            | true     |         |
| cpu                        | CPU 核数 `0.5` (0.5 CPU 核), `1` (1 CPU 核)                 | string                            | false    |         |
| memory                     | 所需要的内存大小                      | string                            | false    |         |
| volumeMounts     |  | [volumeMounts](#volumemounts) | false |
| livenessProbe              | 判断容器是否存活的探针                                       | [livenessProbe](#livenessProbe)   | false    |         |
| readinessProbe             | 判断容器是否就绪，能够接受用户流量的探针        | [readinessProbe](#readinessProbe) | false    |         |
| labels                     | 工作负载的标签                                                               | []string                          | false    |         |
| annotations                | 工作负载的注解                                                          | []string                          | false    |         |
| imagePullPolicy            | 镜像拉取策略，可选值为（"Always"，"Never" 或者 "IfNotPresent"）                                                       | string                            | false    |         |
| imagePullSecrets           | 容器的镜像拉取密钥                                                      | []string                          | false    |         |

### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: cron-worker
spec:
  components:
    - name: mytask
      type: cron-task
      properties:
        image: perl
        count: 10
        cmd: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
        schedule: "*/1 * * * *"
```

## k8s-objects
### 参数说明

|  字段名称   | 描述 |        类型          | 是否必填 | 默认值 |
|---------|-------------|-----------------------|----------|---------|
| objects |  Kubernetes 资源列表   | [[]K8s-Object](#K8s-Object) | true     |         |

#### K8s-Object

列表中的元素为完整的 Kubernetes 资源结构体。

### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-raw
spec:
  components:
    - name: myjob
      type: k8s-objects
      properties:
        objects:
        - apiVersion: batch/v1
          kind: Job
          metadata:
            name: pi
          spec:
            template:
              spec:
                containers:
                - name: pi
                  image: perl
                  command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
                restartPolicy: Never
            backoffLimit: 4
```


