---
title: High Availability
description: Run more than one Cluster Gateway replica, with KubeVela or standalone, and what each replica keeps to itself.
---

The gateway holds no state of its own: every replica reads the same Secrets, and any replica can serve any request. Run more than one once other clusters depend on it, because every request to a member cluster goes through it.

## With KubeVela

```shell
helm upgrade kubevela kubevela/vela-core --namespace vela-system --reuse-values \
  --set multicluster.clusterGateway.replicaCount=3 --wait
```

The chart spreads the replicas across nodes where it can, and [High Availability Deploy](/docs/next/platform-engineers/system-operation/high-availability#cluster-gateway) shows a PodDisruptionBudget that covers them.

## Standalone

```shell
helm upgrade cluster-gateway ./cluster-gateway/charts/cluster-gateway --namespace cluster-gateway \
  --reuse-values --set replicas=3 --wait
```

## What each replica keeps

Each replica keeps its own Secret cache and its own cache of `Dynamic` credentials, so with three replicas a `Dynamic` command runs up to three times per expiry.
