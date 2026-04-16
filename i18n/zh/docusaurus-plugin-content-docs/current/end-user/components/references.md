---
title: 内置组件列表
---

本文档将**按字典序**展示所有内置组件的参数列表。

> 本文档由[脚本](../../contributor/cli-ref-doc.md)自动生成，请勿手动修改，上次更新于 2026-04-16T11:50:12+01:00。

## Cron-Task

### 描述

Describes cron jobs that run code or a script to completion。

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


 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 labels | Specify the labels in the workload。 | map[string]string | false |  |  
 annotations | Specify the annotations in the workload。 | map[string]string | false |  |  
 schedule | Specify the schedule in Cron format, see https://en.wikipedia.org/wiki/Cron。 | string | true |  |  
 startingDeadlineSeconds | Specify deadline in seconds for starting the job if it misses scheduled。 | int | false |  |  
 suspend | suspend subsequent executions。 | bool | false | false |  
 concurrencyPolicy | Specifies how to treat concurrent executions of a Job。 | "Allow" or "Forbid" or "Replace" | false | Allow |  
 successfulJobsHistoryLimit | The number of successful finished jobs to retain。 | int | false | 3 |  
 failedJobsHistoryLimit | The number of failed finished jobs to retain。 | int | false | 1 |  
 count | Specify number of tasks to run in parallel。 | int | false | 1 |  
 image | Which image would you like to use for your service。 | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service。 | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service。 | []string | false |  |  
 restart | Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never。 | string | false | Never |  
 cmd | Commands to run in the container。 | []string | false |  |  
 env | Define arguments by using environment variables。 | [[]env](#env-cron-task) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)。 | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container。 | string | false |  |  
 volumeMounts |  | [volumeMounts](#volumemounts-cron-task) | false |  |  
 volumes | Deprecated field, use volumeMounts instead。 | [[]volumes](#volumes-cron-task) | false |  |  
 hostAliases | An optional list of hosts and IPs that will be injected into the pod's hosts file。 | [[]hostAliases](#hostaliases-cron-task) | false |  |  
 ttlSecondsAfterFinished | Limits the lifetime of a Job that has finished。 | int | false |  |  
 activeDeadlineSeconds | The duration in seconds relative to the startTime that the job may be continuously active before the system tries to terminate it。 | int | false |  |  
 backoffLimit | The number of retries before marking this job failed。 | int | false | 6 |  
 livenessProbe | Instructions for assessing whether the container is alive。 | [livenessProbe](#livenessprobe-cron-task) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic。 | [readinessProbe](#readinessprobe-cron-task) | false |  |  


#### env (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | Environment variable name。 | string | true |  |  
 value | The value of the environment variable。 | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from。 | [valueFrom](#valuefrom-cron-task) | false |  |  


##### valueFrom (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace。 | [secretKeyRef](#secretkeyref-cron-task) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace。 | [configMapKeyRef](#configmapkeyref-cron-task) | false |  |  


##### secretKeyRef (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the secret in the pod's namespace to select from。 | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key。 | string | true |  |  


##### configMapKeyRef (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the config map in the pod's namespace to select from。 | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key。 | string | true |  |  


#### volumeMounts (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 pvc | Mount PVC type volume。 | [[]pvc](#pvc-cron-task) | false |  |  
 configMap | Mount ConfigMap type volume。 | [[]configMap](#configmap-cron-task) | false |  |  
 secret | Mount Secret type volume。 | [[]secret](#secret-cron-task) | false |  |  
 emptyDir | Mount EmptyDir type volume。 | [[]emptyDir](#emptydir-cron-task) | false |  |  
 hostPath | Mount HostPath type volume。 | [[]hostPath](#hostpath-cron-task) | false |  |  


##### pvc (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 claimName | The name of the PVC。 | string | true |  |  


##### configMap (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 cmName |  | string | true |  |  
 items |  | [[]items](#items-cron-task) | false |  |  


##### items (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### secret (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 secretName |  | string | true |  |  
 items |  | [[]items](#items-cron-task) | false |  |  


##### items (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### emptyDir (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 medium |  | "" or "Memory" | false | empty |  


##### hostPath (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 path |  | string | true |  |  


#### volumes (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### hostAliases (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 ip |  | string | true |  |  
 hostnames |  | []string | true |  |  


#### livenessProbe (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-cron-task) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-cron-task) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-cron-task) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-cron-task) | false |  |  


##### httpHeaders (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


#### readinessProbe (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-cron-task) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-cron-task) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-cron-task) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-cron-task) | false |  |  


##### httpHeaders (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (cron-task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


## Daemon

### 描述

Describes daemonset services in Kubernetes。

### Underlying Kubernetes Resources (daemon)

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


 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 labels | Specify the labels in the workload。 | map[string]string | false |  |  
 annotations | Specify the annotations in the workload。 | map[string]string | false |  |  
 image | Which image would you like to use for your service。 | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service。 | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service。 | []string | false |  |  
 ports | Which ports do you want customer traffic sent to, defaults to 80。 | [[]ports](#ports-daemon) | false |  |  
 cmd | Commands to run in the container。 | []string | false |  |  
 env | Define arguments by using environment variables。 | [[]env](#env-daemon) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)。 | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container。 | string | false |  |  
 volumeMounts |  | [volumeMounts](#volumemounts-daemon) | false |  |  
 volumes | Deprecated field, use volumeMounts instead。 | [[]volumes](#volumes-daemon) | false |  |  
 livenessProbe | Instructions for assessing whether the container is alive。 | [livenessProbe](#livenessprobe-daemon) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic。 | [readinessProbe](#readinessprobe-daemon) | false |  |  
 hostAliases | Specify the hostAliases to add。 | [[]hostAliases](#hostaliases-daemon) | false |  |  


#### ports (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | Number of port to expose on the pod's IP address。 | int | true |  |  
 name | Name of the port。 | string | false |  |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP。 | "TCP" or "UDP" or "SCTP" | false | TCP |  
 expose | Specify if the port should be exposed。 | bool | false | false |  


#### env (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | Environment variable name。 | string | true |  |  
 value | The value of the environment variable。 | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from。 | [valueFrom](#valuefrom-daemon) | false |  |  


##### valueFrom (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace。 | [secretKeyRef](#secretkeyref-daemon) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace。 | [configMapKeyRef](#configmapkeyref-daemon) | false |  |  


##### secretKeyRef (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the secret in the pod's namespace to select from。 | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key。 | string | true |  |  


##### configMapKeyRef (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the config map in the pod's namespace to select from。 | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key。 | string | true |  |  


#### volumeMounts (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 pvc | Mount PVC type volume。 | [[]pvc](#pvc-daemon) | false |  |  
 configMap | Mount ConfigMap type volume。 | [[]configMap](#configmap-daemon) | false |  |  
 secret | Mount Secret type volume。 | [[]secret](#secret-daemon) | false |  |  
 emptyDir | Mount EmptyDir type volume。 | [[]emptyDir](#emptydir-daemon) | false |  |  
 hostPath | Mount HostPath type volume。 | [[]hostPath](#hostpath-daemon) | false |  |  


##### pvc (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 claimName | The name of the PVC。 | string | true |  |  


##### configMap (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 defaultMode |  | int | false | 420 |  
 cmName |  | string | true |  |  
 items |  | [[]items](#items-daemon) | false |  |  


##### items (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### secret (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 defaultMode |  | int | false | 420 |  
 secretName |  | string | true |  |  
 items |  | [[]items](#items-daemon) | false |  |  


##### items (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### emptyDir (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 medium |  | "" or "Memory" | false | empty |  


##### hostPath (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 mountPropagation |  | "None" or "HostToContainer" or "Bidirectional" | false |  |  
 path |  | string | true |  |  
 readOnly |  | bool | false |  |  


#### volumes (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### livenessProbe (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-daemon) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-daemon) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-daemon) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-daemon) | false |  |  


##### httpHeaders (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


#### readinessProbe (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-daemon) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-daemon) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-daemon) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-daemon) | false |  |  


##### httpHeaders (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


#### hostAliases (daemon)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 ip |  | string | true |  |  
 hostnames |  | []string | true |  |  


## K8s-Objects

### 描述

K8s-objects allow users to specify raw K8s objects in properties。

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

## Statefulset

### 描述

Describes long-running, scalable, containerized services used to manage stateful application, like database。

### Underlying Kubernetes Resources (statefulset)

- statefulsets.apps

### 示例 (statefulset)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: postgres
spec:
  components:
    - name: postgres
      type: statefulset
      properties:
        cpu: "1"
        exposeType: ClusterIP
        # see https://hub.docker.com/_/postgres
        image: docker.io/library/postgres:16.4
        memory: 2Gi
        ports:
          - expose: true
            port: 5432
            protocol: TCP
        env:
        - name: POSTGRES_DB
          value: mydb
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          value: kvsecretpwd123
      traits:
        - type: scaler
          properties:
            replicas: 1
        - type: storage
          properties:
            pvc:
              - name: "postgresdb-pvc"
                storageClassName: local-path
                resources:
                  requests:
                    storage: "2Gi"
                mountPath: "/var/lib/postgresql/data"
```

### 参数说明 (statefulset)


 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 labels | Specify the labels in the workload。 | map[string]string | false |  |  
 annotations | Specify the annotations in the workload。 | map[string]string | false |  |  
 image | Which image would you like to use for your service。 | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service。 | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service。 | []string | false |  |  
 ports | Which ports do you want customer traffic sent to, defaults to 80。 | [[]ports](#ports-statefulset) | false |  |  
 cmd | Commands to run in the container。 | []string | false |  |  
 args | Arguments to the entrypoint。 | []string | false |  |  
 env | Define arguments by using environment variables。 | [[]env](#env-statefulset) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)。 | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container。 | string | false |  |  
 volumeMounts |  | [volumeMounts](#volumemounts-statefulset) | false |  |  
 volumes | Deprecated field, use volumeMounts instead。 | [[]volumes](#volumes-statefulset) | false |  |  
 livenessProbe | Instructions for assessing whether the container is alive。 | [livenessProbe](#livenessprobe-statefulset) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic。 | [readinessProbe](#readinessprobe-statefulset) | false |  |  
 hostAliases | Specify the hostAliases to add。 | [[]hostAliases](#hostaliases-statefulset) | false |  |  


#### ports (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | Number of port to expose on the pod's IP address。 | int | true |  |  
 containerPort | Number of container port to connect to, defaults to port。 | int | false |  |  
 name | Name of the port。 | string | false |  |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP。 | "TCP" or "UDP" or "SCTP" | false | TCP |  
 expose | Specify if the port should be exposed。 | bool | false | false |  
 nodePort | exposed node port. Only Valid when exposeType is NodePort。 | int | false |  |  


#### env (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | Environment variable name。 | string | true |  |  
 value | The value of the environment variable。 | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from。 | [valueFrom](#valuefrom-statefulset) | false |  |  


##### valueFrom (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace。 | [secretKeyRef](#secretkeyref-statefulset) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace。 | [configMapKeyRef](#configmapkeyref-statefulset) | false |  |  


##### secretKeyRef (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the secret in the pod's namespace to select from。 | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key。 | string | true |  |  


##### configMapKeyRef (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the config map in the pod's namespace to select from。 | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key。 | string | true |  |  


#### volumeMounts (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 pvc | Mount PVC type volume。 | [[]pvc](#pvc-statefulset) | false |  |  
 configMap | Mount ConfigMap type volume。 | [[]configMap](#configmap-statefulset) | false |  |  
 secret | Mount Secret type volume。 | [[]secret](#secret-statefulset) | false |  |  
 emptyDir | Mount EmptyDir type volume。 | [[]emptyDir](#emptydir-statefulset) | false |  |  
 hostPath | Mount HostPath type volume。 | [[]hostPath](#hostpath-statefulset) | false |  |  


##### pvc (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 claimName | The name of the PVC。 | string | true |  |  


##### configMap (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 cmName |  | string | true |  |  
 items |  | [[]items](#items-statefulset) | false |  |  


##### items (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### secret (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 secretName |  | string | true |  |  
 items |  | [[]items](#items-statefulset) | false |  |  


##### items (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### emptyDir (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 medium |  | "" or "Memory" | false | empty |  


##### hostPath (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 path |  | string | true |  |  


#### volumes (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### livenessProbe (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-statefulset) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-statefulset) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-statefulset) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-statefulset) | false |  |  


##### httpHeaders (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


#### readinessProbe (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-statefulset) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-statefulset) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-statefulset) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-statefulset) | false |  |  


##### httpHeaders (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


#### hostAliases (statefulset)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 ip |  | string | true |  |  
 hostnames |  | []string | true |  |  


## Task

### 描述

Describes jobs that run code or a script to completion。

### Underlying Kubernetes Resources (task)

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


 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 labels | Specify the labels in the workload。 | map[string]string | false |  |  
 annotations | Specify the annotations in the workload。 | map[string]string | false |  |  
 count | Specify number of tasks to run in parallel。 | int | false | 1 |  
 image | Which image would you like to use for your service。 | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service。 | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service。 | []string | false |  |  
 restart | Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never。 | string | false | Never |  
 cmd | Commands to run in the container。 | []string | false |  |  
 env | Define arguments by using environment variables。 | [[]env](#env-task) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)。 | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container。 | string | false |  |  
 volumes | Declare volumes and volumeMounts。 | [[]volumes](#volumes-task) | false |  |  
 livenessProbe | Instructions for assessing whether the container is alive。 | [livenessProbe](#livenessprobe-task) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic。 | [readinessProbe](#readinessprobe-task) | false |  |  


#### env (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | Environment variable name。 | string | true |  |  
 value | The value of the environment variable。 | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from。 | [valueFrom](#valuefrom-task) | false |  |  


##### valueFrom (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace。 | [secretKeyRef](#secretkeyref-task) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace。 | [configMapKeyRef](#configmapkeyref-task) | false |  |  


##### secretKeyRef (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the secret in the pod's namespace to select from。 | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key。 | string | true |  |  


##### configMapKeyRef (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the config map in the pod's namespace to select from。 | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key。 | string | true |  |  


#### volumes (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### livenessProbe (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-task) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-task) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-task) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-task) | false |  |  


##### httpHeaders (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


#### readinessProbe (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-task) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-task) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-task) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-task) | false |  |  


##### httpHeaders (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (task)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


## Webservice

### 描述

Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers。

### Underlying Kubernetes Resources (webservice)

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


 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 labels | Specify the labels in the workload。 | map[string]string | false |  |  
 annotations | Specify the annotations in the workload。 | map[string]string | false |  |  
 image | Which image would you like to use for your service。 | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service。 | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service。 | []string | false |  |  
 ports | Which ports do you want customer traffic sent to, defaults to 80。 | [[]ports](#ports-webservice) | false |  |  
 cmd | Commands to run in the container。 | []string | false |  |  
 args | Arguments to the entrypoint。 | []string | false |  |  
 env | Define arguments by using environment variables。 | [[]env](#env-webservice) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)。 | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container。 | string | false |  |  
 limit |  | [limit](#limit-webservice) | false |  |  
 volumeMounts |  | [volumeMounts](#volumemounts-webservice) | false |  |  
 volumes | Deprecated field, use volumeMounts instead。 | [[]volumes](#volumes-webservice) | false |  |  
 livenessProbe | Instructions for assessing whether the container is alive。 | [livenessProbe](#livenessprobe-webservice) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic。 | [readinessProbe](#readinessprobe-webservice) | false |  |  
 hostAliases | Specify the hostAliases to add。 | [[]hostAliases](#hostaliases-webservice) | false |  |  


#### ports (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | Number of port to expose on the pod's IP address。 | int | true |  |  
 containerPort | Number of container port to connect to, defaults to port。 | int | false |  |  
 name | Name of the port。 | string | false |  |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP。 | "TCP" or "UDP" or "SCTP" | false | TCP |  
 expose | Specify if the port should be exposed。 | bool | false | false |  
 nodePort | exposed node port. Only Valid when exposeType is NodePort。 | int | false |  |  


#### env (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | Environment variable name。 | string | true |  |  
 value | The value of the environment variable。 | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from。 | [valueFrom](#valuefrom-webservice) | false |  |  


##### valueFrom (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace。 | [secretKeyRef](#secretkeyref-webservice) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace。 | [configMapKeyRef](#configmapkeyref-webservice) | false |  |  


##### secretKeyRef (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the secret in the pod's namespace to select from。 | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key。 | string | true |  |  


##### configMapKeyRef (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name | The name of the config map in the pod's namespace to select from。 | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key。 | string | true |  |  


#### limit (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 cpu |  | string | false |  |  
 memory |  | string | false |  |  


#### volumeMounts (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 pvc | Mount PVC type volume。 | [[]pvc](#pvc-webservice) | false |  |  
 configMap | Mount ConfigMap type volume。 | [[]configMap](#configmap-webservice) | false |  |  
 secret | Mount Secret type volume。 | [[]secret](#secret-webservice) | false |  |  
 emptyDir | Mount EmptyDir type volume。 | [[]emptyDir](#emptydir-webservice) | false |  |  
 hostPath | Mount HostPath type volume。 | [[]hostPath](#hostpath-webservice) | false |  |  


##### pvc (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 claimName | The name of the PVC。 | string | true |  |  


##### configMap (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 cmName |  | string | true |  |  
 items |  | [[]items](#items-webservice) | false |  |  


##### items (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### secret (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 secretName |  | string | true |  |  
 items |  | [[]items](#items-webservice) | false |  |  


##### items (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### emptyDir (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 medium |  | "" or "Memory" | false | empty |  


##### hostPath (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 path |  | string | true |  |  


#### volumes (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir。 | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### livenessProbe (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-webservice) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-webservice) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-webservice) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-webservice) | false |  |  


##### httpHeaders (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


#### readinessProbe (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute。 | [exec](#exec-webservice) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute。 | [httpGet](#httpget-webservice) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute。 | [tcpSocket](#tcpsocket-webservice) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated。 | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe。 | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out。 | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed。 | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe)。 | int | false | 3 |  


##### exec (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures。 | []string | true |  |  


##### httpGet (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed。 | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed。 | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-webservice) | false |  |  


##### httpHeaders (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health。 | int | true |  |  


#### hostAliases (webservice)

 名称 | 描述 | 类型 | 是否必须 | 默认值 | 不可变 
 ------ | ------ | ------ | ------------ | --------- | --------- 
 ip |  | string | true |  |  
 hostnames |  | []string | true |  |  


