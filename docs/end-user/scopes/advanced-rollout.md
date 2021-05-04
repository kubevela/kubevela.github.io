---
title: Advanced Rollout Plan
---

The rollout plan feature in KubeVela is essentially provided by `AppRollout` API.

## AppRollout

Below is an example for rolling update an application from v1 to v2 in three batches. The 
first batch contains only 1 pod while the rest of the batches split the rest.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: AppRollout
metadata:
  name: rolling-example
spec:
  sourceAppRevisionName: test-rolling-v1
  targetAppRevisionName: test-rolling-v2
  componentList:
    - metrics-provider
  rolloutPlan:
    rolloutStrategy: "IncreaseFirst"
    rolloutBatches:
      - replicas: 1
      - replicas: 50%
      - replicas: 50%
    batchPartition: 1
```
## Basic Usage

1. Deploy application
    ```yaml
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
              - stress-cpu=1
            image: stefanprodan/podinfo:4.0.6
            port: 8080
            replicas: 5
    ```
    Verify AppRevision `test-rolling-v1` have generated
    ```shell
    $ kubectl get apprev test-rolling-v1
    NAME              AGE
    test-rolling-v1   9s
    ```

2. Attach the following rollout plan to upgrade the application to v1
    ```yaml
    apiVersion: core.oam.dev/v1beta1
    kind: AppRollout
    metadata:
      name: rolling-example
    spec:
      # application (revision) reference
      targetAppRevisionName: test-rolling-v1
      componentList:
        - metrics-provider
      rolloutPlan:
        rolloutStrategy: "IncreaseFirst"
        rolloutBatches:
          - replicas: 10%
          - replicas: 40%
          - replicas: 50%
        targetSize: 5
    ```
    Use can check the status of the ApplicationRollout and wait for the rollout to complete.

3. User can continue to modify the application image tag and apply.This will generate new AppRevision `test-rolling-v2`
    ```yaml
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
              - stress-cpu=1
            image: stefanprodan/podinfo:5.0.2
            port: 8080
            replicas: 5
    ```

    Verify AppRevision `test-rolling-v2` have generated
    ```shell
    $ kubectl get apprev test-rolling-v2
    NAME              AGE
    test-rolling-v2   7s
    ```

4. Apply the application rollout that upgrade the application from v1 to v2
    ```yaml
    apiVersion: core.oam.dev/v1beta1
    kind: AppRollout
    metadata:
      name: rolling-example
    spec:
      # application (revision) reference
      sourceAppRevisionName: test-rolling-v1
      targetAppRevisionName: test-rolling-v2
      componentList:
        - metrics-provider
      rolloutPlan:
        rolloutStrategy: "IncreaseFirst"
        rolloutBatches:
          - replicas: 1
          - replicas: 2
          - replicas: 2
    ```
    User can check the status of the ApplicationRollout and see the rollout completes, and the
    ApplicationRollout's "Rolling State" becomes `rolloutSucceed`

## Advanced Usage

Using `AppRollout` separately can enable some advanced use case.

### Revert

5. Apply the application rollout that revert the application from v2 to v1

    ```yaml
    apiVersion: core.oam.dev/v1beta1
      kind: AppRollout
      metadata:
        name: rolling-example
      spec:
        # application (revision) reference
        sourceAppRevisionName: test-rolling-v2
        targetAppRevisionName: test-rolling-v1
        componentList:
          - metrics-provider
        rolloutPlan:
          rolloutStrategy: "IncreaseFirst"
          rolloutBatches:
            - replicas: 1
            - replicas: 2
            - replicas: 2
    ```

### Skip Revision Rollout

6. User can apply this yaml continue to modify the application image tag.This will generate new AppRevision `test-rolling-v3`
    ```yaml
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
                - stress-cpu=1
              image: stefanprodan/podinfo:5.2.0
              port: 8080
              replicas: 5
    ```

    Verify AppRevision `test-rolling-v3` have generated
    ```shell
    $ kubectl get apprev test-rolling-v3
    NAME              AGE
    test-rolling-v3   7s
    ```

7. Apply the application rollout that rollout the application from v1 to v3
    ```yaml
    apiVersion: core.oam.dev/v1beta1
      kind: AppRollout
      metadata:
        name: rolling-example
      spec:
        # application (revision) reference
        sourceAppRevisionName: test-rolling-v1
        targetAppRevisionName: test-rolling-v3
        componentList:
          - metrics-provider
        rolloutPlan:
          rolloutStrategy: "IncreaseFirst"
          rolloutBatches:
            - replicas: 1
            - replicas: 2
            - replicas: 2
    ```

## More Details About `AppRollout` 

### Design Principles and Goals

There are several attempts at solving rollout problem in the cloud native community. However, none 
of them provide a true rolling style upgrade. For example, flagger supports Blue/Green, Canary 
and A/B testing. Therefore, we decide to add support for batch based rolling upgrade as 
our first style to support in KubeVela.

We design KubeVela rollout solutions with the following principles in mind
- First, we want all flavors of rollout controllers share the same core rollout
  related logic. The trait and application related logic can be easily encapsulated into its own
  package.
- Second, the core rollout related logic is easily extensible to support different type of
  workloads, i.e. Deployment, CloneSet, Statefulset, DaemonSet or even customized workloads.
- Thirdly, the core rollout related logic has a well documented state machine that
  does state transition explicitly.
- Finally, the controllers can support all the rollout/upgrade needs of an application running
  in a production environment including Blue/Green, Canary and A/B testing.


### State Transition
Here is the high level state transition graph

![](../../resources/approllout-status-transition.jpg)

### Roadmap

Our recent roadmap for rollout plan is [here](./roadmap).