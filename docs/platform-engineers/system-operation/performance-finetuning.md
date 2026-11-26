---
title: Performance Fine-tuning
---

This page covers the controller settings that matter as your cluster and the number of Applications grow: how many Applications the controller reconciles at once, how fast it may talk to the API server, and how much CPU and memory it gets. Most of them are Helm values on the `vela-core` chart.

## Recommended configurations

The KubeVela performance test gives three sets of settings for clusters of different sizes.

| Scale  |  #Nodes |    #Apps |    #Pods | `--concurrent-reconciles` | `--kube-api-qps` | `--kube-api-burst` |  CPU | Memory |
| :----: | ------: | -------: | -------: | ------------------------: | ---------------: | -----------------: | ---: | -----: |
| Small  |   < 200 |  < 3,000 | < 18,000 |                         2 |              300 |                500 |  0.5 |    1Gi |
| Medium |   < 500 |  < 5,000 | < 30,000 |                         4 |              500 |                800 |    1 |    2Gi |
| Large  | < 1,000 | < 12,000 | < 72,000 |                         4 |              800 |              1,000 |    2 |    4Gi |

Each flag has a Helm value on the `vela-core` chart:

| Flag | Helm value | Chart default | Flag default (no chart) |
| :--- | :--------- | ------------: | ----------------------: |
| `--concurrent-reconciles` | `concurrentReconciles` | 4 | 4 |
| `--kube-api-qps` | `kubeClient.qps` | 400 | 50 |
| `--kube-api-burst` | `kubeClient.burst` | 600 | 100 |
| CPU | `resources.limits.cpu` | `500m` | |
| Memory | `resources.limits.memory` | `1Gi` | |

The chart defaults are already at or above the Small row for reconciles, QPS and burst, so on a small cluster leave them as they are: setting `kubeClient.qps: 300` from the table lowers the limit. For a Medium or Large cluster, set the values from the table when you install or upgrade:

```bash
helm upgrade --install kubevela kubevela/vela-core -n vela-system --reuse-values \
  --set concurrentReconciles=4 \
  --set kubeClient.qps=500 \
  --set kubeClient.burst=800 \
  --set resources.limits.cpu=1 \
  --set resources.limits.memory=2Gi
```

The numbers assume medium-sized Applications (2 or 3 components, 5 or 6 resources each). If your Applications are generally larger, for example 20 resources each, count each one as several Applications when you pick a row.

`--max-dispatch-concurrent` (default 10) caps how many resources one Application dispatches in parallel. The chart has no value for it; add it to the controller's `args` if you need to change it.

## Finding the bottleneck

Each symptom below names the panel that confirms it. The panels are on the dashboards from the `grafana` addon; see [Out of the box dashboards](../operations/o11y/out-of-the-box.md), and [Is the controller healthy?](../operations/o11y/out-of-the-box.md#is-the-controller-healthy) for reading the controller panels.

| Symptom | Confirm with | What to do |
| :------ | :----------- | :--------- |
| The Application's resources exist, but what they create doesn't. For example, the Deployment is there but its Pods are not. | The kube-controller-manager's own metrics; KubeVela is not involved past the Deployment. | Look at kube-controller-manager. |
| The Application renders without error, but its resources never appear. | [Kubernetes APIServer](../operations/o11y/out-of-the-box.md#kubernetes-apiserver) dashboard: requests queued at the API server. | The API server is the bottleneck, not KubeVela. |
| The Application exists but its status never fills in. | [KubeVela System](../operations/o11y/out-of-the-box.md#kubevela-system) dashboard: **ApplicationController Client Request Throughput** and **ApplicationController Client Request Average Time** show client-side rate limiting. | Raise `kubeClient.qps` and `kubeClient.burst`. If CPU is not saturated, raise `concurrentReconciles` too, keeping it below the number of CPU cores. |
| The controller queue keeps growing. | KubeVela System dashboard: **Controller Queue** and **Controller Queue Add Rate**. | Check CPU and memory, then move up a row in the table above. |
| The controller restarts with `OOMKilled`. | KubeVela System dashboard: **Computation Resource** section, memory at the limit. | Raise `resources.limits.memory`. |

## Advanced optimization

Some flags trade a feature for performance. If you don't use the feature, turning it off saves storage and work. For example, if you never roll back Applications, you can stop creating ApplicationRevisions.

| Flag | Helm value | Flag default | Explanation |
| :--- | :--------- | :----------: | :---------- |
| `--optimize-cached-gvks` | `optimize.cachedGvks` | | Types of resources to cache, for example `--optimize-cached-gvks=Deployment.v1.apps,Job.v1.batch`. Turn it on if your system manages a fixed set of resource types. It only works for a single cluster and increases the controller's memory use. |
| `--optimize-list-op` | none | `true` | Indexes ResourceTracker and ApplicationRevision list operations. It uses more memory and speeds up listing. Switch it off to reduce memory use. |
| `--optimize-mark-with-prob` | `optimize.markWithProb` | `0.1` | Runs the ResourceTracker GC mark step only with this probability, so an outdated ResourceTracker may not be removed straight away. Set it to `1.0` to clean up outdated resources in `keepLegacyResource` mode immediately. |
| `--optimize-disable-component-revision` | `optimize.disableComponentRevision` | `false` (chart: `true`) | Stops creating and collecting ComponentRevisions. The rollout trait needs them, so leave this off if you use rollout. |
| `--optimize-disable-application-revision` | `optimize.disableApplicationRevision` | `false` | Stops creating and collecting ApplicationRevisions. Applications can no longer be rolled back. |
| `--optimize-enable-in-memory-workflow-context` | `optimize.enableInMemoryWorkflowContext` | `false` | Keeps the workflow context in memory. If the controller crashes, running workflows start again from scratch, which can break step inputs and outputs. Use it only if your workflows don't use inputs and outputs. |
| `--optimize-disable-resource-apply-double-check` | `optimize.disableResourceApplyDoubleCheck` | `false` | Skips checking a resource after it is applied, so the controller does not wait for it to be created. Useful when you dispatch large numbers of resources and don't need the check. |
| `--optimize-enable-resource-tracker-delete-only-trigger` | `optimize.enableResourceTrackerDeleteOnlyTrigger` | `true` | Reconciles an Application on a ResourceTracker change only when the tracker is deleted. Turn it off if your own operator edits ResourceTrackers, or you edit them by hand. |

The controller does not start if it is given a flag it doesn't define, so check a flag's name against this table before you add it.

> Read more in the [KubeVela Performance Test Report](/blog/2021/08/30/kubevela-performance-test).
