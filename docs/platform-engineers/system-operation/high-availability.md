---
title: High Availability Deploy
---

import HaDeploy from '@site/src/components/HaDeploy';

This page covers what to run, how many of each, and how big, when KubeVela runs real teams' Applications. The defaults in the `vela-core` chart are sized for trying KubeVela out: one replica of each component and a 20Mi memory request.

<HaDeploy />

:::note
Run the control plane on a highly available Kubernetes cluster first. KubeVela keeps its state in the Kubernetes API, so it is only as available as the API server it runs on.
:::

## What runs on the hub

| Component | Installed by | State | What stops when it is down |
| --- | --- | --- | --- |
| vela-core controller | `vela-core` chart | None of its own; everything lives in the Kubernetes API | Applications stop reconciling. Running workloads keep running. |
| vela-core admission webhooks | served by every vela-core replica | None | Every create or update of an Application, a definition and the other webhook-checked objects is refused. |
| cluster-gateway | `vela-core` chart, when `multicluster.enabled=true` (the default) | None | Deploys to managed clusters and status read back from them. The local cluster is unaffected. |
| VelaUX | `velaux` addon, optional | Its database (see [VelaUX](#velaux)) | The UI and its API. Applications keep reconciling. |

## KubeVela Core Controller

Run 2 or 3 replicas. One holds the leader lease and reconciles; the others take over within the lease period (15 seconds by default). Every replica serves the admission webhooks, so more replicas also keep Application writes working during a node drain. Replicas do not add reconcile capacity: for that, see [Controller sharding](./controller-sharding.md).

The webhooks matter more than they look. They are registered with `failurePolicy: Fail` (the chart's `admissionWebhooks.failurePolicy`), so while no vela-core replica is serving them, the API server refuses every Application create and update. A single replica means a node drain or a crash loop blocks every team's deploys until the pod is back.

Install with three replicas:

```shell
helm install --create-namespace -n vela-system kubevela kubevela/vela-core --set replicaCount=3 --wait
```

If KubeVela is already installed, change the release rather than the Deployment, so the next `helm upgrade` does not scale it back down:

```shell
helm upgrade -n vela-system kubevela kubevela/vela-core --reuse-values --set replicaCount=3 --wait
```

### Size the controller

The chart's default resources (`requests.memory: 20Mi`, `limits.memory: 1Gi`, `limits.cpu: 500m`) are for a trial install. A controller managing a few thousand Applications needs more, or it is OOM-killed and restarts in a loop.

The figures below come from the [Performance Fine-tuning](./performance-finetuning.md) test results, for Applications of 2 or 3 components and 5 or 6 resources each. The chart's defaults for `concurrentReconciles` (4), `kubeClient.qps` (400) and `kubeClient.burst` (600) are already at or above the Small row, so keep them there. The limits leave headroom over the tested figures.

| Scale | Applications | Helm values |
| --- | --- | --- |
| Small | < 3,000 | `--set resources.requests.cpu=500m --set resources.requests.memory=1Gi --set resources.limits.cpu=1 --set resources.limits.memory=2Gi` |
| Medium | < 5,000 | `--set kubeClient.qps=500 --set kubeClient.burst=800 --set resources.requests.cpu=1 --set resources.requests.memory=2Gi --set resources.limits.cpu=2 --set resources.limits.memory=4Gi` |
| Large | < 12,000 | `--set kubeClient.qps=800 --set kubeClient.burst=1000 --set resources.requests.cpu=2 --set resources.requests.memory=4Gi --set resources.limits.cpu=4 --set resources.limits.memory=8Gi` |

For example, three replicas sized for the Medium row:

```shell
helm upgrade -n vela-system kubevela kubevela/vela-core --reuse-values \
  --set replicaCount=3 \
  --set kubeClient.qps=500 --set kubeClient.burst=800 \
  --set resources.requests.cpu=1 --set resources.requests.memory=2Gi \
  --set resources.limits.cpu=2 --set resources.limits.memory=4Gi \
  --wait
```

A standby replica takes over the whole load when it wins the lease, so size every replica for the full load, not a share of it. Beyond the Large row, or when one leader cannot keep up however big it is, split the Applications across [controller shards](./controller-sharding.md). For the flags that trade features for speed, and the symptoms of each bottleneck, see [Performance Fine-tuning](./performance-finetuning.md).

### Survive node drains

The chart spreads vela-core replicas across nodes with a *preferred* pod anti-affinity, so the scheduler may still put two on one node, and it ships no PodDisruptionBudget. Add one, so a drain never takes every replica at once:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: kubevela-vela-core
  namespace: vela-system
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: vela-core
      app.kubernetes.io/instance: kubevela
```

The labels assume the release is named `kubevela`; use your release name in `app.kubernetes.io/instance`. To make the spread a hard rule instead of a preference, set the chart's `affinity` value to a `requiredDuringSchedulingIgnoredDuringExecution` pod anti-affinity on the same labels. That needs at least as many schedulable nodes as replicas.

## Cluster Gateway

cluster-gateway is stateless and installed with vela-core by default. vela-core sends every request for a managed cluster through it, so when it is down, deploys to managed clusters and their status stop; Applications on the local cluster carry on. Run more than one replica once you manage other clusters:

```shell
helm upgrade -n vela-system kubevela kubevela/vela-core --reuse-values \
  --set multicluster.clusterGateway.replicaCount=3 --wait
```

Its pods carry `app.kubernetes.io/name: vela-core-cluster-gateway`, so a PodDisruptionBudget like the one above, with that label and `app.kubernetes.io/instance: kubevela-cluster-gateway`, covers it too.

## VelaUX

VelaUX is an addon made of the UI and its API server, both stateless, plus a database. Pick the database with `dbType`:

| `dbType` | Where the data lives |
| --- | --- |
| `kubeapi` (default) | ConfigMaps in the `kubevela` namespace on the hub, so in the hub's etcd. |
| `mongodb`, `mysql`, `postgres` | An external database you run, reached through `dbURL`. |

`kubeapi` works with several replicas: every replica reads and writes through the Kubernetes API, and one of them, elected through a lease in `vela-system`, runs the background event worker. It needs nothing extra to run, and it is backed up with the hub's etcd. What it does not do well is scale: each record is a ConfigMap, and listing them gets slower as projects, Applications and workflow records pile up, while adding load to the hub's API server. For a production install with many teams, use an external database you can run highly available and back up on its own:

```shell
vela addon enable velaux dbType=mongodb dbURL=mongodb://<MONGODB_USER>:<MONGODB_PASSWORD>@<MONGODB_URL> replicas=3
```

See [Use an external database](/velaux/install#use-an-external-database) for the MySQL and PostgreSQL commands and how to create each database.

## Check it

See which vela-core replica holds the lease, then delete that pod and watch another one take it within about 15 seconds:

```shell
kubectl get lease kubevela -n vela-system -o jsonpath='{.spec.holderIdentity}{"\n"}'
kubectl get pods -n vela-system -l app.kubernetes.io/name=vela-core
```

`vela system diagnose` checks that each managed cluster answers through cluster-gateway, and that the hub's API server reaches cluster-gateway; see [System Info and Diagnose](./system-info-diagnose.md).
