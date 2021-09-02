---
title:  Want More?
---

## 1. Get from capability registry

You can get more from official capability registry by using KubeVela [plugin](../../developers/references/kubectl-plugin#install-kubectl-vela-plugin)。

### List

By default, the commands will list capabilities from [repo](https://registry.kubevela.net) maintained by KubeVela.

```shell
$ kubectl vela trait --discover
Showing traits from registry: https://registry.kubevela.net
NAME           	REGISTRY	  DEFINITION                    		APPLIES-TO               
service-account	default  	                              		    [webservice worker]      
env            	default 		                                    [webservice worker]      
flagger-rollout	default       canaries.flagger.app          		[webservice]             
init-container 	default 		                                    [webservice worker]      
keda-scaler    	default       scaledobjects.keda.sh         		[deployments.apps]       
metrics        	default       metricstraits.standard.oam.dev		[webservice backend task]
node-affinity  	default		                              		    [webservice worker]      
route          	default       routes.standard.oam.dev       		[webservice]             
virtualgroup   	default		                              		    [webservice worker] 
```

Note that the `--discover` flag means show all traits not in your cluster.

### Install

Then you can install a trait like:

```shell
$ kubectl vela trait get init-container
Installing component capability init-container
Successfully install trait: init-container                                                                                                 
```

## 2. Designed by yourself

* Read [how to edit definitions](../../platform-engineers/cue/definition-edit) to build your own capability from existing ones.
* [Build your own capability from scratch](../../platform-engineers/cue/advanced)
  and learn more features about how to [define custom traits](../../platform-engineers/traits/customize-trait).
