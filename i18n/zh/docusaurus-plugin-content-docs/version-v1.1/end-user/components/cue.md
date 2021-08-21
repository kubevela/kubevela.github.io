---
title:  CUE 组件
---

> ⚠️ 请安装 [KubeVela CLI 命令行工具](../../getting-started/quick-install.mdx##3)

作为用户的你，一定希望随时可以找到开箱即用的组件，同时如果没有找到满足需求的组件，又可以灵活地自定义你想要的组件。

KubeVela 通过强大的 CUE 配置语言去粘合开源社区里的所有相关能力。我们给你提供了一些开箱即用的组件能力，也为你们的平台管理员，开放了灵活的自定义组件开发方式。

可以先使 vela CLI 看看我们已经通过 CUE 默认内置的组件能力：

```
$ vela components
NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                         
raw        	vela-system	autodetects.core.oam.dev             	raw allow users to specify raw K8s object in properties     
task       	vela-system	jobs.batch                           	Describes jobs that run code or a script to completion.     
webservice 	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services    
           	           	                                     	that have a stable network endpoint to receive external     
           	           	                                     	network traffic from customers.                             
worker     	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services    
           	           	                                     	that running at backend. They do NOT have network endpoint  
           	           	                                     	to receive external network traffic.   
```

你所看到，在 vela-system 命令空间下的 webservice、task 和 worker 等组件类型，都是通过 CUE 模版来内置的。

KubeVela 内置的这几种开箱即用的 CUE 组件，涵盖了主流的微服务场景。

我们以 Web Service 作为例子进行讲解，编写如下的 YAML 文件：

```
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

部署到运行时集群，并通过 `vela ls` 查看是否成功：

```
$ kubectl apply -f web-service.yaml 
application.core.oam.dev/website configured

$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS            	PHASE         	HEALTHY  	STATUS                                	CREATED-TIME                 
website             	frontend      	webservice 	                  	rendering     	healthy  	                                      	2021-07-15 11:24:52 +0800 CST
```

最后，在你想要通过自定义组件来满足需求的时候，可以自己查看管理员手册里的[自定义组件](../../platform-engineers/components/custom-component)进行开发，或者请求你们的平台管理员进行开发。

### 附录：Web Service 配置项

你可以使用 vela show <组件名称> 的命令来查看详细信息，对所有组件适用。比如 Web Service 配置项如下：

```
# Properties
+------------------+-------------------------------------------------------------------------------------------+-----------------------------------+----------+---------+
|       NAME       |                                        DESCRIPTION                                        |               TYPE                | REQUIRED | DEFAULT |
+------------------+-------------------------------------------------------------------------------------------+-----------------------------------+----------+---------+
| cmd              | Commands to run in the container                                                          | []string                          | false    |         |
| env              | Define arguments by using environment variables                                           | [[]env](#env)                     | false    |         |
| image            | Which image would you like to use for your service                                        | string                            | true     |         |
| port             | Which port do you want customer traffic sent to                                           | int                               | true     |      80 |
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