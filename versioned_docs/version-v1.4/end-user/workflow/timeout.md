---
title:  Timeout of Step
---

> Note: You need to upgrade to version 1.5 or above to use the timeout.

This section introduces how to add timeout to workflow steps in KubeVela.

In KubeVela workflow, each step can specify a `timeout`, you can use `timeout` to specify the timeout time for the step.

`timeout` follows the `duration` format, e.g. `30s`, `1m`, etc. You can refer to Golang's [parseDuration](https://pkg.go.dev/time#ParseDuration).

If a step is not completed within the specified time, KubeVela will set the status of the step to `failed` and the `Reason` of the step will be set to `Timeout`.

Apply the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: timeout-example
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
    - name: apply-comp1
      type: apply-component
      properties:
        component: comp1
    - name: suspend
      type: suspend
      timeout: 5s
    - name: apply-comp2
      type: apply-component
      properties:
        component: comp2
```

Use `vela status` to check the status of the Application:

```bash
$ vela status timeout-example
About:

  Name:      	timeout-example
  Namespace: 	default
  Created at:	2022-06-25 00:51:43 +0800 CST
  Status:    	workflowTerminated

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: true
  Steps
  - id:1f58n13qdp
    name:apply-comp1
    type:apply-component
    phase:succeeded
    message:
  - id:1pfije4ugt
    name:suspend
    type:suspend
    phase:failed
    message:
  - id:lqxyenjxj4
    name:apply-comp2
    type:apply-component
    phase:skipped
    message:

Services:

  - Name: comp1
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

As you can see, when the first component is successfully deployed, the workflow is suspended on the second `suspend` step. The `suspend` step is set with a timeout of five seconds. If the workflow is not resumed within five seconds, the step will fail because of timeout. The third step is skipped because the previous `suspend` step failed.
