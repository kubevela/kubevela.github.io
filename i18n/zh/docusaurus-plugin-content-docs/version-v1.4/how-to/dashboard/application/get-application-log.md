---
title: 查看应用运行日志
description: 通过查看应用的运行日志是排查故障的最直接方式。
---

## 通过 UI 查看应用日志

![pod log](https://static.kubevela.net/images/1.3/pod-log.jpg)

如上图所示，交付到 Kubernetes 集群的应用支持查询容器运行日志，切换到指定环境视图下，选择日志页面，即可通过组件/实例/容器的筛选查看对应的运行日志。

日志查询页面默认为每 5 秒自动刷新，查看最新的日志。若你的应用日志中没有时间信息，可点击 `Show timestamps` 展示日志记录时间。

## 通过 CLI 查看应用日志

```bash
$ vela logs <app_name> -n <namespace>
```

使用实际的应用名称，命名空间参数执行上述命令，在交互中选择你需要查询的工作负载即可查询应用日志。

### 下一步

* [暴露访问地址](./get-application-endpoint)