---
title: 内置工作流步骤列表
---

本文档将**按字典序**展示所有内置工作流步骤的参数列表。

> 本文档由[脚本](../../contributor/cli-ref-doc)自动生成，请勿手动修改，上次更新于 2023-01-13T18:00:08+08:00。

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


## Apply-Deployment

### 描述

Apply deployment with specified image and cmd。

### 示例 (apply-deployment)

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

### 参数说明 (apply-deployment)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 image |  | string | true |  
 cmd |  | []string | false |  


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
 value | Kubernetes 资源对象参数。 | map[string]_ | true |  
 cluster | 需要部署的集群名称。如果不指定，则为当前集群。 | string | false | empty 


## Apply-Terraform-Config

### 描述

Apply terraform configuration in the step。

### 示例 (apply-terraform-config)

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

### 参数说明 (apply-terraform-config)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 source | specify the source of the terraform configuration。 | [type-option-1](#type-option-1-apply-terraform-config) or [type-option-2](#type-option-2-apply-terraform-config) | true |  
 deleteResource | whether to delete resource。 | bool | false | true 
 variable | the variable in the configuration。 | map[string]_ | true |  
 writeConnectionSecretToRef | this specifies the namespace and name of a secret to which any connection details for this managed resource should be written。 | [writeConnectionSecretToRef](#writeconnectionsecrettoref-apply-terraform-config) | false |  
 providerRef | providerRef specifies the reference to Provider。 | [providerRef](#providerref-apply-terraform-config) | false |  
 region | region is cloud provider's region. It will override the region in the region field of providerRef。 | string | false |  
 jobEnv | the envs for job。 | map[string]_ | false |  
 forceDelete |  | bool | false | false 


#### type-option-1 (apply-terraform-config)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 hcl | directly specify the hcl of the terraform configuration。 | string | true |  


#### type-option-2 (apply-terraform-config)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 remote | specify the remote url of the terraform configuration。 | string | false | https://github.com/kubevela-contrib/terraform-modules.git 
 path | specify the path of the terraform configuration。 | string | false |  


#### writeConnectionSecretToRef (apply-terraform-config)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 namespace |  | _&#124;_ | true |  


#### providerRef (apply-terraform-config)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 namespace |  | _&#124;_ | true |  


## Apply-Terraform-Provider

### 描述

Apply terraform provider config。

### 示例 (apply-terraform-provider)

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

### 参数说明 (apply-terraform-provider)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
  |  | [AlibabaProvider](#alibabaprovider-apply-terraform-provider) or [AWSProvider](#awsprovider-apply-terraform-provider) or [AzureProvider](#azureprovider-apply-terraform-provider) or [BaiduProvider](#baiduprovider-apply-terraform-provider) or [ECProvider](#ecprovider-apply-terraform-provider) or [GCPProvider](#gcpprovider-apply-terraform-provider) or [TencentProvider](#tencentprovider-apply-terraform-provider) or [UCloudProvider](#ucloudprovider-apply-terraform-provider) | false |  


#### AlibabaProvider (apply-terraform-provider)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type |  | string | true |  
 accessKey |  | string | true |  
 secretKey |  | string | true |  
 name |  | string | false | alibaba-provider 
 region |  | string | true |  


#### AWSProvider (apply-terraform-provider)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 token |  | string | false | empty 
 type |  | string | true |  
 accessKey |  | string | true |  
 secretKey |  | string | true |  
 name |  | string | false | aws-provider 
 region |  | string | true |  


#### AzureProvider (apply-terraform-provider)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 subscriptionID |  | string | true |  
 tenantID |  | string | true |  
 clientID |  | string | true |  
 clientSecret |  | string | true |  
 name |  | string | false | azure-provider 


#### BaiduProvider (apply-terraform-provider)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type |  | string | true |  
 accessKey |  | string | true |  
 secretKey |  | string | true |  
 name |  | string | false | baidu-provider 
 region |  | string | true |  


#### ECProvider (apply-terraform-provider)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type |  | string | true |  
 apiKey |  | string | false | empty 
 name |  | string | true |  


#### GCPProvider (apply-terraform-provider)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 credentials |  | string | true |  
 region |  | string | true |  
 project |  | string | true |  
 type |  | string | true |  
 name |  | string | false | gcp-provider 


#### TencentProvider (apply-terraform-provider)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretID |  | string | true |  
 secretKey |  | string | true |  
 region |  | string | true |  
 type |  | string | true |  
 name |  | string | false | tencent-provider 


#### UCloudProvider (apply-terraform-provider)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 publicKey |  | string | true |  
 privateKey |  | string | true |  
 projectID |  | string | true |  
 region |  | string | true |  
 type |  | string | true |  
 name |  | string | false | ucloud-provider 


## Build-Push-Image

### 描述

Build and push image from git url。

### 示例 (build-push-image)

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

### 参数说明 (build-push-image)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 kanikoExecutor | Specify the kaniko executor image, default to oamdev/kaniko-executor:v1.9.1。 | string | false | oamdev/kaniko-executor:v1.9.1 
 context | Specify the context to build image, you can use context with git and branch or directly specify the context, please refer to https://github.com/GoogleContainerTools/kaniko#kaniko-build-contexts。 | string | true |  
 dockerfile | Specify the dockerfile。 | string | false | ./Dockerfile 
 image | Specify the image。 | string | true |  
 platform | Specify the platform to build。 | string | false |  
 buildArgs | Specify the build args。 | []string | false |  
 credentials | Specify the credentials to access git and image registry。 | [credentials](#credentials-build-push-image) | false |  
 verbosity | Specify the verbosity level。 | "info" or "panic" or "fatal" or "error" or "warn" or "debug" or "trace" | false | info 


#### credentials (build-push-image)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 git | Specify the credentials to access git。 | [git](#git-build-push-image) | false |  
 image | Specify the credentials to access image registry。 | [image](#image-build-push-image) | false |  


##### git (build-push-image)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the secret name。 | string | true |  
 key | Specify the secret key。 | string | true |  


##### image (build-push-image)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the secret name。 | string | true |  
 key | Specify the secret key。 | string | false | .dockerconfigjson 


## Clean-Jobs

### 描述

clean applied jobs in the cluster。

### 示例 (clean-jobs)

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

### 参数说明 (clean-jobs)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labelselector |  | map[string]_ | false |  
 namespace |  | _&#124;_ | true |  


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

### 示例 (create-config)

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

### 参数说明 (create-config)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the name of the config。 | string | true |  
 namespace | Specify the namespace of the config。 | string | false |  
 template | Specify the template of the config。 | string | false |  
 config | Specify the content of the config。 | map[string]_ | true |  


## Delete-Config

### 描述

Delete a config。

### 示例 (delete-config)

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

### 示例 (deploy-cloud-resource)

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
 kind | Specify the kind of the export destination。 | "ConfigMap" or "Secret" | false | ConfigMap 
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
 kind | Specify the kind of the secret。 | "generic" or "docker-registry" | false | generic 
 dockerRegistry | Specify the docker data。 | [dockerRegistry](#dockerregistry-export2secret) | false |  


#### dockerRegistry (export2secret)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 username | Specify the username of the docker registry。 | string | true |  
 password | Specify the password of the docker registry。 | string | true |  
 server | Specify the server of the docker registry。 | string | false | https://index.docker.io/v1/ 


## Generate-Jdbc-Connection

### 描述

Generate a JDBC connection based on Component of alibaba-rds。

### 示例 (generate-jdbc-connection)

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

### 参数说明 (generate-jdbc-connection)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify the name of the secret generated by database component。 | string | true |  
 namespace | Specify the namespace of the secret generated by database component。 | string | false |  


## List-Config

### 描述

List the configs。

### 示例 (list-config)

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
 url | Specify the the lark url, you can either sepcify it in value or use secretRef。 | [type-option-1](#type-option-1-notification) or [type-option-2](#type-option-2-notification) | true |  
 message | Specify the message that you want to sent, refer to [Lark messaging](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#8b0f2a1b)。 | [message](#message-notification) | true |  


##### type-option-1 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | the url address content in string。 | string | true |  


##### type-option-2 (notification)

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
 url | Specify the the dingding url, you can either sepcify it in value or use secretRef。 | [type-option-1](#type-option-1-notification) or [type-option-2](#type-option-2-notification) | true |  
 message | Specify the message that you want to sent, refer to [dingtalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw)。 | [message](#message-notification) | true |  


##### type-option-1 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | the url address content in string。 | string | true |  


##### type-option-2 (notification)

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
 text | Specify the message content of dingtalk notification。 | null | false |  
 msgtype | msgType can be text, link, mardown, actionCard, feedCard。 | "text" or "link" or "markdown" or "actionCard" or "feedCard" | false | text 
 link |  | null | false |  
 markdown |  | null | false |  
 at |  | null | false |  
 actionCard |  | null | false |  
 feedCard |  | null | false |  


#### slack (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 url | Slack 的 Webhook 地址，可以选择直接在 value 填写或从 secretRef 中获取。 | [type-option-1](#type-option-1-notification) or [type-option-2](#type-option-2-notification) | true |  
 message | Specify the message that you want to sent, refer to [slack messaging](https://api.slack.com/reference/messaging/payload)。 | [message](#message-notification) | true |  


##### type-option-1 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | the url address content in string。 | string | true |  


##### type-option-2 (notification)

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
 attachments |  | null | false |  
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
 password | Specify the password of the email, you can either sepcify it in value or use secretRef。 | [type-option-1](#type-option-1-notification) or [type-option-2](#type-option-2-notification) | true |  
 host | Specify the host of your email。 | string | true |  
 port | Specify the port of the email host, default to 587。 | int | false | 587 


##### type-option-1 (notification)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value | the password content in string。 | string | true |  


##### type-option-2 (notification)

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

### 示例 (read-config)

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


## Request

### 描述

Send request to the url。

### 示例 (request)

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

### 参数说明 (request)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 url |  | string | true |  
 method |  | "GET" or "POST" or "PUT" or "DELETE" | false | GET 
 body |  | map[string]_ | false |  
 header |  | map[string]string | false |  


## Share-Cloud-Resource

### 描述

Sync secrets created by terraform component to runtime clusters so that runtime clusters can share the created cloud resource。

### 示例 (share-cloud-resource)

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


## Vela-Cli

### 描述

Run a vela command。

### 示例 (vela-cli)

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

### 参数说明 (vela-cli)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 addonName | Specify the name of the addon。 | string | true |  
 command | Specify the vela command。 | []string | true |  
 image | Specify the image。 | string | false | oamdev/vela-cli:v1.6.4 
 serviceAccountName | specify serviceAccountName want to use。 | string | false | kubevela-vela-core 
 storage |  | [storage](#storage-vela-cli) | false |  


#### storage (vela-cli)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secret | Mount Secret type storage。 | [[]secret](#secret-vela-cli) | false |  
 hostPath | Declare host path type storage。 | [[]hostPath](#hostpath-vela-cli) | false |  


##### secret (vela-cli)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 secretName |  | string | true |  
 items |  | [[]items](#items-vela-cli) | false |  


##### items (vela-cli)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


##### hostPath (vela-cli)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 path |  | string | true |  
 mountPath |  | string | true |  
 type |  | "Directory" or "DirectoryOrCreate" or "FileOrCreate" or "File" or "Socket" or "CharDevice" or "BlockDevice" | false | Directory 


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
 url | 需要发送的 Webhook URL，可以选择直接在 value 填写或从 secretRef 中获取。 | [type-option-1](#type-option-1-webhook) or [type-option-2](#type-option-2-webhook) | true |  
 data | 需要发送的内容。 | map[string]_ | false |  


#### type-option-1 (webhook)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 value |  | string | true |  


#### type-option-2 (webhook)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretRef |  | [secretRef](#secretref-webhook) | true |  


##### secretRef (webhook)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Kubernetes Secret 名称。 | string | true |  
 key | Kubernetes Secret 中的 key。 | string | true |  


