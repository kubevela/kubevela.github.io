---
title:  Patch Resource
---

In previous data flow example, we have seen how to use `patch` keyword to patch resource.
Besides that, we can also patch resource by merge fields in CUE template.
Here's an example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-with-ip
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")
        parameter: {
           component: string
           serverIP?: string
        }
        // load component from application
        component: op.#Load & {
           component: parameter.component
           value: {}
        }
        // apply workload to kubernetes cluster
        apply: op.#Apply & {
           value: {
              component.value.workload
              # patch workload resource by merging fields
              metadata: name: parameter.component
              if parameter.serverIP!=_|_{
                 spec: containers: [{env: [{name: "PrefixIP",value: parameter.serverIP}]}]
              }
           }
        }
```

We can see under `apply` field, the keywords are merged together.
Thus, the name and env config data are patched.
