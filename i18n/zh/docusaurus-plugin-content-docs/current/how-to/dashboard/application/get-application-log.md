---
title: 查看应用运行日志
description: 通过查看应用的运行日志是排查故障的最直接方式
---

![pod log](../../../resources/pod-log.jpg)

如上图所示，交付到 Kubernetes 集群的应用支持查询容器运行日志，通过展开实例信息，点击容器列表 Actions 列下的日志按钮，即可查询该容器的运行日志。

![pod log](../../../resources/log-show.jpg)

日志查询页面默认为每 5 秒自动刷新，查看最新的日志。若你的应用日志中没有时间信息，可点击 `Show timestamps` 展示日志记录时间。
