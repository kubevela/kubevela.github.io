---
title: Sub Steps
---

This section describes how to use sub steps in KubeVela.

There is a special step type `step-group` in KubeVela workflow where you can declare sub-steps when using `step-group` type steps.

:::note
In the version less or equal than v1.4.x, sub steps in a step group are executed concurrently.

In version 1.5+, you can specify the execution mode of steps and sub-steps.
:::

Apply the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: sub-success
spec:
  components:
    - name: express-server1
      type: webservice
      properties:
        image: crccheck/hello-world
    - name: express-server2
      type: webservice
      properties:
        image: crccheck/hello-world
    - name: express-server3
      type: webservice
      properties:
        image: crccheck/hello-world

  workflow:
    steps:
      - name: step1
        type: apply-component
        properties:
          component: express-server1
      - name: step2
        type: step-group
        subSteps:
          - name: step2-sub1
            type: apply-component
            properties:
              component: express-server2
          - name: step2-sub2
            type: apply-component
            properties:
              component: express-server3
```

By default, steps are executed sequentially, so step2 is not executed until step1 is deployed. Whereas in the step-group, sub-steps will be executed concurrently by default, so step2-sub1 and step2-sub2 will be deployed at the same time.
