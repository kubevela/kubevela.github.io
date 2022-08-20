---
title: Built-in Component Type
---

This documentation will walk through all the built-in component types sorted alphabetically.

> It was generated automatically by [scripts](../../contributor/cli-ref-doc), please don't update manually, last updated at 2022-08-19T17:50:10+08:00.

## Cron-Task

### Description

Describes cron jobs that run code or a script to completion.

### Underlying Kubernetes Resources (cron-task)

- cronjobs.batch

### Examples (cron-task)

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

### Specification (cron-task)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labels | Specify the labels in the workload. | map[string]:string | false |  
 annotations | Specify the annotations in the workload. | map[string]:string | false |  
 schedule | Specify the schedule in Cron format, see https://en.wikipedia.org/wiki/Cron. | string | true |  
 startingDeadlineSeconds | Specify deadline in seconds for starting the job if it misses scheduled. | int | false |  
 suspend | Suspend subsequent executions. | bool | false | false 
 concurrencyPolicy | Specifies how to treat concurrent executions of a Job. | string | false | Allow 
 successfulJobsHistoryLimit | The number of successful finished jobs to retain. | int | false | 3 
 failedJobsHistoryLimit | The number of failed finished jobs to retain. | int | false | 1 
 count | Specify number of tasks to run in parallel. | int | false | 1 
 image | Which image would you like to use for your service. | string | true |  
 imagePullPolicy | Specify image pull policy for your service. | string | false |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  
 restart | Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never. | string | false | Never 
 cmd | Commands to run in the container. | []string | false |  
 env | Define arguments by using environment variables. | [[]env](#env-cron-task) | false |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  
 volumes | Declare volumes and volumeMounts. | [[]volumes](#volumes-cron-task) | false |  
 hostAliases | An optional list of hosts and IPs that will be injected into the pod's hosts file. | [[]hostAliases](#hostaliases-cron-task) | false |  
 ttlSecondsAfterFinished | Limits the lifetime of a Job that has finished. | int | false |  
 activeDeadlineSeconds | The duration in seconds relative to the startTime that the job may be continuously active before the system tries to terminate it. | int | false |  
 backoffLimit | The number of retries before marking this job failed. | int | false | 6 
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-cron-task) | false |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-cron-task) | false |  


#### env (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Environment variable name. | string | true |  
 value | The value of the environment variable. | string | false |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-cron-task) | false |  


##### valueFrom (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-cron-task) | false |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-cron-task) | false |  


##### secretKeyRef (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  


##### configMapKeyRef (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  


#### volumes (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | string | false | empty 
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | string | false | emptyDir 


#### hostAliases (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 ip |  | string | true |  
 hostnames |  | []string | true |  


#### livenessProbe (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-cron-task) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-cron-task) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-cron-task) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-cron-task) | false |  


##### httpHeaders (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


#### readinessProbe (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-cron-task) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-cron-task) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-cron-task) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-cron-task) | false |  


##### httpHeaders (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (cron-task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


## Daemon

### Description

Describes daemonset services in Kubernetes.

### Underlying Kubernetes Resources (daemon)

- daemonsets.apps

### Examples (daemon)

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

### Specification (daemon)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labels | Specify the labels in the workload. | map[string]:string | false |  
 annotations | Specify the annotations in the workload. | map[string]:string | false |  
 image | Which image would you like to use for your service. | string | true |  
 imagePullPolicy | Specify image pull policy for your service. | string | false |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  
 ports | Which ports do you want customer traffic sent to, defaults to 80. | [[]ports](#ports-daemon) | false |  
 cmd | Commands to run in the container. | []string | false |  
 env | Define arguments by using environment variables. | [[]env](#env-daemon) | false |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  
 volumeMounts |  | [volumeMounts](#volumemounts-daemon) | false |  
 volumes | Deprecated field, use volumeMounts instead. | [[]volumes](#volumes-daemon) | false |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-daemon) | false |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-daemon) | false |  
 hostAliases | Specify the hostAliases to add. | [[]hostAliases](#hostaliases-daemon) | false |  


#### ports (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | Number of port to expose on the pod's IP address. | int | true |  
 name | Name of the port. | string | false |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP. | string | false | TCP 
 expose | Specify if the port should be exposed. | bool | false | false 


#### env (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Environment variable name. | string | true |  
 value | The value of the environment variable. | string | false |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-daemon) | false |  


##### valueFrom (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-daemon) | false |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-daemon) | false |  


##### secretKeyRef (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  


##### configMapKeyRef (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  


#### volumeMounts (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 pvc | Mount PVC type volume. | [[]pvc](#pvc-daemon) | false |  
 configMap | Mount ConfigMap type volume. | [[]configMap](#configmap-daemon) | false |  
 secret | Mount Secret type volume. | [[]secret](#secret-daemon) | false |  
 emptyDir | Mount EmptyDir type volume. | [[]emptyDir](#emptydir-daemon) | false |  
 hostPath | Mount HostPath type volume. | [[]hostPath](#hostpath-daemon) | false |  


##### pvc (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 claimName | The name of the PVC. | string | true |  


##### configMap (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 defaultMode |  | int | false | 420 
 cmName |  | string | true |  
 items |  | [[]items](#items-daemon) | false |  


##### items (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### secret (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 defaultMode |  | int | false | 420 
 secretName |  | string | true |  
 items |  | [[]items](#items-daemon) | false |  


##### items (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### emptyDir (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | string | false | empty 


##### hostPath (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 mountPropagation |  | string | false |  
 path |  | string | true |  
 readOnly |  | bool | false |  


#### volumes (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | string | false | empty 
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | string | false | emptyDir 


#### livenessProbe (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-daemon) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-daemon) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-daemon) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 host |  | string | false |  
 scheme |  | string | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-daemon) | false |  


##### httpHeaders (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


#### readinessProbe (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-daemon) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-daemon) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-daemon) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 host |  | string | false |  
 scheme |  | string | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-daemon) | false |  


##### httpHeaders (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


#### hostAliases (daemon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 ip |  | string | true |  
 hostnames |  | []string | true |  


## K8s-Objects

### Description

K8s-objects allow users to specify raw K8s objects in properties.

### Examples (k8s-objects)

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

### Specification (k8s-objects)
|  NAME   | DESCRIPTION  |        TYPE          | REQUIRED | DEFAULT |
|---------|-------------|-----------------------|----------|---------|
| objects | A slice of Kubernetes resource manifests   | [][Kubernetes-Objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/) | true     |         |

## Task

### Description

Describes jobs that run code or a script to completion.

### Underlying Kubernetes Resources (task)

- jobs.batch

### Examples (task)

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

### Specification (task)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labels | Specify the labels in the workload. | map[string]:string | false |  
 annotations | Specify the annotations in the workload. | map[string]:string | false |  
 count | Specify number of tasks to run in parallel. | int | false | 1 
 image | Which image would you like to use for your service. | string | true |  
 imagePullPolicy | Specify image pull policy for your service. | string | false |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  
 restart | Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never. | string | false | Never 
 cmd | Commands to run in the container. | []string | false |  
 env | Define arguments by using environment variables. | [[]env](#env-task) | false |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  
 volumes | Declare volumes and volumeMounts. | [[]volumes](#volumes-task) | false |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-task) | false |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-task) | false |  


#### env (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Environment variable name. | string | true |  
 value | The value of the environment variable. | string | false |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-task) | false |  


##### valueFrom (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-task) | false |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-task) | false |  


##### secretKeyRef (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  


##### configMapKeyRef (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  


#### volumes (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | string | false | empty 
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | string | false | emptyDir 


#### livenessProbe (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-task) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-task) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-task) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-task) | false |  


##### httpHeaders (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


#### readinessProbe (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-task) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-task) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-task) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-task) | false |  


##### httpHeaders (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (task)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


## Webservice

### Description

Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers.

### Underlying Kubernetes Resources (webservice)

- deployments.apps

### Examples (webservice)

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

### Specification (webservice)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labels | Specify the labels in the workload. | map[string]:string | false |  
 annotations | Specify the annotations in the workload. | map[string]:string | false |  
 image | Which image would you like to use for your service. | string | true |  
 imagePullPolicy | Specify image pull policy for your service. | string | false |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  
 ports | Which ports do you want customer traffic sent to, defaults to 80. | [[]ports](#ports-webservice) | false |  
 cmd | Commands to run in the container. | []string | false |  
 env | Define arguments by using environment variables. | [[]env](#env-webservice) | false |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  
 volumeMounts |  | [volumeMounts](#volumemounts-webservice) | false |  
 volumes | Deprecated field, use volumeMounts instead. | [[]volumes](#volumes-webservice) | false |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-webservice) | false |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-webservice) | false |  
 hostAliases | Specify the hostAliases to add. | [[]hostAliases](#hostaliases-webservice) | false |  


#### ports (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | Number of port to expose on the pod's IP address. | int | true |  
 name | Name of the port. | string | false |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP. | string | false | TCP 
 expose | Specify if the port should be exposed. | bool | false | false 


#### env (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Environment variable name. | string | true |  
 value | The value of the environment variable. | string | false |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-webservice) | false |  


##### valueFrom (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-webservice) | false |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-webservice) | false |  


##### secretKeyRef (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  


##### configMapKeyRef (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  


#### volumeMounts (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 pvc | Mount PVC type volume. | [[]pvc](#pvc-webservice) | false |  
 configMap | Mount ConfigMap type volume. | [[]configMap](#configmap-webservice) | false |  
 secret | Mount Secret type volume. | [[]secret](#secret-webservice) | false |  
 emptyDir | Mount EmptyDir type volume. | [[]emptyDir](#emptydir-webservice) | false |  
 hostPath | Mount HostPath type volume. | [[]hostPath](#hostpath-webservice) | false |  


##### pvc (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 claimName | The name of the PVC. | string | true |  


##### configMap (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 cmName |  | string | true |  
 items |  | [[]items](#items-webservice) | false |  


##### items (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### secret (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 secretName |  | string | true |  
 items |  | [[]items](#items-webservice) | false |  


##### items (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### emptyDir (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 medium |  | string | false | empty 


##### hostPath (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 path |  | string | true |  


#### volumes (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 medium |  | string | false | empty 
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | string | false | emptyDir 


#### livenessProbe (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-webservice) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-webservice) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-webservice) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 host |  | string | false |  
 scheme |  | string | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-webservice) | false |  


##### httpHeaders (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


#### readinessProbe (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-webservice) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-webservice) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-webservice) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 host |  | string | false |  
 scheme |  | string | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-webservice) | false |  


##### httpHeaders (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


#### hostAliases (webservice)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 ip |  | string | true |  
 hostnames |  | []string | true |  


