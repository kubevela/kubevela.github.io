---
title:  CUE 组件
---

> ⚠️ 请安装 [KubeVela CLI 命令行工具](../../getting-started/quick-install.mdx##3)

作为用户的你，一定希望随时可以找到开箱即用的组件，同时如果没有找到满足需求的组件，又可以灵活地自定义你想要的组件。

KubeVela 通过强大的 CUE 配置语言去粘合开源社区里的所有相关能力。我们给你提供了一些开箱即用的组件能力，也为你们的平台管理员，开放了灵活的自定义组件开发方式。

可以先使 vela CLI 看看我们已经通过 CUE 默认内置的组件能力：

```
$ vela components
NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                         
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

我们以一个简单的 task 类型组件进行讲解，它用来给定一个运行代码或脚本的作业。

先用 vela CLI 查询熟悉一下 task 组件的配置项目：

```
$ vela show task
# Properties
+---------+-------------+----------+----------+---------+
|  NAME   | DESCRIPTION |   TYPE   | REQUIRED | DEFAULT |
+---------+-------------+----------+----------+---------+
| cmd     |             | []string | false    |         |
| count   |             | int      | true     |       1 |
| restart |             | string   | true     | Never   |
| image   |             | string   | true     |         |
+---------+-------------+----------+----------+---------+
```

然后编写一个如下的 YMAL 并部署到运行时集群：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-worker
spec:
  components:
    - name: mytask
      type: task
      properties:
        image: perl
	    count: 10
	    cmd: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
```

最后，在你想要通过自定义组件来满足需求的时候，可以自己查看管理员手册里的[自定义组件](../../platform-engineers/components/custom-component)进行开发，或者请求你们的平台管理员进行开发。