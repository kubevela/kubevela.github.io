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
    - name: env
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
      - name: deploy-test-server
        # specify the workflow step type
        type: multi-env
        properties:
          # specify the component name
          component: nginx-server
          # specify the policy name
          policy: env
          # specify the env name in policy
          env: test
      - name: manual-approval
        # suspend is a built-in task of workflow used to suspend the workflow
        type: suspend
      - name: deploy-prod-server
        type: multi-env
        properties:
          component: nginx-server
          policy: env
          env: prod
```

## Expected outcome

Check the `Application` status:

```shell
kubectl get application multi-env-demo -o yaml
```

We can see that the workflow is suspended at `manual-approval`:

```yaml
...
  status:
    workflow:
      ...
      stepIndex: 2
      steps:
      - name: deploy-test-server
        phase: succeeded
        resourceRef: {}
        type: multi-env
      - name: manual-approval
        phase: succeeded
        resourceRef: {}
        type: suspend
      suspend: true
      terminated: false
```

Switch to `test` cluster and check the component status:

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
nginx-server     1/1     1            1           1m10s
```

Use `resume` command after everything is ok in test cluster:

```shell
$ vela workflow resume multi-env-demo

Successfully resume workflow: multi-env-demo
```

Recheck the `Application` status:

```shell
kubectl get application multi-env-demo -o yaml
```

All the step status in workflow is succeeded:

```yaml
...
  status:
    workflow:
      ...
      stepIndex: 3
      steps:
      - name: deploy-test-server
        phase: succeeded
        resourceRef: {}
        type: multi-env
      - name: manual-approval
        phase: succeeded
        resourceRef: {}
        type: suspend
      - name: deploy-prod-server
        phase: succeeded
        resourceRef: {}
        type: multi-env
      suspend: false
      terminated: true
```

Then, check the component status in `prod` cluster:

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
nginx-server     1/1     1            1           1m10s
```

We can see that the component have been applied to both clusters.

With `multi-env`, we can easily manage applications in multiple environments.
