---
title: Rollout
---
This chapter will introduce how to use RolloutTraits to perform a rolling update on Workloads.

## Configurations

All configurations for Rolling Traits.

Name | Description | Type | Required | Default 
------------ | ------------- | ------------- | ------------- | ------------- 
targetRevision|The revision of target Trait|string|No|If this field is empty, it will always point to the latest revision
targetSize|Size of target Trait|int|Yes|Nil
rolloutBatches|Strategy of rolling update|[]rolloutBatch|Yes|Nil
batchPartition|Partition of rolloutBatches|int|No|Nil, if this field is empty, all batches will be updated

Configurations of rolloutBatch

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
replicas|number of replicas in one rolloutBatch|int|Yes|Nil

## Background
Each modification to a Trait will produce a kubernetes controllerRevision, the default role to generate a name of kubernetes controllerRevision is: `<Component name>-<revision number>`. You can also appoint controllerRevision name by setting `spec.components[x].externalRevision`.

Other than that, when using webservice/worker as Workload's type with RolloutTraits, Workload's name will be controllerRevision's name. And when Workload's type is cloneset-service, Workloads's name will be component's name.


## How to

### First Deployment
   
Apply the YAML below to create an Application, this Application includes a Workload of type webservice with RolloutTraits, and sets controllerRevision name to express-server-v1 by setting `spec.components[0].externalRevision` field.

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v1
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```
This RolloutTraits has two batches with total target size of 5, the first batch has 2 replicas and second batch has 3. Only when all replicas in the first batch are ready, the second batch will start to rollout.

Check the Application status when rollout has been succeed after a while.
```shell
$ kubectl get app rollout-trait-test
NAME                 COMPONENT        TYPE         PHASE     HEALTHY   STATUS   AGE
rollout-trait-test   express-server   webservice   running   true               2d20h
```

Check controllerRevision
```shell
$ kubectl get controllerRevision  -l controller.oam.dev/component=express-server
NAME                CONTROLLER                                    REVISION   AGE
express-server-v1   application.core.oam.dev/rollout-trait-test   1          2d22h
```

Check the status of RolloutTraits. The rollout is succeed if `ROLLING-STATE` is rolloutSucceed, and all replicas are ready if `BATCH-STATE` is batchReady. `TARGET`, `UPGRADED` and `READY` indicates target size of replicas is 5, updated number of replicas is 5 and all 5 replicas are ready.
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5          5       batchReady    rolloutSucceed   2d20h
```

Check Workload Status (Workload underlying webservice/worker is [deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) ultimately)
```shell
$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   5/5     5            5           2d20h
```

### Rollout Update
   
Apply the YAML below to modify the image of container, update the Workload to a new controllerRevision.
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetSize: 5
            batchPartition: 0
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```
This RolloutTrait represents the target size of replicas is 5 and update will be performed in 2 batches. The first batch will update 2 replicas and the second batch will update 3 replicas. Only 2 replicas in first batch will be updated by setting `batchPartition` to 0.

Check controllerRevision and there is a new controllerRevision express-server-v2.
```shell
$ kubectl get controllerRevision -l controller.oam.dev/component=express-server
NAME                CONTROLLER                                    REVISION   AGE
express-server-v1   application.core.oam.dev/rollout-trait-test   1          2d22h
express-server-v2   application.core.oam.dev/rollout-trait-test   2          1m
```

Check the status of RolloutTraits after a while when first batch has been upgraded successfully. `TARGET`, `UPGREADED` and `READY` indicates the target size of replicas for this revision is 5, there are 2 replicas sucessfully upgraded and they are ready. batchReady means replicas in the first rolloutBatch are all ready, rollingInBatches means there are batches still yet to be upgraded.
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        2          2       batchReady   rollingInBatches  2d20h
```

Check Workload status to verify, we can see there are 2 replicas of new Workload express-server-v2 have been upgraded and old version of Workload express-server-v1 still has 3 replicas.
```shell
$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   3/3     3            3           2d20h
express-server-v2   2/2     2            2           1m
```

Apply the YAML below without `batchPartition` field in RolloutTraits to upgrade all replicas to latest revision.
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```

Check RolloutTraits, we can see rollout is succeed.
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5           5       batchReady   rolloutSucceed  2d20h
```

Check Workload status, all replicas of Workload has been upgraded to a new revision and old workload has been deleted.
```shell
$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v2   5/5     5            5           1m
```


### Rollback
   
Apply the YAML below to make controllerRevision roll back to express-server-v1 by assigning `targetRevision` field to express-server-v1 in RolloutTrait.
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetRevision: express-server-v1
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```

Check RolloutTrait status after rollback has been succeed.
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5          5       batchReady    rolloutSucceed  2d20h
```

Check Workload status, we can see Workload has rolled back to express-server-v1. 
```shell
$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   5/5     5            5           15s
```

### Expand

RolloutTraits are also be able to expand a Workload, apply the YAML below to modify the `targetSize`, in order to increase the number of replicas from 5 to 7.
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetRevision: express-server-v1
            targetSize: 7
            rolloutBatches:
              - replicas: 1
              - replicas: 1
EOF
```
This RolloutTrait represents this expansion consists of 2 rollout batches, each batch will expand 1 replica.

Check the status after expansion has been succeed.
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   7        7          7       batchReady    rolloutSucceed   2d20h

$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   7/7     7            7           2m
```

### Shrink
   
Apply the YAML below to Shrink the size of replicas from 7 to 3.
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetRevision: express-server-v1
            targetSize: 3
            rolloutBatches:
              - replicas: 1
              - replicas: 3
EOF
```
This RolloutTrait represents this shrink consists of 2 batches, first batch will remove 1 replica and second batch will remove 3 replicas.

Check the status after shrink has been succeed.
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   3        3          3       batchReady    rolloutSucceed   2d20h

$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   3/3     3            3           5m
```

### Rollout update of cloneset-service

Enable kruise [extension](./addons/introduction)。
```shell
$ vela addon enable kruise
```

Check types of components.
```shell
$ vela components
NAME                NAMESPACE        WORKLOAD                        DESCRIPTION
cloneset-service    vela-system     clonesets.apps.kruise.io
```


Apply the YAML below to create an Application, this Application includes a Workload of type cloneset-service with a RolloutTrait.
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test-cloneset
spec:
  components:
    - name: cloneset-server
      type: cloneset-service
      externalRevision: cloneset-server-v1
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```

Check the status of related resources.
```shell
$ kubectl get app rollout-trait-test-cloneset
NAME                              COMPONENT         TYPE               PHASE      HEALTHY   STATUS     AGE
rollout-trait-test-cloneset   cloneset-service   clonesetservice      running      true               4m18s

$ kubectl get controllerRevision  -l controller.oam.dev/component=cloneset-server
NAME                CONTROLLER                                           REVISION   AGE
cloneset-server-v1   application.core.oam.dev/rollout-trait-test-cloneset   1          4m45s

$ kubectl get rollout cloneset-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
cloneset-server   5        5          5       batchReady    rolloutSucceed   5m10s
```

Check the status of Workload. As cloneset-service Workload supports inplace upgrade, the most noticable difference beween it and webservice/worker is that the name of underlying Workload's name is exactly the component's name.
```shell
$ kubectl get cloneset -l app.oam.dev/component=cloneset-server
NAME             DESIRED   UPDATED   UPDATED_READY   READY   TOTAL   AGE
cloneset-server   5         5         5               5       5       7m3s
```

Check the image.
```shell
$ kubectl get cloneset cloneset-server -o=jsonpath='{.spec.template.spec.containers[0].image}'
stefanprodan/podinfo:4.0.3
```

Apply the YAML below to upgrade the image.
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test-cloneset
spec:
  components:
    - name: cloneset-server
      type: cloneset-service
      externalRevision: cloneset-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```

Check the status of related resources after upgrade has been succeed.
```shell
$ kubectl get controllerRevision  -l controller.oam.dev/component=cloneset-server
NAME                CONTROLLER                                             REVISION    AGE
cloneset-server-v1   application.core.oam.dev/rollout-trait-test-cloneset    1          6m43s
cloneset-server-v2   application.core.oam.dev/rollout-trait-test-clonesett   2          108s

$ kubectl get rollout cloneset-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
cloneset-server  5        5          5       batchReady    rolloutSucceed   6m10s
```

Check the status of the Workload, we can see the name after upgrade is still cloneset-server.
```shell
$ kubectl get cloneset -l app.oam.dev/component=cloneset-server
NAME             DESIRED   UPDATED   UPDATED_READY   READY   TOTAL   AGE
cloneset-server   5         5         5               5       5       7m3s
```

Verify the rollout by checking the image.
```shell
$ kubectl get cloneset cloneset-server -o=jsonpath='{.spec.template.spec.containers[0].image}'
stefanprodan/podinfo:5.0.2
```

Other operations such as Expand, Shrink, Rollback are the same as the operations on webservice/worker.