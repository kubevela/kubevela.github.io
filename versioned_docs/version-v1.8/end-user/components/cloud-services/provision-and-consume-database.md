---
title: Provision and Binding Database
---

:::tip
This section requires your platform engineers have already enabled [terraform addon](../../../reference/addons/terraform).
:::

This tutorial will talk about how to provision and consume Alibaba Cloud RDS (and OSS) by Terraform.

Let's deploy the [application](https://github.com/kubevela/kubevela/tree/master/docs/examples/terraform/cloud-resource-provision-and-consume/application.yaml)
below to provision Alibaba Cloud OSS and RDS cloud resources, and consume them by the web component.

```yaml
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
        port: 80
      traits:
        - type: service-binding
          properties:
            envMappings:
              # environments refer to db-conn secret
              DB_PASSWORD:
                secret: db-conn                                   # 1) If the env name is the same as the secret key, secret key can be omitted.
              endpoint:
                secret: db-conn
                key: DB_PUBLIC_HOS                                # 2) If the env name is different from secret key, secret key has to be set.
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

    - name: sample-oss
      type: alibaba-oss
      properties:
        bucket: vela-website-0911
        acl: private
        writeConnectionSecretToRef:
          name: oss-conn
```

The component `sample-db` will generate secret `db-conn` with [these keys](./terraform/alibaba-rds#outputs), and the component
`sample-oss` will generate secret `oss-conn`. These secrets are binded to the Envs of component `express-server` by trait
[Service Binding](../../traits/service-binding). Then the component can consume instances of OSS and RDS.

Deploy and verify the application.

```shell
$ vela ls
APP   	COMPONENT     	TYPE       	TRAITS         	PHASE         	HEALTHY  	STATUS	CREATED-TIME
webapp	express-server	webservice 	service-binding	running     	healthy  	      	2021-09-08 16:50:41 +0800 CST
├─    	sample-db     	alibaba-rds	               	running     	healthy  	      	2021-09-08 16:50:41 +0800 CST
└─    	sample-oss    	alibaba-oss	               	running     	healthy  	      	2021-09-08 16:50:41 +0800 CST
```

```shell
$ vela port-forward webapp
Forwarding from 127.0.0.1:8080 -> 80
Forwarding from [::1]:8080 -> 80

Forward successfully! Opening browser ...
```

![](../../../resources/crossplane-visit-application-v3.jpg)

