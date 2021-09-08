---
title:  Application
---

KubeVela takes Application as the basis of modeling, uses Components and Traits to complete a set of application deployment plans. After you are familiar with these core concepts, you can develop in accordance with the user manual and administrator manual according to your needs.

## Application

In modeling, the YAML file is the bearer of the application deployment plan. A typical YAML example is as follows:

```yaml
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend              # e.g. we want to deploy a frontend component and serves as web service
      type: webservice
      properties:
        image: nginx
      traits:
        - type: cpuscaler         # e.g. we add a CPU based auto scaler to this component
          properties:
            min: 1
            max: 10
            cpuPercent: 60
        - type: sidecar           # add a sidecar container into this component
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
              namespaceSelector:
                name: test
          - name: prod
            placement:
              namespaceSelector:
                name: prod                
  workflow:
    steps:
      #workflow step name
      - name: deploy-test-env
        type: multi-env
        properties:
          # Specify the policy name
          policy: demo-policy
          # Specify the env name in the policy
          env: test    
      - name: manual-approval
        # use suspend can stop workflow and wait here until condition changed
        type: suspend
      - name: deploy-prod-env
        type: multi-env
        properties:
          # Specify the policy name
          policy: demo-policy
          # Specify the env name in the policy
          env: prod    
```


The fields here correspond to:

- apiVersion: The OAM API version used.
- kind: of CRD Resourse Type. The one we use most often is Pod.
- metadata: business-related information. For example, this time I want to create a website.
- Spec: Describe what we need to deliver and tell Kubernetes what to make. Here we put the `components`, `policies` and `workflow` of KubeVela.
- components: KubeVela's component system.
- Traits: KubeVela's operation and maintenance feature system, works in component level.
- Policies: KubeVela's application level policy.
- Workflow: KubeVela's application level deployment workflow, you can custom every deployment step with it.

## Components

KubeVela has some built-in component types, you can find them by using [KubeVela CLI](../install#3-get-kubevela-cli):

```
vela components 
```

The output shows:

```
NAME        	NAMESPACE  	WORKLOAD                             	DESCRIPTION
helm        	vela-system	autodetects.core.oam.dev             	helm release is a group of K8s resources from either git
            	           	                                     	repository or helm repo
kustomize   	vela-system	autodetects.core.oam.dev             	kustomize can fetching, building, updating and applying
            	           	                                     	Kustomize manifests from git repo.
task        	vela-system	jobs.batch                           	Describes jobs that run code or a script to completion.
webservice  	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services
            	           	                                     	that have a stable network endpoint to receive external
            	           	                                     	network traffic from customers.
worker      	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services
            	           	                                     	that running at backend. They do NOT have network endpoint
            	           	                                     	to receive external network traffic.                    
alibaba-ack 	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud ACK cluster
alibaba-oss 	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud OSS object
alibaba-rds 	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud RDS object
```

You can continue to use [Helm](../end-user/components/helm) and [Kustomize](../end-user/components/kustomize) components to deploy your application, an application is a deployment plan.

If you're a platform builder who's familiar with Kubernetes, you can learn to [define your custom component](../platform-engineers/components/custom-component) to extend every kind of component in KubeVela. Especially, [Terraform Component](../platform-engineers/components/component-terraform) is one of the best practice.


## Traits

KubeVela also has many built-in traits, search them by using [KubeVela CLI](../install#3-get-kubevela-cli):

```
vela traits 
```

The result can be:

```
NAME       	NAMESPACE  	APPLIES-TO       	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION                                          
annotations	vela-system	deployments.apps 	              	true          	Add annotations for your Workload.                   
cpuscaler  	vela-system	webservice,worker	              	false         	Automatically scale the component based on CPU usage.
ingress    	vela-system	webservice,worker	              	false         	Enable public web traffic for the component.         
labels     	vela-system	deployments.apps 	              	true          	Add labels for your Workload.                        
scaler     	vela-system	webservice,worker	              	false         	Manually scale the component.                        
sidecar    	vela-system	deployments.apps 	              	true          	Inject a sidecar container to the component.   
```

You can learn how to bind trait by these detail docs, such as [ingress trait](../end-user/traits/ingress).

If you're a platform builder who's familiar with Kubernetes, you can learn to [define your custom trait](../platform-engineers/traits/customize-trait) to extend any operational capability for your users.

## Policy

Policy allows you to define application level capabilities, such as health check, security group, fire wall, SLO and so on.

Policy is similar to trait, but trait works for component while policy works for the whole application.

## Workflow

In KubeVela, Workflow allows user to glue various operation and maintenance tasks into one process, and achieve automated and rapid delivery of cloud-native applications to any hybrid environment. From the design point of view, the Workflow is to customize the control logic: not only simply apply all resources, but also to provide some process-oriented flexibility. For example, the use of Workflow can help us implement complex operations such as pause, manual verification, waiting state, data flow transmission, multi-environment grayscale, and A/B testing.

The Workflow is based on modular design. Each Workflow module is defined by a Definition CRD and provided to users for operation through K8s API. As a "super glue", the Workflow module can combine any of your tools and processes through the CUE language. This allows you to create your own modules through a powerful declarative language and cloud-native APIs.

> Especially, workflow works in application level, if you specify workflow, the resources won't be deployed if you don't specify any step to deploy it.

If you're a platform builder who's familiar with Kubernetes, you can learn to [define your own workflow step by using CUE](../platform-engineers/workflow/steps).

## What's Next

Here are some recommended next steps:

- Learn KubeVela's user guide to know how to deploy component, let's start from [helm component](../end-user/components/helm).
- Learn KubeVela's admin guide to learn more about [the OAM model](../platform-engineers/oam/oam-model).
