---
title: Application Version Control
---

import ApplicationRevisionArch from '@site/src/components/ApplicationRevisionArch';

## Introduction

Set the `app.oam.dev/publishVersion` annotation when you want an Application to deploy only when you bump a version, and to be able to roll back to the last version that succeeded.

With the annotation set, you can:

| To | Run |
| --- | --- |
| Publish a new version | `vela up <app> --publish-version <version>` |
| See what changed since the last published version | `vela live-diff <app>` |
| Roll back to the last version that succeeded | `vela workflow rollback <app>` |
| Re-publish an older revision under a new version | `vela up <app> --revision <revision> --publish-version <version>` |

<ApplicationRevisionArch />

Every published version is stored as an ApplicationRevision: a snapshot of the Application and everything it depends on, such as its ComponentDefinitions, external Policies and referenced objects.

When you change the annotation to a new value, the Application gets a new revision, whether or not its spec or dependencies changed, and the workflow starts again from the beginning, terminating the run in progress. While the workflow runs, it reads everything from that revision, so changes to the Application spec or its dependencies have no effect until you publish another version.

## Use Guide

For example, start with an Application that deploys podinfo with an external Workflow and Policies.

:::tip
This example keeps its policies and workflow in separate objects; inline ones work the same way. See [Use policies and workflow outside the application](./policies/multi-cluster-reuse.md).
:::

Create the namespace:

```shell
kubectl create namespace examples
```

Save the following as `podinfo.yaml`. The Policies and the Workflow come first, because the Application is refused until the Workflow it references exists.

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: override-high-availability
  namespace: examples
type: override
properties:
  components:
    - type: webservice
      traits:
        - type: scaler
          properties:
            replicas: 3
---
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: topology-local
  namespace: examples
type: topology
properties:
  clusters: ["local"]
---
apiVersion: core.oam.dev/v1alpha1
kind: Workflow
metadata:
  name: make-release
  namespace: examples
steps:
  - name: deploy-local
    type: deploy
    properties:
      policies: ["topology-local", "override-high-availability"]
---
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo
  namespace: examples
  annotations:
    app.oam.dev/publishVersion: alpha1
spec:
  components:
    - name: podinfo
      type: webservice
      properties:
        image: stefanprodan/podinfo:6.0.1
  workflow:
    ref: make-release
```

Apply it:

```shell
kubectl apply -f podinfo.yaml
```

:::tip
To deliver to managed clusters instead, select them in the topology policy, for example by label:

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: topology-local
  namespace: examples
type: topology
properties:
  clusterLabelSelector:
    region: hangzhou
```

See [Multi-cluster Application Delivery](./policies/multi-cluster.md) for joining clusters and choosing where to deploy.
:::

Check the application status:

```shell
vela status podinfo -n examples
```

<details>
<summary>expected output</summary>

```
About:

  Name:         podinfo
  Namespace:    examples
  Created at:   2026-11-20 10:15:02 +0000 UTC
  Healthy:      ❌
  Details:      runningWorkflow

Workflow:

  mode: StepByStep-DAG
  finished: false
  Suspend: false
  Terminated: false
  Steps
  - id: auqaxnbix2
    name: deploy-local
    type: deploy
    phase: running 
    message: wait healthy

Services:

  - Name: podinfo  
    Cluster: local
    Namespace: examples
    Type: webservice
    Health: ❌
      Message: Ready:0/3
    Traits:
      Type: scaler
      Health: ✅
```
</details>

View the resources it created:

```shell
vela status podinfo -n examples --tree --detail
```

<details>
<summary>expected output</summary>

```
CLUSTER   NAMESPACE     RESOURCE           STATUS    APPLY_TIME          DETAIL
local ─── examples  ─── Deployment/podinfo updated   2026-11-20 10:15:03 Ready: 3/3  Up-to-date: 3  Available: 3  Age: 4m16s
```
</details>

After a while the workflow succeeds.

Now change the component image to one that doesn't exist, `stefanprodan/podinfo:6.0.xxx`, without changing the publish version:

```shell
kubectl patch application podinfo -n examples --type json \
  -p '[{"op": "replace", "path": "/spec/components/0/properties/image", "value": "stefanprodan/podinfo:6.0.xxx"}]'
```

The Deployment keeps the old image, because the workflow doesn't run again until you publish a new version:

```shell
kubectl get deployment podinfo -n examples -o jsonpath='{.spec.template.spec.containers[0].image}'
```

<details>
<summary>expected output</summary>

```
stefanprodan/podinfo:6.0.1
```
</details>

The spec has changed, but nothing is deployed until you publish a new version.

### Inspect Changes across Revisions

Run `vela live-diff` to see what differs from the last published revision:

```shell
vela live-diff podinfo -n examples
```

<details>
<summary>expected output</summary>

```yaml
* Application (podinfo) has been modified(*)
  apiVersion: core.oam.dev/v1beta1
  kind: Application
  metadata:
    annotations:
      app.oam.dev/publishVersion: alpha1
    name: podinfo
    namespace: examples
  spec:
    components:
    - name: podinfo
      properties:
-       image: stefanprodan/podinfo:6.0.1
+       image: stefanprodan/podinfo:6.0.xxx
      type: webservice
    workflow:
      ref: make-release
  status: {}
  
* External Policy (topology-local) has no change
* External Policy (override-high-availability) has no change
* External Workflow (make-release) has no change
```
</details>

The diff covers the Application spec and everything it depends on.

### Publish a new app with specified revision

There are two ways to publish a new version. Use either one.

1. Change the `publishVersion` annotation on the Application to `alpha2`, which starts the workflow again.
    ```yaml
    apiVersion: core.oam.dev/v1beta1
    kind: Application
    metadata:
      name: podinfo
      namespace: examples
      annotations:
    -   app.oam.dev/publishVersion: alpha1
    +   app.oam.dev/publishVersion: alpha2
    ...
    ```
2. Run `vela up <app> --publish-version <version>`:
    ```shell
    vela up podinfo -n examples --publish-version alpha2
    ```

The Application stays at `runningWorkflow`, because the Deployment can't finish its rollout with the invalid image.

List the revisions:

```shell
vela revision list podinfo -n examples
```

<details>
<summary>expected output</summary>

```
NAME            PUBLISH_VERSION SUCCEEDED       HASH                    BEGIN_TIME              STATUS          SIZE
podinfo-v1      alpha1          true            65844934c2d07288        2026-11-20 10:15:02     Succeeded       10.5 KiB (Compressed, 34%)
podinfo-v2      alpha2          false           44124fb1a5146a4d                                NotStart        10.5 KiB (Compressed, 34%)
```

A revision whose workflow is still running shows `NotStart` with no `BEGIN_TIME`: its workflow status is written to the revision when the run ends.
</details>

### Rollback to Last Successful Revision

Before rolling back, suspend the application's workflow:

```shell
vela workflow suspend podinfo -n examples
```

Then roll back. The workflow goes back to the last revision that succeeded, and the application's resources go back to that state:

```shell
vela workflow rollback podinfo -n examples
```

<details>
<summary>expected output</summary>

```
Find succeeded application revision podinfo-v1 (PublishVersion: alpha1) to rollback.
Application spec rollback successfully.
Application status rollback successfully.
Application outdated revision cleaned up.
```
</details>

Check the resources again; the Deployment is back on the valid image:

```shell
vela status podinfo -n examples --tree --detail --detail-format wide
```

<details>
<summary>expected output</summary>

```
CLUSTER   NAMESPACE     RESOURCE           STATUS    APPLY_TIME          DETAIL
local ─── examples  ─── Deployment/podinfo updated   2026-11-20 10:15:03 Ready: 3/3  Up-to-date: 3  Available: 3  Age: 17m  Containers: podinfo  Images: stefanprodan/podinfo:6.0.1  Selector: app.oam.dev/component=podinfo
```
</details>

### Re-publish a History Revision

A rollback goes straight back to the last state that succeeded. Re-publishing an old revision instead runs the whole workflow again, and can go back to any revision that is still kept.

For example, say you have two revisions that succeeded and a third still running:

```shell
vela revision list podinfo -n examples
```

<details>
<summary>expected output</summary>

```
NAME            PUBLISH_VERSION SUCCEEDED       HASH                    BEGIN_TIME              STATUS          SIZE
podinfo-v1      alpha1          true            65844934c2d07288        2026-11-20 10:45:19     Succeeded       10.5 KiB (Compressed, 34%)
podinfo-v2      alpha2          true            4acae1a66013283         2026-11-20 10:45:45     Succeeded       10.5 KiB (Compressed, 34%)
podinfo-v3      alpha3          false           44124fb1a5146a4d                                NotStart        10.5 KiB (Compressed, 34%)
```

</details>

To re-publish revision `podinfo-v1` under a new version:

```shell
vela up podinfo -n examples --revision podinfo-v1 --publish-version beta1
```

The Application takes the spec of that revision and runs the whole workflow again. It gets a new revision, identical to the one you named:

```
NAME            PUBLISH_VERSION SUCCEEDED       HASH                    BEGIN_TIME              STATUS          SIZE
podinfo-v2      alpha2          true            4acae1a66013283         2026-11-20 10:45:45     Succeeded       10.5 KiB (Compressed, 34%)
podinfo-v3      alpha3          false           44124fb1a5146a4d        2026-11-20 10:46:28     Failed          10.5 KiB (Compressed, 34%)
podinfo-v4      beta1           true            65844934c2d07288        2026-11-20 10:46:49     Succeeded       10.5 KiB (Compressed, 34%)
```

The *beta1* version has the same hash as *alpha1* in the earlier list. `podinfo-v1` itself is gone: old revisions are garbage collected, as the next section explains.

:::info
The KubeVela Helm chart keeps 2 unused revisions per Application, besides the one in use, and garbage collects older ones. Change it for the whole controller with the chart's `applicationRevisionLimit` value (the controller's `--application-revision-limit` [bootstrap parameter](../platform-engineers/system-operation/bootstrap-parameters.md)), or for one Application with the `applicationRevisionLimit` property of a [`garbage-collect` policy](./policies/gc.md).
:::
