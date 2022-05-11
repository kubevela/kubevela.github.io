---
title: 内置组件列表
---

本文档将展示所有内置组件的参数列表。

## Helm 组件

KubeVela 的 `helm` 组件满足了用户对接 Helm Chart 的需求，你可以通过 `helm` 组件部署任意来自 Helm 仓库、Git 仓库或者 OSS bucket 的现成 Helm Chart 软件包，并对其进行参数覆盖。

### 参数说明

| 参数            | 是否可选 | 含义                                                                                                                                                                                                                                                                | 例子                               |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| repoType        | 必填     | 值为 Helm，标志 chart 来自 Helm 仓库库                                                                                                                                                                                                                                   | Helm                               |
| pullInterval    | 可选     | 与 Helm 仓库进行同步，与调谐 Helm release 的时间间隔 默认值5m（5分钟）                                                                                                                                                                                              | 10m                                |
| url             | 必填     | Helm 仓库地址，支持 http/https                                                                                                                                                                                                                                      | https://charts.bitnami.com/bitnami |
| secretRef       | 可选     | 存有拉取仓库所需凭证的 Secret 对象名，对 HTTP/S 基本鉴权 Secret 中必须包含  username 和 password 字段。对于 TLS the secret must contain a certFile and keyFile, and/or 	// caCert fields.对 TLS 鉴权 Secret 中必须包含  certFile / keyFile 字段 和/或 caCert 字段。 | sec-name                           |
| timeout         | 可选     | 拉取仓库索引的超时时间                                                                                                                                                                                                                                              | 60s                                |
| chart           | 必填     | chart 名称                                                                                                                                                                                                                                                          | redis-cluster                      |
| version         | 可选     | chart 版本，默认为*                                                                                                                                                                                                                                                 | 6.2.7                              |
| targetNamespace | 可选     | 安装 chart 的名字空间，默认由 chart 本身决定                                                                                                                                                                                                                        | your-ns                            |
| releaseName     | 可选     | 安装得到的 release 名称                                                                                                                                                                                                                                             | your-rn                            |
| values          | 可选     | 覆写 chart 的 Values.yaml ，用于 Helm 渲染。                                                                                                                                                                                                                        | 见来自 Git 仓库的例子              |
| installTimeout  | 可选     | `helm install`操作的超时时间，默认值 10m (10分钟)                                                                                                                                                                                                                        | 20m              |

### 样例

```yaml
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

## Helm ( 部署来自 OSS bucket 的 Chart )

### 参数说明

| 参数            | 是否可选 | 含义                                                                                          | 例子                        |
| --------------- | -------- | --------------------------------------------------------------------------------------------- | --------------------------- |
| repoType        | 必填     | 值为 oss 标志 chart 来自 OSS bucket                                                           | oss                         |
| pullInterval    | 可选     | 与 bucket 进行同步，与调谐 Helm release 的时间间隔 默认值5m（5分钟）                          | 10m                         |
| url             | 必填     | bucket 的 endpoint，无需填写 scheme                                                           | oss-cn-beijing.aliyuncs.com |
| secretRef       | 可选     | 保存一个 Secret 的名字，该Secret是读取 bucket 的凭证。Secret 包含 accesskey 和 secretkey 字段 | sec-name                    |
| timeout         | 可选     | 下载操作的超时时间，默认 20s                                                                  | 60s                         |
| chart           | 必填     | chart 存放路径（key）                                                                         | ./chart/podinfo-5.1.3.tgz   |
| version         | 可选     | 在 OSS 来源中，该参数不起作用                                                                 |                             |
| targetNamespace | 可选     | 安装 chart 的名字空间，默认由 chart 本身决定                                                  | your-ns                     |
| releaseName     | 可选     | 安装得到的 release 名称                                                                       | your-rn                     |
| values          | 可选     | 覆写 chart 的 Values.yaml ，用于 Helm 渲染。                                                  | 见来自 Git 仓库的例子       |
| oss.bucketName  | 必填     | bucket 名称                                                                                   | your-bucket                 |
| oss.provider    | 可选     | 可选 generic 或 aws，若从 aws EC2 获取凭证则填 aws。默认 generic。                            | generic                     |
| oss.region      | 可选     | bucket 地区                                                                                   |                             |

### 样例

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

## Helm （部署来自 Git 仓库的 Chart）

### 参数说明

| 参数            | 是否可选 | 含义                                                                                                                                                                           | 例子                                            |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| repoType        | 必填     | 值为 git 标志 chart 来自 Git 仓库                                                                                                                                              | git                                             |
| pullInterval    | 可选     | 与 Git 仓库进行同步，与调谐 Helm release 的时间间隔 默认值5m（5分钟）                                                                                                          | 10m                                             |
| url             | 必填     | Git 仓库地址                                                                                                                                                                   | https://github.com/oam-dev/terraform-controller |
| secretRef       | 可选     | 存有拉取 Git 仓库所需凭证的 Secret 对象名，对 HTTP/S 基本鉴权 Secret 中必须包含  username 和 password 字段。对 SSH 形式鉴权必须包含 identity, identity.pub 和 known_hosts 字段 | sec-name                                        |
| timeout         | 可选     | 下载操作的超时时间，默认 20s                                                                                                                                                   | 60s                                             |
| chart           | 必填     | chart 存放路径（key）                                                                                                                                                          | ./chart/podinfo-5.1.3.tgz                       |
| version         | 可选     | 在 Git 来源中，该参数不起作用                                                                                                                                                  |                                                 |
| targetNamespace | 可选     | 安装 chart 的名字空间，默认由 chart 本身决定                                                                                                                                   | your-ns                                         |
| releaseName     | 可选     | 安装得到的 release 名称                                                                                                                                                        | your-rn                                         |
| values          | 可选     | 覆写 chart 的 Values.yaml ，用于 Helm 渲染。                                                                                                                                   | 见来自 Git 仓库的例子                           |
| git.branch      | 可选     | Git 分支，默认为 master                                                                                                                                                        | dev                                             |

### 样例

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

## Kustomize ( repoType: oss )

Create a Kustomize Component, it could be from Git Repo or OSS bucket or image registry.

### 参数说明

| 参数           | 是否可选 | 含义                                                                                              | 例子                        |
| -------------- | -------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| repoType       | 必填     | 值为 oss 标志 kustomize 配置来自 OSS bucket                                                       | oss                         |
| pullInterval   | 可选     | 与 bucket 进行同步，与调谐 kustomize 的时间间隔 默认值5m（5分钟）                                 | 10m                         |
| url            | 必填     | bucket 的 endpoint，无需填写 scheme                                                               | oss-cn-beijing.aliyuncs.com |
| secretRef      | 可选     | 保存一个 Secret 的名字，该Secret是读取 bucket 的凭证。Secret 包含 accesskey 和 secretkey 字段     | sec-name                    |
| timeout        | 可选     | 下载操作的超时时间，默认 20s                                                                      | 60s                         |
| path           | 必填     | 包含 kustomization.yaml 文件的目录, 或者包含一组 YAML 文件（用以生成 kustomization.yaml )的目录。 | ./prod                      |
| oss.bucketName | 必填     | bucket 名称                                                                                       | your-bucket                 |
| oss.provider   | 可选     | 可选 generic 或 aws，若从 aws EC2 获取凭证则填 aws。默认 generic。                                | generic                     |
| oss.region     | 可选     | bucket 地区                                                                                       |                             |


### 样例


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

### 参数说明

| 参数         | 是否可选 | 含义                                                                                                                                                                           | 例子                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| repoType     | 必填     | 值为 git 标志 kustomize 配置来自 Git 仓库                                                                                                                                      | git                                             |
| pullInterval | 可选     | 与 Git 仓库进行同步，与调谐 helm release 的时间间隔 默认值5m（5分钟）                                                                                                          | 10m                                             |
| url          | 必填     | Git 仓库地址                                                                                                                                                                   | https://github.com/oam-dev/terraform-controller |
| secretRef    | 可选     | 存有拉取 Git 仓库所需凭证的 Secret 对象名，对 HTTP/S 基本鉴权 Secret 中必须包含  username 和 password 字段。对 SSH 形式鉴权必须包含 identity, identity.pub 和 known_hosts 字段 | sec-name                                        |
| timeout      | 可选     | 下载操作的超时时间，默认 20s                                                                                                                                                   | 60s                                             |
| git.branch   | 可选     | Git 分支，默认为 master                                                                                                                                                        | dev                                             |
| git.provider   | 可选     | Git 客户端类型，默认为 GitHub（会使用 go-git 客户端），也可以为 AzureDevOps（会使用 libgit2 客户端）                                                                                                                                                    | GitHub                                             |
                                                                             | GitHub                                             |

### 样例

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

### 参数说明

| 参数         | 是否可选 | 含义                                                                                                                                                                           | 例子                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| image     | 必填     | 表示监听的镜像地址                                                                                                                                                 | oamdev/vela-core                                             |
| secretRef     | 可选     | 表示关联的 secret。如果这是一个私有的镜像仓库，可以通过 `kubectl create secret docker-registry` 创建对应的镜像秘钥并相关联                                                                                                                                                 | my-secret                                             |
| policy.alphabetical.order     | 可选     | 表示用字母顺序来筛选最新的镜像。asc 会优先选择 `Z` 开头的镜像，desc 会优先选择 `A` 开头的镜像                                                                                                                                                 | asc                                             |
| policy.numerical.order     | 可选     | 表示用数字顺序来筛选最新的镜像。asc 会优先选择 `9` 开头的镜像，desc 会优先选择 `0` 开头的镜像                                                                                                                                                 | asc                                             |
| policy.semver.range     | 可选     | 表示在指定范围内找到最新的镜像                                                                                                                                                 | '>=1.0.0 <2.0.0'                                             |
| filterTags.extract     | 可选     | extract 允许从指定的正则表达式模式中提取 pattern                                                                                                                                                 | $timestamp                                             |
| filterTags.pattern     | 可选     | pattern 是用于过滤镜像的正则表达式模式 pattern                                                                                                                                                 | '^master-[a-f0-9]'                                             |
| commitMessage     | 可选     | 用于追加更新镜像时的提交信息                                                                                                                                                 |  'Image: {{range .Updated.Images}}{{println .}}{{end}}'                                             |

### 样例

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


