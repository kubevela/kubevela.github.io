---
title: Data Passing
---

This section introduces how to use `Inputs` and `Outputs` to pass data between workflow steps in KubeVela. To pass data between components rather than steps, see [Order Components and Pass Data Between Them](./component-dependency-parameter.md).

## Outputs

Outputs consists of `name` and `valueFrom`. `name` declares the name of this output, which will be referenced by `from` in input.

`valueFrom` can be written in the following ways:

1. Use value expression, eg. `valueFrom: output.value.data.greeting`. `valueFrom` reads from the step's own result; what is available depends on the step type (for `read-object`, the object is under `output.value`). If the field does not exist in the step's result, the output is `null`.
2. Use CUE expressions, eg. use `+` to combine value and string: `valueFrom: output.metadata.name + "testString"` or you can import built-in packages in CUE like:
```
valueFrom: |
          import "strings"
          strings.Join(["1","2"], ",")
```

## Inputs

Inputs is made of `from` and `parameterKey`. Input uses `from` to reference output, `parameterKey` is the path, inside this step's `properties`, that receives the value.

:::caution
If you want to set the parameterKey with a invalid CUE variable name (eg: contains `-`, or starts with a number, etc.), you can refer to it with `[]` like:

```
inputs:
   - from: output
     parameterKey: data["my-input"]
```
:::

eg. Specify inputs:

```yaml
...
- name: notify
  type: notification
  inputs:
    - from: read-status
      parameterKey: slack.message.text
```

A step with `inputs` waits until the step that produces them has run.

## How to use

This Application writes a ConfigMap, reads it back, and copies one of its values into a second ConfigMap:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: input-output
  namespace: default
spec:
  components: []
  workflow:
    steps:
      - name: create-source
        type: apply-object
        properties:
          value:
            apiVersion: v1
            kind: ConfigMap
            metadata:
              name: source-config
              namespace: default
            data:
              greeting: hello from source-config
      - name: read-source
        type: read-object
        properties:
          apiVersion: v1
          kind: ConfigMap
          name: source-config
          namespace: default
        outputs:
          - name: greeting
            valueFrom: output.value.data.greeting
      - name: write-copy
        type: apply-object
        inputs:
          - from: greeting
            parameterKey: value.data.greeting
        properties:
          value:
            apiVersion: v1
            kind: ConfigMap
            metadata:
              name: copied-config
              namespace: default
```

The `read-source` step puts the ConfigMap it read under `output.value`, so `output.value.data.greeting` is the value to pass on. The `write-copy` step receives it at `value.data.greeting` in its `properties`.

`read-object` reads an Application by default; set `apiVersion` and `kind` to read anything else. Its `namespace` defaults to `default`, whatever namespace the Application is in, so set it when the object lives elsewhere.

Save it as `input-output.yaml` and apply it:

```bash
vela up -f input-output.yaml
```

When the workflow has finished, check the copy:

```bash
kubectl get configmap copied-config -o jsonpath='{.data.greeting}'
```

```
hello from source-config
```

To send the value somewhere else, point `parameterKey` at that step's field instead: for a `notification` step, `slack.message.text` puts it in the Slack message.
