---
title:  Multi Environments
---

If we have multiple clusters, we want to apply our application in the test cluster first, and then apply it to the production cluster after the application in test cluster is running. KubeVela provides the `multi-env` workflow step to manage multi environments.

In this guide, you will learn how to manage multi environments via `multi-env` in `Workflow`.

> Before reading this section, please make sure you have learned about the [Env Binding](../policies/envbinding) in KubeVela.

## How to use

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
    - name: test-env
      type: env-binding
      properties:
        created: false
        envs:
          - name: test
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
    - name: prod-env
      type: env-binding
      properties:
        created: false
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
                  purpose: prod

  workflow:
    steps:
      - name: deploy-server
        # specify the workflow step type
        type: multi-env
        properties:
          # specify the component name
          component: nginx-server
          # specify the policy name
          policy: patch
          # specify the env name in policy
          env: prod
      - name: manual-approval
        # suspend is a built-in task of workflow used to suspend the workflow
        type: suspend
      - name: deploy-prod-server
        type: multi-env
        properties:
          component: nginx-server
          policy: prod-env
          env: prod
```

## Expected outcome

First, check the component status in `test` cluster:

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
nginx-server     1/1     1            1           1m10s
```

Use `resume` command after everything is ok in test cluster:

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
nginx-server     1/1     1            1           1m10s
```

Then, check the component status in `prod` cluster:

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
nginx-server     1/1     1            1           1m10s
```

We can see that the component have been applied to both clusters.

With `multi-env`, we can easily manage applications in multiple environments.
