# 插件：可观测性 Observability

可观测性插件（Observability addon）基于 metrics、logging、tracing 数据，可以为 KubeVela Core 提供系统级别的监控，也可以为应用提供业务级别的监控。
下面详细介绍如何启用可观测性插件，并且查看各种监控数据。

## 可观测能力介绍

KubeVela 可观测能力是通过 [Grafana](https://grafana.com/) 展示的，提议提供系统级别和应用级别的数据。

### KubeVela Core 系统级别可观测性

- KubeVela Core 资源使用情况监控

1）CPU、内存等使用量和使用率数据

![](../../resources/observability-system-level-summary-of-source-usages.png)

2）CPU、内存随着时间变化（如过去三小时）的使用量和使用率、已经每秒网络带宽的图形化展示

![](../../resources/observability-system-level-summary-of-source-usages-chart.png)

- KubeVela Core 日志监控

1）日志统计

可观测页面会显示KubeVela Core 日志总量，已经默认情况下，`error` 出现的数量、频率、出现的所有日志概览和详情。

![](../../resources/observability-system-level-logging-statistics.png)

还会展示随着时间变化，`error` 日志出现的总量、频率等。

![](../../resources/observability-system-level-logging-statistics2.png)

2）日志过滤

在最上方填写关键词，还可以过滤日志。

![](../../resources/observability-system-level-logging-search.png)

## 安装

可观测性插件是通过 `vela addon` 命令安装的，`vela addon` 的使用请参考 xxx 了解。因为本插件依赖了 Prometheus，Prometheus 依赖 StorageClass，
不同 Kubernetes 发行版，StorageClass 会有一定的差异，所以，在不同的 Kubernetes 发行版， 安装命令也有一些差异。

### 本地 Kubernetes 集群

如果您的 Kubernetes 集群是运行在本地，如 Kind 集群，执行如下命令安装可观测性插件。

```shell
$ vela addon enable observability
```

### 阿里云等 ACK Kubernetes 集群


```shell
$ vela addon enable observability -xxx=xxx
```

其中，各个参数代表：

...
