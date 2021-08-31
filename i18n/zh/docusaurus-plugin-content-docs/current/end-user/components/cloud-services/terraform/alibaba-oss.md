---
title:  Alibaba OSS
---

本节，我们将为你介绍如何集成阿里云的对象存储（OSS），成为应用部署计划（Application）的一个可用组件。这些云资源的集成，由 Terraform 提供支撑。

## 开始之前

> 🔧 开启 [Terrafom](../../../addons/introduction) 插件即可使用 Terraform 类型组件。

### 安装组件

由于该组件暂未直接内置，请运行如下命令进行安装：

```shell
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/terraform/cloud-resource-provision-and-consume/ComponentDefinition-alibaba-oss.yaml
```

接下来，通过命令行 `vela components` 就可以查看，是否这个组件被成功安装进 KubeVela 控制平面里：

```
$ vela components
NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                 
alibaba-oss	default    	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud OSS object 
```

安装成功！请把它使用到你的应用部署计划中去吧。

### 如何使用

请直接复制一个编写好的应用部署计划示例，在命令行中执行：

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: zzxwill/flask-web-application:v0.3.1-crossplane
        ports: 80
      traits:
        - type: service-binding
          properties:
            envMappings:
              # environments refer to db-conn secret
              DB_PASSWORD:
                secret: db-conn                             
              endpoint:
                secret: db-conn
                key: DB_HOST          
              username:
                secret: db-conn
                key: DB_USER
              # environments refer to oss-conn secret
              BUCKET_NAME:
                secret: oss-conn

    - name: sample-db
      type: alibaba-rds
      properties:
        instance_name: sample-db
        account_name: oamtest
        password: U34rfwefwefffaked
        writeConnectionSecretToRef:
          name: db-conn
EOF
```
我们在 alibaba-rds 获取的 name: db-conn 将会由 service-binding 运维特征对象进行转发，并注入 express-server 这个组件的环境变量 ENV 中，最终在运行时集群启用这个云服务。
请结合 [运维特征 `service-binding`](../../../../platform-engineers/traits/built-in/service-binding) 对象的使用文档一起查看。

查看 Vela CLI 控制台的返回信息：
```
application.core.oam.dev/webapp configured
```

最后我们可以多次使用 `vela ls` 查看 `webapp` 这个应用的创建状态，直到其创建成功：
```
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS            	PHASE         	HEALTHY  	STATUS                                	CREATED-TIME                 
webapp              	express-server	webservice 	service-binding   	healthChecking	healthy  	                                      	2021-08-20 19:21:36 +0800 CST
└─                	sample-db     	alibaba-rds	                  	healthChecking	unhealthy	Cloud resources are being provisioned.	2021-08-20 19:21:36 +0800 CST

```