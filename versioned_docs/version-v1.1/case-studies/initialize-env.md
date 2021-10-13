---
title: Initialize custom environment
---

This case will introduce what is environment and how to initialize an environment.

## What is environment

An Application development team usually needs to initialize some shared environment for users. An environment is a logical concept that represents a set of common resources for Applications.

For example, a team usually wants two environments: one for development, and one for production.

In general, the resource types that can be initialized include the following types:

1. One or more Kubernetes clusters. Different environments may need different sizes and versions of Kubernetes clusters. Environment initialization can also manage multiple clusters .

2. Any type of Kubernetes custom resources (CRDS) and system plug-ins can be set up in environment initialization.

3. All kinds of shared resources and services.  For example. shared resources in microservices. These shared resources can be a microservice component, cloud database, cache, load balancer, API gateway, and so on.

4. Various management policies and processes. An environment may have different global policies. The policy can be initializing a database table, registering an automatic discovery configuration, and so on.

## Initialize the environment

KubeVela allows you to use different resources to initialize the environment.

You can use the `Policy` and `Workflow` in your `Application`. Note that there may be dependencies between initializations, we can use `depends-on-app` in workflow to do it.

The initialization of different environments has dependencies. Common resources can be separated as dependencies. In this way, reusable initialization modules can be formed.

For example, if both the test and develop environments rely on the same controllers, these controllers can be pulled out and initialized as separate environments, specifying dependency initialization in both the development and test environments.

## How to use

### Directly use Application for initialization

If we want to use `kruise` in cluster, we can use `Helm` to initialize `kruise`.

We can directly use Application to initialize a kruise environment. The application below will deploy a kruise controller in cluster:

```shell
vela addon enable fluxcd
```

```shell
cat <<EOF | kubectl apply -f -
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
      branch: master
      chart: ./charts/kruise/v0.9.0
      version: "*"
      repoType: git
      url: https://github.com/openkruise/kruise
  workflow:
    steps:
    - name: check-flux
      type: depends-on-app
      properties:
        name: fluxcd
        namespace: vela-system
    - name: apply-kruise
      type: apply-component
      properties:
        component: kruise
EOF
```

After applying the files, we can check the application in cluster:

```shell
$ vela ls -n vela-system
APP                	COMPONENT     	TYPE      	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME
kruise        	    ...           	raw 	      running	        healthy	      	2021-09-24 20:59:06 +0800 CST
fluxcd        	    ...           	raw 	      running	        healthy	      	2021-09-24 20:59:06 +0800 CST
```

Kruise is running successfully! Then you can use kruise in your cluster. If you need to set up a new environment, the only thing you need to do is to apply the files above.

#### Customize initialization dependencies

In the example above, `depends-on-app` means this initialization depends on the ability of fluxcd. 

`depends-on-app` will check if the cluster has the application with `name` and `namespace` defines in `properties`.

If the application exists, the next step will be executed after the application is running.
If the application do not exists, KubeVela will check the configMap with the same name, and read the config of the Application and apply to cluster.
> If the application do not exists, we need configMap like below:
> ```yaml
> apiVersion: v1
> kind: ConfigMap
> metadata:
>   name: fluxcd
>   namespace: vela-system
> data:
>   fluxcd: ...
> ``` 

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

  workflow:
    steps:
      - name: apply-pvc
        type: apply-object
        properties:
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
          apiVersion: v1
          kind: ConfigMap
          metadata:
            name: my-cm
            namespace: default
          data:
            test-key: test-value
      - name: apply-remaining
        type: apply-remaining
```

Check the PVC and ConfigMap in cluster：

```shell
$ kubectl get pvc
NAME       STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
my-claim   Bound    pvc-2621d7d7-453c-41df-87fb-58e6b3a8e136   8Gi        RWO            standard       2m53s

$ kubectl get cm
NAME                                      DATA   AGE
my-cm                                     1      3m8s
```

Check the application in cluster：

```shell
$ vela ls
APP                   	COMPONENT      	TYPE  	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME
server-with-pvc-and-cm	log-gen-worker 	worker	      	running	healthy	      	2021-10-11 20:42:38 +0800 CST
└─                  	log-read-worker	worker	      	running	       	      	2021-10-11 20:42:38 +0800 CST
```

Check the logs of the second component:

```shell
$ kubectl logs -f log-read-worker-774b58f565-ch8ch
0: Mon Oct 11 12:43:01 UTC 2021
1: Mon Oct 11 12:43:02 UTC 2021
2: Mon Oct 11 12:43:03 UTC 2021
3: Mon Oct 11 12:43:04 UTC 2021
4: Mon Oct 11 12:43:05 UTC 2021
5: Mon Oct 11 12:43:06 UTC 2021
6: Mon Oct 11 12:43:07 UTC 2021
7: Mon Oct 11 12:43:08 UTC 2021
```

We can see that both components is running. The two components share the same PVC and use the same ConfigMap.
