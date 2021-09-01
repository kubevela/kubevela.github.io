---
title: Overview
---

```
$ vela components
NAME        	NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                 
alibaba-ack 	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud ACK cluster       
alibaba-oss 	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud OSS object        
alibaba-rds 	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud RDS object        
helm        	vela-system	autodetects.core.oam.dev             	helm release is a group of K8s resources from either git    
            	           	                                     	repository or helm repo                                     
kustomize   	vela-system	autodetects.core.oam.dev             	kustomize can fetching, building, updating and applying     
            	           	                                     	Kustomize manifests from git repo.                          
my-stateful 	vela-system	statefulsets.apps                    	My StatefulSet component.                                   
raw         	vela-system	autodetects.core.oam.dev             	raw allow users to specify raw K8s object in properties     
task        	vela-system	jobs.batch                           	Describes jobs that run code or a script to completion.     
webservice  	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services    
            	           	                                     	that have a stable network endpoint to receive external     
            	           	                                     	network traffic from customers.                             
wei-stateful	vela-system	statefulsets.apps                    	My StatefulSet component.                                   
worker      	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services    
            	           	                                     	that running at backend. They do NOT have network endpoint  
            	           	                                     	to receive external network traffic.                        
```