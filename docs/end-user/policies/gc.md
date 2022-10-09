---
title: Garbage Collect
---

By default, KubeVela Application will recycle outdated resources when new version is deployed and confirmed to be healthy. In some cases, you may want to have more customized control to the recycle of outdated resources, where you can leverage the garbage-collect policy.

In garbage-collect policy, there are two major capabilities you can use.

## Keep legacy resources

Suppose you want to keep the resources created by the old version of the application. Use the garbage-collect policy and enable the option `keepLegacyResource`.

1. create app

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        port: 8000
      traits:
        - type: gateway
          properties:
            class: traefik
            domain: 47.251.8.82.nip.io
            http:
              "/": 8000
  policies:
    - name: keep-legacy-resource
      type: garbage-collect
      properties:
        keepLegacyResource: true
EOF
```

Check the status:

```shell
vela status first-vela-app --tree
```

<details>
<summary>expected output</summary>

```
CLUSTER       NAMESPACE     RESOURCE                  STATUS
local     ─── default   ─┬─ Service/express-server    updated
                         ├─ Deployment/express-server updated
                         └─ Ingress/express-server    updated
```
</details>


2. update the app

```yaml
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server-1
      type: webservice
      properties:
        image: oamdev/hello-world
        port: 8000
      traits:
        - type: gateway
          properties:
            class: traefik
            domain: 47.251.8.82.nip.io
            http:
              "/": 8000
  policies:
    - name: keep-legacy-resource
      type: garbage-collect
      properties:
        keepLegacyResource: true
EOF
```

Check the status again:

```shell
vela status first-vela-app --tree
```

<details>
<summary>expected output</summary>

```shell
CLUSTER       NAMESPACE     RESOURCE                    STATUS
local     ─── default   ─┬─ Service/express-server      outdated
                         ├─ Service/express-server-1    updated
                         ├─ Deployment/express-server   outdated
                         ├─ Deployment/express-server-1 updated
                         ├─ Ingress/express-server      outdated
                         └─ Ingress/express-server-1    updated
```
</details>

You can see the legacy resources are reserved but the status is outdated, it will not be synced by periodically reconciliation.

3. delete the app

```
$ vela delete first-vela-app
```

> If you hope to delete resources in one specified version, you can run `kubectl delete resourcetracker first-vela-app-v1-default`. 

## Persist partial resources

You can also persist part of the resources, which skips the normal garbage-collect process when the application is updated.

Take the following app as an example, in the garbage-collect policy, a rule is added which marks all the resources created by the `expose` trait to use the `onAppDelete` strategy. This will keep those services until application is deleted.

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: garbage-collect-app
spec:
  components:
    - name: demo-gc
      type: webservice
      properties:
        image: oamdev/hello-world
      traits:
        - type: expose
          properties:
            port: [8000]
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              traitTypes:
                - expose
            strategy: onAppDelete
EOF
```

You can find deployment and service created.

```shell
$ kubectl get deployment
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
hello-world   1/1     1            1           74s
$ kubectl get service   
NAME          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
hello-world   ClusterIP   10.96.160.208   <none>        8000/TCP   78s
```

If you upgrade the application and use a different component, you will find the old versioned deployment is deleted but the service is kept.

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: garbage-collect-app
spec:
  components:
    - name: hello-world-new
      type: webservice
      properties:
        image: oamdev/hello-world
      traits:
        - type: expose
          properties:
            port: [8000]
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              traitTypes:
                - expose
            strategy: onAppDelete
EOF

$ kubectl get deployment
NAME              READY   UP-TO-DATE   AVAILABLE   AGE
hello-world-new   1/1     1            1           10s
$ kubectl get service   
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
hello-world       ClusterIP   10.96.160.208   <none>        8000/TCP   5m56s
hello-world-new   ClusterIP   10.96.20.4      <none>        8000/TCP   13s
```

If you want to deploy job-like components, in which cases the resources in the component are not expected to be recycled even after the application is deleted, you can use the component type selector and set strategy to `never` as follows.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: garbage-collect-app
spec:
  components:
    - name: hello-world-new
      type: job-like-component
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              componentTypes:
                - webservice
            strategy: never
```

An alternative selector for the component resources is the component name selector.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: create-ns-app
spec:
  components:
    - name: example-addon-namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              componentNames:
                - example-addon-namespace
            strategy: never
```
