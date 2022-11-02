---
title: Data Passing
---

This section introduces how to use `Inputs` and `Outputs` to pass data between workflow steps in KubeVela.

## Outputs

Outputs consists of `name` and `valueFrom`. `name` declares the name of this output, which will be referenced by `from` in input.

`valueFrom` can be written in the following ways:

1. Use value expression, eg. `valueFrom: output.value.status.workflow.message`. Note that `output.value.status.workflow.message` will use the value of the variable from the CUE template of the current step. If this field does not exist in the CUE template of the step, the resulting value will be empty.
2. Use CUE expressions, eg. use `+` to combine value and string: `valueFrom: output.metadata.name + "testString"` or you can import built-in packages in CUE like:
```
valueFrom: |
          import "strings"
          strings.Join(["1","2"], ",")
```

## Inputs

Inputs is made of `from` and `parameterKey`. Input uses `from` to reference output, `parameterKey` is a expression that assigns the value of the input to the corresponding field.

eg. Specify inputs:

```yaml
...
- name: notify
  type: notification
  inputs:
    - from: read-status
      parameterKey: slack.message.text
```

## How to use

Suppose we already have a `depends` application in the cluster, and we want to read the workflow status of the `depends` Application in a new Application and send the status information to Slack.

Apply the following YAML:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: input-output
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
      - name: read
        type: read-object
        properties:
          name: depends
        outputs:
          - name: read-status
            valueFrom: output.value.status.workflow.message
      - name: slack-message
        type: notification
        inputs:
          - from: read-status
            parameterKey: slack.message.text
        properties:
          slack:
            url:
              value: <your slack url>
```

> When reading the `depends` application, we use the `read-object` step type. In this step type, the read resources will be placed in `output.value`, so we can use `output.value.status.workflow.message` reads the workflow status information of `depends`.

When the application runs successfully, we can receive the workflow status information of the `depends` application in the Slack message notification.
