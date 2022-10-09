---
title: Deploy across Multi Environments
---

Environments represent your deployment targets logically (QA, Prod, etc). You can add the same Environment to as many Targets as you need.
In KubeVela, the environment bond a namespace in the hub cluster. The application CR should create in this namespace. If the application does not configure the target cluster and namespace(such as Topology policy). The default target namespace to create the pod or service resources is the same as the environment.

For one application, If you want to deploy to a multi-environment, you need to apply the application CR to multi namespaces in hub cluster. There is a way in UI that you only need to manage one application configuration.

## Deploy the application to multi-environment

### 1. Create an environment

```bash
vela env init prod --namespace prod
```

You could create an environment via CLI, but that does not sync to UI before you create an application in this environment. A more elegant way is to create it directly in the UI.

![create-env](https://static.kubevela.net/images/1.5/create-env.jpg)

One environment could includes multi targets. The environment belongs to a project, One project could include multi environments. Only the application belonging to this project could bond this environment.

![environment](https://static.kubevela.net/images/1.5/environment.jpg)

### 2. Bind the application to an environment

You could select multi environments when you create an application. Or at any time bind the other environments. The UI will generate a workflow when the application bind to an environment, that includes some `deploy` type steps. The default rule is one target one step. You could add other steps such as the `suspend` between the two `deploy` steps.

![env workflow](https://static.kubevela.net/images/1.5/env-workflow.jpg)

### 3. Set the different configuration

We always need to set different configurations for different environments. such as environment variables, replicas or resource limits. Let's create some override policies. When we create an override policy, we need to select a workflow and steps, this means selecting the environment or target. So, you could make the different configurations take effect in the specific environment or targets.

![override-policy](https://static.kubevela.net/images/1.5/override-policy.jpg)

Refer to [the override policy](../end-user/policies/references#override)

### 4. Deploy

By default, every environment is deployed independently. When you deploy an application needs to select a workflow to deploy an environment. If you want to deploy to multi environments in one workflow, there is a way to link the multi workflows.

For example, you want to deploy the prod environment after the QA environment is completed deploy. you could create a trigger with the custom type for the prod environment, you could get a webhook URL. Then, edit the workflow of the QA environment and added a webhook type step that uses the trigger webhook URL at the end. Now, the QA workflow will trigger the prod workflow.

## Deploy the helm chart to multi-environment

Some teams deploy the application to a multi-environment through the helm chart and multi values files. You also move this solution to the KubeVela.

The operation is the same as in the previous section. The key point is to use different value files. Refer to [this section](./helm#specify-different-value-file)