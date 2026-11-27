---
title:  Suspend and Resume
---

This section introduces how to suspend and resume the workflow in KubeVela.

## Suspend the Workflow

In KubeVela, you can choose to use the `vela` command to manually suspend the execution of the workflow, or use a built-in special step type `suspend` to automatically suspend the workflow.

### Suspend Manually

To pause a running workflow, run `vela workflow suspend`; `vela workflow resume` continues it.

* Suspend the application

```bash
vela workflow suspend my-app
```

:::tip
Nothing will happen if you suspend an application that has already finished running workflow, which is in `running` status.
:::

### Use Suspend Step

Apply the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: suspend-demo
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
        message: Waiting for QA sign-off
    - name: apply2
      type: apply-component
      properties:
        component: comp2
```

Use `vela status` to check the status of the Application:

```bash
vela status suspend-demo
```

<details>
  <summary>expected output</summary>

```
About:

  Name:         suspend-demo
  Namespace:    default
  Created at:   2026-11-20 17:36:58 +0000 UTC
  Healthy:      ✅
  Details:      workflowSuspending

Workflow:

  mode: StepByStep-DAG
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id: yj9h29uv6v
    name: apply1
    type: apply-component
    phase: succeeded 
  - id: xvmda4he5e
    name: suspend
    type: suspend
    phase: suspending 
    message: Waiting for QA sign-off

Services:

  - Name: comp1  
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:1/1
    No trait applied
```
</details>

When the first step completes, the `suspend` step suspends the workflow. Its phase is `suspending`, and its `message` shows what the workflow is waiting for.

## Resume the Workflow

### Resume Manually

Once the workflow is suspended, use the `vela workflow resume` command to resume it. You can also resume it from the application's workflow view in VelaUX.

Take the above suspended application as an example:

```bash
vela workflow resume suspend-demo
```

After successfully continuing the workflow, view the status of the app:

```bash
vela status suspend-demo
```

<details>
  <summary>expected output</summary>

```
About:

  Name:         suspend-demo
  Namespace:    default
  Created at:   2026-11-20 17:36:58 +0000 UTC
  Healthy:      ✅
  Details:      running

Workflow:

  mode: StepByStep-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: yj9h29uv6v
    name: apply1
    type: apply-component
    phase: succeeded 
  - id: xvmda4he5e
    name: suspend
    type: suspend
    phase: succeeded 
  - id: 66jonaxjef
    name: apply2
    type: apply-component
    phase: succeeded 

Services:

  - Name: comp2  
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:1/1
    No trait applied

  - Name: comp1  
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:1/1
    No trait applied
```
</details>

As you can see, the workflow has continued to execute.

### Resume the Workflow Automatically

To resume automatically, set `duration` on the `suspend` step. When the `duration` time elapses, the workflow continues.

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
vela status auto-resume
```

<details>
  <summary>expected output</summary>

```
About:

  Name:         auto-resume
  Namespace:    default
  Created at:   2026-11-20 17:36:58 +0000 UTC
  Healthy:      ✅
  Details:      running

Workflow:

  mode: StepByStep-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: yj9h29uv6v
    name: apply1
    type: apply-component
    phase: succeeded 
  - id: xvmda4he5e
    name: suspend
    type: suspend
    phase: succeeded 
  - id: 66jonaxjef
    name: apply2
    type: apply-component
    phase: succeeded 

Services:

  - Name: comp2  
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:1/1
    No trait applied

  - Name: comp1  
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:1/1
    No trait applied
```
</details>

As you can see, the `suspend` step is automatically executed successfully after five seconds, and the workflow is executed successfully.
