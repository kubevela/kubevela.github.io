---
title:  获取更多
---

KubeVela 中的模块完全都是可定制和可插拔的，所以除了内置的运维能力之外，你还可以通过如下的方式添加更多您自己的运维能力。

## 1. 从官方或第三方能力中心获取模块化能力

可以通过 KubeVela 的 [Kubectl 插件](../../developers/references/kubectl-plugin#install-kubectl-vela-plugin)获取官方能力中心中发布的能力。

### 查看能力中心的模块列表

默认情况下，命令会从 KubeVela 官方维护的[能力中心](https://registry.kubevela.net)中获取模块化功能。

例如，让我们尝试列出注册表中所有可用的 trait：

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
请注意，`--discover` 标志表示显示不在集群中的所有特征。

### 从能力中心安装模块

然后你可以安装一个 trait，如：

```shell
$ kubectl vela trait get init-container
Installing component capability init-container
Successfully install trait: init-container                                                                                                 
```

## 2. 自定义模块化能力

* 阅读[管理模块化功能](../../platform-engineers/cue/definition-edit)，学习对已有的模块化能力进行修改和编辑。
* 从头开始[自定义模块化能力](../../platform-engineers/cue/advanced)，并了解自定义运维能力的[更多用法和功能](../../platform-engineers/traits/customize-trait)。