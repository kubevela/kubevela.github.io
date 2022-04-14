---
title:  Version Control
---

## Introduction

![overall-arch](../resources/application-revision-arch.jpg)

In KubeVela, ApplicationRevision keeps the snapshot of the application and all its runtime dependencies such as ComponentDefinition, external Policy or referred objects.
This revision can be used to review the application changes and rollback to past configurations.

In KubeVela v1.3, for application which uses the `PublishVersion` feature, we support viewing the history revisions, checking the differences across revisions, rolling back to the latest succeeded revision and re-publishing past revisions.

For application with the `app.oam.dev/publishVersion` annotation, the workflow runs are strictly controlled.
The annotation, which is noted as *publishVersion* in the following paragraphs, is used to identify a static version of the application and its dependencies.

When the annotation is updated to a new value, the application will generate a new revision no matter if the application spec or the dependencies are changed. 
It will then trigger a fresh new run of workflow after terminating the previous run.

During the running of workflow, all related data are retrieved from the ApplicationRevision, which means the changes to the application spec or the dependencies will not take effects until a newer `publishVerison` is annotated.

## Use Guide

Fo example, let's start with an application with external workflow and policies to deploy podinfo in managed clusters.

> For external workflow and policies, please refer to [Multi-cluster Application Delivery](../case-studies/multi-cluster) for more details.

```yaml
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
    ref: make-release-in-hangzhou
---
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
  name: topology-hangzhou-clusters
  namespace: examples
type: topology
properties:
  clusterLabelSelector:
    region: hangzhou
---
apiVersion: core.oam.dev/v1alpha1
kind: Workflow
metadata:
  name: make-release-in-hangzhou
  namespace: examples
steps:
  - name: deploy-hangzhou
    type: deploy
    properties:
      policies: ["topology-hangzhou-clusters", "override-high-availability"]
```

You can check the application status by running `vela status podinfo -n examples` and view all the related real-time resources by `vela status podinfo -n examples --tree --detail`.
```shell
$ vela status podinfo -n examples
vela status podinfo -n examples               
About:

  Name:         podinfo                      
  Namespace:    examples                     
  Created at:   2022-04-13 19:32:02 +0800 CST
  Status:       runningWorkflow              

Workflow:

  mode: DAG
  finished: false
  Suspend: false
  Terminated: false
  Steps
  - id:auqaxnbix2
    name:deploy-hangzhou
    type:deploy
    phase:running 
    message:wait healthy

Services:

  - Name: podinfo  
    Cluster: velad-003  Namespace: examples
    Type: webservice
    Unhealthy Ready:0/3
    Traits:
      ✅ scaler
  - Name: podinfo  
    Cluster: velad-002  Namespace: examples
    Type: webservice
    Unhealthy Ready:0/3
    Traits:
      ✅ scaler

$ vela status podinfo -n examples --tree --detail
CLUSTER       NAMESPACE     RESOURCE           STATUS    APPLY_TIME          DETAIL
hangzhou1 ─── examples  ─── Deployment/podinfo updated   2022-04-13 19:32:03 Ready: 3/3  Up-to-date: 3  Available: 3  Age: 4m16s
hangzhou2 ─── examples  ─── Deployment/podinfo updated   2022-04-13 19:32:03 Ready: 3/3  Up-to-date: 3  Available: 3  Age: 4m16s
```

This application should be successful after a while. 
Now if we edit the component image and set it to an invalid value, such as `stefanprodan/podinfo:6.0.xxx`. 
The application will not re-run the workflow to make this change take effect automatically.
But the application spec changes, it means the next workflow run will update the deployment image.

### Inspect Changes across Revisions

Now let's run `vela live-diff podinfo -n examples` to check this diff
```bash
$ vela live-diff podinfo -n examples
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
      ref: make-release-in-hangzhou
  status: {}
  
* External Policy (topology-hangzhou-clusters) has no change
* External Policy (override-high-availability) has no change
* External Workflow (make-release-in-hangzhou) has no change
```

We can see all the changes of the application spec and the dependencies. 
Now let's make this change take effects. 
There are two ways to make it take effects. You can choose any one of them.

1. Update the `publishVersion` annotation in the application to `alpha2` to trigger the re-run of workflow.
2. Run `vela up podinfo -n examples --publish-version alpha2` to publish the new version.

We will find the application stuck at `runningWorkflow` as the deployment cannot finish the update progress due to the invalid image.

Now we can run `vela revision list podinfo -n examples` to list all the available revisions.
```bash
$ vela revision list podinfo -n examples
NAME            PUBLISH_VERSION SUCCEEDED       HASH                    BEGIN_TIME              STATUS          SIZE    
podinfo-v1      alpha1          true            65844934c2d07288        2022-04-13 19:32:02     Succeeded       23.7 KiB
podinfo-v2      alpha2          false           44124fb1a5146a4d        2022-04-13 19:46:50     Executing       23.7 KiB
```

### Rollback to Last Successful Revision

Before rolling back, we need to suspend the workflow of the application first. Run `vela workflow suspend podinfo -n examples`. 
After the application workflow is suspended, run `vela workflow rollback podinfo -n examples`, the workflow will be rolled back and the application resources will restore to the succeeded state.
```shell
$ vela workflow suspend podinfo -n examples
Successfully suspend workflow: podinfo
$ vela workflow rollback podinfo -n examples
Find succeeded application revision podinfo-v1 (PublishVersion: alpha1) to rollback.
Application spec rollback successfully.
Application status rollback successfully.
Application rollback completed.
Application outdated revision cleaned up.
```

Now if we return back to see all the resources, we will find the resources have been turned back to use the valid image again.
```shell
$ vela status podinfo -n examples --tree --detail --detail-format wide
CLUSTER       NAMESPACE     RESOURCE           STATUS    APPLY_TIME          DETAIL
hangzhou1 ─── examples  ─── Deployment/podinfo updated   2022-04-13 19:32:03 Ready: 3/3  Up-to-date: 3  Available: 3  Age: 17m  Containers: podinfo  Images: stefanprodan/podinfo:6.0.1  Selector: app.oam.dev/component=podinfo
hangzhou2 ─── examples  ─── Deployment/podinfo updated   2022-04-13 19:32:03 Ready: 3/3  Up-to-date: 3  Available: 3  Age: 17m  Containers: podinfo  Images: stefanprodan/podinfo:6.0.1  Selector: app.oam.dev/component=podinfo
```

### Re-publish a History Revision

> This feature is introduced after v1.3.1.


Rolling back revision allows you to directly go back to the latest successful state. An alternative way is to re-publish an old revision, which will re-run the workflow but can go back to any revision that is still available. 

For example, you might have 2 successful revisions available to use.
```shell
$ vela revision list podinfo -n examples
NAME            PUBLISH_VERSION SUCCEEDED       HASH                    BEGIN_TIME              STATUS          SIZE
podinfo-v1      alpha1          true            65844934c2d07288        2022-04-13 20:45:19     Succeeded       23.7 KiB
podinfo-v2      alpha2          true            4acae1a66013283         2022-04-13 20:45:45     Succeeded       23.7 KiB
podinfo-v3      alpha3          false           44124fb1a5146a4d        2022-04-13 20:46:28     Executing       23.7 KiB
```

Alternatively, you can directly use `vela up podinfo -n examples --revision podinfo-v1 --publish-version beta1` to re-publish the earliest version. This process will let the application to use the past revision and re-run the whole workflow. A new revision that is totally same with the specified one will be generated.

```shell
NAME            PUBLISH_VERSION SUCCEEDED       HASH                    BEGIN_TIME              STATUS          SIZE
podinfo-v1      alpha1          true            65844934c2d07288        2022-04-13 20:45:19     Succeeded       23.7 KiB
podinfo-v2      alpha2          true            4acae1a66013283         2022-04-13 20:45:45     Succeeded       23.7 KiB
podinfo-v3      alpha3          false           44124fb1a5146a4d        2022-04-13 20:46:28     Failed          23.7 KiB
podinfo-v4      beta1           true            65844934c2d07288        2022-04-13 20:46:49     Succeeded       23.7 KiB
```

You can find that the *beta1* version shares the same hash with *alpha1* version.

> By default, application will hold at most 10 revisions. If you want to modify this number, you can set it in the `--application-revision-limit` bootstrap parameter of KubeVela controller.