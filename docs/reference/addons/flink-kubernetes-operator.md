# Flink-kubernetes-operator

A Kubernetes operator for Apache Flink(https://github.com/apache/flink-kubernetes-operator), it allows users to manage Flink applications and their lifecycle through native k8s tooling like kubectl.

## Install

```shell
vela addon enable flink-kubernetes-operator
```

## Uninstall

```shell
vela addon disable flink-kubernetes-operator
```

## Check the flink-kubernetes-operator running status

Since this addon dependents `fluxcd` and `cert-manager` addon, so will enable them automatically. Check the status of them:
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


 Show the component type `flink-cluster`, so we know how to use it in one application. As a Flink user, you can choose the parameter to set for your Flink cluster
```shell
vela show flink-cluster
# Properties
# Specification
+--------------+-------------------------------------------------------+--------+----------+---------------------------------------------------------------+
|     NAME     |                      DESCRIPTION                      |  TYPE  | REQUIRED |                            DEFAULT                            |
+--------------+-------------------------------------------------------+--------+----------+---------------------------------------------------------------+
| name         | Specify the flink cluster name.                       | string | true     |                                                               |
| namespace    | Specify the namespace for flink cluster to install.   | string | true     |                                                               |
| nots         | Specify the taskmanager.numberOfTaskSlots.            | string | true    |                                                               |
| flinkVersion | Specify the flink cluster version.                    | string | true    |                                                              |
| image        | Specify the image for flink cluster to run.           | string | true    |                                                              |
| jarURI       | Specify the uri for the jar of the flink cluster job. | string | true    |                                                              |
| parallelism  | Specify the parallelism of the flink cluster job.     | int    | true    |                                                              |
| upgradeMode  | Specify the upgradeMode of the flink cluster job.     | string | true    |                                                              | 
| replicas     | Specify the replicas of the flink cluster jobManager. | int    | true    |                                                              |
| jmcpu        | Specify the cpu of the flink cluster jobManager.      | int    | true    |                                                              |
| jmmem        | Specify the memory of the flink cluster jobManager.   | string | true    |                                                              |
| tmcpu        | Specify the cpu of the flink cluster taskManager.     | int    | true    |                                                              |
| tmmem        | Specify the memory of the flink cluster taskManager.  | string | true    |                                                              |
+--------------+-------------------------------------------------------+--------+----------+---------------------------------------------------------------+


```

## Example for how to run a component typed flink-cluster in application

First please make sure your cluster already exists namespace `flink-cluster`.

Then deploy the application:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: flink-app-v1
  namespace: vela-system
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
      upgradeMode:  stateless
      replicas: 1
      jmcpu: 1
      jmmem: 1024m
      tmcpu: 1
      tmmem: 1024m
      
```

Check the flink cluster
```shell
vela ls  -n vela-system | grep app
flink-app-v1                    my-flink-component      flink-cluster                   running healthy                                                               2022-07-30 18:53:34 +0800 CST


```

Accesss the flink cluster by website using http://localhost:8888
```shell
kubectl get svc -n flink-cluster | grep rest
my-flink-cluster-rest   ClusterIP   192.168.149.175   <none>        8081/TCP            17m


kubectl port-forward service/my-flink-cluster-rest 8888:8081 -n flink-cluster
Forwarding from 127.0.0.1:8888 -> 8081