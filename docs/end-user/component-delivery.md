---
title:  Component Delivery // Deprecated
---

Components are one of the core concepts of KubeVela. You can use them to build the most common types of services, such as a Web Service that provides external access, a Worker that runs scheduled tasks on the backend, or enables Redis and including OSS from Cloud Provider and so on.

In order to help you quickly and comprehensively implement your business, KubeVela provides a large number of out-of-the-box component types, which not only include business components for conventional microservice scenarios, such as "service-oriented components" (webservice) and "back-end running components" (Worker), “one-off task component” (task), etc.

KubeVela also include general-purpose components for different product categories in the community, such as the “Helm component” that supports Helm Chart, the “Kustomize component” that supports Git Repo, etc. and at last it contains a series of commonly used cloud service components. If KubeVela's built-in component types cannot meet all your needs, KubeVela also has the ability to expand to almost any type of component products.

## KubeVela's Component

We use [KubeVela CLI][1] to check out all the available Components:

```shell
$ vela components
NAME        NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                            
alibaba-ack	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud ACK cluster       
alibaba-oss	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud OSS object        
alibaba-rds	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud RDS object        
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

Let's take several typical component types as example to introduce the usage of KubeVela component delivery. If you want to directly view how Cloud Services are used, please read [Integrated Cloud Service][2].


## Using Service-Based Components (Web Service)

Service-oriented components are components that support external access to services with the container as the core, and their functions cover the needs of most of he microservice scenarios.

Please copy shell below and apply to the cluster:
```shell
cat <<EOF | kubectl apply -f -
# YAML begins
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        port: 8080
        cpu: "0.1"
        env:
          - name: FOO
            value: bar
# YAML ends
EOF
```
You can also save the YAML file as website.yaml and use the `kubectl apply -f website.yaml` command to deploy.

Next, check the deployment status of the application through `kubectl get application <application name> -o yaml`:
```shell
$ kubectl get application website -o yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
  ... #  Omit non-critical information
spec:
  components:
  - name: frontend
    properties:
      ... #  Omit non-critical information
    type: webservice
status:
  conditions:
  - lastTransitionTime: "2021-08-28T10:26:47Z"
    reason: Available
    status: "True"
    ... #  Omit non-critical information
    type: HealthCheck
  observedGeneration: 1
  ... #  Omit non-critical information
  services:
  - healthy: true
    name: frontend
    workloadDefinition:
      apiVersion: apps/v1
      kind: Deployment
  status: running
```

When we see that the `status.services.healthy` field is true and the status is running, it means that the entire application is delivered successfully.

If status shows as rendering or healthy as false, it means that the application has either failed to deploy or is still being deployed. Please proceed according to the information returned in `kubectl get application <application name> -o yaml`.

You can also view through the CLI of vela, using the following command:
```shell
$ vela ls
APP    	COMPONENT	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
website	frontend 	webservice	      	running	healthy	      	2021-08-28 18:26:47 +0800 CST
```
We also see that the PHASE of the app is running and the STATUS is healthy.

## Using Helm Component

KubeVela's Helm component meets the needs of users to connect to Helm Chart. You can deploy any ready-made Helm chart software package from Helm Repo, Git Repo or OSS bucket through the Helm component, and overwrite its parameters.

We use the Chart package deployment method from the Helm Repo to explain. In this `Application`, we hope to deliver a component called redis-comp. It is a chart from the [bitnami](https://charts.bitnami.com/bitnami).

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis-comp
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        url: https://charts.bitnami.com/bitnami
        repoType: helm
EOF
```

Please copy the above code block and deploy it directly to the runtime cluster:
```shell
application.core.oam.dev/app-delivering-chart created
```

Finally, we use `vela ls` to view the application status after successful delivery:
```shell
APP                 	COMPONENT 	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
app-delivering-chart	redis-comp	helm      	      	running	healthy	      	2021-08-28 18:48:21 +0800 CST
```

We also see that the PHASE of the app-delivering-chart APP is running and the STATUS is healthy.

For usage examples of Git repositories and OSS buckets, and detailed configuration information about them, please go to Built-in Components in the Admin's Guide.

## Using Kustomize Component

KubeVela's `kustomize` component meets the needs of users to directly connect Yaml files and folders as component products. No matter whether your Yaml file/folder is stored in a Git Repo or an OSS bucket, KubeVela can read and deliver it.

Let's take the YAML folder component from the OSS bucket registry as an example to explain the usage. In the `Application` this time, I hope to deliver a component named bucket-comp. The deployment file corresponding to the component is stored in the cloud storage OSS bucket, and the corresponding bucket name is definition-registry. `kustomize.yaml` comes from this address of oss-cn-beijing.aliyuncs.com and the path is `./app/prod/`.

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      properties:
        repoType: oss
        # If the bucket is private, you will need to provide
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: definition-registry
        path: ./app/prod/
EOF
```
Please copy the above code block and deploy it directly to the runtime cluster:

```shell
application.core.oam.dev/bucket-app created
```

Finally, we use `vela ls` to view the application status after successful delivery:
```shell
vela ls
APP                 	COMPONENT  	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
bucket-app          	bucket-comp	kustomize 	      	running	healthy	      	2021-08-28 18:53:14 +0800 CST
```

The PHASE of the app is running, and the STATUS is healthy. Successful application deployment!

For usage examples of Git repositories and their detailed configuration item information, please go to Built-in Components in the Admin Guide.

## Using Cloud Service Component

Cloud Service components are also the core components supported by KubeVela. Cloud Services are often not used separately. Cloud Services such as databases and caches are often used after they are created. The relevant information is transferred to other components. At the same time, Cloud Services involve different cloud vendors, and Some authentication-related preparations will be explained independently in the chapter [Integrated Cloud Services][5].

## Custom Component

When none of the above KubeVela's built-in unpacking components can meet your needs, don’t worry, KubeVela provides powerful expansion capabilities and can be connected to almost any type of component form. You can check the [custom components][6] in the Admin Guide to Learn about how to use CUE and Kubernetes to extend KubeVela's component types.

## Next

- Visit the [Integrated Cloud Services][7] document to master the Cloud Service integration methods of different types and different vendors
- Visit the [Binding Trait][8] document to master how to bind the operation and maintenance actions and strategies you need to the component

[1]:	../getting-started/quick-install#3-get-kubevela-cli
[2]:	./cloud-services

[5]:	./cloud-services
[6]:	../platform-engineers/components/custom-component
[7]:	./cloud-services
[8]:	./binding-traits