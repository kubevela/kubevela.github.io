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

Check the component status in cluster:

```shell
$ kubectl get deployment

NAME              READY   UP-TO-DATE   AVAILABLE   AGE
express-server2   1/1     1            1           5s
express-server3   1/1     1            1           5s
express-server4   1/1     1            1           4s

$ kubectl get ingress

No resources found in default namespace.
```

We can see that the first component `express-server` and its trait has been skipped applying.

But the rest of the components has been applied to the cluster successfully. 

With `apply-remaining`, we can easily filter and apply resources by filling in the built-in parameters.
