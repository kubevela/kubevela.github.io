---
title: Performance Fine-tuning
---

### Recommended Configurations

When cluster scale becomes large and more applications are needed for managing, KubeVela controller performance might have bottleneck problems due to inappropriate parameters.

According to the KubeVela performance test, three sets of parameters are recommended in clusters with different scales as below.

| Scale  |  #Nodes |    #Apps |    #Pods | concurrent-reconciles | kube-api-qps | kube-api-burst |  CPU | Memory |
| :----: | ------: | -------: | -------: | --------------------: | :----------: | -------------: | ---: | -----: |
| Small  |   < 200 |  < 3,000 | < 18,000 |                     2 |     300      |            500 |  0.5 |    1Gi |
| Medium |   < 500 |  < 5,000 | < 30,000 |                     4 |     500      |            800 |    1 |    2Gi |
| Large  | < 1,000 | < 12,000 | < 72,000 |                     4 |     800      |          1,000 |    2 |    4Gi |

> The above configurations are based on medium size applications (each application contains 2~3 components and 5~6 resources). If the applications in your scenario are generally larger, e.g., containing 20 resources, then you could increase the application number accordingly to find the appropriate configuration and parameters.

### Fine-tuning Methods

You might encounter various performance bottlenecks. Read the following examples and try to find the proper solution for your problem.

1. Applications could be created. Its managed resources are available but indirect resources are not. For example, Deployments in webservice are successfully created but Pods are not. You could check kube-controller-manager and see if there is performance bottleneck problems with it.
2. Applications could be created. Its managed resources are not available and there is no rendering problem with the application. Check if apiserver has lots of requests waiting in queue. The mutating requests for managed resources might be blocked at apiserver.
3. Applications could be found in cluster but no status information could be displayed. If there is no problem with the application content, it might be caused by the KubeVela controller bottleneck, such as limiting requests to apiserver. Increase **kube-api-qps / kube-api-burst** and check if CPU is overloaded. If CPU is not overloaded, check if the thread number is below the number of CPU cores.
4. KubeVela Controller itself could crash frequently due to Out-Of-Memory. Increase the memory to solve it.

### Advanced Optimization

Although KubeVela has a bunch of capabilities, users might only use part of them. Some optimization techniques will harm part of the funcationalities but can help improve the performance of the others. For example, you might not need application rollback. Then you can turn off the ApplicationRevision to save the storage and computation. A list of optional optimization parameters are shown below. You can customize your KubeVela controller by setting some of them.

| Arg | Default | Explanation |
| :-- | :-----: | :---------- |
| optimize-cached-gvks |  | Types of resources to be cached. For example, --optimize-cached-gvks=Deployment.v1.apps,Job.v1.batch . If you have dedicated resources to be managed in your system, you can turn it on to improve performance. NOTE: this optimization only works for single-cluster. It will increase the memory cost of KubeVela controller. |
| optimize-resource-tracker-list-op | true | Optimize ResourceTracker List Op by adding index. This will increase the use of memory and accelerate the list operation of ResourceTracker. Default to enable it . If you want to reduce the memory use of KubeVela, you can switch it off. |
| optimize-controller-reconcile-loop-reduction | false | Optimize ApplicationController reconcile by reducing the number of loops to reconcile application. In detail, reconciles after finalizer patching and workflow finished will not return immediately but will continue running. If you do not care about the occasional re-run of workflow, you can switch it on to further improve KubeVela controller performance. |
| optimize-mark-with-prob | 0.1 | Optimize ResourceTracker GC by only run mark with probability. Side effect: outdated ResourceTracker might not be able to be removed immediately. Default to 0.1. If you want to cleanup outdated resource for keepLegacyResource mode immediately, set it to 1.0 to disable this optimization. |
| optimize-disable-component-revision | false | Optimize ComponentRevision by disabling the creation and gc. Side effect: rollout cannot be used. If you don't use rollout trait, you can switch it on to reduce the storage and improve performance. |
| optimize-disable-application-revision | false | Optimize ApplicationRevision by disabling the creation and gc. Side effect: application cannot rollback. If you don't need to rollback applications, you can switch it on to reduce the storage and improve performance. |
| optimize-disable-workflow-recorder | false | Optimize workflow recorder by disabling the creation and gc. Side effect: workflow will not record application after finished running. If you do not use VelaUX, you can switch it on to improve performance. |
| optimize-enable-in-memory-workflow-context | false | Optimize workflow by use in-memory context. Side effect: controller crash will lead to workflow run again from scratch and possible to cause mistakes in workflow inputs/outputs. You can use this optimization when you don't use input/output feature of workflow. |
| optimize-disable-resource-apply-double-check | false | Optimize workflow by ignoring resource double check after apply. Side effect: controller will not wait for resource creation. If you want to use KubeVela to dispatch tons of resources and do not need to double check the creation result, you can enable this optimization. |
| optimize-enable-resource-tracker-delete-only-trigger | true | Optimize resourcetracker by only trigger reconcile when resourcetracker is deleted. It is enabled by default. If you want to integrate KubeVela with your own operator or allow ResourceTracker manual edit, you can turn it off. |

> Read more details in [KubeVela Performance Test Report](/blog/2021/08/30/kubevela-performance-test)