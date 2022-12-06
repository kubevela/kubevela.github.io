---
title: 内置组件列表
---

本文档将**按字典序**展示所有内置组件的参数列表。

> 本文档由[脚本](../../contributor/cli-ref-doc)自动生成，请勿手动修改，上次更新于 2022-12-06T16:17:10+08:00。

## Cron-Task

### 描述

定义一个周期性运行代码或者脚本的任务。

### 底层 Kubernetes 资源 (cron-task)

- cronjobs.batch

### 示例 (cron-task)

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

### 参数说明 (cron-task)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labels | 工作负载的标签。 | map[string]string | false |  
 annotations | 工作负载的注解。 | map[string]string | false |  
 schedule | 执行规则 [Cron 规范](https://en.wikipedia.org/wiki/Cron)。 | string | true |  
 startingDeadlineSeconds | Specify deadline in seconds for starting the job if it misses scheduled。 | int | false |  
 suspend | 是否暂停执行。 | bool | false | false 
 concurrencyPolicy | 定义任务如何处理任务的重叠运行，可选值为 "Allow"，"Forbid" 或者 "Replace"，默认值为 Allow。 | "Allow" or "Forbid" or "Replace" | false | Allow 
 successfulJobsHistoryLimit | 保留多少个已经成功完成的任务记录。 | int | false | 3 
 failedJobsHistoryLimit | 保留多少个已经失败的任务记录。 | int | false | 1 
 count | 每次任务执行的并行度。 | int | false | 1 
 image | 容器使用的镜像。 | string | true |  
 imagePullPolicy | 镜像拉取策略。 | "Always" or "Never" or "IfNotPresent" | false |  
 imagePullSecrets | 容器的镜像拉取密钥。 | []string | false |  
 restart | 定义失败重启策略，可选值为 Never 或者 OnFailure，默认是 OnFailure。 | string | false | Never 
 cmd | 容器的启动命令。 | []string | false |  
 env | 容器中的环境变量。 | [[]env](#env-cron-task) | false |  
 cpu | CPU 核数 `0.5` (0.5 CPU 核), `1` (1 CPU 核)。 | string | false |  
 memory | 所需要的内存大小。 | string | false |  
 volumes | Declare volumes and volumeMounts。 | [[]volumes](#volumes-cron-task) | false |  
 hostAliases | An optional list of hosts and IPs that will be injected into the pod's hosts file。 | [[]hostAliases](#hostaliases-cron-task) | false |  
 ttlSecondsAfterFinished | Limits the lifetime of a Job that has finished。 | int | false |  
 activeDeadlineSeconds | The duration in seconds relative to the startTime that the job may be continuously active before the system tries to terminate it。 | int | false |  
 backoffLimit | The number of retries before marking this job failed。 | int | false | 6 
 livenessProbe | 判断容器是否存活的探针。 | [livenessProbe](#livenessprobe-cron-task) | false |  
 readinessProbe | 判断容器是否就绪，能够接受用户流量的探针。 | [readinessProbe](#readinessprobe-cron-task) | false |  


#### env (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量名称。 | string | true |  
 value | 环境变量的值。 | string | false |  
 valueFrom | 从哪个资源中读取环境变量的定义。 | [valueFrom](#valuefrom-cron-task) | false |  


##### valueFrom (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretKeyRef | secret 键的引用。 | [secretKeyRef](#secretkeyref-cron-task) | false |  
 configMapKeyRef | configmap 键的引用。 | [configMapKeyRef](#configmapkeyref-cron-task) | false |  


##### secretKeyRef (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Secret 名称。 | string | true |  
 key | 选择 Secret 中存在的 key。 | string | true |  


##### configMapKeyRef (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量的名称。 | string | true |  
 key | configmap 中的键名。 | string | true |  


#### volumes (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | "" or "Memory" | false | empty 
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir 


#### hostAliases (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 ip |  | string | true |  
 hostnames |  | []string | true |  


#### livenessProbe (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-cron-task) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-cron-task) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-cron-task) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-cron-task) | false |  


##### httpHeaders (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


#### readinessProbe (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-cron-task) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-cron-task) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-cron-task) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-cron-task) | false |  


##### httpHeaders (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


## Daemon

### 描述

定义一个同 Kubernetes 每个机器 Node 都运行的服务。

### 底层 Kubernetes 资源 (daemon)

- daemonsets.apps

### 示例 (daemon)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: addon-node-exporter
  namespace: vela-system
spec:
  components:
  - name: node-exporter
    type: daemon    
    properties:
      image: prom/node-exporter
      imagePullPolicy: IfNotPresent
      volumeMounts:
        hostPath:
        - mountPath: /host/sys
          mountPropagation: HostToContainer
          name: sys
          path: /sys
          readOnly: true
        - mountPath: /host/root
          mountPropagation: HostToContainer
          name: root
          path: /
          readOnly: true
    traits:
    - properties:
        args:
        - --path.sysfs=/host/sys
        - --path.rootfs=/host/root
        - --no-collector.wifi
        - --no-collector.hwmon
        - --collector.filesystem.ignored-mount-points=^/(dev|proc|sys|var/lib/docker/.+|var/lib/kubelet/pods/.+)($|/)
        - --collector.netclass.ignored-devices=^(veth.*)$
      type: command
    - properties:
        annotations:
          prometheus.io/path: /metrics
          prometheus.io/port: "8080"
          prometheus.io/scrape: "true"
        port:
        - 9100
      type: expose
    - properties:
        cpu: 0.1
        memory: 250Mi
      type: resource
```

### 参数说明 (daemon)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labels | 工作负载的标签。 | map[string]string | false |  
 annotations | 工作负载的注解。 | map[string]string | false |  
 image | 容器使用的镜像。 | string | true |  
 imagePullPolicy | 镜像拉取策略。 | "Always" or "Never" or "IfNotPresent" | false |  
 imagePullSecrets | 容器的镜像拉取密钥。 | []string | false |  
 ports | 指定业务流量进入的端口（多个），默认为 80。 | [[]ports](#ports-daemon) | false |  
 cmd | 容器的启动命令。 | []string | false |  
 env | 容器中的环境变量。 | [[]env](#env-daemon) | false |  
 cpu | CPU 核数 `0.5` (0.5 CPU 核), `1` (1 CPU 核)。 | string | false |  
 memory | 所需要的内存大小。 | string | false |  
 volumeMounts |  | [volumeMounts](#volumemounts-daemon) | false |  
 volumes | Deprecated field, use volumeMounts instead。 | [[]volumes](#volumes-daemon) | false |  
 livenessProbe | 判断容器是否存活的探针。 | [livenessProbe](#livenessprobe-daemon) | false |  
 readinessProbe | 判断容器是否就绪，能够接受用户流量的探针。 | [readinessProbe](#readinessprobe-daemon) | false |  
 hostAliases | 定义容器内的 hostAliases。 | [[]hostAliases](#hostaliases-daemon) | false |  


#### ports (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 要暴露的 IP 端口号。 | int | true |  
 name | 端口名称。 | string | false |  
 protocol | 端口协议类型 UDP， TCP， 或者 SCTP。 | "TCP" or "UDP" or "SCTP" | false | TCP 
 expose | 端口是否需要暴露。 | bool | false | false 


#### env (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量名称。 | string | true |  
 value | 环境变量的值。 | string | false |  
 valueFrom | 从哪个资源中读取环境变量的定义。 | [valueFrom](#valuefrom-daemon) | false |  


##### valueFrom (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretKeyRef | secret 键的引用。 | [secretKeyRef](#secretkeyref-daemon) | false |  
 configMapKeyRef | configmap 键的引用。 | [configMapKeyRef](#configmapkeyref-daemon) | false |  


##### secretKeyRef (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Secret 名称。 | string | true |  
 key | 选择 Secret 中存在的 key。 | string | true |  


##### configMapKeyRef (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量的名称。 | string | true |  
 key | configmap 中的键名。 | string | true |  


#### volumeMounts (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 pvc | 挂载一个 PVC 卷。 | [[]pvc](#pvc-daemon) | false |  
 configMap | 挂载一个 configmap 卷。 | [[]configMap](#configmap-daemon) | false |  
 secret | 挂载一个 secret 卷。 | [[]secret](#secret-daemon) | false |  
 emptyDir | 挂载一个 emptyDir 的卷。 | [[]emptyDir](#emptydir-daemon) | false |  
 hostPath | 挂载主机目录卷。 | [[]hostPath](#hostpath-daemon) | false |  


##### pvc (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 claimName | PVC 名称。 | string | true |  


##### configMap (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 defaultMode |  | int | false | 420 
 cmName |  | string | true |  
 items |  | [[]items](#items-daemon) | false |  


##### items (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### secret (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 defaultMode |  | int | false | 420 
 secretName |  | string | true |  
 items |  | [[]items](#items-daemon) | false |  


##### items (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### emptyDir (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | "" or "Memory" | false | empty 


##### hostPath (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 mountPropagation |  | "None" or "HostToContainer" or "Bidirectional" | false |  
 path |  | string | true |  
 readOnly |  | bool | false |  


#### volumes (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | "" or "Memory" | false | empty 
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir 


#### livenessProbe (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-daemon) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-daemon) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-daemon) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 host |  | string | false |  
 scheme |  | string | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-daemon) | false |  


##### httpHeaders (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


#### readinessProbe (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-daemon) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-daemon) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-daemon) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 host |  | string | false |  
 scheme |  | string | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-daemon) | false |  


##### httpHeaders (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


#### hostAliases (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 ip |  | string | true |  
 hostnames |  | []string | true |  


## K8s-Objects

### 描述

列表中的元素为完整的 Kubernetes 资源结构体。

### 示例 (k8s-objects)

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

### 参数说明 (k8s-objects)
|  NAME   | DESCRIPTION  |        TYPE          | REQUIRED | DEFAULT |
|---------|-------------|-----------------------|----------|---------|
| objects | A slice of Kubernetes resource manifests   | [][Kubernetes-Objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/) | true     |         |

## Task

### 描述

定义一个只执行一次代码或者脚本的任务。

### 底层 Kubernetes 资源 (task)

- jobs.batch

### 示例 (task)

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

### 参数说明 (task)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labels | 工作负载的标签。 | map[string]string | false |  
 annotations | 工作负载的注解。 | map[string]string | false |  
 count | 每次任务执行的并行度。 | int | false | 1 
 image | 容器使用的镜像。 | string | true |  
 imagePullPolicy | 镜像拉取策略。 | "Always" or "Never" or "IfNotPresent" | false |  
 imagePullSecrets | 容器的镜像拉取密钥。 | []string | false |  
 restart | 定义失败重启策略，可选值为 Never 或者 OnFailure，默认是 OnFailure。 | string | false | Never 
 cmd | 容器的启动命令。 | []string | false |  
 env | 容器中的环境变量。 | [[]env](#env-task) | false |  
 cpu | CPU 核数 `0.5` (0.5 CPU 核), `1` (1 CPU 核)。 | string | false |  
 memory | 所需要的内存大小。 | string | false |  
 volumes | Declare volumes and volumeMounts。 | [[]volumes](#volumes-task) | false |  
 livenessProbe | 判断容器是否存活的探针。 | [livenessProbe](#livenessprobe-task) | false |  
 readinessProbe | 判断容器是否就绪，能够接受用户流量的探针。 | [readinessProbe](#readinessprobe-task) | false |  


#### env (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量名称。 | string | true |  
 value | 环境变量的值。 | string | false |  
 valueFrom | 从哪个资源中读取环境变量的定义。 | [valueFrom](#valuefrom-task) | false |  


##### valueFrom (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretKeyRef | secret 键的引用。 | [secretKeyRef](#secretkeyref-task) | false |  
 configMapKeyRef | configmap 键的引用。 | [configMapKeyRef](#configmapkeyref-task) | false |  


##### secretKeyRef (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Secret 名称。 | string | true |  
 key | 选择 Secret 中存在的 key。 | string | true |  


##### configMapKeyRef (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量的名称。 | string | true |  
 key | configmap 中的键名。 | string | true |  


#### volumes (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | "" or "Memory" | false | empty 
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir 


#### livenessProbe (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-task) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-task) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-task) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-task) | false |  


##### httpHeaders (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


#### readinessProbe (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-task) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-task) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-task) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-task) | false |  


##### httpHeaders (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


## Webservice

### 描述

定义一个长期运行的，可伸缩的容器化的服务，并且会暴露一个服务端点用来接受来自客户的外部流量。

### 底层 Kubernetes 资源 (webservice)

- deployments.apps

### 示例 (webservice)

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
        ports:
          - port: 8080
            expose: true
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

### 参数说明 (webservice)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labels | 工作负载的标签。 | map[string]string | false |  
 annotations | 工作负载的注解。 | map[string]string | false |  
 image | 容器使用的镜像。 | string | true |  
 imagePullPolicy | 镜像拉取策略。 | "Always" or "Never" or "IfNotPresent" | false |  
 imagePullSecrets | 容器的镜像拉取密钥。 | []string | false |  
 ports | 指定业务流量进入的端口（多个），默认为 80。 | [[]ports](#ports-webservice) | false |  
 cmd | 容器的启动命令。 | []string | false |  
 env | 容器中的环境变量。 | [[]env](#env-webservice) | false |  
 cpu | CPU 核数 `0.5` (0.5 CPU 核), `1` (1 CPU 核)。 | string | false |  
 memory | 所需要的内存大小。 | string | false |  
 volumeMounts |  | [volumeMounts](#volumemounts-webservice) | false |  
 volumes | Deprecated field, use volumeMounts instead。 | [[]volumes](#volumes-webservice) | false |  
 livenessProbe | 判断容器是否存活的探针。 | [livenessProbe](#livenessprobe-webservice) | false |  
 readinessProbe | 判断容器是否就绪，能够接受用户流量的探针。 | [readinessProbe](#readinessprobe-webservice) | false |  
 hostAliases | 定义容器内的 hostAliases。 | [[]hostAliases](#hostaliases-webservice) | false |  


#### ports (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 要暴露的 IP 端口号。 | int | true |  
 name | 端口名称。 | string | false |  
 protocol | 端口协议类型 UDP， TCP， 或者 SCTP。 | "TCP" or "UDP" or "SCTP" | false | TCP 
 expose | 端口是否需要暴露。 | bool | false | false 
 nodePort | exposed node port. Only Valid when exposeType is NodePort。 | int | false |  


#### env (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量名称。 | string | true |  
 value | 环境变量的值。 | string | false |  
 valueFrom | 从哪个资源中读取环境变量的定义。 | [valueFrom](#valuefrom-webservice) | false |  


##### valueFrom (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretKeyRef | secret 键的引用。 | [secretKeyRef](#secretkeyref-webservice) | false |  
 configMapKeyRef | configmap 键的引用。 | [configMapKeyRef](#configmapkeyref-webservice) | false |  


##### secretKeyRef (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Secret 名称。 | string | true |  
 key | 选择 Secret 中存在的 key。 | string | true |  


##### configMapKeyRef (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量的名称。 | string | true |  
 key | configmap 中的键名。 | string | true |  


#### volumeMounts (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 pvc | 挂载一个 PVC 卷。 | [[]pvc](#pvc-webservice) | false |  
 configMap | 挂载一个 configmap 卷。 | [[]configMap](#configmap-webservice) | false |  
 secret | 挂载一个 secret 卷。 | [[]secret](#secret-webservice) | false |  
 emptyDir | 挂载一个 emptyDir 的卷。 | [[]emptyDir](#emptydir-webservice) | false |  
 hostPath | 挂载主机目录卷。 | [[]hostPath](#hostpath-webservice) | false |  


##### pvc (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 claimName | PVC 名称。 | string | true |  


##### configMap (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 cmName |  | string | true |  
 items |  | [[]items](#items-webservice) | false |  


##### items (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### secret (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 secretName |  | string | true |  
 items |  | [[]items](#items-webservice) | false |  


##### items (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### emptyDir (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 medium |  | "" or "Memory" | false | empty 


##### hostPath (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 path |  | string | true |  


#### volumes (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | "" or "Memory" | false | empty 
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir 


#### livenessProbe (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-webservice) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-webservice) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-webservice) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 host |  | string | false |  
 scheme |  | string | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-webservice) | false |  


##### httpHeaders (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


#### readinessProbe (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-webservice) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-webservice) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-webservice) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 host |  | string | false |  
 scheme |  | string | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-webservice) | false |  


##### httpHeaders (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


#### hostAliases (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 ip |  | string | true |  
 hostnames |  | []string | true |  


