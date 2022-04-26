---
title:  应用交付模型
---

KubeVela 背后的应用交付模型是 [Open Application Model](../platform-engineers/oam/oam-model)，简称 OAM ，其核心是将应用部署所需的所有组件和各项运维动作，描述为一个统一的、与基础设施无关的“部署计划”，进而实现在混合环境中进行标准化和高效率的应用交付。

## 应用部署计划（Application）

KubeVela 通过声明式 YAML 文件的方式来描述应用部署计划。一个典型的样例如下：

```yaml
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend              # 比如我们希望部署一个实现前端业务的 Web Service 类型组件
      type: webservice
      properties:
        image: nginx
      traits:
        - type: cpuscaler         # 给组件设置一个可以动态调节 CPU 使用率的 cpuscaler 类型运维特征
          properties:
            min: 1
            max: 10
            cpuPercent: 60
        - type: sidecar           # 往运行时集群部署之前，注入一个做辅助工作的 sidecar
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
  policies:
    - name: demo-policy
      type: env-binding
      properties:
        envs:
          - name: test
            placement:
              clusterSelector:
                name: cluster-test
          - name: prod
            placement:
              clusterSelector:
                name: cluster-prod
  workflow:
    steps:
        # 步骤名称
      - name: deploy-test-env
        # 指定步骤类型
        type: deploy2env
        properties:
          # 指定策略名称
          policy: demo-policy
          # 指定部署的环境名称
          env: test    
      - name: manual-approval
        # 工作流内置 suspend 类型的任务，用于暂停工作流
        type: suspend
      - name: deploy-prod-env
        type: deploy2env
        properties:
          policy: demo-policy
          env: prod    
```

在使用时，一个应用部署计划由组件、运维特征、策略、工作流等多个模块组装而成。

## 组件（Components）

一个应用部署计划可以包含很多待部署组件。KubeVela 内置了常用的组件类型，使用 [KubeVela CLI](../install#3-安装-kubevela-cli) 命令查看：
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

## 运维特征（Traits）

运维特征是可以随时绑定给待部署组件的、模块化的运维能力。KubeVela 也内置了常用的运维特征类型，使用 [KubeVela CLI](../install#3-安装-kubevela-cli) 命令查看：
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

## 应用策略（Policy)

应用策略（Policy）负责定义指定应用交付过程中的策略，比如质量保证策略、安全组策略、防火墙规则、SLO 目标、放置策略等等。

## 工作流（Workflow）

工作流允许用户将组件、运维特征、具体的交付动作等一系列元素组装成为一个完整的、面向过程的有向无环图（DAG）。典型的工作流步骤包括暂停、人工审核、等待、数据传递、多环境/多集群发布、A/B 测试等等。

![alt](../resources/workflow.png)

每一个策略和工作流步骤在 KubeVela 中都是一个完全可插拔的独立功能模块，KubeVela 允许你通过 CUE 语言自由的定义和创建属于自己的工作流步骤来组成自己的交付计划。

## 下一步

后续步骤:

- 加入 KubeVela 中文社区钉钉群，群号：23310022。
- 阅读[**用户手册**](../end-user/components/helm)，从 Helm 组件开始了解如何构建你的应用部署计划。
- 阅读[**管理员手册**](../platform-engineers/oam/oam-model)了解开放应用模型的细节。