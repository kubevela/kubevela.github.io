---
title: "How Does an Open-Source Workflow Engine Support an Enterprise-Level Serverless Architecture?"
author: Fog Dong
author_title: KubeVela team
author_url: https://github.com/FogDong
author_image_url: https://avatars.githubusercontent.com/u/15977536?v=4
tags: [ KubeVela, Workflow, serverless, "use-case" ]
description: "This article will focus on KubeVela Workflow and show its enterprise use cases in serverless scenario"
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

[Serverless Application Engine (SAE)](https://www.alibabacloud.com/product/severless-application-engine) is a Kubernetes-based cloud product that combines the Serverless architecture and the microservice model. As an iterative cloud product, it has encountered many challenges in the process of rapid development. **How can we solve these challenges in the booming cloud-native era and perform reliable and fast upgrades for architecture?** The SAE team and the KubeVela community worked closely to address these challenges and came up with a replicable open-source solution, KubeVela Workflow. 

This article describes how to use KubeVela Workflow to upgrade the architecture of SAE and interprets multiple practice scenarios. 

<!--truncate-->

## Challenges in the Serverless Era

SAE is an application hosting platform for business application architecture and microservices. It is a Kubernetes-based cloud product that combines the Serverless architecture and the microservice model. 

![image.png](/img/blog/workflow-sae/en/wf-sae-1.png)

As shown in the preceding architecture diagram, SAE users can host multiple types of applications on SAE. At the underlying layer of SAE, the Java business layer processes the relevant business logic and interacts with Kubernetes resources. At the bottom, it relies on highly available, O&M-free, and pay-as-you-go elastic resource pools. 

In this architecture, SAE mainly relies on its Java business layer to provide users with capabilities. This architecture helps users easily deploy applications. Still, at the same time, it brings some challenges as well. 

With the continuous development of Serverless, SAE has encountered three major challenges:

1. Engineers in SAE have some complex and non-standardized operations. **How can we automate these complex operations to reduce development consumption?**
2. With the development of business, the application-delivering capability of SAE is favored by a large number of users. The growth of users also brings efficiency challenges.** How can we optimize the existing delivery capability and improve efficiency in high concurrency?**
3. As Serverless architecture continues to be implemented in enterprises, numerous of cloud vendors are making their product systems serverless. **In such a wave, how can SAE quickly connect with internal Serverless capabilities and reduce development costs while launching new features?**

The preceding three challenges show that SAE needs some kind of orchestration engine to upgrade the delivery process, integrate with internal capabilities, and automate operations. 

So, what does this orchestration engine need to meet to solve these challenges?

1. **High Scalability:** The steps in the process need to be highly scalable for this orchestration engine. Only in this way can the originally non-standardized and complex operations be standardized with the steps. In the meanwhile, the steps can combine with the process control capability of the orchestration engine, thus reducing the consumption of development resources. 
2. **Lightweight and Efficient:** This orchestration engine must be efficient and production-ready, so as to meet the high concurrency requirements of SAE in large-scale user scenarios. 
3. **Strong Integration and Process Control Capabilities:** This orchestration engine needs to be able to quickly integrate with the atomic functions in the company. If the glue code that connects upstream and downstream capabilities can be transformed into the process in the orchestration engine, development costs can be reduced.

Based on these challenges and considerations, the SAE team and the KubeVela community have conducted in-depth cooperation and launched the [KubeVela Workflow](https://github.com/kubevela/workflow) project as an orchestration engine. 

## Why Use Kubevela Workflow? 
Thanks to the booming ecological of cloud-native, there are already many mature workflow projects in the community (such as Tekton, Argo, etc.). There are also some orchestration engines within Alibaba Cloud. So, *why **reinvent the wheel** instead of using existing technology?*

This is because KubeVela Workflow has a fundamental difference in design. **The steps in the workflow are designed for the cloud-native IaC system and support abstract encapsulation and reuse, which means that you can use atomic capabilities like a function call in every step, instead of just creating pods or containers.**

![image.png](/img/blog/workflow-sae/en/wf-sae-2.png)

In KubeVela Workflow, each step has a step type, and each step type corresponds to the resource callend `WorkflowStepDefinition`. You can use the [CUE language](https://github.com/cue-lang/cue) (an IaC language, which is a superset of JSON) to write this step definition or directly use the step type defined in the community. 

You can simply regard a `WorkflowStepDefinition` as a function declaration. Each time a new step type is defined, a new function is defined. The function requires some input parameters, and the step definition is the same. In the step definition, you can define the input parameters required for this step type in the `parameter` field. When the workflow is running, the workflow controller executes the CUE code in the corresponding step definition using the actual parameter values input by the user, just as it executes your custom function. 

With such a layer of abstraction of the steps, it adds huge possibilities to the steps: 

- If you want to customize the step type (just like writing a new function), you can import the official code packages in the step definition, thus introducing other atomic capabilities into the step, including HTTP requests, CRUD resources in multiple clusters, conditional waiting, etc. With such a programmable step type, you can easily integrate with any system. For example, in the SAE scenario, the step definition is integrate with other internal atomic capabilities (such as MSE, ACR, ALB, SLS, etc.). Then, the workflow orchestration capability is used to control the process.

![image.png](/img/blog/workflow-sae/en/wf-sae-3.png)

- If you only want to use defined steps, just like calling a packaged third-party function, the only thing you need to care about is your input parameters and the step type you want. For example, in a typical image-building scenario, first, specify the step type as `build-push-image` and then specify your input parameters: the code source and branch of the built image, the name of the built image, and the secret key of the image repository to push. 

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: build-push-image
  namespace: default
spec:
  workflowSpec:
   steps:
    - name: build-push
      type: build-push-image
      properties:
        context:
          git: github.com/FogDong/simple-web-demo
          branch: main
        image: fogdong/simple-web-demo:v1
        credentials:
          image:
            name: image-secret
```

In such an architecture, the abstraction of the step brings infinite possibilities to the workflow. When you need to add a step to the workflow, you no longer need to compile-build-package the business code and then use the pod to execute the code. You only need to modify the configuration code in the step definition (together with the workflow engine's orchestration and control capability) to integrate with new features.

This is also the main reason why SAE chooses Kubevela Workflow. Based on scalability, we can fully leverage the power of ecology and accelerate product upgrades. 

## Cases
Next, let's go deeper into the user cases in SAE. 
### Case 1: Automated Operations
The first scenario is an automated operations scenario for SREs in SAE. 

In SAE, we write and update some base images for users. We need to preload these images to multiple clusters in different regions to provide a better experience for users who use these base images. 

The original operation process is very complicated. It involves building images and pushing them across multiple regions using ACR, as well as creating image cache templates and managing those image caches. Regions here include Shanghai, US West, Shenzhen, and Singapore. These operations are non-standardized and time-consuming. This is because when an SRE needs to push these images from the local to foreign clusters, it is likely to fail due to network problems. Therefore, he needs to disperse his energy on these operations that could otherwise be automated.

This is also the scenario that KubeVela Workflow is suitable for: each step in these operations can be converted into a step in the workflow programmatically, so that these steps can be orchestrated and reused. In addition, KubeVela Workflow provides a visual dashboard. SREs only need to configure a pipeline template once, and can automate the process by triggering execution or by entering specific runtime parameters each time the execution is triggered.

The simplified steps is like below:

1. Use the `HTTP request` step type to build an image by requesting the service of ACR and pass the image ID to the next step through inputs/outputs. In this step definition, you need to wait until the ACR service is done before ending the execution of the current step. 
2. If the first step fails, execute the `error handle` step.
3. If the first step is successfully built, use the `HTTP request` step to build image cache, at the same time, the service logs are used as the source of the current step.  Here you can view the logs of the steps directly in the Dashboard to troubleshoot problems.
4. Use a `step group` with `deploy` step type to preload images for clusters in the China (Shanghai) region and the US (West) region. The multi-cluster management and control capabilities of KubeVela Workflow are used to distribute the `ImagePullJob` workload to multiple clusters to preload images. 

![image.png](/img/blog/workflow-sae/en/wf-sae-4.png)

In the preceding process, if you do not use KubeVela Workflow, you may need to write a bunch of business code to connect multiple services and clusters. Let’s take the last step of distributing the `ImagePullJob` workload to multiple clusters as an example: Not only do you need to manage the configuration of multiple clusters, but also need to watch the status of the workload (CRD) until the status of the workload becomes `Ready` before proceeding to the next step. This process actually corresponds to a simple Kubernetes Operator's reconcile logic: first create or update a resource, if the status of the resource is as expected, then end the reconcile, if not, continue to wait.

**Do we need to implement an Operator for every new resource management in our operations? Is there any convenient way to free us from the complicated Operator development?**

It is precisely because of the programmability of steps in KubeVela Workflow that it can completely cover these operations and resource management in SAE scenarios, which can help engineers reduce manpower consumption. Similar to the above logic, the step definition corresponding to KubeVela Workflow is very simple. No matter what kind of resources (or a HTTP interface request), it can be covered by a similar step template like:
```yaml
template: {
  // First, read resources from the specified cluster
	read: op.#Read & {
  	value: {
    	apiVersion: parameter.apiVersion
    	kind: parameter.kind
    	metadata: {
      	name: parameter.name
      	namespace: parameter.namespace
    	}
  	}
  	cluster: parameter.cluster
	}
	// Second, wait until the resource is Ready. Otherwise, the step keeps waiting
	wait: op.#ConditionalWait & {
  	continue: read.value.status != _|_ && read.value.status.phase == "Ready"
	}
	// Third(optional), if the resource is Ready, then...
	// Custom Logic...
	
	// Users must input the defined parameter when using the step type
	parameter: {
  	apiVersion: string
  	kind: string
  	name: string
  	namespace: *context.namespace | string
  	cluster: *"" | string
 	}
}
```

Corresponding to the current case is:

- **First:** Read the status of `ImagePullJob` in a specified cluster, such as the cluster in the China (Shanghai) region. 
- **Second:** If the `ImagePullJob` is ready and the image has been preloaded, continue to execute.
- **Third(Optional): **After the `ImagePullJob` is ready, clean up the `ImagePullJob` in the cluster. 

Like this, no matter how many Region clusters or new type resources are added in the subsequent O&M scenarios, you can let KubeVela Workflow manage the cluster's KubeConfig, and use the defined step types with different cluster names or resource types to achieve a simplified Kubernetes Operator Reconcile process to reduce development costs. 

### Case 2: Optimize the Existing Delivery Process
In addition to automating internal O&M operations, upgrading the original SAE product architecture to improve delivery efficiency for users is also an important reason of choosing KubeVela Workflow. 

#### Original Architecture
In the delivery scenario of SAE, a delivery process corresponds to a series of tasks, such as: initializing the environment, building images, releasing in batches, etc. This series of tasks corresponds to the `SAE Tasks` in the figure below.

These tasks are sequentially thrown to `Java Executor` for business logic in the original architecture of SAE, such as creating resources in Kubernetes, and synchronizing the status of current tasks with the MySQL database, etc.

After the current task is completed, JAVA Executor will get the next task from SAE's original orchestration engine, and at the same time, the orchestration engine will continuously put new tasks into the initial task list.

![image.png](/img/blog/workflow-sae/en/wf-sae-5.png)

The biggest problem in this old architecture is the polling call. `JAVA Executor` will get it from the SAE task list every second to check whether there are new tasks; at the same time, after `JAVA Executor` creates Kubernetes resources, it will attempts to get the status of resources from the cluster every second.

The original architecture of SAE is not the controller model in the Kubernetes ecosystem, but the polling model. If the orchestration engine layer is upgraded to the controller model for event watching, it can better integrate with the entire Kubernetes ecosystem and improve efficiency.

![image.png](/img/blog/workflow-sae/en/wf-sae-6.png)

However, the logic coupling of business is deep in the original architecture. If the traditional container-based cloud-native workflow is used, SAE needs to package the original business logic into images and maintain and update a large number of images, which is not a sustainable path. We hope the upgraded workflow engine can be easily integrated with the task orchestration, business execution layer, and Kubernetes cluster.

#### New Architecture
With the high scalability of KubeVela Workflow, SAE engineers do not need to repackage the original capabilities into images or make large-scale modifications. 

![image.png](/img/blog/workflow-sae/en/wf-sae-7.png)

The new process is shown in the preceding figure. After a delivery paln is created on the SAE product side, the business side writes the model to the database, converts the model, and generates a KubeVele workflow, which corresponds to YAML on the right side. 

At the same time, SAE's original Java Executor provides the original business capabilities as microservice APIs. When KubeVela Workflow is executed, each step is IaC-based, and the underlying implementation is in the CUE language. Some of these steps will call the business microservice API of SAE, while others will directly interact with the underlying Kubernetes resources. Data can be transferred between steps. If there is an error in the call, you can use the conditional judgment of the step to handle the error.

Such optimization is scalable and fully reuses the Kubernetes ecosystem. It extends workflow processes and atomic capabilities and is oriented to the final state. This combination of scalability and process control can cover the original business functions and reduce the amount of development. At the same time, the state update latency is reduced from the minute level to the millisecond level, which is agile and native. It has the YAML-level description capability but also improves the development efficiency from 1d to 1h. 
### Case 3: Launch New Features Quickly 
In addition to automated O&M and upgrading the original architecture, _what else can KubeVela Workflow provide?_

The reusability of steps and the ease of integration with other ecosystems bring more surprises to SAE in addition to upgrades: **from** **writing business code to orchestrating different steps, so as to launch new product features quickly!**

SAE has accumulated a large amount of JAVA foundation and supports a wealth of functions, such as: supporting single-batch release, multi-batch release, and canary release for JAVA microservices. However, with the increase of customers, some customers have put forward new requirements, and they hope to have the ability to publish multilingual north-south traffic in canary release. 

There are also many mature open-source products for canary releases, such as Kruise Rollout. After investigation, SAE engineers found that Kruise Rollout can be used to complete the ability of canary release, and it can cooperate with the internal ingress controller(ALB) of Alibaba Cloud to split different traffic. 

![image.png](/img/blog/workflow-sae/en/wf-sae-8.png)

Such a solution is shown in the architecture diagram above. SAE distributes a KubeVela Workflow, and the steps in the Workflow will integrate with Alibaba Cloud ALB, open-source Kruise Rollout, and SAE's business components at the same time. Batch management is completed in the steps, thus completing the rapid launch of features. 

In fact, after using KubeVela Workflow, it is no longer necessary to write new business codes for this feature. It is only necessary to write a step type for updating canary batches.

Due to the programmability of step types, we can easily use different patch policies in the definition to update the release batches of Rollout objects in the different clusters. Moreover, in the workflow, the step type of each step is reusable. This means when you develop a new step type, you are laying the foundation for the next time a new feature is launched. This reuse allows you to launch features quickly and reduce development costs. 

## Summary
After SAE upgraded the KubeVela architecture, it improved delivery efficiency and reduced development costs. Based on the advantages of its underlying reliance on Serverless infrastructure, it can give full play to the advantages of the product in application hosting.

In addition, the architecture upgrade solution of KubeVela Workflow in SAE is an open-source solution that can be **replicated**. The community provides more than 50 built-in step types (including image building, image pushing, image scanning, and multi-cluster deployment, using Terraform to manage infrastructure, condition wait, message notification, etc) to help you open up CI/CD easily. 

![image.png](/img/blog/workflow-sae/en/wf-sae-9.png)

You can refer to the following documents for more usage scenarios:

- [Build images, push images, and deploy resources](https://github.com/kubevela/workflow#try-kubevela-workflow)
- [Orchestrate multiple KubeVela Applications](https://github.com/kubevela/workflow/blob/main/examples/multiple-apps.md)
- [Initialize the Environment with One Click, use Terraform to pull up clusters, manage clusters, and distribute resources to new clusters](https://github.com/kubevela/workflow/blob/main/examples/initialize-env.md)
- [Call the specified service and send a notification of the returned result through data passing](https://github.com/kubevela/workflow/blob/main/examples/request-and-notify.md)
- [Use different context parameters to control the deployment of resources](https://github.com/kubevela/workflow/blob/main/examples/run-with-template.md)



## The End

You can learn more about KubeVela and the OAM project through the following materials:

- Project Code Library: https://github.com/kubevela/kubevela Welcome to Star/Watch/Fork! 
- Workflow Code Library: https://github.com/kubevela/workflow Welcome to Star/Watch/Fork! 
- Official Project Homepage and Documents: kubevela.io
- Slack：CNCF #kubevela Channel

