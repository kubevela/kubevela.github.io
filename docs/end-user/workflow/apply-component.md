---
title:  Apply Components and Traits
---

## Overview

In this guide, you will learn how to apply components and traits in `Workflow`.

## Apply Application

Apply the following `Application` with workflow step type of `apply-component`:

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
        type: apply-component
        properties:
          // specify the component name
          component: express-server
```

## Expected outcome

We can see that all the components and traits have been applied to the cluster.
