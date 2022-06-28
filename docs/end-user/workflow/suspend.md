---
title:  Suspend and Resume Workflow
---

This section introduces how to suspend and resume the workflow in KubeVela.

## Suspend the Workflow

In KubeVela, you can choose to use the `vela` command to manually suspend the execution of the workflow, or use a built-in special step type `suspend` to automatically suspend the workflow.

### Suspend Manually

If you have a running application and you want to suspend its execution, you can use `vela workflow suspend` to suspend the workflow.

```bash
$ vela workflow suspend my-app
Successfully suspend workflow: my-app
```

### Use Suspend Step

Apply the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: suspend
  namespace: default
spec:
  components:
  - name: comp1
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: comp2
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
    - name: apply1
      type: apply-component
      properties:
        component: comp1
    - name: suspend
      type: suspend
    - name: apply2
      type: apply-component
      properties:
        component: comp2
```

Use `vela status` to check the status of the Application:

```bash
$ vela status suspend
About:

  Name:      	suspend
  Namespace: 	default
  Created at:	2022-06-27 17:36:58 +0800 CST
  Status:    	workflowSuspending

Workflow:

  mode: StepByStep
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id:yj9h29uv6v
    name:apply1
    type:apply-component
    phase:succeeded
    message:
  - id:xvmda4he5e
    name:suspend
    type:suspend
    phase:running
    message:

Services:

  - Name: comp1
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

As you can see, when the first step is completed, the `suspend` step will be executed and this step will suspend the workflow.

## Resume the Workflow

### Resume Manually

Once the workflow is suspended, you can use the `vela workflow resume` command to manually resume the workflow.

Take the above suspended application as an example:

```bash
$ vela workflow resume suspend
Successfully resume workflow: suspend
```

After successfully continuing the workflow, view the status of the app:

```bash
$ vela status suspend
About:

  Name:      	suspend
  Namespace: 	default
  Created at:	2022-06-27 17:36:58 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:yj9h29uv6v
    name:apply1
    type:apply-component
    phase:succeeded
    message:
  - id:xvmda4he5e
    name:suspend
    type:suspend
    phase:succeeded
    message:
  - id:66jonaxjef
    name:apply2
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: comp2
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied

  - Name: comp1
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

As you can see, the workflow has continued to execute.

### Terminate Manually

If you want to terminate a workflow while it is suspended, you can use the `vela workflow terminate` command to terminate the workflow.

```bash
$ vela workflow terminate my-app
Successfully terminate workflow: my-app
```

### Resume the Workflow Automatically

If you want the workflow to be continued automatically after a period of time has passed. Then, you can add a `duration` parameter to the `suspend` step. When the `duration` time elapses, the workflow will automatically continue execution.

Apply the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: auto-resume
  namespace: default
spec:
  components:
  - name: comp1
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: comp2
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
    - name: apply1
      type: apply-component
      properties:
        component: comp1
    - name: suspend
      type: suspend
      properties:
        duration: 5s
    - name: apply2
      type: apply-component
      properties:
        component: comp2
```

Use `vela status` to check the status of the Application:

```bash
$ vela status auto-resume
About:

  Name:      	auto-resume
  Namespace: 	default
  Created at:	2022-06-27 17:57:35 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:q5jhm6mgwv
    name:apply1
    type:apply-component
    phase:succeeded
    message:
  - id:3xgfcp3cuj
    name:suspend
    type:suspend
    phase:succeeded
    message:
  - id:zjux8ud876
    name:apply2
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: comp2
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied

  - Name: comp1
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

As you can see, the `suspend` step is automatically executed successfully after five seconds, and the workflow is executed successfully.
