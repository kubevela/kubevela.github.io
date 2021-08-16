---
title:  Apply Remaining
---

## Overview

If we have applied some resources and do not want to specify the rest one by one, KubeVela provides the `apply-remaining` workflow step to filter out selected resources and apply remaining.

In this guide, you will learn how to apply remaining resources via `apply-remaining` in `Workflow`.

## Apply Application

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
  workflow:
    steps:
      - name: express-server
        // specify the workflow step type
        type: apply-remaining
        properties:
          exceptions:
            // specify the configuration of the component
            express-server:
              // skipApplyWorkload indicates whether to skip apply the workload resource
              skipApplyWorkload: false
              // skipAllTraits indicates to skip apply all resources of the traits
              // if this is true, skipApplyTraits will be ignored
              skipAllTraits: false
              // skipApplyTraits specifies the names of the traits to skip apply
              skipApplyTraits:
                - ingress
```

## Expected outcome

We can see that the component have been applied to the cluster, but the trait named ingress has been skipped.

With `apply-remaining`, we can easily filter and apply resources by filling in the built-in parameters.
