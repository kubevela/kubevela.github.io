---
title: System Info and Diagnose
---

Vela CLI provide a command to diagnose the system and show the system information.

You can:

- run `vela system info` to check all detail system information
- run `vela system diagnose` to diagnose system's health

### Vela System Info

1.The system info command displays the cpu and memory metrics, the numbers of ready pods and desired pods.

```shell
vela system info
NAME                            NAMESPACE       READY PODS      IMAGE                           CPU(cores)      MEMORY(bytes)   ARGS                                                         ENVS
kubevela-cluster-gateway        vela-system     1/1             oamdev/cluster-gateway:v1.4.0   2m              28Mi            apiserver --secure-port=9443 --secret-namespace=ve...        -
kubevela-vela-core              vela-system     1/1             oamdev/vela-core:latest         13m             217Mi           --metrics-addr=:8080 --enable-leader-election --op...        -
```

2.The system info command displays the deployment spec and status

```shell
vela system info -s kubevela-vela-core -n vela-system                                                                                1 ↵
metadata:
  annotations:
    deployment.kubernetes.io/revision: "2"
    meta.helm.sh/release-name: kubevela
    meta.helm.sh/release-namespace: vela-system
  creationTimestamp: "2022-08-09T15:11:20Z"
  generation: 3
  labels:
    app.kubernetes.io/instance: kubevela
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/name: vela-core
    app.kubernetes.io/version: 0.1.0
    controller.oam.dev/name: vela-core
    helm.sh/chart: vela-core-0.1.0
  name: kubevela-vela-core
  namespace: vela-system
  resourceVersion: "658152"
  uid: 1e26c04b-9f47-4a81-bc95-1694e0eb0ed0
spec:
  ...(omitted for brevity)
status:
  availableReplicas: 1
  conditions:
  - lastTransitionTime: "2022-08-09T15:11:20Z"
    lastUpdateTime: "2022-08-09T15:11:55Z"
    message: ReplicaSet "kubevela-vela-core-d7cb9c78d" has successfully progressed.
    reason: NewReplicaSetAvailable
    status: "True"
    type: Progressing
  - lastTransitionTime: "2022-08-16T15:27:00Z"
    lastUpdateTime: "2022-08-16T15:27:00Z"
    message: Deployment has minimum availability.
    reason: MinimumReplicasAvailable
    status: "True"
    type: Available
  observedGeneration: 3
  readyReplicas: 1
  replicas: 1
  updatedReplicas: 1
```

### Vela System Diagnose

`vela system diagnose` will helps you to diagnose the KubeVela's health.

```shell
 vela system diagnose
------------------------------------------------------
Diagnosing APIService of cluster-gateway...
Result: APIService of cluster-gateway is fine~
------------------------------------------------------
------------------------------------------------------
Diagnosing health of clusters...
Result: Clusters are fine~
------------------------------------------------------
```