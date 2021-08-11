---
title:  应用部署计划
---

KubeVela 将 Application 应用程序作为建模的基础，使用 Components 组件和 Traits 运维特征，完成一整套的应用部署计划。在熟悉这些核心概念后，你可以根据需求，对应按照 [用户手册](../end-user/initializer-end-user) 和 [管理员手册](../platform-engineers/advanced-install.mdx) 进行开发。

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

同时作为管理员的你，也可以使用 [自定义组件](../platform-engineers/components/component-cue)、[Terraform 组件](../platform-engineers/components/component-terraform) 来自定义你的用户所需要的任何组件类型。

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

同时作为管理员的你，也可以继续使用 [自定义运维特征](../platform-engineers/traits/trait) 为你的用户，自定义任何需要的运维特征类型。

## 下一步

在理解了应用部署计划这套核心概念后，你可以进一步阅读关于 Workflow 交付工作流的概念。