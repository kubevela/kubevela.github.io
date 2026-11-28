---
title: System Info and Diagnose
---

Vela CLI provide a command to diagnose the system and show the system information. It can help check if the system is running in a health state.

You can:

- run `vela system info` to check all detail system information
- run `vela system diagnose` to diagnose system's health

### Vela System Info

1. `vela system info` lists every Deployment labelled `app.kubernetes.io/name=vela-core`, in any namespace, with its ready pods, image, and CPU and memory use.

```shell
vela system info
```

<details>
<summary>expected output</summary>

```
NAME                        NAMESPACE      READY PODS    IMAGE                            CPU(cores)    MEMORY(bytes)
kubevela-cluster-gateway    vela-system    1/1           oamdev/cluster-gateway:v1.4.0    2m            28Mi
kubevela-vela-core          vela-system    1/1           oamdev/vela-core:latest          13m           217Mi
```
</details>

CPU and memory come from the metrics API; without metrics-server they show as `N/A`.

Use `-o` to change the format:

- `-o wide` adds the `ARGS` and `ENVS` columns, the container's arguments and environment variables.
- `-o yaml` prints each Deployment in full as YAML.

2. To see one component in detail, name its Deployment with `-s`. This prints a summary of that Deployment, whatever `-o` says.

```shell
vela system info -s kubevela-vela-core
```

<details>
<summary>expected output</summary>

```
Name:                 kubevela-vela-core
Namespace:            vela-system
CreationTimestamp:    2026-11-20 10:12:31 +0000 UTC
Labels:               app.kubernetes.io/name=vela-core
                      app.kubernetes.io/instance=kubevela
                      app.kubernetes.io/managed-by=Helm
                      controller.oam.dev/name=vela-core
Annotations:          deployment.kubernetes.io/revision=1
                      meta.helm.sh/release-name=kubevela
                      meta.helm.sh/release-namespace=vela-system
Selector:             app.kubernetes.io/name=vela-core
                      app.kubernetes.io/instance=kubevela
Image:                oamdev/vela-core:latest
Args:                 --metrics-addr=:8080
                      --enable-leader-election
                      ...(omitted for brevity)
Envs:                 -
Limits:               cpu=500m
                      memory=1Gi
Requests:             cpu=50m
                      memory=20Mi
```
</details>

### Vela System Diagnose

`vela system diagnose` checks the health of each managed cluster (every cluster except `local`) through cluster-gateway, then checks that the hub's API server can reach cluster-gateway through its APIService.

```shell
vela system diagnose
```

<details>
<summary>expected output</summary>

```
------------------------------------------------------
Diagnosing health of clusters...
Connect to cluster worker successfully.
ok
Result: Clusters are fine~
------------------------------------------------------
------------------------------------------------------
Diagnosing the link of hub APIServer to cluster-gateway...
APIService "v1alpha1.cluster.core.oam.dev" is available!
Result: The link of hub APIServer to cluster-gateway is fine~
------------------------------------------------------
```
</details>
