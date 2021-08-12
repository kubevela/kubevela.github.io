---
title:  Multi Environments
---

This documentation introduces how to use multi environments in workflow.

Assume that our Application, which was originally applied in the test environment, needs to be migrated to the production environment, and the image version also needs to be updated. We can write an Application like this:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: multi-env-demo
  namespace: default
spec:
  components:
    - name: nginx-server
      type: webservice
      properties:
        image: nginx:1.21
        port: 80

  policies:
    - name: patch
      type: env-binding
      properties:
        envs:
          - name: prod
            patch:
              components:
                - name: nginx-server
                  type: webservice
                  properties:
                    image: nginx:1.20
                    port: 80
            placement:
              clusterSelector:
                labels:
                  purpose: test

  workflow:
    steps:
      - name: deploy-server
        type: deploy2cluster
        properties:
          component: nginx-server
          policy:    patch
          env:       prod
```

As you can see, in `policies`, there is some configuration that needs to be updated. In the `properties` of `workflow`, the related 'component', 'policy', and 'env' names are specified, which we can then use in `ApplyEnvBindComponent`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: deploy2cluster
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")

        parameter: {
        	env:       string
        	policy:    string
        	component: string
        }

        component: op.#ApplyEnvBindComponent & {
        	env:       parameter.env
        	policy:    parameter.policy
        	component: parameter.component
          // context.namespace indicates the namespace of the app
        	namespace: context.namespace
        }
```

With `ApplyEnvBindComponent`, we can easily manage applications in multiple environments.
