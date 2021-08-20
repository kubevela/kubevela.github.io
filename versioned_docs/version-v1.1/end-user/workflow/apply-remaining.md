---
title:  Apply Remaining
---

If we want to apply one component first and then apply the rest of the components after the first one is running, KubeVela provides the `apply-remaining` workflow step to filter out selected resources and apply remaining.

In this guide, you will learn how to apply remaining resources via `apply-remaining` in `Workflow`.

## How to use

Apply the following `Application` with workflow step type of `apply-remaining`:

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
  - name: express-server2
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: express-server3
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: express-server4
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
      - name: first-server
        type: apply-component
        properties:
          component: express-server
      - name: manual-approval
        # suspend is a built-in task of workflow used to suspend the workflow
        type: suspend
      - name: remaining-server
        # specify the workflow step type
        type: apply-remaining
        properties:
          # specify the component that needs to be skipped
          exceptions:
            # specify the configuration of the component
            express-server:
              # skipApplyWorkload indicates whether to skip apply the workload resource
              skipApplyWorkload: true
              # skipAllTraits indicates to skip apply all resources of the traits
              skipAllTraits: true
```

## Expected outcome

Check the `Application` status:

```shell
kubectl get application first-vela-workflow -o yaml
```

We can see that the workflow is suspended at `manual-approval`:

```yaml
...
  status:
    workflow:
      ...
      stepIndex: 2
      steps:
      - name: first-server
        phase: succeeded
        resourceRef: {}
        type: apply-component
      - name: manual-approval
        phase: succeeded
        resourceRef: {}
        type: suspend
      suspend: true
      terminated: false
```

Check the component status in cluster and resume the workflow after the component is running:

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
express-server   1/1     1            1           5s

$ kubectl get ingress

NAME             CLASS    HOSTS                 ADDRESS   PORTS   AGE
express-server   <none>   testsvc.example.com             80      47s
```

Resume the workflow:

```
vela workflow resume first-vela-workflow
```

Recheck the `Application` status:

```shell
kubectl get application first-vela-workflow -o yaml
```

All the step status in workflow is succeeded:

```yaml
...
  status:
    workflow:
      ...
      stepIndex: 3
      steps:
      - name: first-server
        phase: succeeded
        resourceRef: {}
        type: apply-component
      - name: manual-approval
        phase: succeeded
        resourceRef: {}
        type: suspend
      - name: remaining-server
        phase: succeeded
        resourceRef: {}
        type: apply-remaining
      suspend: false
      terminated: true
```

Recheck the component status:

```shell
$ kubectl get deployment

NAME              READY   UP-TO-DATE   AVAILABLE   AGE
express-server    1/1     1            1           110s
express-server2   1/1     1            1           6s
express-server3   1/1     1            1           6s
express-server4   1/1     1            1           6s
```

We can see that all of the components has been applied to the cluster successfully. Besides, the first component `express-server` is not applied repeatedly.

With `apply-remaining`, we can easily filter and apply resources by filling in the built-in parameters.
