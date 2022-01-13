---
title: 发布应用到新环境
description: 发布应用到新的环境
---

应用在创建时可以指定部署到 1 个或多个环境，如果应用已经创建，且在一个环境中已经调试完成，希望发不到其他环境，参考如下操作。

![bind-new-env](../../../resources/bind-new-env.jpg)

如上图所示，在应用管理页面，点击 `Bind Environment`，在弹窗中选择需要发布的环境。如果环境还没创建，可点击下方的 `Create new environment` 创建新的环境。

点击确认即完成绑定，`Baseline Config` 右侧环境选项区域出现新的环境，且在工作流管理页面将自动生成新环境的部署工作流。切换到新环境视图下点击 `Deploy` 即可将应用发布到该环境。
