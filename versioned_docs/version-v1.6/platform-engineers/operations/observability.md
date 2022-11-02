---
title: Automated Observability
---

Observability is critical for infrastructures and applications. Without observability system, it is hard to identify what happens when system broke down. On contrary, a strong observabilty system can not only provide confidences for operators but can also help developers quickly locate the performance bottleneck or the weak points inside the whole system.

To help users build their own observability system from scratch, KubeVela provides a list of addons, including

**Metrics**
- `prometheus-server`: A server records metrics in time series with flexible queries supported.
- `kube-state-metrics`: A metrics collector for the Kubernetes system.
- `node-exporter`: A metrics collector for the running Kubernetes nodes.

**Logging**
- `loki`: A logging server which stores collected logs of Kubernetes pods and provide query interfaces.

**Dashboard**
- `grafana`: A web application that provides analytics and interactive visualizations.

> More addons for alerting & tracing will be introduced in later versions.

## What's Next

- [**Installation**](./o11y/installation): Guide for how to install observability addons in your KubeVela system.

- [**Out of the Box**](./o11y/out-of-the-box): Guide for how to use pre-installed dashboards to monitor your system and applications.

- [**Metrics**](./o11y/metrics): Guide for customizing the process of collecting metrics for your application.

- [**Logging**](./o11y/logging): Guide for how to customize the log collecting rules for your application.

- [**Dashboard**](./o11y/dashboard): Guide for creating your customized dashboards for applications.

- [**Integration**](./o11y/integration): Guide for integrating your existing infrastructure to KubeVela, when you already have Prometheus or Grafana before installing addons.