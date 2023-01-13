---
title: Initialize Env Infra Resources
---

This section will introduce how to initialize and destroy infrastructure of environment with KubeVela easily.

## What can be infrastructure of environment

An Application development team usually needs to initialize some shared environment for users. An environment is a logical concept that represents a set of common infrastructure resources for Applications.

For example, a team usually wants two environments: one for development, and one for production.

In general, the infra resource types that can be initialized include the following types:

1. One or more Kubernetes clusters. Different environments may need different sizes and versions of Kubernetes clusters. Environment initialization can also manage multiple clusters .

2. Any type of Kubernetes custom resources (CRDs) and system plug-ins can be set up in environment initialization.

3. All kinds of shared resources and services.  For example. shared resources in microservices. These shared resources can be a microservice component, cloud database, cache, load balancer, API gateway, and so on.

4. Various management policies and processes. An environment may have different global policies. The policy can be chaos test, security scan, SLO and son on; the process can be initializing a database table, registering an automatic discovery configuration, and so on.

KubeVela allows you to use different resources to initialize the environment.

You can use the `Policy` and `Workflow` in your `Application`. Note that there may be dependencies between initializations, we can use `depends-on-app` in workflow to do it.

The initialization of different environments has dependencies. Common resources can be separated as dependencies. In this way, reusable initialization modules can be formed.

For example, if both the test and develop environments rely on the same controllers, these controllers can be pulled out and initialized as separate environments, specifying dependency initialization in both the development and test environments.

## How to use

### Directly use Application for initialization

If we want to use some CRD controller like [OpenKruise](https://github.com/openkruise/kruise) in cluster, we can use `Helm` to initialize `kruise`.

We can directly use Application to initialize a kruise environment. The application below will deploy a kruise controller in cluster.

We have to enable [`FluxCD` addon](https://kubevela.net/docs/reference/addons/fluxcd) in cluster since we use `Helm` to deploy kruise.
We can use `depends-on-app` to make sure `addon-fluxcd` is deployed before kruise, we also use `apply-once` policy here to make sure we'll only apply the application once for initialization.

> `depends-on-app` will check if the cluster has the application with `name` and `namespace` defines in `properties`.
> If the application exists, the next step will be executed after the application is running.
> If the application do not exists, KubeVela will check the ConfigMap with the same name, and read the config of the Application and apply to cluster.
> For more information, please refer to [depends-on-app](../end-user/workflow/built-in-workflow-defs#depends-on-app).


```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: kruise
  namespace: vela-system
spec:
  components:
    - name: kruise
      type: helm
      properties:
        repoType: helm
        url: https://openkruise.github.io/charts/
        chart: kruise
        version: 1.2.0
        git:
          branch: master
        values:
          featureGates: PreDownloadImageForInPlaceUpdate=true
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
  workflow:
    steps:
    - name: check-flux
      type: depends-on-app
      properties:
        name: addon-fluxcd
        namespace: vela-system
    - name: apply-kruise
      type: apply-component
      properties:
        component: kruise
EOF
```

Check the application in cluster:

```shell
vela status kruise -n vela-system
```

<details>
<summary>Expected Outcome</summary>

```console
About:

  Name:      	kruise
  Namespace: 	vela-system
  Created at:	2022-10-31 18:10:27 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: l6apfsi5c2
    name: check-flux
    type: depends-on-app
    phase: succeeded
  - id: p2nqell47w
    name: apply-kruise
    type: apply-component
    phase: succeeded

Services:

  - Name: kruise
    Cluster: local  Namespace: vela-system
    Type: helm
    Healthy Fetch repository successfully, Create helm release successfully
    No trait applied
```
</details>

Kruise is running successfully! Then you can use kruise in your cluster. If you need to set up a new environment, the only thing you need to do is to apply the files like above.

### Add initialize workflow in application

Some Kubernetes native resources like ConfigMap/PVC are commonly used in the environment.

If you want to apply those resources before deploying your application, you can add an initialization workflow to your application.

KubeVela provides a built-in workflow step `apply-object` to fill in native Kubernetes resources.
In this way, by filling in Kubernetes native resources, we can avoid writing redundant component definitions.

Apply the following application, it will initialize an environment with ConfigMap/PVC. There is two components in this application, the first one will write data to PVC, the second on will read the data from PVC:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: server-with-pvc-and-cm
  namespace: default
spec:
  components:
  - name: log-gen-worker
    type: worker
    properties:
      image: busybox
      cmd:
        - /bin/sh
        - -c
        - >
          i=0;
          while true;
          do
            echo "$i: $(date)" >> /test-pvc/date.log;
            i=$((i+1));
            sleep 1;
          done
      volumes:
        - name: "my-pvc"
          type: "pvc"
          mountPath: "/test-pvc"
          claimName: "my-claim"
        - name: "my-configmap"
          type: "configMap"
          mountPath: "/test-cm"
          cmName: "my-cm"
          items:
            - key: test-key
              path: test-key
  - name: log-read-worker
    type: worker
    properties:
      name: count-log
      image: busybox
      cmd: 
        - /bin/sh
        - -c
        - 'tail -n+1 -f /test-pvc/date.log'
      volumes:
        - name: "my-pvc"
          type: "pvc"
          mountPath: "/test-pvc"
          claimName: "my-claim"
        - name: "my-configmap"
          type: "configMap"
          mountPath: "/test-cm"
          cmName: "my-cm"
          items:
            - key: test-key
              path: test-key

  policies:
    - name: my-policy
      properties:
        clusters:
        - local
      type: topology
    - name: apply-once
      type: apply-once
      properties:
        enable: true

  workflow:
    steps:
      - name: apply-pvc
        type: apply-object
        properties:
          value:
            apiVersion: v1
            kind: PersistentVolumeClaim
            metadata:
              name: my-claim
              namespace: default
            spec:
              accessModes:
              - ReadWriteOnce
              resources:
                requests:
                  storage: 8Gi
              storageClassName: standard
      - name: apply-cm
        type: apply-object
        properties:
          value:
            apiVersion: v1
            kind: ConfigMap
            metadata:
              name: my-cm
              namespace: default
            data:
              test-key: test-value
      - name: deploy-comp
        properties:
          policies:
          - my-policy
        type: deploy
```

Check the PVC and ConfigMap in cluster：

```shell
vela status server-with-pvc-and-cm --detail --tree
```

<details>
<summary>Expected Outcome</summary>

```console
CLUSTER       NAMESPACE     RESOURCE                       STATUS    APPLY_TIME          DETAIL
local     ─── default   ─┬─ ConfigMap/my-cm                updated   2022-10-31 18:00:52 Data: 1  Age: 57s
                         ├─ PersistentVolumeClaim/my-claim updated   2022-10-31 10:00:52 Status: Bound  Volume: pvc-b6f88ada-af98-468d-8cdd-31ca110c5e1a  Capacity: 8Gi  Access Modes: RWO  StorageClass: standard  Age: 57s
                         ├─ Deployment/log-gen-worker      updated   2022-10-31 10:00:52 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 57s
                         └─ Deployment/log-read-worker     updated   2022-10-31 10:00:52 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 57s
```
</details>


Check the application in cluster：

```shell
vela status server-with-pvc-and-cm
```

<details>
<summary>Expected Outcome</summary>

```console
$ vela status server-with-pvc-and-cm
About:

  Name:      	server-with-pvc-and-cm
  Namespace: 	default
  Created at:	2022-10-31 18:00:51 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: xboizfjo28
    name: apply-pvc
    type: apply-object
    phase: succeeded
  - id: 4ngx25mrx8
    name: apply-cm
    type: apply-object
    phase: succeeded
  - id: 1gzzt3mfw1
    name: deploy-comp
    type: deploy
    phase: succeeded

Services:

  - Name: log-gen-worker
    Cluster: local  Namespace: default
    Type: worker
    Healthy Ready:1/1
    No trait applied

  - Name: log-read-worker
    Cluster: local  Namespace: default
    Type: worker
    Healthy Ready:1/1
    No trait applied
```
</details>


Check the logs of the second component:

```shell
vela logs server-with-pvc-and-cm --component log-read-worker
```

<details>
<summary>Expected Outcome</summary>

```console
+ log-read-worker-7f4bc9d9b5-kb5l6 › log-read-worker
log-read-worker 2022-10-31T10:01:15.606903716Z 0: Mon Oct 31 10:01:13 UTC 2022
log-read-worker 2022-10-31T10:01:15.606939383Z 1: Mon Oct 31 10:01:14 UTC 2022
log-read-worker 2022-10-31T10:01:15.606941883Z 2: Mon Oct 31 10:01:15 UTC 2022
log-read-worker 2022-10-31T10:01:16.607006425Z 3: Mon Oct 31 10:01:16 UTC 2022
log-read-worker 2022-10-31T10:01:17.607184925Z 4: Mon Oct 31 10:01:17 UTC 2022
log-read-worker 2022-10-31T10:01:18.607304426Z 5: Mon Oct 31 10:01:18 UTC 2022
...
```
</details>

We can see that both components is running. The two components share the same PVC and use the same ConfigMap.

## Destroy the infrastructure of environment

As we have already modeled the environment as a KubeVela Application, we can destroy the environment easily by deleting the application.

```
vela delete server-with-pvc-and-cm
```

Then the KubeVela controller will clean up all these resources.

