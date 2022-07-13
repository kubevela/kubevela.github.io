---
title: Built-in Component Type
---

This documentation will walk through the built-in component types.

## Webservice

### Description

Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers.

### Properties

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 cmd | Commands to run in the container | []string | false |
 env | Define arguments by using environment variables | [[]env](#env) | false |
 volumeMounts |  | [volumeMounts](#volumemounts) | false |
 labels | Specify the labels in the workload | map[string]string | false |
 annotations | Specify the annotations in the workload | map[string]string | false |
 image | Which image would you like to use for your service | string | true |
 ports | Which ports do you want customer traffic sent to | [[]ports](#ports) | false |
 imagePullPolicy | Specify image pull policy for your service. Should be "Always","Never" or "IfNotPresent". | string | false |
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core) | string | false |
 memory | Specifies the attributes of the memory resource required for the container. | string | false |
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe) | false |
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe) | false |
 imagePullSecrets | Specify image pull secrets for your service | []string | false |
 hostAliases | Specify the hostAliases to add | [[]hostAliases](#hostaliases) | true |


#### readinessProbe

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec) | false |
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget) | false |
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket) | false |
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | true | 0
 periodSeconds | How often, in seconds, to execute the probe. | int | true | 10
 timeoutSeconds | Number of seconds after which the probe times out. | int | true | 1
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | true | 1
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | true | 3


##### tcpSocket

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 port | The TCP socket within the container that should be probed to assess container health. | int | true |


##### httpGet

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |
 httpHeaders |  | [[]httpHeaders](#httpheaders) | false |


###### httpHeaders

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 value |  | string | true |


##### exec

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |


##### hostAliases

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 ip |  | string | true |
 hostnames |  | []string | true |


#### livenessProbe

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 hostAliases | Specify the hostAliases to add | [[]hostAliases](#hostaliases) | true |
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec) | false |
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget) | false |
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket) | false |
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | true | 0
 periodSeconds | How often, in seconds, to execute the probe. | int | true | 10
 timeoutSeconds | Number of seconds after which the probe times out. | int | true | 1
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | true | 1
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | true | 3

#### ports

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name | Name of the port | string | false |
 port | Number of port to expose on the pod's IP address | int | true |
 protocol | Protocol for port. Must be UDP, TCP, or SCTP | string | true | TCP
 expose | Specify if the port should be exposed | bool | true | false


#### volumeMounts

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 pvc | Mount PVC type volume | [[]pvc](#pvc) | false |
 configMap | Mount ConfigMap type volume | [[]configMap](#configmap) | false |
 secret | Mount Secret type volume | [[]secret](#secret) | false |
 emptyDir | Mount EmptyDir type volume | [[]emptyDir](#emptydir) | false |
 hostPath | Mount HostPath type volume | [[]hostPath](#hostpath) | false |


##### hostPath

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 path |  | string | true |
 name |  | string | true |
 mountPath |  | string | true |


##### emptyDir

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 medium |  | string | true | empty


##### secret

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 defaultMode |  | int | true | 420
 items |  | [[]items](#items) | false |
 secretName |  | string | true |


###### items

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 path |  | string | true |
 key |  | string | true |
 mode |  | int | true | 511


##### configMap

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 defaultMode |  | int | true | 420
 cmName |  | string | true |
 items |  | [[]items](#items) | false |


###### items

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 path |  | string | true |
 key |  | string | true |
 mode |  | int | true | 511


##### pvc

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 claimName | The name of the PVC | string | true |


#### env

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name | Environment variable name | string | true |
 value | The value of the environment variable | string | false |
 valueFrom | Specifies a source the value of this var should come from | [valueFrom](#valuefrom) | false |


##### valueFrom

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 secretKeyRef | Selects a key of a secret in the pod's namespace | [secretKeyRef](#secretkeyref) | false |
 configMapKeyRef | Selects a key of a config map in the pod's namespace | [configMapKeyRef](#configmapkeyref) | false |


###### configMapKeyRef

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name | The name of the config map in the pod's namespace to select from | string | true |
 key | The key of the config map to select from. Must be a valid secret key | string | true |


###### secretKeyRef

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name | The name of the secret in the pod's namespace to select from | string | true |
 key | The key of the secret to select from. Must be a valid secret key | string | true |

### Examples

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

Describes long-running, scalable, containerized services that running at backend. They do NOT have network endpoint to receive external network traffic. 

### Parameters

| NAME             | DESCRIPTION                                                                               | TYPE                              | REQUIRED | DEFAULT |
| ---------------- | ----------------------------------------------------------------------------------------- | --------------------------------- | -------- | ------- |
| cmd              | Commands to run in the container                                                          | []string                          | false    |         |
| env              | Define arguments by using environment variables                                           | [[]env](#env)                     | false    |         |
| image            | Which image would you like to use for your service                                        | string                            | true     |         |
| imagePullPolicy  | Specify image pull policy for your service. Should be "Always","Never" or "IfNotPresent".                                               | string                            | false    |         |
| cpu              | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)          | string                            | false    |         |
| memory           | Specifies the attributes of the memory resource required for the container.               | string                            | false    |         |
| volumeMounts     |  | [volumeMounts](#volumemounts) | false |
| livenessProbe    | Instructions for assessing whether the container is alive.                                | [livenessProbe](#livenessprobe)   | false    |         |
| readinessProbe   | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe) | false    |         |
| imagePullSecrets | Specify image pull secrets for your service                                               | []string                          | false    |         |

### Examples

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

Describes jobs that run code or a script to completion.

### Parameters

| NAME             | DESCRIPTION                                                                                      | TYPE                              | REQUIRED | DEFAULT |
| ---------------- | ------------------------------------------------------------------------------------------------ | --------------------------------- | -------- | ------- |
| cmd              | Commands to run in the container                                                                 | []string                          | false    |         |
| env              | Define arguments by using environment variables                                                  | [[]env](#env)                     | false    |         |
| count            | Specify number of tasks to run in parallel                                                       | int                               | true     | 1       |
| restart          | Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never. | string                            | true     | Never   |
| image            | Which image would you like to use for your service                                               | string                            | true     |         |
| cpu              | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)                 | string                            | false    |         |
| memory           | Specifies the attributes of the memory resource required for the container.                      | string                            | false    |         |
| volumeMounts     |  | [volumeMounts](#volumemounts)                                                                 | false |
| livenessProbe    | Instructions for assessing whether the container is alive.                                       | [livenessProbe](#livenessprobe)   | false    |         |
| readinessProbe   | Instructions for assessing whether the container is in a suitable state to serve traffic.        | [readinessProbe](#readinessprobe) | false    |         |
| labels           | Specify the labels in the workload                                                               | []string                          | false    |         |
| annotations      | Specify the annotations in the workload                                                          | []string                          | false    |         |
| imagePullPolicy  | Specify image pull policy for your service                                                       | string                            | false    |         |
| imagePullSecrets | Specify image pull secrets for your service                                                      | []string                          | false    |         |

### Examples

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

Describes cron jobs that run code or a script to completion.

### Parameters

| NAME                       | DESCRIPTION                                                                                      | TYPE                              | REQUIRED | DEFAULT |
|----------------------------|--------------------------------------------------------------------------------------------------|-----------------------------------|----------|---------|
| cmd                        | Commands to run in the container                                                                 | []string                          | false    |         |
| env                        | Define arguments by using environment variables                                                  | [[]env](#env)                     | false    |         |
| schedule                   | Specify the schedule in [Cron format](https://en.wikipedia.org/wiki/Cron)                        | string                            | true     |         |
| suspend                    | Suspend subsequent executions                                                                    | bool                              | false    | false   |
| concurrencyPolicy          | Specifies how to treat concurrent executions of a Job                                            | string                            | false    | Allow   |
| successfulJobsHistoryLimit | The number of successful finished jobs to retain                                                 | int                               | false    | 3       |
| failedJobsHistoryLimit     | The number of failed finished jobs to retain                                                     | int                               | false    | 1       |
| count                      | Specify number of tasks to run in parallel                                                       | int                               | true     | 1       |
| restart                    | Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never. | string                            | true     | Never   |
| image                      | Which image would you like to use for your service                                               | string                            | true     |         |
| cpu                        | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)                 | string                            | false    |         |
| memory                     | Specifies the attributes of the memory resource required for the container.                      | string                            | false    |         |
| volumeMounts               |  | [volumeMounts](#volumemounts)                                                                 | false |
| livenessProbe              | Instructions for assessing whether the container is alive.                                       | [livenessProbe](#livenessprobe)   | false    |         |
| readinessProbe             | Instructions for assessing whether the container is in a suitable state to serve traffic.        | [readinessProbe](#readinessprobe) | false    |         |
| labels                     | Specify the labels in the workload                                                               | []string                          | false    |         |
| annotations                | Specify the annotations in the workload                                                          | []string                          | false    |         |
| imagePullPolicy            | Specify image pull policy for your service                                                       | string                            | false    |         |
| imagePullSecrets           | Specify image pull secrets for your service                                                      | []string                          | false    |         |

### Examples

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

This type allow you to nest Kubernetes manifests into properties.

### Parameters

|  NAME   | DESCRIPTION  |        TYPE          | REQUIRED | DEFAULT |
|---------|-------------|-----------------------|----------|---------|
| objects |  Kubernetes resource manifest   | [[]K8s-Object](#k8s-object) | true     |         |

### Examples

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
