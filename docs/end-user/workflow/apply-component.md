---
title:  Apply Components and Traits
---

In this guide, you will learn how to apply components and traits in `Workflow`.

## How to use

Apply the following `Application`:

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
  - name: nginx-server
    type: webservice
    properties:
      image: nginx:1.21
      port: 80
  workflow:
    steps:
      - name: express-server
        # specify the workflow step type
        type: apply-component
        properties:
          # specify the component name
          component: express-server
      - name: manual-approval
        # suspend is a built-in task of workflow used to suspend the workflow
        type: suspend
      - name: nginx-server
        type: apply-component
        properties:
          component: nginx-server
```

If we want to suspend the workflow for manual approval before applying some certain components, we can use `suspend` step to pause the workflow.

In this case, the workflow will be suspended after applying the first component. The second component will wait to be applied util the `resume` command is called.

Check the status after applying the `Application`:

```shell
$ kubectl get app first-vela-workflow

NAME                  COMPONENT        TYPE         PHASE                HEALTHY   STATUS   AGE
first-vela-workflow   express-server   webservice   workflowSuspending                      2s
```

We can use `vela workflow resume` to resume the workflow.

> For more information of `vela workflow`，please ref [vela cli](../../cli/vela_workflow).

```shell
$ vela workflow resume first-vela-workflow

Successfully resume workflow: first-vela-workflow
```

Check the status, the `Application` is now `runningWorkflow`:

```shell
$ kubectl get app first-vela-workflow

NAME                  COMPONENT        TYPE         PHASE     HEALTHY   STATUS   AGE
first-vela-workflow   express-server   webservice   running   true               10s
```
## Expected outcome

Check the component status in cluster:

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
express-server   1/1     1            1           3m28s
nginx-server     1/1     1            1           3s

$ kubectl get ingress

NAME             CLASS    HOSTS                 ADDRESS   PORTS   AGE
express-server   <none>   testsvc.example.com             80      4m7s
```

We can see that all the components and traits have been applied to the cluster.
