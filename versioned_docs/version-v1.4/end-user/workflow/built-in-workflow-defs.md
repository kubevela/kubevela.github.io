---
title: Built-in WorkflowStep Type
---

This documentation will walk through all the built-in workflow step types sorted alphabetically.

> It was generated automatically by [scripts](../../contributor/cli-ref-doc), please don't update manually, last updated at 2022-07-24T18:00:59+08:00.

## Apply-Object

### Description

Apply raw kubernetes objects for your workflow steps.

### Examples (apply-object)

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

### Specification (apply-object)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value | Specify Kubernetes native resource object to be applied. | map[string]:(null\|bool\|string\|bytes\|{...}\|[...]\|number) | true |  
 cluster | The cluster you want to apply the resource to, default is the current control plane cluster. | string | false | empty 


## Depends-On-App

### Description

Wait for the specified Application to complete.

### Examples (depends-on-app)

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

### Specification (depends-on-app)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the dependent Application. | string | true |  
 namespace | Specify the namespace of the dependent Application. | string | true |  


## Deploy

### Description

A powerful and unified deploy step for components multi-cluster delivery with policies.

### Examples (deploy)

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

### Specification (deploy)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 policies | Declare the policies that used for this deployment. If not specified, the components will be deployed to the hub cluster. | []string | false |  
 parallelism | Maximum number of concurrent delivered components. | int | false | 5 
 ignoreTerraformComponent | If set false, this step will apply the components with the terraform workload. | bool | false | true 
 auto | If set to false, the workflow will suspend automatically before this step, default to be true. | bool | false | true 


## Deploy-Cloud-Resource

### Description

Deploy cloud resource and deliver secret to multi clusters.

### Specification (deploy-cloud-resource)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 env | Declare the name of the env in policy. | string | true |  
 policy | Declare the name of the env-binding policy, if empty, the first env-binding policy will be used. | string | false | empty 


## Deploy2env

### Description

Deploy env binding component to target env.

### Specification (deploy2env)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 env | Declare the name of the env in policy. | string | true |  
 policy | Declare the name of the env-binding policy, if empty, the first env-binding policy will be used. | string | false | empty 
 parallel | components are applied in parallel. | bool | false | false 


## Deploy2runtime

### Description

Deploy application to runtime clusters.

### Specification (deploy2runtime)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 clusters | Declare the runtime clusters to apply, if empty, all runtime clusters will be used. | []string | false |  


## Export2config

### Description

Export data to specified Kubernetes ConfigMap in your workflow.

### Examples (export2config)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: export-config
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
      - name: apply-server
        type: apply-component
        outputs: 
          - name: status
            valueFrom: output.status.conditions[0].message
        properties:
          component: express-server
      - name: export-config
        type: export-config
        inputs:
          - from: status
            parameterKey: data.serverstatus
        properties:
          configName: my-configmap
          data:
            testkey: testvalue
```

### Specification (export2config)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 cluster | Specify the cluster of the config map. | string | false | empty 
 namespace | Specify the namespace of the config map. | string | false |  
 data | Specify the data of config map. | {...} | true |  
 configName | Specify the name of the config map. | string | true |  


## Export2secret

### Description

Export data to Kubernetes Secret in your workflow.

### Examples (export2secret)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: export-secret
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
      - name: apply-server
        type: apply-component
        outputs: 
          - name: status
            valueFrom: output.status.conditions[0].message
        properties:
          component: express-server
      - name: export-secret
        type: export-secret
        inputs:
          - from: status
            parameterKey: data.serverstatus
        properties:
          secretName: my-secret
          data:
            testkey: testvalue
```

### Specification (export2secret)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 cluster | Specify the cluster of the config map. | string | false | empty 
 namespace | Specify the namespace of the secret. | string | false |  
 type | Specify the type of the secret. | string | false |  
 secretName | Specify the name of the secret. | string | true |  
 data | Specify the data of secret. | {...} | true |  


## Generate-Jdbc-Connection

### Description

Generate a JDBC connection based on Component of alibaba-rds.

### Specification (generate-jdbc-connection)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the secret generated by database component. | string | true |  
 namespace | Specify the namespace of the secret generated by database component. | string | false |  


## Notification

### Description

Send notifications to Email, DingTalk, Slack, Lark or webhook in your workflow.

### Examples (notification)

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

### Specification (notification)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 lark | Please fulfill its url and message if you want to send Lark messages. | [lark](#lark-notification) | false |  
 slack | Please fulfill its url and message if you want to send Slack messages. | [slack](#slack-notification) | false |  
 email | Please fulfill its from, to and content if you want to send email. | [email](#email-notification) | false |  
 dingding | Please fulfill its url and message if you want to send DingTalk messages. | [dingding](#dingding-notification) | false |  


#### lark (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url | Specify the the lark url, you can either sepcify it in value or use secretRef. | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [Lark messaging](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#8b0f2a1b). | [message](#message-notification) | true |  


##### url-option-0 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value |  | string | true |  


##### url-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | name is the name of the secret. | string | true |  
 key | key is the key in the secret. | string | true |  


##### message (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 content | content should be json encode string. | string | true |  
 msg_type | msg_type can be text, post, image, interactive, share_chat, share_user, audio, media, file, sticker. | string | true |  


#### slack (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url | Specify the the slack url, you can either sepcify it in value or use secretRef. | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [slack messaging](https://api.slack.com/reference/messaging/payload). | [message](#message-notification) | true |  


##### url-option-0 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value |  | string | true |  


##### url-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | name is the name of the secret. | string | true |  
 key | key is the key in the secret. | string | true |  


##### message (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 text | Specify the message text for slack notification. | string | true |  
 blocks |  | (null\|[...]) | false |  
 attachments |  | (null\|{...}) | false |  
 thread_ts |  | string | false |  
 mrkdwn | Specify the message text format in markdown for slack notification. | bool | false | true 


#### email (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 content | Specify the content of the email. | [content](#content-notification) | true |  
 from | Specify the email info that you want to send from. | [from](#from-notification) | true |  
 to | Specify the email address that you want to send to. | []string | true |  


##### content (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 body | Specify the context body of the email. | string | true |  
 subject | Specify the subject of the email. | string | true |  


##### from (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 address | Specify the email address that you want to send from. | string | true |  
 alias | The alias is the email alias to show after sending the email. | string | false |  
 password | Specify the password of the email, you can either sepcify it in value or use secretRef. | [password-option-0](#password-option-0-notification) or [password-option-1](#password-option-1-notification) | true |  
 host | Specify the host of your email. | string | true |  
 port | Specify the port of the email host, default to 587. | int | false | 587 


##### password-option-0 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value |  | string | true |  


##### password-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | name is the name of the secret. | string | true |  
 key | key is the key in the secret. | string | true |  


#### dingding (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url | Specify the the dingding url, you can either sepcify it in value or use secretRef. | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [dingtalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw). | [message](#message-notification) | true |  


##### url-option-0 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value |  | string | true |  


##### url-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | name is the name of the secret. | string | true |  
 key | key is the key in the secret. | string | true |  


##### message (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 text | Specify the message content of dingtalk notification. | (null\|{...}) | false |  
 msgtype | msgType can be text, link, mardown, actionCard, feedCard. | string | false | text 
 link |  | (null\|{...}) | false |  
 markdown |  | (null\|{...}) | false |  
 at |  | (null\|{...}) | false |  
 actionCard |  | (null\|{...}) | false |  
 feedCard |  | (null\|{...}) | false |  


## Read-Object

### Description

Read Kubernetes objects from cluster for your workflow steps.

### Examples (read-object)

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

### Specification (read-object)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the object. | string | true |  
 cluster | The cluster you want to apply the resource to, default is the current control plane cluster. | string | false | empty 
 apiVersion | Specify the apiVersion of the object, defaults to 'core.oam.dev/v1beta1'. | string | false |  
 kind | Specify the kind of the object, defaults to Application. | string | false |  
 namespace | The namespace of the resource you want to read. | string | false | default 


## Share-Cloud-Resource

### Description

Sync secrets created by terraform component to runtime clusters so that runtime clusters can share the created cloud resource.

### Specification (share-cloud-resource)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 env | Declare the name of the env in policy. | string | true |  
 policy | Declare the name of the env-binding policy, if empty, the first env-binding policy will be used. | string | false | empty 
 placements | Declare the location to bind. | [[]placements](#placements-share-cloud-resource) | true |  


#### placements (share-cloud-resource)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 cluster |  | string | false |  
 namespace |  | string | false |  


## Step-Group

### Description

step group.

### Specification (step-group)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 \- |  | {} | true |  


## Suspend

### Description

Suspend the current workflow, it can be resumed by 'vela workflow resume' command.

### Examples (suspend)

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
        type: webhook-notification
        properties:
          slack:
            # the Slack webhook address, please refer to: https://api.slack.com/messaging/webhooks
            message:
              text: Ready to apply the application, ask the administrator to approve and resume the workflow.
      - name: manual-approval
        type: suspend
        # properties:
        #   duration: "30s"
      - name: express-server
        type: apply-application
```

### Specification (suspend)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 duration | Specify the wait duration time to resume workflow such as "30s", "1min" or "2m15s". | string | false |  


## Webhook

### Description

Send a request to the specified Webhook URL. If no request body is specified, the current Application body will be sent by default.

### Examples (webhook)

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

### Specification (webhook)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url | Specify the webhook url. | [url-option-0](#url-option-0-webhook) or [url-option-1](#url-option-1-webhook) | true |  
 data | Specify the data you want to send. | map[string]:(null\|bool\|string\|bytes\|{...}\|[...]\|number) | false |  


#### url-option-0 (webhook)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value |  | string | true |  


#### url-option-1 (webhook)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretRef |  | [secretRef](#secretref-webhook) | true |  


##### secretRef (webhook)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | name is the name of the secret. | string | true |  
 key | key is the key in the secret. | string | true |  


