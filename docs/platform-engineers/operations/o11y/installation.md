---
title: Installation
---

:::tip
Before installing observability addons, we recommend you to start from the [introduction of the observability feature](../observability).
:::

## Quick Start

To enable the observability addons, you simply need to run the `vela addon enable` commands as below.

1. Install the kube-state-metrics addon

```shell
vela addon enable kube-state-metrics
```

2. Install the node-exporter addon

```shell
vela addon enable node-exporter
```

3. Install the prometheus-server addon

```shell
vela addon enable prometheus-server
```

4. Install the loki addon

```shell
vela addon enable loki
```

5. Install the grafana addon

```shell
vela addon enable grafana
```

6. Access your grafana through port-forward.

```shell
kubectl port-forward svc/grafana -n o11y-system 8080:3000
```

Now you can access your grafana by access `http://localhost:8080` in your browser. The default username and password are `admin` and `kubevela` respectively.

> You can change it by adding `adminUser=super-user adminPassword=PASSWORD` to step 6.

You will see several pre-installed dashboards and use them to view your system and applications. For more details of those pre-installed dashboards, see [Out-of-the-Box](./out-of-the-box) section.

![kubevela-application-dashboard](../../../resources/kubevela-application-dashboard.png)

:::caution
**Resource**: The observability suite includes several addons which requires some computation resources to work properly. The recommended installation resources for you cluster are 2 cores + 4 Gi memory.

**Version**: We recommend you to use KubeVela (>= v1.6.0) to use the observability addons. For version v1.5.0, logging is not supported.
:::

:::tip
**Addon Suite**: If you want to enable these addons in one command, you can use [WorkflowRun](https://github.com/kubevela/workflow) to orchestrate the install process. It allows you to manage the addon enable process as code and make it reusable across different systems.
:::

## Multi-cluster Installation

If you want to install observability addons in multi-cluster scenario, make sure your Kubernetes clusters support LoadBalancer service and are mutatually accessible.

By default, the installation process for `kube-state-metrics`, `node-exporter` and `prometheus-server` are natually multi-cluster supported (they will be automatically installed to all clusters). But to let your `grafana` on the control plane to be able to access prometheus-server in managed clusters, you need to use the following command to enable `prometheus-server`.

```shell
vela addon enable prometheus-server thanos=true serviceType=LoadBalancer
```

This will install [thanos](https://github.com/thanos-io/thanos) sidecar & query along with prometheus-server. Then enable grafana, you will be able to see aggregated prometheus metrics now.

You can also choose which clusters to install addons by using commands as below

```shell
vela addon enable kube-state-metrics clusters=\{local,c2\}
```

For `loki` addon, the storage is hosted on the hub control plane by default, and the agent ([promtail](https://grafana.com/docs/loki/latest/clients/promtail/) or [vector](https://vector.dev/)) installation is multi-cluster supported. You can run the following command to let multi-cluster agents to send logs to the loki service on the `local` cluster.

```shell
vela addon enable loki agent=vector serviceType=LoadBalancer
```

> If you add new clusters to your control plane after addons being installed, you need to re-enable the addon to let it take effect.
