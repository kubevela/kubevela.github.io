---
title:  Workflow
---

## Overview

`Workflow` allows you to customize steps in `Application`, glue together additional delivery processes and specify arbitrary delivery environments. In short, `Workflow` provides customized control flow and flexibility based on the original delivery model of Kubernetes(Apply). For example, `Workflow` can be used to implement complex operations such as pause, manual approval, waiting status, data flow, multi-environment gray release, A/B testing, etc.

`Workflow` is a further exploration and best practice based on OAM model in KubeVela, it obeys the modular concept and reusable characteristics of OAM. Each workflow module is a "super glue" that can combine your arbitrary tools and processes. In modern complex cloud native application delivery environment, you can completely describe all delivery processes through a declarative configuration, ensuring the stability and convenience of the delivery process.

## Using workflow

`Workflow` consists of steps, you can either use KubeVela's [built-in workflow steps], or write their own `WorkflowStepDefinition` to complete the operation.

We can use `vela def` to define workflow steps by writing `Cue templates`. Let's write an `Application` that apply a Tomcat using Helm chart and automatically send message to Slack when the Tomcat is running.

### Workflow Steps

KubeVela provides several CUE actions for writing workflow steps. These actions are provided by the `vela/op` package.

| Action | Description | Parameter |
| :---: | :--: | :-- |
| ApplyApplication | Apply all the resources in Application. | - |
| Read | Read resources in Kubernetes cluster. | value: the resource metadata to be get. And after successful execution, `value` will be updated with resource definition in cluster.<br /> err: if an error occurs, the `err` will contain the error message. |
| ConditionalWait | The workflow step will be blocked until the condition is met. | continue: The workflow step will be blocked until the value becomes `true`. |
| ... | ... | ... |

> For all the workflow actions, please refer to [Cue Actions](./cue-actions)

We need two `WorkflowStepDefinitions` to complete the Application：

1. Apply Tomcat and wait till it's status become running. We need to write a custom workflow step for it.
2. Send Slack notifications, we can use the built-in [webhook-notification] step for it.

#### Step: Apply Tomcat

First, use `vela def init` to generate a `WorkflowStepDefinition` template：

```shell
vela def init my-helm -t workflow-step --desc "Apply helm charts and wait till it's running." -o my-helm.cue
```

The result is as follows：
```shell
$ cat my-helm.cue

"my-helm": {
	annotations: {}
	attributes: {}
	description: "Apply helm charts and wait till it's running."
	labels: {}
	type: "workflow-step"
}

template: {
}
```

Import `vela/op` and complete the Cue code in `template`:

```
import (
  "vela/op"
)

"my-helm": {
	annotations: {}
	attributes: {}
	description: "Apply helm charts and wait till it's running."
	labels: {}
	type: "workflow-step"
}

template: {
  // Apply all the resources in Application
  apply: op.#ApplyApplication & {}

  resource: op.#Read & {
     value: {
       kind: "Deployment"
       apiVersion: "apps/v1"
       metadata: {
         name: "tomcat"
         // we can use context to get any metadata in Application
         namespace: context.namespace
       }
     }
  }

  workload: resource.value
  // wait till it's ready
  wait: op.#ConditionalWait & {
    continue: workload.status.readyReplicas == workload.status.replicas && workload.status.observedGeneration == workload.metadata.generation
  }
}
```

Apply it to the cluster：

```shell
$ vela def apply my-helm.cue

WorkflowStepDefinition my-helm in namespace vela-system updated.
```

#### Step: Send Slack notifications

Use the built-in step, [webhook-notification].

### Apply the Application

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: tomcat
    type: helm
    properties:
      repoType: helm
      repoUrl: https://charts.bitnami.com/bitnami
      chart: tomcat
      version: "9.2.20"
  workflow:
    steps:
      - name: tomcat
        # specify the step type
        type: my-helm
        outputs:
          - name: msg
            # export the deployment status in my-helm
            exportKey: resource.value.status.conditions[0].message
      - name: send-message
        type: webhook-notification
        inputs:
          - from: msg
            # use the output value in the previous step and pass it into the properties slack.message.text
            parameterKey: slack.message.text 
        properties:
          slack:
            # the address of your slack webhook, please refer to: https://api.slack.com/messaging/webhooks
            url: slack url
```

Apply the Application to the cluster and you can see that all resources have been successfully applied and Slack has received the messages of the Deployment status.
