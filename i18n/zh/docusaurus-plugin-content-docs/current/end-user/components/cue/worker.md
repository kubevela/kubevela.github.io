---
title:  后端服务
---

后端服务（Worker）描述在后端运行的长时间运行、可扩展、容器化的服务。它不对外暴露访问端口。

## 如何使用

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

## 属性说明

```console
$ vela show worker
# Properties
+------------------+-------------------------------------------------------------------------------------------+-----------------------------------+----------+---------+
|       NAME       |                                        DESCRIPTION                                        |               TYPE                | REQUIRED | DEFAULT |
+------------------+-------------------------------------------------------------------------------------------+-----------------------------------+----------+---------+
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
+------------------+-------------------------------------------------------------------------------------------+-----------------------------------+----------+---------+


########### readinessProbe
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------+----------+---------+
|        NAME         |                                             DESCRIPTION                                              |          TYPE           | REQUIRED | DEFAULT |
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------+----------+---------+
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)           | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                         |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                         |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)     | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                         |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                         |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket) | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                         |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                         |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                     | true     |       0 |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                     | true     |      10 |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                     | true     |       1 |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                     | true     |       1 |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                     | true     |       3 |
|                     | not ready (readiness probe).                                                                         |                         |          |         |
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------+----------+---------+


############### tcpSocket
+------+---------------------------------------------------------------------------------------+------+----------+---------+
| NAME |                                      DESCRIPTION                                      | TYPE | REQUIRED | DEFAULT |
+------+---------------------------------------------------------------------------------------+------+----------+---------+
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |
+------+---------------------------------------------------------------------------------------+------+----------+---------+


############# httpGet
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+
|    NAME     |                                      DESCRIPTION                                      |             TYPE              | REQUIRED | DEFAULT |
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+


############## httpHeaders
+-------+-------------+--------+----------+---------+
| NAME  | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-------+-------------+--------+----------+---------+
| name  |             | string | true     |         |
| value |             | string | true     |         |
+-------+-------------+--------+----------+---------+


############ exec
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+
|  NAME   |                                             DESCRIPTION                                              |   TYPE   | REQUIRED | DEFAULT |
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+
| command | A command to be executed inside the container to assess its health. Each space delimited token of    | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes,  |          |          |         |
|         | whilst all other exit codes are considered failures.                                                 |          |          |         |
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+


###### livenessProbe
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------+----------+---------+
|        NAME         |                                             DESCRIPTION                                              |          TYPE           | REQUIRED | DEFAULT |
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------+----------+---------+
| exec                | Instructions for assessing container health by executing a command. Either this attribute or the     | [exec](#exec)           | false    |         |
|                     | httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive |                         |          |         |
|                     | with both the httpGet attribute and the tcpSocket attribute.                                         |                         |          |         |
| httpGet             | Instructions for assessing container health by executing an HTTP GET request. Either this attribute  | [httpGet](#httpGet)     | false    |         |
|                     | or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually       |                         |          |         |
|                     | exclusive with both the exec attribute and the tcpSocket attribute.                                  |                         |          |         |
| tcpSocket           | Instructions for assessing container health by probing a TCP socket. Either this attribute or the    | [tcpSocket](#tcpSocket) | false    |         |
|                     | exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with |                         |          |         |
|                     | both the exec attribute and the httpGet attribute.                                                   |                         |          |         |
| initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated.                | int                     | true     |       0 |
| periodSeconds       | How often, in seconds, to execute the probe.                                                         | int                     | true     |      10 |
| timeoutSeconds      | Number of seconds after which the probe times out.                                                   | int                     | true     |       1 |
| successThreshold    | Minimum consecutive successes for the probe to be considered successful after having failed.         | int                     | true     |       1 |
| failureThreshold    | Number of consecutive failures required to determine the container is not alive (liveness probe) or  | int                     | true     |       3 |
|                     | not ready (readiness probe).                                                                         |                         |          |         |
+---------------------+------------------------------------------------------------------------------------------------------+-------------------------+----------+---------+


########## tcpSocket
+------+---------------------------------------------------------------------------------------+------+----------+---------+
| NAME |                                      DESCRIPTION                                      | TYPE | REQUIRED | DEFAULT |
+------+---------------------------------------------------------------------------------------+------+----------+---------+
| port | The TCP socket within the container that should be probed to assess container health. | int  | true     |         |
+------+---------------------------------------------------------------------------------------+------+----------+---------+


######## httpGet
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+
|    NAME     |                                      DESCRIPTION                                      |             TYPE              | REQUIRED | DEFAULT |
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+
| path        | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string                        | true     |         |
| port        | The TCP socket within the container to which the HTTP GET request should be directed. | int                           | true     |         |
| httpHeaders |                                                                                       | [[]httpHeaders](#httpHeaders) | false    |         |
+-------------+---------------------------------------------------------------------------------------+-------------------------------+----------+---------+


######### httpHeaders
+-------+-------------+--------+----------+---------+
| NAME  | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-------+-------------+--------+----------+---------+
| name  |             | string | true     |         |
| value |             | string | true     |         |
+-------+-------------+--------+----------+---------+


####### exec
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+
|  NAME   |                                             DESCRIPTION                                              |   TYPE   | REQUIRED | DEFAULT |
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+
| command | A command to be executed inside the container to assess its health. Each space delimited token of    | []string | true     |         |
|         | the command is a separate array element. Commands exiting 0 are considered to be successful probes,  |          |          |         |
|         | whilst all other exit codes are considered failures.                                                 |          |          |         |
+---------+------------------------------------------------------------------------------------------------------+----------+----------+---------+


##### volumes
+-----------+---------------------------------------------------------------------+--------+----------+---------+
|   NAME    |                             DESCRIPTION                             |  TYPE  | REQUIRED | DEFAULT |
+-----------+---------------------------------------------------------------------+--------+----------+---------+
| name      |                                                                     | string | true     |         |
| mountPath |                                                                     | string | true     |         |
| type      | Specify volume type, options: "pvc","configMap","secret","emptyDir" | string | true     |         |
+-----------+---------------------------------------------------------------------+--------+----------+---------+


## env
+-----------+-----------------------------------------------------------+-------------------------+----------+---------+
|   NAME    |                        DESCRIPTION                        |          TYPE           | REQUIRED | DEFAULT |
+-----------+-----------------------------------------------------------+-------------------------+----------+---------+
| name      | Environment variable name                                 | string                  | true     |         |
| value     | The value of the environment variable                     | string                  | false    |         |
| valueFrom | Specifies a source the value of this var should come from | [valueFrom](#valueFrom) | false    |         |
+-----------+-----------------------------------------------------------+-------------------------+----------+---------+


### valueFrom
+--------------+--------------------------------------------------+-------------------------------+----------+---------+
|     NAME     |                   DESCRIPTION                    |             TYPE              | REQUIRED | DEFAULT |
+--------------+--------------------------------------------------+-------------------------------+----------+---------+
| secretKeyRef | Selects a key of a secret in the pod's namespace | [secretKeyRef](#secretKeyRef) | true     |         |
+--------------+--------------------------------------------------+-------------------------------+----------+---------+


#### secretKeyRef
+------+------------------------------------------------------------------+--------+----------+---------+
| NAME |                           DESCRIPTION                            |  TYPE  | REQUIRED | DEFAULT |
+------+------------------------------------------------------------------+--------+----------+---------+
| name | The name of the secret in the pod's namespace to select from     | string | true     |         |
| key  | The key of the secret to select from. Must be a valid secret key | string | true     |         |
+------+------------------------------------------------------------------+--------+----------+---------+
``` 