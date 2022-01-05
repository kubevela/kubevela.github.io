---
title: 访问部署的应用
description: 本页面介绍通过为应用分配网关策略，或设置应用的 Service 类型为 Loadbalancer 或 NodePort 实现应用的集群外访问。
---

本文介绍多种应用访问策略的设置方法，你可以根据基础设施条件选择应用合适访问方式。

## 开始之前

- 建议在 Kubernetes 集群中安装 Ingress 控制器，比如 [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/deploy/)。
