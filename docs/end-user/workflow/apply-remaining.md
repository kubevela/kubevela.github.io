---
title:  Apply Remaining
---

This documentation introduces how to apply remaining resources via `ApplyRemaining` WorkflowStepDefinition.

In some cases, we don't need to apply all the resources, but it's too tedious to skip the needless ones and specify them one by one. KubeVela provides the `ApplyRemaining` action, which allows users to filter out needless resources and apply remaining.

Suppose we have such an Application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: express-server
        type: apply-remaining
        properties:
          exceptions:
            express-server:
              skipApplyWorkload: false
              skipAllTraits: false
              skipApplyTraits:
                - ingress
```

As you can see, in `properties`, we specify an `exceptions` parameter with the component name `express-server` as the key, the value is an object with some built-in parameters for `ApplyRemaining`. The parameters will be explained in the following example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-remaining
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")
        parameter: {
            exceptions?: [componentName=string]: {
              // skipApplyWorkload indicates whether to skip apply the workload resource
              skipApplyWorkload: *true | bool

              // skipAllTraits indicates to skip apply all resources of the traits.
              // If this is true, skipApplyTraits will be ignored
              skipAllTraits: *true| bool

              // skipApplyTraits specifies the names of the traits to skip apply
              skipApplyTraits: [...string]
           }
        }

        apply: op.#ApplyRemaining & {
          parameter
        }
```

With `ApplyRemaining`, we can easily filter and apply resources by filling in the built-in parameters.
