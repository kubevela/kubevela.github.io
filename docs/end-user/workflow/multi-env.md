---
title:  Multi Environments
---

## Overview

If we have applied our application in the test environment and need to migrate it to the production environment, in which some configuration also needs to be updated, KubeVela provides the `multi-env` workflow step to manage multi environments.

In this guide, you will learn how to manage multi environments via `multi-env` in `Workflow`.

## Apply Application

Apply the following `Application` with workflow step type of `multi-env`:


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
        // specify the workflow step type
        type: multi-env
        properties:
          // specify the component name
          component: nginx-server
          // specify the policy name
          policy: patch
          // specify the env name in policy
          env: prod
```

## Expected outcome

We can see that the component have been applied to the cluster with the latest configuration.

With `multi-env`, we can easily manage applications in multiple environments.
