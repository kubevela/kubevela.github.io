---
title: Web 服务
---

服务型组件是以容器为核心支撑对外访问服务的组件，其功能涵盖了主流微服务场景的需要，即在后端长时间运行、可水平扩展、且对外暴露服务端口的服务。

## 如何使用

为了便于你快速学习，请直接复制下面的 Shell 执行，应用会部署到集群中：

```shell
cat <<EOF | vela up -f -
# YAML 文件开始
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
        cpu: "0.1"
        env:
          - name: FOO
            value: bar
# YAML 文件结束
EOF
```

你也可以自行将 YAML 文件保存为 website.yaml，使用 `vela up -f website.yaml` 命令进行部署。

接下来，通过 `vela status <应用 name>` 查看应用的部署状态：

```shell
$ vela status website
About:

  Name:      	website
  Namespace: 	default
  Created at:	2022-01-11 21:04:59 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:2y4rv8479h
    name:frontend
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: frontend  Env:
    Type: webservice
    healthy Ready:1/1
```

当我们看到 Workflow 的 finished 的字段为 true，并且 Status 为 running 时，即表示整个应用交付成功。

如果 Status 显示为 rendering，或者 healthy 为 false，则表示应用要么部署失败，要么还在部署中。

你也可以通过列表查看，使用如下命令：

```shell
$ vela ls
APP    	COMPONENT	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
website	frontend 	webservice	      	running	healthy	      	2021-08-28 18:26:47 +0800 CST
```

我们也看到 website APP 的 PHASE 为 running，同时 STATUS 为 healthy。


## 属性说明

```bash
# Properties
+------------------+-------------------------------------------------------------------------------------------+-----------------------------------+----------+---------+
|       NAME       |                                        DESCRIPTION                                        |               TYPE                | REQUIRED | DEFAULT |
+------------------+-------------------------------------------------------------------------------------------+-----------------------------------+----------+---------+
| cmd              | Commands to run in the container                                                          | []string                          | false    |         |
| env              | Define arguments by using environment variables                                           | [[]env](#env)                     | false    |         |
| volumeMounts     |                                                                                           | [volumeMounts](#volumeMounts)     | false    |         |
| labels           | Specify the labels in the workload                                                        | map[string]string                 | false    |         |
| annotations      | Specify the annotations in the workload                                                   | map[string]string                 | false    |         |
| image            | Which image would you like to use for your service                                        | string                            | true     |         |
| ports            | Which ports do you want customer traffic sent to, defaults to 80                          | [[]ports](#ports)                 | false    |         |
| imagePullPolicy  | Specify image pull policy for your service                                                | string                            | false    |         |
| cpu              | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)          | string                            | false    |         |
| memory           | Specifies the attributes of the memory resource required for the container.               | string                            | false    |         |
| volumes          | Deprecated field, use volumeMounts instead.                                               | [[]volumes](#volumes)             | false    |         |
| livenessProbe    | Instructions for assessing whether the container is alive.                                | [livenessProbe](#livenessProbe)   | false    |         |
| readinessProbe   | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessProbe) | false    |         |
| imagePullSecrets | Specify image pull secrets for your service                                               | []string                          | false    |         |
+------------------+-------------------------------------------------------------------------------------------+-----------------------------------+----------+---------+


## readinessProbe
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------------+----------+---------+
|        NAME         |                                             DESCRIPTION                                              |             TYPE              | REQUIRED | DEFAULT |
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------------+----------+---------+
| hostAliases         | Specify the hostAliases to add                                                                       | [[]hostAliases](#hostAliases) | true     |         |
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)                 | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                               |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                               |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)           | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                               |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                               |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket)       | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                               |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                               |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                           | true     |       0 |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                           | true     |      10 |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                           | true     |       1 |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                           | true     |       1 |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                           | true     |       3 |
|                     | not ready (readiness probe).                                                                         |                               |          |         |
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------------+----------+---------+


### tcpSocket
+------+---------------------------------------------------------------------------------------+------+----------+---------+
| NAME |                                      DESCRIPTION                                      | TYPE | REQUIRED | DEFAULT |
+------+---------------------------------------------------------------------------------------+------+----------+---------+
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |
+------+---------------------------------------------------------------------------------------+------+----------+---------+


### httpGet
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+
|    NAME     |                                      DESCRIPTION                                      |             TYPE              | REQUIRED | DEFAULT |
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+


#### httpHeaders
+-------+-------------+--------+----------+---------+
| NAME  | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-------+-------------+--------+----------+---------+
| name  |             | string | true     |         |
| value |             | string | true     |         |
+-------+-------------+--------+----------+---------+


### exec
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+
|  NAME   |                                             DESCRIPTION                                              |   TYPE   | REQUIRED | DEFAULT |
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+
| command | A command to be executed inside the container to assess its health. Each space delimited token of    | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes,  |          |          |         |
|         | whilst all other exit codes are considered failures.                                                 |          |          |         |
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+


### hostAliases
+-----------+-------------+----------+----------+---------+
|   NAME    | DESCRIPTION |   TYPE   | REQUIRED | DEFAULT |
+-----------+-------------+----------+----------+---------+
| ip        |             | string   | true     |         |
| hostnames |             | []string | true     |         |
+-----------+-------------+----------+----------+---------+


## livenessProbe
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------------+----------+---------+
|        NAME         |                                             DESCRIPTION                                              |             TYPE              | REQUIRED | DEFAULT |
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------------+----------+---------+
| hostAliases         | Specify the hostAliases to add                                                                       | [[]hostAliases](#hostAliases) | true     |         |
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)                 | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                               |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                               |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)           | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                               |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                               |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket)       | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                               |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                               |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                           | true     |       0 |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                           | true     |      10 |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                           | true     |       1 |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                           | true     |       1 |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                           | true     |       3 |
|                     | not ready (readiness probe).                                                                         |                               |          |         |
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------------+----------+---------+


### tcpSocket
+------+---------------------------------------------------------------------------------------+------+----------+---------+
| NAME |                                      DESCRIPTION                                      | TYPE | REQUIRED | DEFAULT |
+------+---------------------------------------------------------------------------------------+------+----------+---------+
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |
+------+---------------------------------------------------------------------------------------+------+----------+---------+


### httpGet
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+
|    NAME     |                                      DESCRIPTION                                      |             TYPE              | REQUIRED | DEFAULT |
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+


#### httpHeaders
+-------+-------------+--------+----------+---------+
| NAME  | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-------+-------------+--------+----------+---------+
| name  |             | string | true     |         |
| value |             | string | true     |         |
+-------+-------------+--------+----------+---------+


### exec
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+
|  NAME   |                                             DESCRIPTION                                              |   TYPE   | REQUIRED | DEFAULT |
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+
| command | A command to be executed inside the container to assess its health. Each space delimited token of    | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes,  |          |          |         |
|         | whilst all other exit codes are considered failures.                                                 |          |          |         |
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+


### hostAliases
+-----------+-------------+----------+----------+---------+
|   NAME    | DESCRIPTION |   TYPE   | REQUIRED | DEFAULT |
+-----------+-------------+----------+----------+---------+
| ip        |             | string   | true     |         |
| hostnames |             | []string | true     |         |
+-----------+-------------+----------+----------+---------+


## volumes
+-----------+---------------------------------------------------------------------+--------+----------+---------+
|   NAME    |                             DESCRIPTION                             |  TYPE  | REQUIRED | DEFAULT |
+-----------+---------------------------------------------------------------------+--------+----------+---------+
| name      |                                                                     | string | true     |         |
| mountPath |                                                                     | string | true     |         |
| type      | Specify volume type, options: "pvc","configMap","secret","emptyDir" | string | true     |         |
+-----------+---------------------------------------------------------------------+--------+----------+---------+


## ports
+----------+--------------------------------------------------+--------+----------+---------+
|   NAME   |                   DESCRIPTION                    |  TYPE  | REQUIRED | DEFAULT |
+----------+--------------------------------------------------+--------+----------+---------+
| name     | Name of the port                                 | string | false    |         |
| port     | Number of port to expose on the pod's IP address | int    | true     |         |
| protocol | Protocol for port. Must be UDP, TCP, or SCTP     | string | true     | TCP     |
| expose   | Specify if the port should be exposed            | bool   | true     | false   |
+----------+--------------------------------------------------+--------+----------+---------+


## volumeMounts
+-----------+-----------------------------+---------------------------+----------+---------+
|   NAME    |         DESCRIPTION         |           TYPE            | REQUIRED | DEFAULT |
+-----------+-----------------------------+---------------------------+----------+---------+
| pvc       | Mount PVC type volume       | [[]pvc](#pvc)             | false    |         |
| configMap | Mount ConfigMap type volume | [[]configMap](#configMap) | false    |         |
| secret    | Mount Secret type volume    | [[]secret](#secret)       | false    |         |
| emptyDir  | Mount EmptyDir type volume  | [[]emptyDir](#emptyDir)   | false    |         |
| hostPath  | Mount HostPath type volume  | [[]hostPath](#hostPath)   | false    |         |
+-----------+-----------------------------+---------------------------+----------+---------+


### hostPath
+-----------+-------------+--------+----------+---------+
|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-----------+-------------+--------+----------+---------+
| path      |             | string | true     |         |
| name      |             | string | true     |         |
| mountPath |             | string | true     |         |
+-----------+-------------+--------+----------+---------+


### emptyDir
+-----------+-------------+--------+----------+---------+
|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-----------+-------------+--------+----------+---------+
| name      |             | string | true     |         |
| mountPath |             | string | true     |         |
| medium    |             | string | true     | empty   |
+-----------+-------------+--------+----------+---------+


### secret
+-------------+-------------+-------------------+----------+---------+
|    NAME     | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+-------------+-------------+-------------------+----------+---------+
| name        |             | string            | true     |         |
| mountPath   |             | string            | true     |         |
| defaultMode |             | int               | true     |     420 |
| items       |             | [[]items](#items) | false    |         |
| secretName  |             | string            | true     |         |
+-------------+-------------+-------------------+----------+---------+


#### items
+------+-------------+--------+----------+---------+
| NAME | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+------+-------------+--------+----------+---------+
| path |             | string | true     |         |
| key  |             | string | true     |         |
| mode |             | int    | true     |     511 |
+------+-------------+--------+----------+---------+


### configMap
+-------------+-------------+-------------------+----------+---------+
|    NAME     | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+-------------+-------------+-------------------+----------+---------+
| name        |             | string            | true     |         |
| mountPath   |             | string            | true     |         |
| defaultMode |             | int               | true     |     420 |
| cmName      |             | string            | true     |         |
| items       |             | [[]items](#items) | false    |         |
+-------------+-------------+-------------------+----------+---------+


#### items
+------+-------------+--------+----------+---------+
| NAME | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+------+-------------+--------+----------+---------+
| path |             | string | true     |         |
| key  |             | string | true     |         |
| mode |             | int    | true     |     511 |
+------+-------------+--------+----------+---------+


### pvc
+-----------+---------------------+--------+----------+---------+
|   NAME    |     DESCRIPTION     |  TYPE  | REQUIRED | DEFAULT |
+-----------+---------------------+--------+----------+---------+
| name      |                     | string | true     |         |
| mountPath |                     | string | true     |         |
| claimName | The name of the PVC | string | true     |         |
+-----------+---------------------+--------+----------+---------+


## env
+-----------+-----------------------------------------------------------+-------------------------+----------+---------+
|   NAME    |                        DESCRIPTION                        |          TYPE           | REQUIRED | DEFAULT |
+-----------+-----------------------------------------------------------+-------------------------+----------+---------+
| name      | Environment variable name                                 | string                  | true     |         |
| value     | The value of the environment variable                     | string                  | false    |         |
| valueFrom | Specifies a source the value of this var should come from | [valueFrom](#valueFrom) | false    |         |
+-----------+-----------------------------------------------------------+-------------------------+----------+---------+


### valueFrom
+-----------------+------------------------------------------------------+-------------------------------------+----------+---------+
|      NAME       |                     DESCRIPTION                      |                TYPE                 | REQUIRED | DEFAULT |
+-----------------+------------------------------------------------------+-------------------------------------+----------+---------+
| secretKeyRef    | Selects a key of a secret in the pod's namespace     | [secretKeyRef](#secretKeyRef)       | false    |         |
| configMapKeyRef | Selects a key of a config map in the pod's namespace | [configMapKeyRef](#configMapKeyRef) | false    |         |
+-----------------+------------------------------------------------------+-------------------------------------+----------+---------+


#### configMapKeyRef
+------+----------------------------------------------------------------------+--------+----------+---------+
| NAME |                             DESCRIPTION                              |  TYPE  | REQUIRED | DEFAULT |
+------+----------------------------------------------------------------------+--------+----------+---------+
| name | The name of the config map in the pod's namespace to select from     | string | true     |         |
| key  | The key of the config map to select from. Must be a valid secret key | string | true     |         |
+------+----------------------------------------------------------------------+--------+----------+---------+


#### secretKeyRef
+------+------------------------------------------------------------------+--------+----------+---------+
| NAME |                           DESCRIPTION                            |  TYPE  | REQUIRED | DEFAULT |
+------+------------------------------------------------------------------+--------+----------+---------+
| name | The name of the secret in the pod's namespace to select from     | string | true     |         |
| key  | The key of the secret to select from. Must be a valid secret key | string | true     |         |
+------+------------------------------------------------------------------+--------+----------+---------+
```