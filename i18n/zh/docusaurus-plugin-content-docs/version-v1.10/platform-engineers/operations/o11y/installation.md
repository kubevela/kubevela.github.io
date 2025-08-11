---
title: 安装可观测性插件
---

:::tip
如果你的 KubeVela 是多集群场景，请参阅下面的 [多集群安装](#多集群安装) 章节。
:::

## 快速开始

要启用插件套件，只需运行 `vela addon enable` 命令，如下所示。

1. 安装 kube-state-metrics 插件

```shell
vela addon enable kube-state-metrics
```

2. 安装 node-exporter 插件

```shell
vela addon enable node-exporter
```

3. 安装 prometheus-server

```shell
vela addon enable prometheus-server
```

4. 安装 loki 插件

```shell
vela addon enable loki
```

5. 安装 grafana 插件

```shell
vela addon enable grafana
```

6. 通过端口转发访问 grafana

```shell
kubectl port-forward svc/grafana -n o11y-system 8080:3000
```

现在在浏览器中访问 `http://localhost:8080` 就可以访问你的 grafana。 默认的用户名和密码分别是 `admin` 和 `kubevela`。

> 你可以通过在步骤 6 中添加 `adminUser=super-user adminPassword=PASSWORD` 参数来改变默认的 Grafana 用户名及密码。

安装完成后，你可以在 Grafana 上看到若干预置的监控大盘，它们可以帮助你查看整个系统及各个应用的运行状态。你可以参考 [监控大盘](./dashboard.md) 章节来了解这些预置监控大盘的详细信息。

![kubevela-application-dashboard](../../../resources/kubevela-application-dashboard.png)

:::caution
**资源**: 可观测性套件包括几个插件，它们需要一些计算资源才能正常工作。 集群的推荐安装资源是 2 核 + 4 Gi 内存。

**版本**: 安装所需的 KubeVela 版本（服务端控制器和客户端 CLI）**不低于** v1.5.0-beta.4。
:::

:::tip
**可观测插件套件**: 如果你想要通过一行命令来完成所有可观测性插件的安装，你可以使用 [WorkflowRun](https://github.com/kubevela/workflow) 来编排这些安装过程。它可以帮助你将复杂的安装流程代码化，并在各个系统中复用这个流程。
:::

## 多集群安装

如果你想在多集群场景中安装可观测性插件，请确保你的 Kubernetes 集群支持 LoadBalancer 服务并且可以相互访问。

默认情况下，`kube-state-metrics`、`node-exporter` 和 `prometheus-server` 的安装过程原生支持多集群（它们将自动安装到所有集群）。 但是要让控制平面上的 `grafana` 能够访问托管集群中的 prometheus-server，你需要使用以下命令来启用 `prometheus-server`。

```shell
vela addon enable prometheus-server thanos=true serviceType=LoadBalancer
```

这将安装 [thanos](https://github.com/thanos-io/thanos) sidecar 和 prometheus-server。 然后启用 grafana，你将能够看到聚合的 prometheus 指标。

你还可以使用以下命令选择要在哪个集群安装插件：

```shell
vela addon enable kube-state-metrics clusters=\{local,c2\}
```

对于 `loki` 插件，默认情况下日志存储集中在管控面上，日志采集器（[promtail](https://grafana.com/docs/loki/latest/clients/promtail/) 或者 [vector](https://vector.dev/)）的安装则是支持多集群的。你可以通过运行一下命令来将日志采集器安装在多集群中，并让这些采集器将收集到的日志存储在 `local` 集群的 Loki 服务中。

```shell
vela addon enable loki agent=vector serviceType=LoadBalancer
```

> 如果在安装插件后将新集群添加到控制平面，则需要重新启用插件才能使其生效。
