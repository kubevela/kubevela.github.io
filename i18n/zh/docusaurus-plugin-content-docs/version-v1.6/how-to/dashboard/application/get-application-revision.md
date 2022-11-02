---
title: 查看应用部署版本
description: 查看应用当前部署版本和历史部署版本。
---

应用每执行一次部署即可生成一个版本，通过应用 `Baseline Config` 视图下的 `Revisions` 页面展示应用的历史部署版本。

![app-revision](../../../resources/app-revisions.jpg)

通过 Webhook Trigger 触发部署的版本，如果携带了代码信息，版本号可与代码 Commit 信息进行关联。

### 下一步

* [通过 CLI 进行版本管理](../../../end-user/version-control)
* [回收应用实例](./recycle-environment)