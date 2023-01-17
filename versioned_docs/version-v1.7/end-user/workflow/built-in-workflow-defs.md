---
title: Built-in WorkflowStep Type
---

This documentation will walk through all the built-in workflow step types sorted alphabetically.

> It was generated automatically by [scripts](../../contributor/cli-ref-doc), please don't update manually, last updated at 2023-01-16T19:19:03+08:00.

## Addon-Operation

### Description

Enable a KubeVela addon.

### Scope

This step type is only valid in WorkflowRun.

### Examples (addon-operation)

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

      - name: Prepare Loki
        type: addon-operation
        properties:
          addonName: loki
          operation: enable
          args:
            - --version=v0.1.4
            - agent=vector
            - serviceType=LoadBalancer
            
      - name: Prepare Grafana
        type: step-group
        subSteps: 
        
        - name: get-exist-grafana
          type: list-config
          properties:
            template: grafana
          outputs:
          - name: grafana
            valueFrom: "output.configs"
        
        - name: Install Grafana & Init Dashboards
          inputs:
          - from: grafana
            parameterKey: configs
          if: "!context.readConfig || len(inputs.grafana) == 0"
          type: addon-operation
          properties:
            addonName: grafana
            operation: enable
            args:
              - serviceType=LoadBalancer
        
        - name: Init Dashboards
          inputs:
          - from: grafana
            parameterKey: configs
          if: "len(inputs.grafana) != 0"
          type: addon-operation
          properties:
            addonName: grafana
            operation: enable
            args:
              - install=false

      - name: Clean
        type: clean-jobs
  
      - name: print-message
        type: print-message-in-status
        properties:
          message: "All addons have been enabled successfully, you can use 'vela addon list' to check them."

```

### Specification (addon-operation)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 addonName | Specify the name of the addon. | string | true |  
 args | Specify addon enable args. | []string | false |  
 image | Specify the image. | string | false | oamdev/vela-cli:v1.6.4 
 operation | operation for the addon. | "enable" or "upgrade" or "disable" | false | enable 
 serviceAccountName | specify serviceAccountName want to use. | string | false | kubevela-vela-core 


## Apply-App

### Description

Apply application from data or ref to the cluster.

### Scope

This step type is only valid in WorkflowRun.

### Examples (apply-app)

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: apply-applications
  namespace: default
  annotations:
    workflowrun.oam.dev/debug: "true"
spec:
  workflowSpec:
    steps:
      - name: check-app-exist
        type: read-app
        properties:
          name: webservice-app
      - name: apply-app1
        type: apply-app
        if: status["check-app-exist"].message == "Application not found"
        properties:
          data:
            apiVersion: core.oam.dev/v1beta1
            kind: Application
            metadata:
              name: webservice-app
            spec:
              components:
                - name: express-server
                  type: webservice
                  properties:
                    image: crccheck/hello-world
                    ports:
                      - port: 8000
      - name: suspend
        type: suspend
        timeout: 24h
      - name: apply-app2
        type: apply-app
        properties:
          ref:
            name: my-app
            key: application
            type: configMap
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app
  namespace: default
data:
  application: |
    apiVersion: core.oam.dev/v1beta1
    kind: Application
    metadata:
      name: webservice-app2
    spec:
      components:
        - name: express-server2
          type: webservice
          properties:
            image: crccheck/hello-world
            ports:
              - port: 8000
        
```

### Specification (apply-app)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 data |  | map[string]_ | false |  
 ref |  | [ref](#ref-apply-app) | false |  


#### ref (apply-app)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 namespace |  | _&#124;_ | true |  
 type |  | string | false | configMap 
 key |  | string | false | application 


## Apply-Component

### Description

Apply a specific component and its corresponding traits in application.

### Scope

This step type is only valid in Application.

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


## Apply-Deployment

### Description

Apply deployment with specified image and cmd.

### Scope

This step type is valid in both Application and WorkflowRun.

### Examples (apply-deployment)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: apply-deploy
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
      - name: apply-comp
        type: apply-component
        properties:
          component: express-server
      - name: apply-deploy
        type: apply-deployment
        properties:
          image: nginx
```

### Specification (apply-deployment)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 image |  | string | true |  
 cmd |  | []string | false |  


## Apply-Object

### Description

Apply raw kubernetes objects for your workflow steps.

### Scope

This step type is valid in both Application and WorkflowRun.

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
 value | Specify Kubernetes native resource object to be applied. | map[string]_ | true |  
 cluster | The cluster you want to apply the resource to, default is the current control plane cluster. | string | false | empty 


## Apply-Terraform-Config

### Description

Apply terraform configuration in the step.

### Scope

This step type is valid in both Application and WorkflowRun.

### Examples (apply-terraform-config)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: apply-terraform-resource
  namespace: default
spec:
  components: []
  workflow:
    steps:
    - name: provider
      type: apply-terraform-provider
      properties:
        type: alibaba
        name: my-alibaba-provider
        accessKey: <accessKey>
        secretKey: <secretKey>
        region: cn-hangzhou
    - name: configuration
      type: apply-terraform-config
      properties:
        source:
          path: alibaba/cs/dedicated-kubernetes
          remote: https://github.com/FogDong/terraform-modules
        providerRef:
          name: my-alibaba-provider
        writeConnectionSecretToRef:
            name: my-terraform-secret
            namespace: vela-system
        variable:
          name: regular-check-ack
          new_nat_gateway: true
          vpc_name: "tf-k8s-vpc-regular-check"
          vpc_cidr: "10.0.0.0/8"
          vswitch_name_prefix: "tf-k8s-vsw-regualr-check"
          vswitch_cidrs: [ "10.1.0.0/16", "10.2.0.0/16", "10.3.0.0/16" ]
          k8s_name_prefix: "tf-k8s-regular-check"
          k8s_version: 1.24.6-aliyun.1
          k8s_pod_cidr: "192.168.5.0/24"
          k8s_service_cidr: "192.168.2.0/24"
          k8s_worker_number: 2
          cpu_core_count: 4
          memory_size: 8
          tags:
            created_by: "Terraform-of-KubeVela"
            created_from: "module-tf-alicloud-ecs-instance"
```

### Specification (apply-terraform-config)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 source | specify the source of the terraform configuration. | [type-option-1](#type-option-1-apply-terraform-config) or [type-option-2](#type-option-2-apply-terraform-config) | true |  
 deleteResource | whether to delete resource. | bool | false | true 
 variable | the variable in the configuration. | map[string]_ | true |  
 writeConnectionSecretToRef | this specifies the namespace and name of a secret to which any connection details for this managed resource should be written. | [writeConnectionSecretToRef](#writeconnectionsecrettoref-apply-terraform-config) | false |  
 providerRef | providerRef specifies the reference to Provider. | [providerRef](#providerref-apply-terraform-config) | false |  
 region | region is cloud provider's region. It will override the region in the region field of providerRef. | string | false |  
 jobEnv | the envs for job. | map[string]_ | false |  
 forceDelete |  | bool | false | false 


#### type-option-1 (apply-terraform-config)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 hcl | directly specify the hcl of the terraform configuration. | string | true |  


#### type-option-2 (apply-terraform-config)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 remote | specify the remote url of the terraform configuration. | string | false | https://github.com/kubevela-contrib/terraform-modules.git 
 path | specify the path of the terraform configuration. | string | false |  


#### writeConnectionSecretToRef (apply-terraform-config)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 namespace |  | _&#124;_ | true |  


#### providerRef (apply-terraform-config)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 namespace |  | _&#124;_ | true |  


## Apply-Terraform-Provider

### Description

Apply terraform provider config.

### Scope

This step type is valid in both Application and WorkflowRun.

### Examples (apply-terraform-provider)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: apply-terraform-provider
  namespace: default
spec:
  components: []
  workflow:
    steps:
    - name: provider
      type: apply-terraform-provider
      properties:
        type: alibaba
        name: my-alibaba-provider
        accessKey: <accessKey>
        secretKey: <secretKey>
        region: cn-hangzhou
```

### Specification (apply-terraform-provider)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
  |  | [AlibabaProvider](#alibabaprovider-apply-terraform-provider) or [AWSProvider](#awsprovider-apply-terraform-provider) or [AzureProvider](#azureprovider-apply-terraform-provider) or [BaiduProvider](#baiduprovider-apply-terraform-provider) or [ECProvider](#ecprovider-apply-terraform-provider) or [GCPProvider](#gcpprovider-apply-terraform-provider) or [TencentProvider](#tencentprovider-apply-terraform-provider) or [UCloudProvider](#ucloudprovider-apply-terraform-provider) | false |  


#### AlibabaProvider (apply-terraform-provider)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type |  | string | true |  
 accessKey |  | string | true |  
 secretKey |  | string | true |  
 name |  | string | false | alibaba-provider 
 region |  | string | true |  


#### AWSProvider (apply-terraform-provider)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 token |  | string | false | empty 
 type |  | string | true |  
 accessKey |  | string | true |  
 secretKey |  | string | true |  
 name |  | string | false | aws-provider 
 region |  | string | true |  


#### AzureProvider (apply-terraform-provider)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 subscriptionID |  | string | true |  
 tenantID |  | string | true |  
 clientID |  | string | true |  
 clientSecret |  | string | true |  
 name |  | string | false | azure-provider 


#### BaiduProvider (apply-terraform-provider)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type |  | string | true |  
 accessKey |  | string | true |  
 secretKey |  | string | true |  
 name |  | string | false | baidu-provider 
 region |  | string | true |  


#### ECProvider (apply-terraform-provider)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type |  | string | true |  
 apiKey |  | string | false | empty 
 name |  | string | true |  


#### GCPProvider (apply-terraform-provider)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 credentials |  | string | true |  
 region |  | string | true |  
 project |  | string | true |  
 type |  | string | true |  
 name |  | string | false | gcp-provider 


#### TencentProvider (apply-terraform-provider)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretID |  | string | true |  
 secretKey |  | string | true |  
 region |  | string | true |  
 type |  | string | true |  
 name |  | string | false | tencent-provider 


#### UCloudProvider (apply-terraform-provider)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 publicKey |  | string | true |  
 privateKey |  | string | true |  
 projectID |  | string | true |  
 region |  | string | true |  
 type |  | string | true |  
 name |  | string | false | ucloud-provider 


## Build-Push-Image

### Description

Build and push image from git url.

### Scope

This step type is valid in both Application and WorkflowRun.

### Examples (build-push-image)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: build-push-image
  namespace: default
spec:
  components:
  - name: my-web
    type: webservice
    properties:
      image: fogdong/simple-web-demo:v1
      ports:
        - port: 80
          expose: true
  workflow:
    steps:
    - name: create-git-secret
      type: export2secret
      properties:
        secretName: git-secret
        data:
          token: <git token>
    - name: create-image-secret
      type: export2secret
      properties:
        secretName: image-secret
        kind: docker-registry
        dockerRegistry:
          username: <docker username>
          password: <docker password>
    - name: build-push
      type: build-push-image
      properties:
        # use your kaniko executor image like below, if not set, it will use default image oamdev/kaniko-executor:v1.9.1
        # kanikoExecutor: gcr.io/kaniko-project/executor:latest
        # you can use context with git and branch or directly specify the context, please refer to https://github.com/GoogleContainerTools/kaniko#kaniko-build-contexts
        context:
          git: github.com/FogDong/simple-web-demo
          branch: main
        image: fogdong/simple-web-demo:v1
        # specify your dockerfile, if not set, it will use default dockerfile ./Dockerfile
        # dockerfile: ./Dockerfile
        credentials:
          image:
            name: image-secret
        # buildArgs:
        #   - key="value"
        # platform: linux/arm
    - name: apply-comp
      type: apply-component
      properties:
        component: my-web
```

### Specification (build-push-image)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 kanikoExecutor | Specify the kaniko executor image, default to oamdev/kaniko-executor:v1.9.1. | string | false | oamdev/kaniko-executor:v1.9.1 
 context | Specify the context to build image, you can use context with git and branch or directly specify the context, please refer to https://github.com/GoogleContainerTools/kaniko#kaniko-build-contexts. | string | true |  
 dockerfile | Specify the dockerfile. | string | false | ./Dockerfile 
 image | Specify the image. | string | true |  
 platform | Specify the platform to build. | string | false |  
 buildArgs | Specify the build args. | []string | false |  
 credentials | Specify the credentials to access git and image registry. | [credentials](#credentials-build-push-image) | false |  
 verbosity | Specify the verbosity level. | "info" or "panic" or "fatal" or "error" or "warn" or "debug" or "trace" | false | info 


#### credentials (build-push-image)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 git | Specify the credentials to access git. | [git](#git-build-push-image) | false |  
 image | Specify the credentials to access image registry. | [image](#image-build-push-image) | false |  


##### git (build-push-image)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the secret name. | string | true |  
 key | Specify the secret key. | string | true |  


##### image (build-push-image)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the secret name. | string | true |  
 key | Specify the secret key. | string | false | .dockerconfigjson 


## Clean-Jobs

### Description

clean applied jobs in the cluster.

### Scope

This step type is valid in both Application and WorkflowRun.

### Examples (clean-jobs)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: clean-jobs
  namespace: default
spec:
  components: []
  workflow:
    steps:
    - name: clean-cli-jobs
      type: clean-jobs
      properties:
        labelSelector:
          "my-label": my-value
```

### Specification (clean-jobs)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labelselector |  | map[string]_ | false |  
 namespace |  | _&#124;_ | true |  


## Collect-Service-Endpoints

### Description

Collect service endpoints for the application.

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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
 config | Specify the content of the config. | map[string]_ | true |  


## Delete-Config

### Description

Delete a config.

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is only valid in Application.

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

### Scope

This step type is only valid in Application.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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
 kind | Specify the kind of the export destination. | "ConfigMap" or "Secret" | false | ConfigMap 
 data | Specify the data to export. | struct | true |  
 topology | Specify the topology to export. | string | false |  


## Export-Service

### Description

Export service to clusters specified by topology.

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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
 kind | Specify the kind of the secret. | "generic" or "docker-registry" | false | generic 
 dockerRegistry | Specify the docker data. | [dockerRegistry](#dockerregistry-export2secret) | false |  


#### dockerRegistry (export2secret)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 username | Specify the username of the docker registry. | string | true |  
 password | Specify the password of the docker registry. | string | true |  
 server | Specify the server of the docker registry. | string | false | https://index.docker.io/v1/ 


## Generate-Jdbc-Connection

### Description

Generate a JDBC connection based on Component of alibaba-rds.

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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
 url | Specify the the lark url, you can either sepcify it in value or use secretRef. | [type-option-1](#type-option-1-notification) or [type-option-2](#type-option-2-notification) | true |  
 message | Specify the message that you want to sent, refer to [Lark messaging](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#8b0f2a1b). | [message](#message-notification) | true |  


##### type-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value | the url address content in string. | string | true |  


##### type-option-2 (notification)

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
 url | Specify the the dingding url, you can either sepcify it in value or use secretRef. | [type-option-1](#type-option-1-notification) or [type-option-2](#type-option-2-notification) | true |  
 message | Specify the message that you want to sent, refer to [dingtalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw). | [message](#message-notification) | true |  


##### type-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value | the url address content in string. | string | true |  


##### type-option-2 (notification)

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
 text | Specify the message content of dingtalk notification. | null | false |  
 msgtype | msgType can be text, link, mardown, actionCard, feedCard. | "text" or "link" or "markdown" or "actionCard" or "feedCard" | false | text 
 link |  | null | false |  
 markdown |  | null | false |  
 at |  | null | false |  
 actionCard |  | null | false |  
 feedCard |  | null | false |  


#### slack (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url | Specify the the slack url, you can either sepcify it in value or use secretRef. | [type-option-1](#type-option-1-notification) or [type-option-2](#type-option-2-notification) | true |  
 message | Specify the message that you want to sent, refer to [slack messaging](https://api.slack.com/reference/messaging/payload). | [message](#message-notification) | true |  


##### type-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value | the url address content in string. | string | true |  


##### type-option-2 (notification)

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
 attachments |  | null | false |  
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
 password | Specify the password of the email, you can either sepcify it in value or use secretRef. | [type-option-1](#type-option-1-notification) or [type-option-2](#type-option-2-notification) | true |  
 host | Specify the host of your email. | string | true |  
 port | Specify the port of the email host, default to 587. | int | false | 587 


##### type-option-1 (notification)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value | the password content in string. | string | true |  


##### type-option-2 (notification)

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

### Scope

This step type is valid in both Application and WorkflowRun.

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


## Read-App

### Description

Read application from the cluster.

### Scope

This step type is only valid in WorkflowRun.

### Examples (read-app)

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: apply-applications
  namespace: default
  annotations:
    workflowrun.oam.dev/debug: "true"
spec:
  workflowSpec:
    steps:
      - name: check-app-exist
        type: read-app
        properties:
          name: webservice-app
      - name: apply-app1
        type: apply-app
        if: status["check-app-exist"].message == "Application not found"
        properties:
          data:
            apiVersion: core.oam.dev/v1beta1
            kind: Application
            metadata:
              name: webservice-app
            spec:
              components:
                - name: express-server
                  type: webservice
                  properties:
                    image: crccheck/hello-world
                    ports:
                      - port: 8000
      - name: suspend
        type: suspend
        timeout: 24h
      - name: apply-app2
        type: apply-app
        properties:
          ref:
            name: my-app
            key: application
            type: configMap
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app
  namespace: default
data:
  application: |
    apiVersion: core.oam.dev/v1beta1
    kind: Application
    metadata:
      name: webservice-app2
    spec:
      components:
        - name: express-server2
          type: webservice
          properties:
            image: crccheck/hello-world
            ports:
              - port: 8000
        
```

### Specification (read-app)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 namespace |  | _&#124;_ | true |  


## Read-Config

### Description

Read a config.

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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


## Request

### Description

Send request to the url.

### Scope

This step type is valid in both Application and WorkflowRun.

### Examples (request)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: request-http
  namespace: default
spec:
  components: []
  workflow:
    steps:
    - name: request
      type: request
      properties:
        url: https://api.github.com/repos/kubevela/workflow
      outputs:
        - name: stars
          valueFrom: |
            import "strconv"
            "Current star count: " + strconv.FormatInt(response["stargazers_count"], 10)
    - name: notification
      type: notification
      inputs:
        - from: stars
          parameterKey: slack.message.text
      properties:
        slack:
          url:
            value: <your slack url>
    - name: failed-notification
      type: notification
      if: status.request.failed
      properties:
        slack:
          url:
            value: <your slack url>
          message:
            text: "Failed to request github"
```

### Specification (request)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 url |  | string | true |  
 method |  | "GET" or "POST" or "PUT" or "DELETE" | false | GET 
 body |  | map[string]_ | false |  
 header |  | map[string]string | false |  


## Share-Cloud-Resource

### Description

Sync secrets created by terraform component to runtime clusters so that runtime clusters can share the created cloud resource.

### Scope

This step type is only valid in Application.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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

### Scope

This step type is valid in both Application and WorkflowRun.

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


## Vela-Cli

### Description

Run a vela command.

### Scope

This step type is valid in both Application and WorkflowRun.

### Examples (vela-cli)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-cli
  namespace: default
spec:
  components: []
  workflow:
    steps:
    - name: list-app
      type: vela-cli
      properties:
        command:
          - vela
          - ls
```

### Specification (vela-cli)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 addonName | Specify the name of the addon. | string | true |  
 command | Specify the vela command. | []string | true |  
 image | Specify the image. | string | false | oamdev/vela-cli:v1.6.4 
 serviceAccountName | specify serviceAccountName want to use. | string | false | kubevela-vela-core 
 storage |  | [storage](#storage-vela-cli) | false |  


#### storage (vela-cli)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secret | Mount Secret type storage. | [[]secret](#secret-vela-cli) | false |  
 hostPath | Declare host path type storage. | [[]hostPath](#hostpath-vela-cli) | false |  


##### secret (vela-cli)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 secretName |  | string | true |  
 items |  | [[]items](#items-vela-cli) | false |  


##### items (vela-cli)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### hostPath (vela-cli)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 path |  | string | true |  
 mountPath |  | string | true |  
 type |  | "Directory" or "DirectoryOrCreate" or "FileOrCreate" or "File" or "Socket" or "CharDevice" or "BlockDevice" | false | Directory 


## Webhook

### Description

Send a request to the specified Webhook URL. If no request body is specified, the current Application body will be sent by default.

### Scope

This step type is valid in both Application and WorkflowRun.

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
 url | Specify the webhook url. | [type-option-1](#type-option-1-webhook) or [type-option-2](#type-option-2-webhook) | true |  
 data | Specify the data you want to send. | map[string]_ | false |  


#### type-option-1 (webhook)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 value |  | string | true |  


#### type-option-2 (webhook)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretRef |  | [secretRef](#secretref-webhook) | true |  


##### secretRef (webhook)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | name is the name of the secret. | string | true |  
 key | key is the key in the secret. | string | true |  


