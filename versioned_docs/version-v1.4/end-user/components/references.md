---
title: Built-in Component Type
---

This documentation will walk through the built-in component types.

## Helm

### Parameters

| Parameters      | Description                                                                                                                                                                                                                                                                                                                                                              | Example                            |
| --------------- | ----------- | ---------------------------------- |
| repoType        | required, indicates where it's from                                                                                                                                                                                                                                                                                                                                      | Helm                               |
| pullInterval    | optional, synchronize with Helm Repo, tunning interval and 5 minutes by default                                                                                                                                                                                                                                                                                          | 10m                                |
| url             | required, Helm Reop address, it supports http/https                                                                                                                                                                                                                                                                                                                      | https://charts.bitnami.com/bitnami |
| secretRef       | optional, The name of the Secret object that holds the credentials required to pull the repo. The username and password fields must be included in the HTTP/S basic authentication Secret. For TLS the secret must contain a certFile and keyFile, and/or caCert fields. For TLS authentication, the secret must contain a certFile / keyFile field and/or caCert field. | sec-name                           |
| timeout         | optional, timeout for pulling repo index                                                                                                                                                                                                                                                                                                                                 | 60s                                |
| chart           | required, chart title                                                                                                                                                                                                                                                                                                                                                    | redis-cluster                      |
| version         | optional, chart version, * by default                                                                                                                                                                                                                                                                                                                                    | 6.2.7                              |
| targetNamespace | optional, the namespace to install chart, decided by chart itself                                                                                                                                                                                                                                                                                                        | your-ns                            |
| releaseName     | optional, release name after installed                                                                                                                                                                                                                                                                                                                                   | your-rn                            |
| values          | optional, override the Values.yaml inchart, using for the rendering of Helm                                                                                                                                                                                                                                                                                              |                                    |
| installTimeout  | optional, the timeout for operation `helm install`, and 10 minutes by default                           | 20m                                |


### Example

```
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis-comp
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        url: https://charts.bitnami.com/bitnami
        repoType: helm
```



## Helm ( repoType: oss )

### Parameters

| Parameters | Description | Example |
| ---------- | ----------- | ------- |
| repoType        | required, indicates where it's from                                                                                             | oss                         |
| pullInterval    | optional, synchronize with bucket, tunning interval and 5 minutes by default                                                    | 10m                         |
| url             | required, bucket's endpoint and no need to fill in with scheme                                                                  | oss-cn-beijing.aliyuncs.com |
| secretRef       | optional, Save the name of a Secret, which is the credential to read the bucket. Secret contains accesskey and secretkey fields | sec-name                    |
| timeout         | optional, The timeout period of the download operation, the default is 20s                                                      | 60s                         |
| chart           | required, Chart storage path (key)                                                                                              | ./chart/podinfo-5.1.3.tgz   |
| version         | optional, In OSS source, this parameter has no effect                                                                           |                             |
| targetNamespace | optional, The namespace of the installed chart, which is determined by the chart itself by default                              | your-ns                     |
| releaseName     | optional, Installed release name                                                                                                | your-rn                     |
| values          | optional, Overwrite the Values.yaml of the chart for Helm rendering.                                                            |                             |
| oss.bucketName  | required, bucket name                                                                                                           | your-bucket                 |
| oss.provider    | optional, Optional generic or aws, fill in aws if the certificate is obtained from aws EC2. The default is generic.             | generic                     |
| oss.region      | optional, bucket region                                                                                                         |                             |

### Example

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: helm
      properties:
        repoType: oss
        # required if bucket is private
        secretRef: bucket-secret
        chart: ./chart/podinfo-5.1.3.tgz
        url: oss-cn-beijing.aliyuncs.com
        oss:
            bucketName: definition-registry
```

## Helm ( repoType: git )

### Parameters

| Parameters | Description | Example |
| ---------- | ----------- | ------- |
| repoType        | required, indicates where it's from                                                                                                                                                                                                                                                           | git                                             |
| pullInterval    | optional, synchronize with Git Repo, tunning interval and 5 minutes by default                                                                                                                                                                                                                | 10m                                             |
| url             | required, Git Repo address                                                                                                                                                                                                                                                                    | https://github.com/oam-dev/terraform-controller |
| secretRef       | optional, The name of the Secret object that holds the credentials required to pull the Git repository. For HTTP/S basic authentication, the Secret must contain the username and password fields. For SSH authentication, the identity, identity.pub and known_hosts fields must be included | sec-name                                        |
| timeout         | optional, The timeout period of the download operation, the default is 20s                                                                                                                                                                                                                    | 60s                                             |
| chart           | required, Chart storage path (key)                                                                                                                                                                                                                                                            | ./chart/podinfo-5.1.3.tgz                       |
| version         | optional, In Git source, this parameter has no effect                                                                                                                                                                                                                                         |                                                 |
| targetNamespace | optional, the namespace to install chart, decided by chart itself                                                                                                                                                                                                                             | your-ns                                         |
| releaseName     | optional, Installed release name                                                                                                                                                                                                                                                              | your-rn                                         |
| values          | optional, Overwrite the Values.yaml of the chart for Helm rendering.                                                                                                                                                                                                                          |                                                 |
| git.branch      | optional, Git branch, master by default                                                                                                                                                                                                                                                       | dev                                             |

### Example

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
   name: app-delivering-chart
spec:
   components:
     - name: terraform-controller
       type: helm
       properties:
          repoType: git
          url: https://github.com/oam-dev/terraform-controller
          chart: ./chart
          git:
          	branch: master
```

## Webservice

### Description

Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers.

### Properties

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 cmd | Commands to run in the container | []string | false |
 env | Define arguments by using environment variables | [[]env](#env) | false |
 volumeMounts |  | [volumeMounts](#volumeMounts) | false |
 labels | Specify the labels in the workload | map[string]string | false |
 annotations | Specify the annotations in the workload | map[string]string | false |
 image | Which image would you like to use for your service | string | true |
 ports | Which ports do you want customer traffic sent to, defaults to 80 | [[]ports](#ports) | false |
 imagePullPolicy | Specify image pull policy for your service | string | false |
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core) | string | false |
 memory | Specifies the attributes of the memory resource required for the container. | string | false |
 volumes | Deprecated field, use volumeMounts instead. | [[]volumes](#volumes) | false |
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessProbe) | false |
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessProbe) | false |
 imagePullSecrets | Specify image pull secrets for your service | []string | false |


#### readinessProbe

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 hostAliases | Specify the hostAliases to add | [[]hostAliases](#hostAliases) | true |
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec) | false |
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpGet) | false |
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpSocket) | false |
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
 httpHeaders |  | [[]httpHeaders](#httpHeaders) | false |


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
 hostAliases | Specify the hostAliases to add | [[]hostAliases](#hostAliases) | true |
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec) | false |
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpGet) | false |
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpSocket) | false |
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
 httpHeaders |  | [[]httpHeaders](#httpHeaders) | false |


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


#### volumes

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name |  | string | true |
 mountPath |  | string | true |
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir" | string | true |


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
 configMap | Mount ConfigMap type volume | [[]configMap](#configMap) | false |
 secret | Mount Secret type volume | [[]secret](#secret) | false |
 emptyDir | Mount EmptyDir type volume | [[]emptyDir](#emptyDir) | false |
 hostPath | Mount HostPath type volume | [[]hostPath](#hostPath) | false |


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
 valueFrom | Specifies a source the value of this var should come from | [valueFrom](#valueFrom) | false |


##### valueFrom

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 secretKeyRef | Selects a key of a secret in the pod's namespace | [secretKeyRef](#secretKeyRef) | false |
 configMapKeyRef | Selects a key of a config map in the pod's namespace | [configMapKeyRef](#configMapKeyRef) | false |


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
| imagePullPolicy  | Specify image pull policy for your service                                                | string                            | false    |         |
| cpu              | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)          | string                            | false    |         |
| memory           | Specifies the attributes of the memory resource required for the container.               | string                            | false    |         |
| volumes          | Declare volumes and volumeMounts                                                          | [[]volumes](#volumes)             | false    |         |
| livenessProbe    | Instructions for assessing whether the container is alive.                                | [livenessProbe](#livenessProbe)   | false    |         |
| readinessProbe   | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessProbe) | false    |         |
| imagePullSecrets | Specify image pull secrets for your service                                               | []string                          | false    |         |


### readinessProbe
| NAME                | DESCRIPTION                                                                                          | TYPE                    | REQUIRED | DEFAULT |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | -------- | ------- |
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)           | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                         |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                         |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)     | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                         |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                         |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket) | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                         |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                         |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                     | true     | 0       |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                     | true     | 10      |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                     | true     | 1       |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                     | true     | 1       |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                     | true     | 3       |
|                     | not ready (readiness probe).                                                                         |                         |          |         |


##### tcpSocket
| NAME | DESCRIPTION                                                                           | TYPE | REQUIRED | DEFAULT |
| ---- | ------------------------------------------------------------------------------------- | ---- | -------- | ------- |
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |


#### httpGet
| NAME        | DESCRIPTION                                                                           | TYPE                          | REQUIRED | DEFAULT |
| ----------- | ------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------- |
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |


##### httpHeaders
| NAME  | DESCRIPTION | TYPE   | REQUIRED | DEFAULT |
| ----- | ----------- | ------ | -------- | ------- |
| name  |             | string | true     |         |
| value |             | string | true     |         |


##### exec
| NAME    | DESCRIPTION                                                                                         | TYPE     | REQUIRED | DEFAULT |
| ------- | --------------------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| command | A command to be executed inside the container to assess its health. Each space delimited token of   | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes, |          |          |         |
|         | whilst all other exit codes are considered failures.                                                |          |          |         |


### livenessProbe
| NAME                | DESCRIPTION                                                                                          | TYPE                    | REQUIRED | DEFAULT |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | -------- | ------- |
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)           | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                         |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                         |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)     | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                         |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                         |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket) | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                         |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                         |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                     | true     | 0       |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                     | true     | 10      |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                     | true     | 1       |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                     | true     | 1       |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                     | true     | 3       |
|                     | not ready (readiness probe).                                                                         |                         |          |         |


#### tcpSocket
| NAME | DESCRIPTION                                                                           | TYPE | REQUIRED | DEFAULT |
| ---- | ------------------------------------------------------------------------------------- | ---- | -------- | ------- |
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |


#### httpGet
| NAME        | DESCRIPTION                                                                           | TYPE                          | REQUIRED | DEFAULT |
| ----------- | ------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------- |
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |


##### httpHeaders
| NAME  | DESCRIPTION | TYPE   | REQUIRED | DEFAULT |
| ----- | ----------- | ------ | -------- | ------- |
| name  |             | string | true     |         |
| value |             | string | true     |         |


#### exec
| NAME    | DESCRIPTION                                                                                         | TYPE     | REQUIRED | DEFAULT |
| ------- | --------------------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| command | A command to be executed inside the container to assess its health. Each space delimited token of   | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes, |          |          |         |
|         | whilst all other exit codes are considered failures.                                                |          |          |         |


#### volumes
| NAME      | DESCRIPTION                                                         | TYPE   | REQUIRED | DEFAULT |
| --------- | ------------------------------------------------------------------- | ------ | -------- | ------- |
| name      |                                                                     | string | true     |         |
| mountPath |                                                                     | string | true     |         |
| type      | Specify volume type, options: "pvc","configMap","secret","emptyDir" | string | true     |         |


#### env
| NAME      | DESCRIPTION                                               | TYPE                    | REQUIRED | DEFAULT |
| --------- | --------------------------------------------------------- | ----------------------- | -------- | ------- |
| name      | Environment variable name                                 | string                  | true     |         |
| value     | The value of the environment variable                     | string                  | false    |         |
| valueFrom | Specifies a source the value of this var should come from | [valueFrom](#valueFrom) | false    |         |


#### valueFrom
| NAME         | DESCRIPTION                                      | TYPE                          | REQUIRED | DEFAULT |
| ------------ | ------------------------------------------------ | ----------------------------- | -------- | ------- |
| secretKeyRef | Selects a key of a secret in the pod's namespace | [secretKeyRef](#secretKeyRef) | true     |         |


#### secretKeyRef

| NAME | DESCRIPTION                                                      | TYPE   | REQUIRED | DEFAULT |
| ---- | ---------------------------------------------------------------- | ------ | -------- | ------- |
| name | The name of the secret in the pod's namespace to select from     | string | true     |         |
| key  | The key of the secret to select from. Must be a valid secret key | string | true     |         |


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
| volumes          | Declare volumes and volumeMounts                                                                 | [[]volumes](#volumes)             | false    |         |
| livenessProbe    | Instructions for assessing whether the container is alive.                                       | [livenessProbe](#livenessProbe)   | false    |         |
| readinessProbe   | Instructions for assessing whether the container is in a suitable state to serve traffic.        | [readinessProbe](#readinessProbe) | false    |         |
| labels           | Specify the labels in the workload                                                               | []string                          | false    |         |
| annotations      | Specify the annotations in the workload                                                          | []string                          | false    |         |
| imagePullPolicy  | Specify image pull policy for your service                                                       | string                            | false    |         |
| imagePullSecrets | Specify image pull secrets for your service                                                      | []string                          | false    |         |

### readinessProbe

| NAME                | DESCRIPTION                                                                                          | TYPE                    | REQUIRED | DEFAULT |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | -------- | ------- |
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)           | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                         |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                         |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)     | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                         |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                         |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket) | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                         |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                         |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                     | true     | 0       |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                     | true     | 10      |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                     | true     | 1       |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                     | true     | 1       |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                     | true     | 3       |
|                     | not ready (readiness probe).                                                                         |                         |          |         |


#### tcpSocket

| NAME | DESCRIPTION                                                                           | TYPE | REQUIRED | DEFAULT |
| ---- | ------------------------------------------------------------------------------------- | ---- | -------- | ------- |
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |


#### httpGet

| NAME        | DESCRIPTION                                                                           | TYPE                          | REQUIRED | DEFAULT |
| ----------- | ------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------- |
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |


##### httpHeaders

| NAME  | DESCRIPTION | TYPE   | REQUIRED | DEFAULT |
| ----- | ----------- | ------ | -------- | ------- |
| name  |             | string | true     |         |
| value |             | string | true     |         |


#### exec

| NAME    | DESCRIPTION                                                                                         | TYPE     | REQUIRED | DEFAULT |
| ------- | --------------------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| command | A command to be executed inside the container to assess its health. Each space delimited token of   | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes, |          |          |         |
|         | whilst all other exit codes are considered failures.                                                |          |          |         |


### livenessProbe

| NAME                | DESCRIPTION                                                                                          | TYPE                    | REQUIRED | DEFAULT |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | -------- | ------- |
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)           | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                         |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                         |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)     | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                         |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                         |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket) | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                         |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                         |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                     | true     | 0       |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                     | true     | 10      |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                     | true     | 1       |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                     | true     | 1       |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                     | true     | 3       |
|                     | not ready (readiness probe).                                                                         |                         |          |         |


#### tcpSocket

| NAME | DESCRIPTION                                                                           | TYPE | REQUIRED | DEFAULT |
| ---- | ------------------------------------------------------------------------------------- | ---- | -------- | ------- |
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |


#### httpGet

| NAME        | DESCRIPTION                                                                           | TYPE                          | REQUIRED | DEFAULT |
| ----------- | ------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------- |
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |


##### httpHeaders

| NAME  | DESCRIPTION | TYPE   | REQUIRED | DEFAULT |
| ----- | ----------- | ------ | -------- | ------- |
| name  |             | string | true     |         |
| value |             | string | true     |         |


#### exec

| NAME    | DESCRIPTION                                                                                         | TYPE     | REQUIRED | DEFAULT |
| ------- | --------------------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| command | A command to be executed inside the container to assess its health. Each space delimited token of   | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes, |          |          |         |
|         | whilst all other exit codes are considered failures.                                                |          |          |         |


##### volumes
| NAME      | DESCRIPTION                                                         | TYPE   | REQUIRED | DEFAULT |
| --------- | ------------------------------------------------------------------- | ------ | -------- | ------- |
| name      |                                                                     | string | true     |         |
| mountPath |                                                                     | string | true     |         |
| type      | Specify volume type, options: "pvc","configMap","secret","emptyDir" | string | true     |         |


#### env

| NAME      | DESCRIPTION                                               | TYPE                    | REQUIRED | DEFAULT |
| --------- | --------------------------------------------------------- | ----------------------- | -------- | ------- |
| name      | Environment variable name                                 | string                  | true     |         |
| value     | The value of the environment variable                     | string                  | false    |         |
| valueFrom | Specifies a source the value of this var should come from | [valueFrom](#valueFrom) | false    |         |


#### valueFrom

| NAME         | DESCRIPTION                                      | TYPE                          | REQUIRED | DEFAULT |
| ------------ | ------------------------------------------------ | ----------------------------- | -------- | ------- |
| secretKeyRef | Selects a key of a secret in the pod's namespace | [secretKeyRef](#secretKeyRef) | true     |         |


#### secretKeyRef

| NAME | DESCRIPTION                                                      | TYPE   | REQUIRED | DEFAULT |
| ---- | ---------------------------------------------------------------- | ------ | -------- | ------- |
| name | The name of the secret in the pod's namespace to select from     | string | true     |         |
| key  | The key of the secret to select from. Must be a valid secret key | string | true     |         |

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
| volumes                    | Declare volumes and volumeMounts                                                                 | [[]volumes](#volumes)             | false    |         |
| livenessProbe              | Instructions for assessing whether the container is alive.                                       | [livenessProbe](#livenessProbe)   | false    |         |
| readinessProbe             | Instructions for assessing whether the container is in a suitable state to serve traffic.        | [readinessProbe](#readinessProbe) | false    |         |
| labels                     | Specify the labels in the workload                                                               | []string                          | false    |         |
| annotations                | Specify the annotations in the workload                                                          | []string                          | false    |         |
| imagePullPolicy            | Specify image pull policy for your service                                                       | string                            | false    |         |
| imagePullSecrets           | Specify image pull secrets for your service                                                      | []string                          | false    |         |

### readinessProbe

| NAME                | DESCRIPTION                                                                                          | TYPE                    | REQUIRED | DEFAULT |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | -------- | ------- |
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)           | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                         |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                         |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)     | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                         |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                         |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket) | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                         |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                         |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                     | true     | 0       |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                     | true     | 10      |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                     | true     | 1       |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                     | true     | 1       |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                     | true     | 3       |
|                     | not ready (readiness probe).                                                                         |                         |          |         |


#### tcpSocket

| NAME | DESCRIPTION                                                                           | TYPE | REQUIRED | DEFAULT |
| ---- | ------------------------------------------------------------------------------------- | ---- | -------- | ------- |
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |


#### httpGet

| NAME        | DESCRIPTION                                                                           | TYPE                          | REQUIRED | DEFAULT |
| ----------- | ------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------- |
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |


##### httpHeaders

| NAME  | DESCRIPTION | TYPE   | REQUIRED | DEFAULT |
| ----- | ----------- | ------ | -------- | ------- |
| name  |             | string | true     |         |
| value |             | string | true     |         |


#### exec

| NAME    | DESCRIPTION                                                                                         | TYPE     | REQUIRED | DEFAULT |
| ------- | --------------------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| command | A command to be executed inside the container to assess its health. Each space delimited token of   | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes, |          |          |         |
|         | whilst all other exit codes are considered failures.                                                |          |          |         |


### livenessProbe

| NAME                | DESCRIPTION                                                                                          | TYPE                    | REQUIRED | DEFAULT |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | -------- | ------- |
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)           | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                         |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                         |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)     | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                         |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                         |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket) | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                         |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                         |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                     | true     | 0       |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                     | true     | 10      |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                     | true     | 1       |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                     | true     | 1       |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                     | true     | 3       |
|                     | not ready (readiness probe).                                                                         |                         |          |         |


#### tcpSocket

| NAME | DESCRIPTION                                                                           | TYPE | REQUIRED | DEFAULT |
| ---- | ------------------------------------------------------------------------------------- | ---- | -------- | ------- |
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |


#### httpGet

| NAME        | DESCRIPTION                                                                           | TYPE                          | REQUIRED | DEFAULT |
| ----------- | ------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------- |
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |


##### httpHeaders

| NAME  | DESCRIPTION | TYPE   | REQUIRED | DEFAULT |
| ----- | ----------- | ------ | -------- | ------- |
| name  |             | string | true     |         |
| value |             | string | true     |         |


#### exec

| NAME    | DESCRIPTION                                                                                         | TYPE     | REQUIRED | DEFAULT |
| ------- | --------------------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| command | A command to be executed inside the container to assess its health. Each space delimited token of   | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes, |          |          |         |
|         | whilst all other exit codes are considered failures.                                                |          |          |         |


##### volumes
| NAME      | DESCRIPTION                                                         | TYPE   | REQUIRED | DEFAULT |
| --------- | ------------------------------------------------------------------- | ------ | -------- | ------- |
| name      |                                                                     | string | true     |         |
| mountPath |                                                                     | string | true     |         |
| type      | Specify volume type, options: "pvc","configMap","secret","emptyDir" | string | true     |         |


#### env

| NAME      | DESCRIPTION                                               | TYPE                    | REQUIRED | DEFAULT |
| --------- | --------------------------------------------------------- | ----------------------- | -------- | ------- |
| name      | Environment variable name                                 | string                  | true     |         |
| value     | The value of the environment variable                     | string                  | false    |         |
| valueFrom | Specifies a source the value of this var should come from | [valueFrom](#valueFrom) | false    |         |


#### valueFrom

| NAME         | DESCRIPTION                                      | TYPE                          | REQUIRED | DEFAULT |
| ------------ | ------------------------------------------------ | ----------------------------- | -------- | ------- |
| secretKeyRef | Selects a key of a secret in the pod's namespace | [secretKeyRef](#secretKeyRef) | true     |         |


#### secretKeyRef

| NAME | DESCRIPTION                                                      | TYPE   | REQUIRED | DEFAULT |
| ---- | ---------------------------------------------------------------- | ------ | -------- | ------- |
| name | The name of the secret in the pod's namespace to select from     | string | true     |         |
| key  | The key of the secret to select from. Must be a valid secret key | string | true     |         |


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

## Kustomize ( repoType: oss )

KubeVela's `kustomize` component meets the needs of users to directly connect Yaml files and folders as component products. No matter whether your Yaml file/folder is stored in a Git Repo or an OSS bucket, KubeVela can read and deliver it.

### Parameters

| Parameters     | Description                                                                                                                                           | Example                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| repoType       | required, The value of the Git. To indicate that kustomize configuration comes from the Git repository                                                | oss                         |
| pullInterval   | optional, Synchronize with Git repository, and the time interval between tuning helm release. The default value is 5m (5 minutes）                    | 10m                         |
| url            | required, bucket's endpoint, no need to fill in with scheme                                                                                           | oss-cn-beijing.aliyuncs.com |
| secretRef      | optional, Save the name of a Secret, which is the credential to read the bucket. Secret contains accesskey and secretkey fields                       | sec-name                    |
| timeout        | optional, The timeout period of the download operation, the default is 20s                                                                            | 60s                         |
| path           | required, The directory containing the kustomization.yaml file, or the directory containing a set of YAML files (used to generate kustomization.yaml) | ./prod                      |
| oss.bucketName | required, bucket name                                                                                                                                 | your-bucket                 |
| oss.provider   | optional, Generic or aws, if you get the certificate from aws EC2, fill in aws. The default is generic.                                               | generic                     |
| oss.region     | optional, bucket region                                                                                                                               |                             |

### Examples

Let's take the YAML folder component from the OSS bucket registry as an example to explain the usage. In the `Application` we will deliver a component named bucket-comp. The deployment file corresponding to the component is stored in the cloud storage OSS bucket, and the corresponding bucket name is definition-registry. `kustomize.yaml` comes from this address of `oss-cn-beijing.aliyuncs.com` and the path is `./app/prod/`.


1. (Optional) If your OSS bucket needs identity verification, create a Secret:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

2. Deploy it:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      properties:
        repoType: oss
        # If the bucket is private, you will need to provide
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: definition-registry
        path: ./app/prod/
```


## Kustomize ( repoType: git )

### Parameters

| Parameters   | Description                                                                                                                                                                                                                                                                              | Example                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| repoType     | required, The value of the Git. To indicate that kustomize configuration comes from the Git repository                                                                                                                                                                                   | git                                             |
| pullInterval | optional, Synchronize with Git repository, and the time interval between tuning helm release. The default value is 5m (5 minutes）                                                                                                                                                       | 10m                                             |
| url          | required, Git repository address                                                                                                                                                                                                                                                         | https://github.com/oam-dev/terraform-controller |
| secretRef    | optional, The Secret object name that holds the credentials required to pull the Git repository. The username and password fields must be included in the HTTP/S basic authentication Secret. For SSH authentication, the identity, identity.pub and known_hosts fields must be included | sec-name                                        |
| timeout      | optional, The timeout period of the download operation, the default is 20s                                                                                                                                                                                                               | 60s                                             |
| git.branch   | optional, Git branch, master by default                                                                                                                                                                                                                                                  | dev                                             |
| git.provider   | optional, Determines which git client library to use. Defaults to GitHub, it will pick go-git. AzureDevOps will pick libgit2                                                                                                                                                                                                                                                  | GitHub                                             |

### Examples

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: git-app
spec:
  components:
    - name: git-comp
      type: kustomize
      properties:
        repoType: git
        url: https://github.com/<path>/<to>/<repo>
        git:
          branch: master
          provider: GitHub
        path: ./app/dev/
```

**Override Kustomize**

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      properties:
        # ...omitted for brevity
        path: ./app/
     
```

## Kustomize ( Watch Image Registry )

### Parameter

| Parameter         | Required | Description                                                                                                                                                                           | Example                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| image     | required     | The image url                                                                                                                                                 | oamdev/vela-core                                             |
| secretRef     | optional     | If it's a private image registry, use `kubectl create secret docker-registry` to create the secret                                                                                                                                                 | my-secret                                             |
| policy.alphabetical.order     | optional     | Order specifies the sorting order of the tags. Given the letters of the alphabet as tags, ascending order would select Z, and descending order would select A                                                                                                                                                 | asc                                             |
| policy.numerical.order     | optional      | Given the integer values from 0 to 9 as tags, ascending order would select 9, and descending order would select 0                                                                                                                                               | asc                                             |
| policy.semver.range     | optional      | Range gives a semver range for the image tag; the highest version within the range that's a tag yields the latest image                                                                                                                                                 | '>=1.0.0 <2.0.0'                                             |
| filterTags.extract     | optional      | Extract allows a capture group to be extracted from the specified regular expression pattern, useful before tag evaluation                                                                                                                                                 | $timestamp                                             |
| filterTags.pattern     | optional      | Pattern specifies a regular expression pattern used to filter for image tags                                                                                                                                                 | '^master-[a-f0-9]'                                             |
| commitMessage     | optional      | Use for more commit message                                                                                                                                                 |  'Image: {{range .Updated.Images}}{{println .}}{{end}}'                                             |

### Example

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: image-app
spec:
  components:
    - name: image
      type: kustomize
      properties:
        imageRepository:
          image: <your image>
          secretRef: imagesecret
          filterTags:
            pattern: '^master-[a-f0-9]+-(?P<ts>[0-9]+)'
            extract: '$ts'
          policy:
            numerical:
              order: asc
          commitMessage: "Image: {{range .Updated.Images}}{{println .}}{{end}}"
```






