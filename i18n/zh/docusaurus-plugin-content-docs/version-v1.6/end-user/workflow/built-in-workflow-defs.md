---
title: 内置工作流步骤列表
---

本文档将**按字典序**展示所有内置工作流步骤的参数列表。

> 本文档由[脚本](../../contributor/cli-ref-doc)自动生成，请勿手动修改，上次更新于 2022-11-16T14:46:36+08:00。

## Apply-Component

### 描述

Apply a specific component and its corresponding traits in application。

### 示例 (apply-component)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: express-server
        type: apply-component
        properties:
          component: express-server
          # cluster: <your cluster name>
```

### 参数说明 (apply-component)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 component | Specify the component name to apply。 | string | true |  
 cluster | Specify the cluster。 | string | false | empty 


## Apply-Object

### 描述

在工作流中部署 Kubernetes 资源对象。

### 示例 (apply-object)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: server-with-pvc
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
      volumes:
        - name: "my-pvc"
          type: "pvc"
          mountPath: "/test"
          claimName: "myclaim"

  workflow:
    steps:
      - name: apply-pvc
        type: apply-object
        properties:
          # Kubernetes native resources fields
          value:
            apiVersion: v1
            kind: PersistentVolumeClaim
            metadata:
              name: myclaim
              namespace: default
            spec:
              accessModes:
              - ReadWriteOnce
              resources:
                requests:
                  storage: 8Gi
              storageClassName: standard
            # the cluster you want to apply the resource to, default is the current cluster
            cluster: <your cluster name>  
      - name: apply-server
        type: apply-component
        properties:
          component: express-serve
```

### 参数说明 (apply-object)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | Kubernetes 资源对象参数。 | map[string]:_ | true |  
 cluster | 需要部署的集群名称。如果不指定，则为当前集群。 | string | false | empty 


## Collect-Service-Endpoints

### 描述

Collect service endpoints for the application。

### 示例 (collect-service-endpoints)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-collect-service-endpoint-and-export
spec:
  components:
    - type: webservice
      name: busybox
      properties:
        image: busybox
        imagePullPolicy: IfNotPresent
        cmd:
          - sleep
          - '1000000'
      traits:
        - type: expose
          properties:
            port: [8080]
            type: ClusterIP
  policies:
    - type: topology
      name: local
      properties:
        clusters: ["local"]
    - type: topology
      name: all
      properties:
        clusters: ["local", "cluster-worker"]
  workflow:
    steps:
      - type: deploy
        name: deploy
        properties:
          policies: ["local"]
      - type: collect-service-endpoints
        name: collect-service-endpoints
        outputs:
          - name: host
            valueFrom: value.endpoint.host
      - type: export-data
        name: export-data
        properties:
          topology: all
        inputs:
          - from: host
            parameterKey: data.host
```

### 参数说明 (collect-service-endpoints)
This capability has no arguments.

## Create-Config

### 描述

Create or update a config。

### 参数说明 (create-config)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the name of the config。 | string | true |  
 namespace | Specify the namespace of the config。 | string | false |  
 template | Specify the template of the config。 | string | false |  
 config | Specify the content of the config。 | map[string]:_ | true |  


## Delete-Config

### 描述

Delete a config。

### 参数说明 (delete-config)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the name of the config。 | string | true |  
 namespace | Specify the namespace of the config。 | string | false |  


## Depends-On-App

### 描述

等待指定的 Application 完成。

### 示例 (depends-on-app)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: express-server
        type: depends-on-app
        properties:
          name: another-app
          namespace: default
```

`depends-on-app` will check if the cluster has the application with `name` and `namespace` given in properties.
If the application exists, it will hang the next step until the application is running.
If the application does not exist, KubeVela will check the ConfigMap with the same name, and read the config of the Application and apply to cluster.
The ConfigMap is like below: the `name` and `namespace` of the ConfigMap is the same in properties.
In data, the `key` must be specified by `application`, and the `value` is the yaml of the deployed application yaml.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp
  namespace: vela-system
data:
  application: 
    <app yaml file>
```

### 参数说明 (depends-on-app)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 需要等待的 Application 名称。 | string | true |  
 namespace | 需要等待的 Application 所在的命名空间。 | string | true |  


## Deploy

### 描述

功能丰富且统一的用于多集群部署的步骤，可以指定多集群差异化配置策略。

### 示例 (deploy)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-workflowstep
  namespace: examples
spec:
  components:
    - name: nginx-deploy-workflowstep
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
  workflow:
    steps:
      - type: deploy
        name: deploy-local
        properties:
          policies: ["topology-local"]
      - type: deploy
        name: deploy-hangzhou
        properties:
          # require manual approval before running this step
          auto: false
          policies: ["topology-hangzhou-clusters"]
```

### 参数说明 (deploy)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 auto | 默认为 true。如果为 false，工作流将在执行该步骤前自动暂停。。 | bool | false | true 
 policies | 指定本次部署要使用的策略。如果不指定策略，将自动部署到管控集群。 | []string | false |  
 parallelism | 指定本次部署的并发度。 | int | false | 5 
 ignoreTerraformComponent | 部署时忽略 Terraform 的组件，默认忽略，Terraform 仅需要在管控集群操作云资源，不需要管控信息下发到多集群。 | bool | false | true 


## Deploy-Cloud-Resource

### 描述

将云资源生成的秘钥部署到多集群。

### 参数说明 (deploy-cloud-resource)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 policy | Declare the name of the env-binding policy, if empty, the first env-binding policy will be used。 | string | false | empty 
 env | 指定多集群策略中定义的环境名称。 | string | true |  


## Export-Data

### 描述

Export data to clusters specified by topology。

### 示例 (export-data)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-collect-service-endpoint-and-export
spec:
  components:
    - type: webservice
      name: busybox
      properties:
        image: busybox
        imagePullPolicy: IfNotPresent
        cmd:
          - sleep
          - '1000000'
      traits:
        - type: expose
          properties:
            port: [8080]
            type: ClusterIP
  policies:
    - type: topology
      name: local
      properties:
        clusters: ["local"]
    - type: topology
      name: all
      properties:
        clusters: ["local", "cluster-worker"]
  workflow:
    steps:
      - type: deploy
        name: deploy
        properties:
          policies: ["local"]
      - type: collect-service-endpoints
        name: collect-service-endpoints
        outputs:
          - name: host
            valueFrom: value.endpoint.host
      - type: export-data
        name: export-data
        properties:
          topology: all
        inputs:
          - from: host
            parameterKey: data.host
```

### 参数说明 (export-data)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the name of the export destination。 | string | false |  
 namespace | Specify the namespace of the export destination。 | string | false |  
 kind | Specify the kind of the export destination。 | string | false | ConfigMap 
 data | Specify the data to export。 | struct | true |  
 topology | Specify the topology to export。 | string | false |  


## Export-Service

### 描述

Export service to clusters specified by topology。

### 示例 (export-service)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-collect-service-endpoint-and-export
spec:
  components:
    - type: webservice
      name: busybox
      properties:
        image: busybox
        imagePullPolicy: IfNotPresent
        cmd:
          - sleep
          - '1000000'
      traits:
        - type: expose
          properties:
            port: [8080]
            type: LoadBalancer
  policies:
    - type: topology
      name: local
      properties:
        clusters: ["local"]
    - type: topology
      name: worker
      properties:
        clusters: ["cluster-worker"]
  workflow:
    steps:
      - type: deploy
        name: deploy
        properties:
          policies: ["local"]
      - type: collect-service-endpoints
        name: collect-service-endpoints
        outputs:
          - name: host
            valueFrom: value.endpoint.host
          - name: port
            valueFrom: value.endpoint.port
      - type: export-service
        name: export-service
        properties:
          name: busybox
          topology: worker
        inputs:
          - from: host
            parameterKey: ip
          - from: port
            parameterKey: port
```

### 参数说明 (export-service)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the name of the export destination。 | string | false |  
 namespace | Specify the namespace of the export destination。 | string | false |  
 ip | Specify the ip to be export。 | string | true |  
 port | Specify the port to be used in service。 | int | true |  
 targetPort | Specify the port to be export。 | int | true |  
 topology | Specify the topology to export。 | string | false |  


## Export2config

### 描述

在工作流中导出数据到 Kubernetes ConfigMap 对象。

### 示例 (export2config)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: export2config
  namespace: default
spec:
  components:
    - name: export2config-demo-server
      type: webservice
      properties:
        image: oamdev/hello-world
        port: 8000
  workflow:
    steps:
      - name: apply-server
        type: apply-component
        outputs:
          - name: status
            valueFrom: output.status.conditions[0].message
        properties:
          component: export2config-demo-server
      - name: export-config
        type: export2config
        inputs:
          - from: status
            parameterKey: data.serverstatus
        properties:
          configName: my-configmap
          data:
            testkey: |
              testvalue
              value-line-2
```

### 参数说明 (export2config)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 configName | ConfigMap 的名称。 | string | true |  
 namespace | ConfigMap 的 namespace，默认为当前应用的 namespace。 | string | false |  
 data | 需要导出到 ConfigMap 中的数据，是一个 key-value 的 map。 | struct | true |  
 cluster | 要导出到的集群名称。 | string | false | empty 


## Export2secret

### 描述

在工作流中导出数据到 Kubernetes Secret 对象。

### 示例 (export2secret)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: export-secret
  namespace: default
spec:
  components:
  - name: express-server-sec
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
  workflow:
    steps:
      - name: apply-server
        type: apply-component
        outputs: 
          - name: status
            valueFrom: output.status.conditions[0].message
        properties:
          component: express-server-sec
      - name: export-secret
        type: export2secret
        inputs:
          - from: status
            parameterKey: data.serverstatus
        properties:
          secretName: my-secret
          data:
            testkey: |
              testvalue
              value-line-2
```

### 参数说明 (export2secret)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretName | Secret 的名称。 | string | true |  
 namespace | secret 的 namespace，默认为当前应用的 namespace。 | string | false |  
 type | 指定导出的 secret 类型。 | string | false |  
 data | 需要导出到 Secret 中的数据。 | struct | true |  
 cluster | 要导出到的集群名称。 | string | false | empty 


## Generate-Jdbc-Connection

### 描述

Generate a JDBC connection based on Component of alibaba-rds。

### 参数说明 (generate-jdbc-connection)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the name of the secret generated by database component。 | string | true |  
 namespace | Specify the namespace of the secret generated by database component。 | string | false |  


## List-Config

### 描述

List the configs。

### 参数说明 (list-config)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 template | Specify the template of the config。 | string | true |  
 namespace | Specify the namespace of the config。 | string | false |  


## Notification

### 描述

向指定的 Webhook 发送信息，支持邮件、钉钉、Slack 和飞书。

### 示例 (notification)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: dingtalk-message
        type: notification
        properties:
          dingding:
            # the DingTalk webhook address, please refer to: https://developers.dingtalk.com/document/robots/custom-robot-access
            url: 
              value: <url>
            message:
              msgtype: text
              text:
                context: Workflow starting...
      - name: application
        type: apply-application
      - name: slack-message
        type: notification
        properties:
          slack:
            # the Slack webhook address, please refer to: https://api.slack.com/messaging/webhooks
            url:
              secretRef:
                name: <secret-key>
                key: <secret-value>
            message:
              text: Workflow ended.
          lark:
            url:
              value: <lark-url>
            message:
              msg_type: "text"
              content: "{\"text\":\" Hello KubeVela\"}"
          email:
            from:
              address: <sender-email-address>
              alias: <sender-alias>
              password:
                # secretRef:
                #   name: <secret-name>
                #   key: <secret-key>
                value: <sender-password>
              host: <email host like smtp.gmail.com>
              port: <email port, optional, default to 587>
            to:
              - kubevela1@gmail.com
              - kubevela2@gmail.com
            content:
              subject: test-subject
              body: test-body
```

**Expected outcome**

We can see that before and after the deployment of the application, the messages can be seen in the corresponding group chat.

### 参数说明 (notification)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 lark | 发送飞书信息。 | [lark](#lark-notification) | false |  
 dingding | 发送钉钉信息。 | [dingding](#dingding-notification) | false |  
 slack | 发送 Slack 信息。 | [slack](#slack-notification) | false |  
 email | 发送邮件通知。 | [email](#email-notification) | false |  


#### lark (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 url | Specify the the lark url, you can either sepcify it in value or use secretRef。 | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [Lark messaging](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#8b0f2a1b)。 | [message](#message-notification) | true |  


##### url-option-0 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | the url address content in string。 | string | true |  


##### url-option-1 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Kubernetes Secret 名称。 | string | true |  
 key | Kubernetes Secret 中的 key。 | string | true |  


##### message (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 msg_type | msg_type can be text, post, image, interactive, share_chat, share_user, audio, media, file, sticker。 | string | true |  
 content | content should be json encode string。 | string | true |  


#### dingding (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 url | Specify the the dingding url, you can either sepcify it in value or use secretRef。 | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [dingtalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw)。 | [message](#message-notification) | true |  


##### url-option-0 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | the url address content in string。 | string | true |  


##### url-option-1 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Kubernetes Secret 名称。 | string | true |  
 key | Kubernetes Secret 中的 key。 | string | true |  


##### message (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 text | Specify the message content of dingtalk notification。 | (null&#124;struct) | false |  
 msgtype | msgType can be text, link, mardown, actionCard, feedCard。 | string | false | text 
 link |  | (null&#124;struct) | false |  
 markdown |  | (null&#124;struct) | false |  
 at |  | (null&#124;struct) | false |  
 actionCard |  | (null&#124;struct) | false |  
 feedCard |  | (null&#124;struct) | false |  


#### slack (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 url | Slack 的 Webhook 地址，可以选择直接在 value 填写或从 secretRef 中获取。 | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [slack messaging](https://api.slack.com/reference/messaging/payload)。 | [message](#message-notification) | true |  


##### url-option-0 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | the url address content in string。 | string | true |  


##### url-option-1 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Kubernetes Secret 名称。 | string | true |  
 key | Kubernetes Secret 中的 key。 | string | true |  


##### message (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 text | Specify the message text for slack notification。 | string | true |  
 blocks |  | null | false |  
 attachments |  | (null&#124;struct) | false |  
 thread_ts |  | string | false |  
 mrkdwn | Specify the message text format in markdown for slack notification。 | bool | false | true 


#### email (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 from | 指定邮件发送人信息。 | [from](#from-notification) | true |  
 to | 指定收件人信息。 | []string | true |  
 content | 指定邮件内容。 | [content](#content-notification) | true |  


##### from (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 address | 发件人邮件地址。 | string | true |  
 alias | The alias is the email alias to show after sending the email。 | string | false |  
 password | Specify the password of the email, you can either sepcify it in value or use secretRef。 | [password-option-0](#password-option-0-notification) or [password-option-1](#password-option-1-notification) | true |  
 host | Specify the host of your email。 | string | true |  
 port | Specify the port of the email host, default to 587。 | int | false | 587 


##### password-option-0 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | the password content in string。 | string | true |  


##### password-option-1 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Kubernetes Secret 名称。 | string | true |  
 key | Kubernetes Secret 中的 key。 | string | true |  


##### content (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 subject | 指定邮件标题。 | string | true |  
 body | 指定邮件正文内容。 | string | true |  


## Print-Message-In-Status

### 描述

print message in workflow step status。

### 示例 (print-message-in-status)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: print-message-in-status
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
  workflow:
    steps:
      - name: express-server
        type: apply-component
        properties:
          component: express-server
      - name: message
        type: print-message-in-status
        properties:
          message: "All addons have been enabled successfully, you can use 'vela addon list' to check them."
```

### 参数说明 (print-message-in-status)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 message |  | string | true |  


## Read-Config

### 描述

Read a config。

### 参数说明 (read-config)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the name of the config。 | string | true |  
 namespace | Specify the namespace of the config。 | string | false |  


## Read-Object

### 描述

在工作流中读取 Kubernetes 资源对象。

### 示例 (read-object)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: read-object
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
  workflow:
    steps:
    - name: read-object
      type: read-object
      outputs:
        - name: cpu
          valueFrom: output.value.data["cpu"]
        - name: memory
          valueFrom: output.value.data["memory"]
      properties:
        apiVersion: v1
        kind: ConfigMap
        name: my-cm-name
        cluster: <your cluster name
    - name: apply
      type: apply-component
      inputs:
        - from: cpu
          parameterKey: cpu
        - from: memory
          parameterKey: memory
      properties:
        component: express-server
```

### 参数说明 (read-object)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 apiVersion | Specify the apiVersion of the object, defaults to 'core.oam.dev/v1beta1'。 | string | false |  
 kind | Specify the kind of the object, defaults to Application。 | string | false |  
 name | Specify the name of the object。 | string | true |  
 namespace | The namespace of the resource you want to read。 | string | false | default 
 cluster | 需要部署的集群名称。如果不指定，则为当前集群。 | string | false | empty 


## Share-Cloud-Resource

### 描述

Sync secrets created by terraform component to runtime clusters so that runtime clusters can share the created cloud resource。

### 参数说明 (share-cloud-resource)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 placements | Declare the location to bind。 | [[]placements](#placements-share-cloud-resource) | true |  
 policy | Declare the name of the env-binding policy, if empty, the first env-binding policy will be used。 | string | false | empty 
 env | 指定多集群策略中定义的环境名称。 | string | true |  


#### placements (share-cloud-resource)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 namespace |  | string | false |  
 cluster |  | string | false |  


## Step-Group

### 描述

A special step that you can declare 'subSteps' in it, 'subSteps' is an array containing any step type whose valid parameters do not include the `step-group` step type itself. The sub steps were executed in parallel。

### 示例 (step-group)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example
  namespace: default
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
    - name: express-server2
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000

  workflow:
    steps:
      - name: step
        type: step-group
        subSteps:
          - name: apply-sub-step1
            type: apply-component
            properties:
              component: express-server
          - name: apply-sub-step2
            type: apply-component
            properties:
              component: express-server2
```

### 参数说明 (step-group)
This capability has no arguments.

## Suspend

### 描述

暂停当前工作流，可以通过 'vela workflow resume' 继续已暂停的工作流。

### 示例 (suspend)

The `duration` parameter is supported in KubeVela v1.4 or higher.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
  workflow:
    steps:
      - name: slack-message
        type: notification
        properties:
          slack:
            url:
              value: <your-slack-url>
            # the Slack webhook address, please refer to: https://api.slack.com/messaging/webhooks
            message:
              text: Ready to apply the application, ask the administrator to approve and resume the workflow.
      - name: manual-approval
        type: suspend
        # properties:
        #   duration: "30s"
      - name: express-server
        type: apply-component
        properties:
          component: express-server
```

### 参数说明 (suspend)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 duration | 指定工作流暂停的时长，超过该时间后工作流将自动继续，如："30s"， "1min"， "2m15s"。 | string | false |  


## Webhook

### 描述

向指定 Webhook URL 发送请求，若不指定请求体，则默认发送当前 Application。

### 示例 (webhook)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
  workflow:
    steps:
      - name: express-server
        type: apply-application
      - name: webhook
        type: webhook
        properties:
          url:
            value: <your webhook url>
```

### 参数说明 (webhook)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 url | 需要发送的 Webhook URL，可以选择直接在 value 填写或从 secretRef 中获取。 | [url-option-0](#url-option-0-webhook) or [url-option-1](#url-option-1-webhook) | true |  
 data | 需要发送的内容。 | map[string]:_ | false |  


#### url-option-0 (webhook)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value |  | string | true |  


#### url-option-1 (webhook)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretRef |  | [secretRef](#secretref-webhook) | true |  


##### secretRef (webhook)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Kubernetes Secret 名称。 | string | true |  
 key | Kubernetes Secret 中的 key。 | string | true |  


