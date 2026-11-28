---
title: Deploy to Multiple Clusters
---

import MultiClusterSystem from '@site/src/components/MultiClusterSystem';
import MultiClusterWorkflow from '@site/src/components/MultiClusterWorkflow';

KubeVela deploys one Application to many clusters. You say where with a `topology` policy, and the workflow's `deploy` steps decide the order. This page covers deploying, choosing clusters and ordering the deploys. Two pages build on it:

* [Override Configuration per Cluster](./multi-cluster-override.md): a different image, replica count or trait in some clusters.
* [Reuse Policies and Workflows](./multi-cluster-reuse.md): share `topology` and `override` policies and workflows across Applications.

## Why multiple clusters

* **Scale.** One Kubernetes cluster tops out at around 5,000 nodes.
* **Availability.** A copy of the application in a second cluster keeps it running when one cluster fails.
* **Placement.** Regulation or latency can require an application to run in a particular region.

## Architecture

<MultiClusterSystem />

KubeVela reaches other clusters through [Cluster Gateway](https://github.com/oam-dev/cluster-gateway), which the KubeVela chart installs. By default it connects to each cluster with the kubeconfig stored as a Secret on the hub. For pull mode, use [Open Cluster Management](../../platform-engineers/system-operation/working-with-ocm.md).

The Application, its policies and its workflow all live on the hub cluster. Only the resources the components render (Deployments, Services and so on) are sent to the managed clusters.

<MultiClusterWorkflow />

Policies describe where resources go and how they are changed on the way. The workflow does the dispatching: each `deploy` step takes a set of policies, applies any overrides, and sends the resources to the clusters they select.

## Before you begin

You need clusters joined to the hub. Joining them is usually an operator's job; to do it yourself, see [Manage Clusters](../../platform-engineers/system-operation/managing-clusters.md).

The examples on this page assume these clusters:

```bash
$ vela cluster list
CLUSTER                 TYPE            ENDPOINT                ACCEPTED        LABELS
local                   Internal        -                       true
cluster-beijing         X509Certificate <ENDPOINT_BEIJING>      true
cluster-hangzhou-1      X509Certificate <ENDPOINT_HANGZHOU_1>   true
cluster-hangzhou-2      X509Certificate <ENDPOINT_HANGZHOU_2>   true
```

Some examples select clusters by label, so label the two hangzhou clusters:

```bash
vela cluster labels add cluster-hangzhou-1 region=hangzhou
vela cluster labels add cluster-hangzhou-2 region=hangzhou
```

The examples deploy into the `examples` namespace, so create it on the hub:

```bash
kubectl create namespace examples
```

:::note
The hub cluster that KubeVela runs on is registered as `local`. You can deploy to it like any managed cluster, but you can't detach or change it.
:::

## Deploy an application to clusters

List the clusters in a `topology` policy. This deploys an nginx webservice to both hangzhou clusters:

```bash
$ cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: basic-topology
  namespace: examples
spec:
  components:
    - name: nginx-basic
      type: webservice
      properties:
        image: nginx
      traits:
        - type: expose
          properties:
            port: [80]
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusters: ["cluster-hangzhou-1", "cluster-hangzhou-2"]
EOF
```

Check the result with `vela status`:

```bash
vela status basic-topology -n examples
```

<details>
<summary>expected output</summary>

```
About:

  Name:         basic-topology
  Namespace:    examples
  Created at:   2022-04-08 14:37:54 +0800 CST
  Status:       running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:3mvz5i8elj
    name:deploy-topology-hangzhou-clusters
    type:deploy
    phase:succeeded
    message:

Services:

  - Name: nginx-basic
    Cluster: cluster-hangzhou-1  Namespace: examples
    Type: webservice
    Healthy Ready:1/1
    Traits:
      ✅ expose
  - Name: nginx-basic
    Cluster: cluster-hangzhou-2  Namespace: examples
    Type: webservice
    Healthy Ready:1/1
    Traits:
      ✅ expose
```
</details>

With no workflow in the Application, KubeVela adds one `deploy` step per `topology` policy.

### Debug a multi-cluster application

These commands work on pods in the managed clusters from the hub, without switching kubeconfig context. When the application runs in more than one cluster, they ask which one you mean.

- `vela status` gives the overview shown above.
- `vela status --pod` lists the application's pods.
- `vela logs` shows pod logs.

```bash
$ vela logs basic-topology -n examples
? You have 2 deployed resources in your app. Please choose one: Cluster: cluster-hangzhou-1 | Namespace: examples | Kind: Deployment | Name: nginx-basic
+ nginx-basic-dfb6dcf8d-km5vk › nginx-basic
nginx-basic-dfb6dcf8d-km5vk nginx-basic 2022-04-08T06:38:10.540430392Z /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
nginx-basic-dfb6dcf8d-km5vk nginx-basic 2022-04-08T06:38:10.540742240Z /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
```

- `vela exec` runs a command in a pod.

```bash
$ vela exec basic-topology -n examples -it -- ls
? You have 2 deployed resources in your app. Please choose one: Cluster: cluster-hangzhou-1 | Namespace: examples | Kind: Deployment | Name: nginx-basic
bin   docker-entrypoint.d   home   media  proc  sbin  tmp
boot  docker-entrypoint.sh  lib    mnt    root  srv   usr
dev   etc                   lib64  opt    run   sys   var
```

- `vela port-forward` forwards a port of a pod or service to your machine.

```bash
$ vela port-forward basic-topology -n examples 8080:80
? You have 4 deployed resources in your app. Please choose one: Cluster: cluster-hangzhou-1 | Namespace: examples | Kind: Deployment | Name: nginx-basic
Forwarding from 127.0.0.1:8080 -> 80
Forwarding from [::1]:8080 -> 80

Forward successfully! Opening browser ...
Handling connection for 8080
```

## Choose the clusters

Naming clusters in `clusters` is the simplest way. To pick them by label instead, use `clusterLabelSelector`. This selects every cluster labelled `region=hangzhou`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: label-selector-topology
  namespace: examples
spec:
  components:
    - name: nginx-label-selector
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
```

To deploy to the hub itself, use the `local` cluster. Set `namespace` to deploy into a namespace other than the Application's:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: local-ns-topology
  namespace: examples
spec:
  components:
    - name: nginx-local-ns
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
```

:::tip
To keep every Application's resources in its own namespace, start the KubeVela controller with `--allow-cross-namespace-resource=false` (see [bootstrap parameters](../../platform-engineers/system-operation/bootstrap-parameters.md)).
:::

## Control the order of deploys

With several `topology` policies and no workflow, the components are deployed to each destination in the order the policies are listed.

To choose the order yourself, or to add a manual approval, write the `deploy` steps out. Here the `local` deploy runs first, and the hangzhou deploy waits for approval (`auto: false`):

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-workflowstep
  namespace: examples
spec:
  components:
    - name: nginx-deploy-workflowstep
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
  workflow:
    steps:
      - type: deploy
        name: deploy-local
        properties:
          policies: ["topology-local"]
      - type: deploy
        name: deploy-hangzhou
        properties:
          # require manual approval before running this step
          auto: false
          policies: ["topology-hangzhou-clusters"]
```

Approve the waiting step with `vela workflow resume deploy-workflowstep -n examples`.

To deploy to several destinations at once, list their policies in one `deploy` step:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-concurrently
  namespace: examples
spec:
  components:
    - name: nginx-deploy-concurrently
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
  workflow:
    steps:
      - type: deploy
        name: deploy-all
        properties:
          policies: ["topology-local", "topology-hangzhou-clusters"]
```

### Decide the next deploy from the last one

Workflow steps such as `read-object` can decide where to deploy next. This Application runs a `task` in the `default` namespace, reads the Job back, and runs the task in `prod` only once the first run has finished. The two [override policies](./multi-cluster-override.md) give each run its own annotation.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: staged-task
spec:
  components:
    - name: mytask
      type: task
      properties:
        image: bash
        count: 1
        cmd: ["echo",  "hello world"]
  policies:
    - name: target-default
      type: topology
      properties:
        clusters: ["local"]
        namespace: "default"
    - name: target-prod
      type: topology
      properties:
        clusters: ["local"]
        namespace: "prod"
    - name: override-annotations-1
      type: override
      properties:
        components:
          - type: task
            traits:
            - type: annotations
              properties:
                "description": "first run"
    - name: override-annotations-2
      type: override
      properties:
        components:
          - type: task
            traits:
            - type: annotations
              properties:
                "description": "second run"
  workflow:
    steps:
      - type: deploy
        name: deploy-01
        properties:
          policies: ["target-default", "override-annotations-1"]
      - name: read-object
        type: read-object
        outputs:
          - name: ready
            valueFrom: output.value.status["ready"]
        properties:
          apiVersion: batch/v1
          kind: Job
          name: mytask
          namespace: default
          cluster: local
      - type: deploy
        name: deploy-02
        inputs:
          - from: ready
        if: inputs["ready"] == 0
        properties:
          policies: ["target-prod", "override-annotations-2"]
```

`deploy-01` waits until the Job has succeeded, so its pods have finished and `status.ready` reads 0. `deploy-02` checks that before running the task in `prod`. Create the `prod` namespace first (`kubectl create namespace prod`).

## Older multi-cluster applications

The `env-binding` policy and `deploy2env` workflow step from KubeVela v1.2 are deprecated but still installed, so existing Applications that use them keep working. Use `topology` and `override` policies with the `deploy` step for new applications.
