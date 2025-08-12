---
title:  Dependency
---

This section will introduce how to specify dependencies for workflow steps.

:::note
In the version &lt;=1.4, the steps in the workflow are executed sequentially, which means that there is an implicit dependency between steps, ie: the next step depends on the successful execution of the previous step. At this point, specifying dependencies in the workflow may not make much sense.

In versions &gt;=1.5, you can display the execution method of the specified workflow steps (eg: change to DAG parallel execution). At this time, you can control the execution of the workflow by specifying the dependencies of the steps.
:::

## How to use

In KubeVela, the dependencies between steps can be specified by `dependsOn` in the steps.

For example: we want to send a message notification after deploying the component:

```yaml
...
workflow:
  steps:
    - name: comp
      type: apply-component
    - name: notify
      type: notification
      dependsOn:
        - comp
```

In this case, KubeVela waits for the completion of the step `comp` before executing the `notify` step to send a message notification.

Apply the following YAML:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: dependsOn-app
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
      - name: comp
        type: apply-component
        properties:
          component: express-server
      - name: slack-message
        type: notification
        dependsOn:
          - comp
        properties:
          slack:
            url:
              value: <your slack url>
            message:
              text: depends on comp
```

## Expected outcome

Use `vela status` to check the status of the Application:

```bash
$ vela status depends
About:

  Name:      	depends
  Namespace: 	default
  Created at:	2022-06-24 17:20:50 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:e6votsntq3
    name:comp
    type:apply-component
    phase:succeeded
    message:
  - id:esvzxehgwc
    name:slack-message
    type:notification
    phase:succeeded
    message:

Services:

  - Name: express-server
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

As you can see, all step statuses are succeeded. And when the component is successfully deployed, a message is also sent in slack.
