---
title: Application Rollout
---
In this documentation, we will show how to use the rollout plan within application to do progressive rollout.
## Overview

By default, when we update the spec of Application, KubeVela will update workload directly which relies on the underlying workload to provide availability.

KubeVela provides a unified progressive rollout mechanism, you can specify the `spec.rolloutPlan` in application to do so.

## User Workflow
Here is the end to end user experience based on Deployment


1. Deploy application to the cluster
  ```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-rolling
spec:
  components:
    - name: metrics-provider
      type: worker
      properties:
        cmd:
          - ./podinfo
          - stress-cpu=1.0
        image: stefanprodan/podinfo:4.0.6
        port: 8080
  rolloutPlan:
    rolloutStrategy: "IncreaseFirst"
    rolloutBatches:
      - replicas: 50%
      - replicas: 50%
    targetSize: 6
  ```

2. User can  modify the application container command and apply
  ```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-rolling
spec:
  components:
    - name: metrics-provider
      type: worker
      properties:
        cmd:
          - ./podinfo
          - stress-cpu=2.0
        image: stefanprodan/podinfo:4.0.6
        port: 8080
  rolloutPlan:
    rolloutStrategy: "IncreaseFirst"
    rolloutBatches:
      - replicas: 50%
      - replicas: 50%
    targetSize: 6
  ```

User can check the status of the Application and see the rollout completes, and the
Application's `status.rollout.rollingState` becomes `rolloutSucceed`

## Using AppRollout to adopt Application with rolloutPlan

Sometimes, we want to use [AppRollout](../rollout/rollout) to adopt the Application Rollout, so we can use the `AppRollout` to specify more specific revision. The `AppRollout` can both rollout or revert the version of application.

If you want to let `AppRollout` adopt the Application with `rolloutPlan`, please add the annotations in application to tell `AppRollout` to adopt rollout, and clean the strategy in `spec.rolloutPlan` to avoid conflicts.

eg. to let AppRollout adopt the application above, you should update the application like below:
```shell
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-rolling
  annotations:
    "app.oam.dev/rolling-components": "metrics-provider"
    "app.oam.dev/rollout-template": "true"
spec:
  components:
    - name: metrics-provider
      type: worker
      properties:
        cmd:
          - ./podinfo
          - stress-cpu=2.0
        image: stefanprodan/podinfo:4.0.6
        port: 8080
```

Please refer to [AppRollout](../rollout/rollout) to learn more details.




