---
title: Prepare Shared Resources before Deploying
---

Some Applications need something in the cluster before they can run: a controller that serves the CRDs they use, or a PVC and ConfigMap their pods mount. This page shows two ways to have KubeVela put those in place first, so nothing deploys against a cluster that is not ready for it.

## Wait for another Application with `depends-on-app`

When the shared piece is big enough to manage on its own, such as a controller several teams use, install it with its own Application and make the Applications that need it wait for it.

This Application installs [OpenKruise](https://github.com/openkruise/kruise) from its Helm chart, with the built-in `helmchart` component type:

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
      type: helmchart
      properties:
        chart:
          source: kruise
          repoURL: https://openkruise.github.io/charts/
          version: 1.2.0
        values:
          featureGates: PreDownloadImageForInPlaceUpdate=true
EOF
```

This one runs a Kruise `CloneSet`, so it can only deploy once Kruise is running. Its first workflow step, `depends-on-app`, holds the workflow until the `kruise` Application reaches `running`:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: web-cloneset
  namespace: default
spec:
  components:
    - name: web
      type: k8s-objects
      properties:
        objects:
          - apiVersion: apps.kruise.io/v1alpha1
            kind: CloneSet
            metadata:
              name: web
            spec:
              replicas: 2
              selector:
                matchLabels:
                  app: web
              template:
                metadata:
                  labels:
                    app: web
                spec:
                  containers:
                    - name: nginx
                      image: nginx:alpine
  workflow:
    steps:
      - name: wait-for-kruise
        type: depends-on-app
        properties:
          name: kruise
          namespace: vela-system
      - name: deploy-web
        type: deploy
EOF
```

`depends-on-app` reads the Application named in `name` and `namespace` and waits until its status is `running`. If no such Application exists, it looks for a ConfigMap with the same name and namespace, applies the Application stored under its `application` key, and waits for that one instead. See [depends-on-app](../end-user/workflow/built-in-workflow-defs.md#depends-on-app) for the details.

Check both:

```shell
vela status kruise -n vela-system
vela status web-cloneset
```

While Kruise is still installing, `web-cloneset` shows the `wait-for-kruise` step running and `deploy-web` not started. Once `kruise` reports `running`, the CloneSet is deployed.

Every Application that needs Kruise can carry the same first step, and Kruise is installed and upgraded in one place.

## Apply resources in the workflow before the components

When the shared resources belong to one Application, such as the PVC and ConfigMap its pods mount, create them in the same Application's workflow with `apply-object` steps before the `deploy` step. You don't need a component definition for each resource: `apply-object` takes any Kubernetes object as it is.

In this Application, the first component writes a line a second to a file on the PVC, and the second reads the file back. Both also mount the ConfigMap:

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
        volumeMounts:
          pvc:
            - name: my-pvc
              mountPath: /test-pvc
              claimName: my-claim
          configMap:
            - name: my-configmap
              mountPath: /test-cm
              cmName: my-cm
              items:
                - key: test-key
                  path: test-key
    - name: log-read-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - /bin/sh
          - -c
          - 'tail -n+1 -f /test-pvc/date.log'
        volumeMounts:
          pvc:
            - name: my-pvc
              mountPath: /test-pvc
              claimName: my-claim
          configMap:
            - name: my-configmap
              mountPath: /test-cm
              cmName: my-cm
              items:
                - key: test-key
                  path: test-key
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
        type: deploy
```

Set `storageClassName` to one your cluster has (`kubectl get storageclass`). A `ReadWriteOnce` volume is shared by both pods only while they run on the same node; on a cluster with several nodes, use a storage class that supports `ReadWriteMany`.

Check the PVC and ConfigMap were created along with the workloads:

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

Check the workflow ran the two `apply-object` steps before `deploy-comp`:

```shell
vela status server-with-pvc-and-cm
```

<details>
<summary>Expected Outcome</summary>

```console
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

The reader shows the lines the writer puts on the shared volume:

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
...
```
</details>

## Clean up

The resources from `apply-object` steps are tracked with the Application's own, so deleting the Application removes them too:

```shell
vela delete server-with-pvc-and-cm
vela delete web-cloneset
```

Delete `kruise` last, once no Application uses a `CloneSet`:

```shell
vela delete kruise -n vela-system
```
