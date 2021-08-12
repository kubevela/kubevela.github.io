---
title:  Multi Environments
---

## Overview

If we have applied our application in the test environment and need to migrate it to the production environment, in which some configuration also needs to be updated, KubeVela provides the `ApplyEnvBindComponent` workflow step to manage multi environments.

In this guide, you will learn how to manage multi environments via `ApplyEnvBindComponent` in WorkflowStepDefinition.

## Apply Base Definitions

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

---
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

## Expected outcome

We can see that the component have been applied to the cluster with the latest configuration.

With `ApplyEnvBindComponent`, we can easily manage applications in multiple environments.
