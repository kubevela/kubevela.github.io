---
title:  CUE 组件
---

作为用户的你，一定希望随时可以找到开箱即用的组件，同时如果没有找到满足需求的组件，又可以灵活地自定义你想要的组件。

KubeVela 通过强大的 CUE 配置语言去粘合开源社区里的所有相关能力。我们给你提供了一些开箱即用的组件能力，也为你们的平台管理员，开放了灵活的自定义组件开发方式。

可以先使用指令看看我们已经通过 CUE 内置的组件能力：

```
$ vela components
NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                 
alibaba-rds	default    	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud RDS object        
stateless  	default    	deployments.apps                     	description not defined                                     
task       	default    	jobs.batch                           	Describes jobs that run code or a script to completion.     
webserver  	default    	deployments.apps                     	webserver is a combo of Deployment + Service                
helm       	vela-system	autodetects.core.oam.dev             	helm release is a group of K8s resources from either git    
           	           	                                     	repository or helm repo                                     
kustomize  	vela-system	autodetects.core.oam.dev             	kustomize can fetching, building, updating and applying     
           	           	                                     	Kustomize manifests from git repo.                          
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

在你想要通过自定义组件来满足需求的时候，可以自己查看管理员手册里的[自定义组件](../../platform-engineers/components/custom-component)进行开发，或者请求你们的平台管理员进行开发。