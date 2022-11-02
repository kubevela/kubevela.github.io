---
title: 性能调优
---

### 推荐配置

在集群规模变大，应用数量变多时，可能会因为 KubeVela 的控制器性能跟不上需求导致 KubeVela 系统内的应用运维出现问题，这可能是由于你的 KubeVela 控制器参数不当所致。

在 KubeVela 的性能测试中，KubeVela 团队验证了在各种不同规模的场景下 KubeVela 控制器的运维能力。并给出了以下的推荐配置：

| 规模  | 集群节点数 | 应用数量 | Pod 数量 | concurrent-reconciles | kube-api-qps | kube-api-burst |  CPU | Memory |
| :---: | ---------: | -------: | -------: | --------------------: | :----------: | -------------: | ---: | -----: |
|  小   |      < 200 |  < 3,000 | < 18,000 |                     2 |     300      |            500 |  0.5 |    1Gi |
|  中   |      < 500 |  < 5,000 | < 30,000 |                     4 |     500      |            800 |    1 |    2Gi |
|  大   |    < 1,000 | < 12,000 | < 72,000 |                     4 |     800      |          1,000 |    2 |    4Gi |

> 上述配置中，单一应用的规模应在 2～3 个组件，5～6 个资源左右。如果你的场景下，应用普遍较大，如单个应用需要对应 20 个资源，那么你可以按照比例相应提高各项配置。

### 调优方法

性能瓶颈出现时一般可能会有以下一些不同的表现：

1. 新创建的应用能够获取到，其直接关联资源获取得到，但间接关联资源获取不到。如应用内包含的 webservice 对应的 Deployment 成功创建，但 Pod 迟迟无法创建。这种情况一般和相应资源的控制器有关，比如 kube-controller-manager。可以排查相应控制器是否存在性能瓶颈或问题。
2. 新创建的应用能够获取到，关联资源无法获取，且应用渲染本身没有问题 ( 在应用的信息内没有出现渲染错误 )。检查 apiserver 内是否存在大量排队请求，这种场景有可能是由于分发的下属资源，如 Deployment 请求到了 apiserver，但由于先前的资源在 apiserver 处排队导致新请求无法及时处理。
3. 新创建的应用能够获取到，但是没有状态信息。这种情况如果应用本身的内容格式没有问题，有可能是由于 KubeVela 控制器出现瓶颈，如访问 apiserver 被限流，导致吞吐量跟不上请求的速率。可以通过提高 **kube-api-qps / kube-api-burst** 来解决。如果限流不存在问题，可以检查控制器所用的 CPU 资源是否已经用满；如果 CPU 过载。则可以通过提高控制器的 CPU 资源来解决。如果 CPU 资源未使用满，但始终保持在同一负载上，有可能是线程数小于所给 CPU 数量。
4. KubeVela 控制器本身由于内存不足频繁崩溃，可以通过给控制器提高内存量解决。

### 进阶优化

尽管 KubeVela 提供了很多有用功能，但每个用户可能只会使用其中的一小部分能力。有一些优化方法虽然会伤害到若干特定能力，但是能够优化 KubeVela 的整体效率。比如说，如果你不需要应用的回滚能力（总是向前更新），那么你可以通过关闭 ApplicationRevision 来节约存储和计算的开销。下表中列出了一系列在不同场景下可以使用的优化参数。你可以根据自己的场景定制 KubeVela 控制器。

| 参数 | 默认值 | 说明 |
| :-- | :-----: | :---------- |
| optimize-cached-gvks |  | 需要额外缓存的资源类型。例如 --optimize-cached-gvks=Deployment.v1.apps,Job.v1.batch 。如果在你的系统中 KubeVela 管控的资源类型主要集中在特定几种上，你可以将这些类型的资源加入缓存中来提高性能。注意：该优化会增加 KubeVela 控制器的内存使用量。 |
| optimize-resource-tracker-list-op | true | 通过增加索引优化 ResourceTracker 的 List 操作。略微增加内存使用量。 |
| optimize-controller-reconcile-loop-reduction | false | 通过压缩 KubeVela 的应用转移状态来减少调谐次数。具体来讲，在 patch finalizer 以及 workflow finished 之后，调谐会继续进行而不是立刻结束。开启该优化会在不必要的场景下偶尔重跑工作流。如果你并不需要确保工作流不会重复执行，可以选择开启该优化。 |
| optimize-mark-with-prob | 0.1 | 通过减少 ResourceTracker 对于 keepLegacyResource 模式下过期资源的扫描次数来优化 ResourceTracker 的资源回收。如果你不需要使用 keepLegacyResource 能力，该优化不会有任何影响。 |
| optimize-disable-component-revision | false | 通过关闭 ComponentRevision 减少存储和计算的开销。如果你不需要应用组件灰度更新的能力，可以选择开启该选项。 |
| optimize-disable-application-revision | false | 通过关闭 ApplicationRevision 减少存储和计算的开销。如果你不需要应用回滚能力，可以选择开启该选项。 |
| optimize-disable-workflow-recorder | false | 通过关闭工作流的历史记录来减少存储开销。如果你不需要使用 VelaUX 来查看工作流的历史记录，可以选择开启该选项。 |
| optimize-enable-in-memory-workflow-context | false | 将工作流的状态基存储在内存而不是 ConfigMap 中，降低存取延时。副作用是如果 KubeVela 控制器重启，尚未结束的工作流会重跑。如果你并不需要确保工作流不会重复执行，可以选择开启该优化。  |
| optimize-disable-resource-apply-double-check | false | 通过禁用资源创建后的二次确认来优化工作流。如果你使用的工作负载没有配置健康检查，同时不需要二次确认其创建，可以选择开启该优化。 |
| optimize-enable-resource-tracker-delete-only-trigger | true | 通过关闭 ResourceTracker 删除事件之外的事件接受来优化系统性能。 |

> 更多细节可以参考 [KubeVela 性能测试报告](/blog/2021/08/30/kubevela-performance-test)