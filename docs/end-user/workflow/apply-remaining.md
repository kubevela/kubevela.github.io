---
title:  Apply Remaining
---

If we have applied some resources and do not want to specify the rest one by one, KubeVela provides the `apply-remaining` workflow step to filter out selected resources and apply remaining.

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
  workflow:
    steps:
      - name: express-server
        # specify the workflow step type
        type: apply-remaining
        properties:
          exceptions:
            # specify the configuration of the component
            express-server:
              # skipApplyWorkload indicates whether to skip apply the workload resource
              skipApplyWorkload: false
              # skipAllTraits indicates to skip apply all resources of the traits
              # if this is true, skipApplyTraits will be ignored
              skipAllTraits: false
              # skipApplyTraits specifies the names of the traits to skip apply
              skipApplyTraits:
                - ingress
      - name: express-server2
        type: apply-remaining
        properties:
          exceptions:
            express-server:
              skipApplyWorkload: true
```

## Expected outcome

Check the component status in cluster:

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
express-server   1/1     1            1           3m28s

$ kubectl get ingress

No resources found in default namespace.
```

We can see that the first component `express-server` has been applied to the cluster, but the trait named ingress has been skipped.

But the second component `express-server2` hasn't been applied to cluster since it has been skipped. 

With `apply-remaining`, we can easily filter and apply resources by filling in the built-in parameters.
