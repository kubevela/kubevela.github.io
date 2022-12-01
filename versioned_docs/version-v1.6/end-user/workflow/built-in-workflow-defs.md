---
title: Built-in WorkflowStep Type
---

This documentation will walk through all the built-in workflow step types sorted alphabetically.

> It was generated automatically by [scripts](../../contributor/cli-ref-doc), please don't update manually, last updated at 2022-11-24T12:21:19+08:00.

## Apply-Component

### Description

Apply a specific component and its corresponding traits in application.

### Examples (apply-component)

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

### Specification (apply-component)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 component | Specify the component name to apply. | string | true |  
 cluster | Specify the cluster. | string | false | empty 


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
 value | Specify Kubernetes native resource object to be applied. | map[string]:_ | true |  
 cluster | The cluster you want to apply the resource to, default is the current control plane cluster. | string | false | empty 


## Collect-Service-Endpoints

### Description

Collect service endpoints for the application.

### Examples (collect-service-endpoints)

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

### Specification (collect-service-endpoints)
This capability has no arguments.

## Create-Config

### Description

Create or update a config.

### Examples (create-config)

```yaml
kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: test-config
  namespace: "config-e2e-test"
spec:
  components: []
  workflow:
    steps:
    - name: write-config
      type: create-config
      properties:
        name: test
        config: 
          key1: value1
          key2: 2
          key3: true
          key4: 
            key5: value5
    - name: read-config
      type: read-config
      properties:
        name: test
      outputs:
      - fromKey: config
        name: read-config
    - name: delete-config
      type: delete-config
      properties:
        name: test
```

### Specification (create-config)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the config. | string | true |  
 namespace | Specify the namespace of the config. | string | false |  
 template | Specify the template of the config. | string | false |  
 config | Specify the content of the config. | map[string]:_ | true |  


## Delete-Config

### Description

Delete a config.

### Examples (delete-config)

```yaml
kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: test-config
  namespace: "config-e2e-test"
spec:
  components: []
  workflow:
    steps:
    - name: write-config
      type: create-config
      properties:
        name: test
        config: 
          key1: value1
          key2: 2
          key3: true
          key4: 
            key5: value5
    - name: delete-config
      type: delete-config
      properties:
        name: test
```

### Specification (delete-config)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the config. | string | true |  
 namespace | Specify the namespace of the config. | string | false |  


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
 auto | If set to false, the workflow will suspend automatically before this step, default to be true. | bool | false | true 
 policies | Declare the policies that used for this deployment. If not specified, the components will be deployed to the hub cluster. | []string | false |  
 parallelism | Maximum number of concurrent delivered components. | int | false | 5 
 ignoreTerraformComponent | If set false, this step will apply the components with the terraform workload. | bool | false | true 


## Deploy-Cloud-Resource

### Description

Deploy cloud resource and deliver secret to multi clusters.

### Examples (deploy-cloud-resource)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rds-app
  namespace: project-1
spec:
  components:
    - name: db
      type: alibaba-rds
      properties:
        instance_name: db
        account_name: kubevela
        password: my-password
        writeConnectionSecretToRef:
          name: project-1-rds-conn-credential
  policies:
    - name: env-policy
      type: env-binding
      properties:
        envs:
          # 部署 RDS 给杭州集群
          - name: hangzhou
            placement:
              clusterSelector:
                name: cluster-hangzhou
            patch:
              components:
                - name: db
                  type: alibaba-rds
                  properties:
                    # region: hangzhou
                    instance_name: hangzhou_db
          # 部署 RDS 给香港集群
          - name: hongkong
            placement:
              clusterSelector:
                name: cluster-hongkong
              namespaceSelector:
                name: hk-project-1
            patch:
              components:
                - name: db
                  type: alibaba-rds
                  properties:
                    # region: hongkong
                    instance_name: hongkong_db
                    writeConnectionSecretToRef:
                      name: hk-project-rds-credential

  workflow:
    steps:
      # 部署 RDS 给杭州区用
      - name: deploy-hangzhou-rds
        type: deploy-cloud-resource
        properties:
          env: hangzhou
      # 将给杭州区用的 RDS 共享给北京区
      - name: share-hangzhou-rds-to-beijing
        type: share-cloud-resource
        properties:
          env: hangzhou
          placements:
            - cluster: cluster-beijing
      # 部署 RDS 给香港区用
      - name: deploy-hongkong-rds
        type: deploy-cloud-resource
        properties:
          env: hongkong
      # 将给香港区用的 RDS 共享给香港区其他项目用
      - name: share-hongkong-rds-to-other-namespace
        type: share-cloud-resource
        properties:
          env: hongkong
          placements:
            - cluster: cluster-hongkong
              namespace: hk-project-2
            - cluster: cluster-hongkong
              namespace: hk-project-3
```

### Specification (deploy-cloud-resource)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 policy | Declare the name of the env-binding policy, if empty, the first env-binding policy will be used. | string | false | empty 
 env | Declare the name of the env in policy. | string | true |  


## Export-Data

### Description

Export data to clusters specified by topology.

### Examples (export-data)

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

### Specification (export-data)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the export destination. | string | false |  
 namespace | Specify the namespace of the export destination. | string | false |  
 kind | Specify the kind of the export destination. | string | false | ConfigMap 
 data | Specify the data to export. | struct | true |  
 topology | Specify the topology to export. | string | false |  


## Export-Service

### Description

Export service to clusters specified by topology.

### Examples (export-service)

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

### Specification (export-service)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the export destination. | string | false |  
 namespace | Specify the namespace of the export destination. | string | false |  
 ip | Specify the ip to be export. | string | true |  
 port | Specify the port to be used in service. | int | true |  
 targetPort | Specify the port to be export. | int | true |  
 topology | Specify the topology to export. | string | false |  


## Export2config

### Description

Export data to specified Kubernetes ConfigMap in your workflow.

### Examples (export2config)

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

### Specification (export2config)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 configName | Specify the name of the config map. | string | true |  
 namespace | Specify the namespace of the config map. | string | false |  
 data | Specify the data of config map. | struct | true |  
 cluster | Specify the cluster of the config map. | string | false | empty 


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

### Specification (export2secret)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretName | Specify the name of the secret. | string | true |  
 namespace | Specify the namespace of the secret. | string | false |  
 type | Specify the type of the secret. | string | false |  
 data | Specify the data of secret. | struct | true |  
 cluster | Specify the cluster of the secret. | string | false | empty 


## Generate-Jdbc-Connection

### Description

Generate a JDBC connection based on Component of alibaba-rds.

### Examples (generate-jdbc-connection)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: jdbc
spec:
  components:
    - name: db
      type: alibaba-rds
      properties:
        instance_name: favorite-links
        database_name: db1
        account_name: oamtest
        password: U34rfwefwefffaked
        security_ips: [ "0.0.0.0/0" ]
        privilege: ReadWrite
        writeConnectionSecretToRef:
          name: db-conn
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000

  workflow:
    steps:
      - name: jdbc
        type: generate-jdbc-connection
        outputs:
          - name: jdbc
            valueFrom: jdbc
        properties:
          name: db-conn
          namespace: default
      - name: apply
        type: apply-component
        inputs:
          - from: jdbc
            parameterKey: env
        properties:
          component: express-server
```

### Specification (generate-jdbc-connection)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the secret generated by database component. | string | true |  
 namespace | Specify the namespace of the secret generated by database component. | string | false |  


## List-Config

### Description

List the configs.

### Examples (list-config)

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: observability
  namespace: vela-system
spec:
  context:
    readConfig: true
  mode: 
  workflowSpec:
    steps:
      - name: Enable Prism
        type: addon-operation
        properties:
          addonName: vela-prism
      
      - name: Enable o11y
        type: addon-operation
        properties:
          addonName: o11y-definitions
          operation: enable
          args:
          - --override-definitions

      - name: Prepare Prometheus
        type: step-group
        subSteps: 
        - name: get-exist-prometheus
          type: list-config
          properties:
            template: prometheus-server
          outputs:
          - name: prometheus
            valueFrom: "output.configs"

        - name: prometheus-server
          inputs:
          - from: prometheus
            # TODO: Make it is not required
            parameterKey: configs
          if: "!context.readConfig || len(inputs.prometheus) == 0"
          type: addon-operation
          properties:
            addonName: prometheus-server
            operation: enable
            args:
            - memory=4096Mi
            - serviceType=LoadBalancer
```

### Specification (list-config)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 template | Specify the template of the config. | string | true |  
 namespace | Specify the namespace of the config. | string | false |  


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
 dingding | Please fulfill its url and message if you want to send DingTalk messages. | [dingding](#dingding-notification) | false |  
 slack | Please fulfill its url and message if you want to send Slack messages. | [slack](#slack-notification) | false |  
 email | Please fulfill its from, to and content if you want to send email. | [email](#email-notification) | false |  


#### lark (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url | Specify the the lark url, you can either sepcify it in value or use secretRef. | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [Lark messaging](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#8b0f2a1b). | [message](#message-notification) | true |  


##### url-option-0 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value | the url address content in string. | string | true |  


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
 msg_type | msg_type can be text, post, image, interactive, share_chat, share_user, audio, media, file, sticker. | string | true |  
 content | content should be json encode string. | string | true |  


#### dingding (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url | Specify the the dingding url, you can either sepcify it in value or use secretRef. | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [dingtalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw). | [message](#message-notification) | true |  


##### url-option-0 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value | the url address content in string. | string | true |  


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
 text | Specify the message content of dingtalk notification. | (null&#124;struct) | false |  
 msgtype | msgType can be text, link, mardown, actionCard, feedCard. | string | false | text 
 link |  | (null&#124;struct) | false |  
 markdown |  | (null&#124;struct) | false |  
 at |  | (null&#124;struct) | false |  
 actionCard |  | (null&#124;struct) | false |  
 feedCard |  | (null&#124;struct) | false |  


#### slack (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url | Specify the the slack url, you can either sepcify it in value or use secretRef. | [url-option-0](#url-option-0-notification) or [url-option-1](#url-option-1-notification) | true |  
 message | Specify the message that you want to sent, refer to [slack messaging](https://api.slack.com/reference/messaging/payload). | [message](#message-notification) | true |  


##### url-option-0 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value | the url address content in string. | string | true |  


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
 blocks |  | null | false |  
 attachments |  | (null&#124;struct) | false |  
 thread_ts |  | string | false |  
 mrkdwn | Specify the message text format in markdown for slack notification. | bool | false | true 


#### email (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 from | Specify the email info that you want to send from. | [from](#from-notification) | true |  
 to | Specify the email address that you want to send to. | []string | true |  
 content | Specify the content of the email. | [content](#content-notification) | true |  


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
 value | the password content in string. | string | true |  


##### password-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretRef |  | [secretRef](#secretref-notification) | true |  


##### secretRef (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | name is the name of the secret. | string | true |  
 key | key is the key in the secret. | string | true |  


##### content (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 subject | Specify the subject of the email. | string | true |  
 body | Specify the context body of the email. | string | true |  


## Print-Message-In-Status

### Description

print message in workflow step status.

### Examples (print-message-in-status)

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

### Specification (print-message-in-status)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 message |  | string | true |  


## Read-Config

### Description

Read a config.

### Examples (read-config)

```yaml
kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: test-config
  namespace: "config-e2e-test"
spec:
  components: []
  workflow:
    steps:
    - name: read-config
      type: read-config
      properties:
        name: test
      outputs:
      - fromKey: config
        name: read-config
```

### Specification (read-config)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the config. | string | true |  
 namespace | Specify the namespace of the config. | string | false |  


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
 apiVersion | Specify the apiVersion of the object, defaults to 'core.oam.dev/v1beta1'. | string | false |  
 kind | Specify the kind of the object, defaults to Application. | string | false |  
 name | Specify the name of the object. | string | true |  
 namespace | The namespace of the resource you want to read. | string | false | default 
 cluster | The cluster you want to apply the resource to, default is the current control plane cluster. | string | false | empty 


## Share-Cloud-Resource

### Description

Sync secrets created by terraform component to runtime clusters so that runtime clusters can share the created cloud resource.

### Examples (share-cloud-resource)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rds-app
  namespace: project-1
spec:
  components:
    - name: db
      type: alibaba-rds
      properties:
        instance_name: db
        account_name: kubevela
        password: my-password
        writeConnectionSecretToRef:
          name: project-1-rds-conn-credential
  policies:
    - name: env-policy
      type: env-binding
      properties:
        envs:
          # 部署 RDS 给杭州集群
          - name: hangzhou
            placement:
              clusterSelector:
                name: cluster-hangzhou
            patch:
              components:
                - name: db
                  type: alibaba-rds
                  properties:
                    # region: hangzhou
                    instance_name: hangzhou_db
          # 部署 RDS 给香港集群
          - name: hongkong
            placement:
              clusterSelector:
                name: cluster-hongkong
              namespaceSelector:
                name: hk-project-1
            patch:
              components:
                - name: db
                  type: alibaba-rds
                  properties:
                    # region: hongkong
                    instance_name: hongkong_db
                    writeConnectionSecretToRef:
                      name: hk-project-rds-credential

  workflow:
    steps:
      # 部署 RDS 给杭州区用
      - name: deploy-hangzhou-rds
        type: deploy-cloud-resource
        properties:
          env: hangzhou
      # 将给杭州区用的 RDS 共享给北京区
      - name: share-hangzhou-rds-to-beijing
        type: share-cloud-resource
        properties:
          env: hangzhou
          placements:
            - cluster: cluster-beijing
      # 部署 RDS 给香港区用
      - name: deploy-hongkong-rds
        type: deploy-cloud-resource
        properties:
          env: hongkong
      # 将给香港区用的 RDS 共享给香港区其他项目用
      - name: share-hongkong-rds-to-other-namespace
        type: share-cloud-resource
        properties:
          env: hongkong
          placements:
            - cluster: cluster-hongkong
              namespace: hk-project-2
            - cluster: cluster-hongkong
              namespace: hk-project-3
```

### Specification (share-cloud-resource)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 placements | Declare the location to bind. | [[]placements](#placements-share-cloud-resource) | true |  
 policy | Declare the name of the env-binding policy, if empty, the first env-binding policy will be used. | string | false | empty 
 env | Declare the name of the env in policy. | string | true |  


#### placements (share-cloud-resource)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 namespace |  | string | false |  
 cluster |  | string | false |  


## Step-Group

### Description

A special step that you can declare 'subSteps' in it, 'subSteps' is an array containing any step type whose valid parameters do not include the `step-group` step type itself. The sub steps were executed in parallel.

### Examples (step-group)

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

### Specification (step-group)
This capability has no arguments.

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
 data | Specify the data you want to send. | map[string]:_ | false |  


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


