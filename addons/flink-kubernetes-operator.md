---
title: Flink Kubernetes Operator
---

The [Apache Flink Kubernetes operator](https://github.com/apache/flink-kubernetes-operator) lets you manage Flink applications and their lifecycle with native Kubernetes tooling such as kubectl. This addon installs it and adds a `flink-cluster` component type.

## Install

```shell
vela addon enable flink-kubernetes-operator
```

To remove it:

```shell
vela addon disable flink-kubernetes-operator
```

## Check the operator is running

Enabling it also enables the fluxcd and cert-manager addons, which it depends on. Check all three:

```shell
$ vela ls -n vela-system
APP                             COMPONENT               TYPE            TRAITS  PHASE   HEALTHY STATUS                                                          CREATED-TIME                 
addon-cert-manager              cert-manager            helm                    running healthy Fetch repository successfully, Create helm release              2022-06-16 11:50:19 +0800 CST
                                                                                                successfully                                                                                 
addon-flink-kubernetes-operator flink-namespace         raw                     running healthy                                                                 2022-06-16 11:50:20 +0800 CST
└─                              flink-operator          helm                    running healthy Fetch repository successfully, Create helm release              2022-06-16 11:50:20 +0800 CST
                                                                                                successfully                                                                                 
addon-fluxcd                    flux-system-namespace   raw                     running healthy                                                                 2022-06-16 11:47:07 +0800 CST
└─                              fluxcd-resources        k8s-objects             running healthy                                                                 2022-06-16 11:47:07 +0800 CST
```

## The flink-cluster component type

All parameters are required. Run `vela show flink-cluster` to see them in your cluster.

| Name | Type | Description |
| --- | --- | --- |
| `name` | string | Flink cluster name. |
| `namespace` | string | Namespace to create the Flink cluster in. |
| `nots` | string | `taskmanager.numberOfTaskSlots`, for example `"2"`. |
| `flinkVersion` | string | Flink version, for example `v1_14`. |
| `image` | string | Image the Flink cluster runs, for example `flink:latest`. |
| `jarURI` | string | URI of the job's jar, for example `local:///opt/flink/examples/streaming/StateMachineExample.jar`. |
| `parallelism` | int | Parallelism of the job, for example `2`. |
| `upgradeMode` | string | Upgrade mode of the job, for example `stateless`. |
| `replicas` | int | JobManager replicas, for example `1`. |
| `jmcpu` | int | JobManager CPU, for example `1`. |
| `jmmem` | string | JobManager memory, for example `1024m`. |
| `tmcpu` | int | TaskManager CPU, for example `1`. |
| `tmmem` | string | TaskManager memory, for example `1024m`. |

## Run a Flink cluster

The `namespace` property decides where the Flink cluster runs, wherever the Application itself lives. This example keeps both in `flink-cluster`. Create the namespace first:

```shell
kubectl create namespace flink-cluster
```

Then deploy the Application:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: flink-app-v1
  namespace: flink-cluster
spec:
  components:
  - name: my-flink-component
    type: flink-cluster
    properties:
      name: my-flink-cluster
      namespace: flink-cluster
      nots: '2'
      flinkVersion: v1_14
      image: flink:latest
      jarURI: local:///opt/flink/examples/streaming/StateMachineExample.jar
      parallelism: 2
      upgradeMode: stateless
      replicas: 1
      jmcpu: 1
      jmmem: 1024m
      tmcpu: 1
      tmmem: 1024m
EOF
```

Check the Application:

```shell
$ vela ls -n flink-cluster
APP             COMPONENT               TYPE            TRAITS  PHASE   HEALTHY STATUS  CREATED-TIME
flink-app-v1    my-flink-component      flink-cluster           running healthy         2022-07-30 18:53:34 +0800 CST
```

Open the Flink web UI at http://localhost:8888 by forwarding its REST service:

```shell
$ kubectl get svc -n flink-cluster | grep rest
my-flink-cluster-rest   ClusterIP   192.168.149.175   <none>        8081/TCP            17m

$ kubectl port-forward service/my-flink-cluster-rest 8888:8081 -n flink-cluster
Forwarding from 127.0.0.1:8888 -> 8081
```
