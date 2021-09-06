---
title:  Integrated Cloud Services
---

Cloud-oriented development is now becoming the norm, there is an urgent need to integrate cloud resources from different sources and types. Whether it is the most basic object storage, cloud database, or load balancing, it is all faced with the challenges of hybrid cloud, multi-cloud and other complex environments, and KubeVela is perfect for the needs.

KubeVela efficiently and securely integrates different types of cloud resources through resource binding capabilities in cloud resource Components and Traits. At present, you can directly use the default components of AliCloud Kubernetes(ACK), AliCloud Object Storage Service (OSS) and AliCloud Relational Database Service (RDS). At the same time, more new cloud resources will gradually become the default option under the support of the community in the future, so that you can use cloud resources of various manufacturers in a standardized and unified way.

## Check the cloud resources in KubeVela

We can use [KubeVela CLI](../getting-started/quick-install#3-Get-KubeVela-CLI) to check the available cloud resources in the current cluster:

```shell
$ vela components
NAME        NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                            
alibaba-ack	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud ACK cluster       
alibaba-oss	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud OSS object        
alibaba-rds	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud RDS object        
```

The integration process of cloud resources in KubeVela is as follows:

- Get required secret or token from cloud service providers.
- Save the authentication information to the global configuration of Terraform and verify it.
- KubeVela will authenticate with the Terraform controller and automatically pull up cloud resources.

## Activate cloud resources

Prepare the token of the cloud resources and use `vela addon enable` to configure the authentication:

```shell
vela addon enable terraform/provider-alicloud --ALICLOUD_ACCESS_KEY_ID=<your key ID> -ALICLOUD_SECRET_ACCESS_KEY=<your key secret>
```

Take the example of AliCloud relational database (RDS) as an example to explain.

### Apply cloud resource

Apply the `Application`:

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: rds-server
      type: webservice
      properties:
        image: zzxwill/flask-web-application:v0.3.1-crossplane
        ports: 80
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

We use a `webservice` component as the server for RDS, while the `alibaba-rds` component named `sample-db` takes responsibility for pulling cloud resources, and the database information is written to `db-conn`.

Generally, it takes a lot of time to pull up cloud resources. For example, RDS here takes about 15 minutes. We can see its whole process from rendering, health check to running:

```
$ vela ls                  
APP                  	COMPONENT     	TYPE       	TRAITS            	PHASE  	HEALTHY	STATUS                                        	CREATED-TIME 
webapp               	rds-server    	webservice 	service-binding   	rendering	       	      	2021-08-30 20:04:03 +0800 CST
└─                 	sample-db     	alibaba-rds	                  	rendering	       	      	2021-08-30 20:04:03 +0800 CST

webapp               	rds-server    	webservice 	service-binding   	healthChecking	healthy  	                                      	2021-08-30 20:04:03 +0800 CST
└─                 	sample-db     	alibaba-rds	                  	healthChecking	unhealthy	Cloud resources are being provisioned.	2021-08-30 20:04:03 +0800 CST

webapp               	rds-server    	webservice 	service-binding   	running	healthy	                                              	2021-08-30 20:04:03 +0800 CST
└─                 	sample-db     	alibaba-rds	                  	running	healthy	Cloud resources are deployed and ready to use.	2021-08-30 20:04:03 +0800 CST
```

### Bind cloud resources to components

Use Traits `service-binding` and update the YAML file, the `db-conn` will send secret and token to the `rds-server` component:

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: rds-server
      type: webservice
      properties:
        image: zzxwill/flask-web-application:v0.3.1-crossplane
        ports: 80
      traits:
        - type: service-binding
          properties:
            envMappings:
              # 环境变量与 db-conn 密钥形成映射
              DB_PASSWORD:
                secret: db-conn                             
              endpoint:
                secret: db-conn
                key: DB_HOST          
              username:
                secret: db-conn
                key: DB_USER
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

For more cloud resources usages, please check built-in cloud resources in platform-engineers doc.

## Custom cloud resources

If the out-of-the-box cloud resources don't cover your needs, you can still use the flexible [Terraform component](../platform-engineers/components/component-terraform) to build your own cloud resources.

## Next

- [Component Observability](./component-observability)
- [Data Pass Between Components ](./component-dependency-parameter)
- [Multi-Cluster and Environment](./multi-app-env-cluster)