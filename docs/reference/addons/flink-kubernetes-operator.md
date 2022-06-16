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
+--------------+-------------+--------+----------+---------------------------------------------------------------+
|     NAME     | DESCRIPTION |  TYPE  | REQUIRED |                            DEFAULT                            |
+--------------+-------------+--------+----------+---------------------------------------------------------------+
| name         |             | string | true     |                                                               |
| namespace    |             | string | true     |                                                               |
| nots         |             | string | true     |                                                             2 |
| flinkVersion |             | string | true     | v1_14                                                         |
| image        |             | string | true     | flink:latest                                                  |
| jarURI       |             | string | true     | local:///opt/flink/examples/streaming/StateMachineExample.jar |
| parallelism  |             | int    | true     |                                                             2 |
| upgradeMode  |             | string | true     | stateless                                                     |
| replicas     |             | int    | true     |                                                             1 |
| jmcpu        |             | int    | true     |                                                             1 |
| jmmem        |             | string | true     | 1024m                                                         |
| tmcpu        |             | int    | true     |                                                             1 |
| tmmem        |             | string | true     | 1024m                                                         |
+--------------+-------------+--------+----------+---------------------------------------------------------------+
```

## Example for how to run a component typed flink-cluster in application

First please make sure your cluster already exists namespace `flink-home`.

Then deploy the application:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
   name: flink-app-v1
spec:
components:
  - name: my-flink-component
    type: flink-cluster
    properties:
      name: my-flink-cluster
      namespace: flink-home
EOF      
```

Check all the related resources:

```shell
vela status flink-app-v1 
About:

Name:         flink-app-v1
Created at:   2022-04-22 17:33:51 +0800 CST
Status:       running

Workflow:

mode: DAG
finished: true
Suspend: false
Terminated: false
Steps
- id:n6na24x6dr
  name:my-flink-component
  type:apply-component
  phase:succeeded
  message:

Services:

- Name: my-flink-component
  Cluster: local  Namespace: default
  Type: flink-cluster
  Healthy
  No trait applied
```

You can see you first flink-cluster application is running!