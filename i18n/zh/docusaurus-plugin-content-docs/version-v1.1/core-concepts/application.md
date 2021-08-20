---
title:  应用部署计划
---

KubeVela 将 Application 应用程序作为建模的基础，使用 Components 组件和 Traits 运维特征，完成一整套的应用部署计划。在熟悉这些核心概念后，你可以根据需求，对应按照 [用户手册](../end-user/components/helm) 和 [管理员手册](../platform-engineers/oam/oam-model) 进行开发。

### Application 应用程序

在技术建模中，YAML 文件是应用部署计划的承载。一个典型的 YAML 样例如下：
```
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend              # This is the component I want to deploy
      type: webservice
      properties:
        image: nginx
      traits:
        - type: cpuscaler         # Automatically scale the component by CPU usage after deployed
          properties:
            min: 1
            max: 10
            cpuPercent: 60
        - type: sidecar           # Inject a fluentd sidecar before applying the component to runtime cluster
          properties:
            name: "sidecar-test"
            image: "fluentd"
    - name: backend
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
```
这里的字段对应着：

- `apiVersion`：所使用的 OAM API 版本。
- `kind`：种类。我们最经常用到的就是 Pod 了。
- `metadata`：业务相关信息。比如这次要创建的是一个网站。
- `Spec`：描述我们需要应用去交付什么，告诉 Kubernetes 做成什么样。这里我们放入 KubeVela 的 `components`。
- `components`：KubeVela 的组件系统。
- `traits`：KubeVela 的运维特征系统。

下面这张示意图诠释了它们之间的关系：
![image.png](../resources/concepts.png)

先有一个应用程序 Application。在此基础之上我们申明应用主体为可配置、可部署的组件 Components，并同时对应地去申明，期望每个组件要拥有的相关运维特征 Traits。

你使用 KubeVela 的时候，就像在玩“乐高“积木：先拿起一块大的“应用程序”，然后往上固定一块或几块“组件”，组件上又可以贴上任何颜色大小的“运维特征”。同时根据需求的变化，你随时可以重新组装，形成新的应用部署计划。

### Components 组件

KubeVela 内置了常用的组件类型，使用 [KubeVela CLI](../getting-started/quick-install.mdx##3) 命令查看：
```
vela components 
```
返回结果：
```
NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                 
alibaba-rds	default    	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud RDS object        
task       	vela-system	jobs.batch                           	Describes jobs that run code or a script to completion.     
webservice 	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services    
           	           	                                     	that have a stable network endpoint to receive external     
           	           	                                     	network traffic from customers.                             
worker     	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services    
           	           	                                     	that running at backend. They do NOT have network endpoint  
           	           	                                     	to receive external network traffic.                        

```

作为用户的你，可以继续使用 [CUE 组件](../end-user/components/cue)、[Helm 组件](../end-user/components/helm)、[Kustomize 组件](../end-user/components/kustomize)和[云服务组件](../end-user/components/cloud-services/terraform/rds)来实现你需要的任何组件类型。

同时作为管理员的你，也可以使用 [自定义组件](../platform-engineers/components/custom-component)、[Terraform 组件](../platform-engineers/components/component-terraform) 来自定义你的用户所需要的任何组件类型。

### Traits 运维特征

KubeVela 也内置了常用的运维特征类型，使用 [KubeVela CLI](../getting-started/quick-install.mdx##3) 命令查看：
```
vela traits 
```
返回结果：
```
NAME       	NAMESPACE  	APPLIES-TO       	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION                                          
annotations	vela-system	deployments.apps 	              	true          	Add annotations for your Workload.                   
cpuscaler  	vela-system	webservice,worker	              	false         	Automatically scale the component based on CPU usage.
ingress    	vela-system	webservice,worker	              	false         	Enable public web traffic for the component.         
labels     	vela-system	deployments.apps 	              	true          	Add labels for your Workload.                        
scaler     	vela-system	webservice,worker	              	false         	Manually scale the component.                        
sidecar    	vela-system	deployments.apps 	              	true          	Inject a sidecar container to the component.   
```

作为用户的你，可以继续阅读用户手册里的 [绑定运维特征](../end-user/traits/ingress) ，具体查看如何完成各种运维特征的开发。

同时作为管理员的你，也可以继续使用 [自定义运维特征](../platform-engineers/traits/customize-trait) 为你的用户，自定义任何需要的运维特征类型。

### Workflow 工作流

在 KubeVela 里，工作流能够让用户去粘合各种运维任务到一个流程中去，实现自动化地快速交付云原生应用到任意混合环境中。
从设计上讲，工作流是为了定制化控制逻辑：不仅仅是简单地 Apply 所有资源，更是为了能够提供一些面向过程的灵活性。
比如说，使用工作流能够帮助我们实现暂停、人工验证、等待状态、数据流传递、多环境灰度、A/B 测试等复杂操作。

工作流是基于模块化设计的。
每一个工作流模块都由一个 Definition CRD 定义并且通过 K8s API 来提供给用户操作。
工作流模块作为一个“超级粘合剂”可以将你任意的工具和流程都通过 CUE 语言来组合起来。
这让你可以通过强大的声明式语言和云原生 API 来创建你自己的模块。

下面是一个例子：

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
      image: crccheck/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  - name: nginx-server
    type: webservice
    properties:
      image: nginx:1.21
      port: 80
  workflow:
    steps:
      - name: express-server
        # 指定步骤类型
        type: apply-component
        properties:
          # 指定组件名称
          component: express-server
      - name: manual-approval
        # 工作流内置 suspend 类型的任务，用于暂停工作流
        type: suspend
      - name: nginx-server
        type: apply-component
        properties:
          component: nginx-server
```

接下来我们对上面的例子做更详细的说明：

- 这里使用了 `apply-component` 和 `suspend` 类型的工作流步骤：
  - `apply-component` 类型可以使用户部署指定的组件及其运维特征。
  - 在第一步完成后，开始执行 `suspend` 类型的工作流步骤。该步骤会暂停工作流，我们可以查看集群中第一个组件的状态，当其成功运行后，再使用 `vela workflow resume first-vela-workflow` 命令来继续该工作流。
  - 当工作流继续运行后，第三个步骤开始部署组件及运维特征。此时我们查看集群，可以看到所以资源都已经被成功部署。

到这里我们已经介绍完 KubeVela 工作流的基本概念。作为下一步，你可以：

- [动手尝试工作流的实践案例](../end-user/workflow/apply-component).
- [学习创建你自己的 Definition 模块](../platform-engineers/workflow/steps). 
- [了解工作流系统背后的设计和架构](https://github.com/oam-dev/kubevela/blob/master/design/vela-core/workflow_policy.md).
