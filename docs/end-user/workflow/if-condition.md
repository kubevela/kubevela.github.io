---
title:  If conditions
---

This section introduces how to add if conditions to workflow steps.

In the KubeVela workflow, each step can specify an `if`, in which you can determine whether the step should be executed.

## No If specified

In the case where a step does not specify an If, KubeVela will determine whether to execute the step based on the status of the previous steps. In default, if all the previous steps are succeeded, the step will be executed.

This also means that if step A fails, step B after step A will be skipped and will not be executed.

Apply the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: err-with-no-if
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      ports:
        - port: 8000
  workflow:
    steps:
      - name: apply-err
        type: apply-object
        properties:
          value:
            test: err
      - name: apply-comp
        type: apply-component
        properties:
          component: express-server
```

Use `vela status` to check the status of the Application:

```bash
$ vela status err-with-no-if
About:

  Name:      	err-with-no-if
  Namespace: 	default
  Created at:	2022-06-24 18:14:46 +0800 CST
  Status:    	workflowTerminated

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: true
  Steps
  - id:bztlmifsjl
    name:apply-err
    type:apply-object
    phase:failed
    message:step apply: run step(provider=kube,do=apply): Object 'Kind' is missing in '{"test":"err"}'
  - id:el8quwh8jh
    name:apply-comp
    type:apply-component
    phase:skipped
    message:

Services:
```

As you can see, the step `apply-err` will fail due to an attempt to deploy an invalid resource, and the step `apply-comp` will be skipped because the previous step failed.

## If Always

If you want a step to be executed anyway, you can specify `if` to `always` for this step.

Apply the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: err-with-always
  namespace: default
spec:
  components:
  - name: invalid
    type: webservice
    properties:
      image: invalid
      ports:
        - port: 8000
  workflow:
    steps:
      - name: comp
        type: apply-component
        timeout: 5s
        outputs:
          - name: status
            valueFrom: output.status.conditions[0].type + output.status.conditions[0].status
        properties:
          component: invalid
      - name: notification
        type: notification
        inputs:
          - from: status
            parameterKey: slack.message.text
        if: always
        properties:
          slack:
            url:
              value: <your slack url>
```

Use `vela status` to check the status of the Application:

```bash
$ vela status err-with-always
About:

  Name:      	err-with-always
  Namespace: 	default
  Created at:	2022-06-27 17:30:29 +0800 CST
  Status:    	workflowTerminated

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: true
  Steps
  - id:loeqr6dlcn
    name:comp
    type:apply-component
    phase:failed
    message:
  - id:hul9tayu82
    name:notification
    type:notification
    phase:succeeded
    message:

Services:

  - Name: invalid
    Cluster: local  Namespace: default
    Type: webservice
    Unhealthy Ready:0/1
    No trait applied
```

You can see that step `comp` will try to deploy a component whose image is `invalid`, and the component will fail due to timeout after five seconds because the image cannot be pulled. In the meanwhile, this step passes the component's `status` as outputs. The step `notification` will be executed because `if: always` is specified. At the same time, the content of the message notification is the status of the component in the previous step. Therefore, we can see the message notification carrying the status information in slack.

## Custom If conditions

> Note: You need to upgrade to version 1.5 or above to use custom If conditions.

You can also write your own judgment logic to determine whether the step should be executed. Note: The value in `if` will be executed as CUE codes. KubeVela provides some built-in variables in `if`, they are:

* `status`：`status` contains status information for all workflow steps. You can use `status.<step-name>.phase == "succeeded"` to determine the status of a step, or you can use the simplified `status.<step-name>.succeeded` to determine.
* `inputs`：`inputs` contains all the inputs parameters of the step. You can use `inputs.<input-name> == "value"` to get input for the step.

> Note that if your step name or inputs name is not a valid CUE variable name (eg: contains `-`, or starts with a number, etc.), you can refer to it as follows: `status["invalid-name"].failed`

Apply the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: custom-if
  namespace: default
spec:
  components:
  - name: comp-custom-if
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
  workflow:
    steps:
    - name: apply
      type: apply-component
      properties:
        component: comp-custom-if
      outputs:
        - name: comp-output
          valueFrom: context.name
    - name: notification
      type: notification
      inputs:
        - from: comp-output
          parameterKey: slack.message.text
      if: inputs["comp-output"] == "custom-if"
      properties:
        slack:
          url:
            value: <your slack url>
    - name: notification-skip
      type: notification
      if: status.notification.failed
      properties:
        slack:
          url:
            value: <your slack url>
          message:
            text: this notification should be skipped
    - name: notification-succeeded
      type: notification
      if: status.notification.succeeded
      properties:
        slack:
          url:
            value: <your slack url>
          message:
            text: the notification is succeeded
```

Use `vela status` to check the status of the Application:

```bash
$ vela status custom-if
About:

  Name:      	custom-if
  Namespace: 	default
  Created at:	2022-06-25 00:37:14 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:un1zd8qc6h
    name:apply
    type:apply-component
    phase:succeeded
    message:
  - id:n5xbtgsi68
    name:notification
    type:notification
    phase:succeeded
    message:
  - id:2ufd3v6n78
    name:notification-skip
    type:notification
    phase:skipped
    message:
  - id:h644x6o8mb
    name:notification-succeeded
    type:notification
    phase:succeeded
    message:

Services:

  - Name: comp-custom-if
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

As you can see, after the first step `apply` succeeded, the outputs `comp-output` will be output. The second step `notification` refers to the outputs of the first step as inputs and makes a judgment. After the condition is met, the notification is successfully sent. The third step `notification-skip` judges whether the second step is in a failed state. If the condition is not met, this step is skipped. The fourth step `notification-succeeded` judges whether the second step is successful, if the condition is met, the step is successfully executed.
