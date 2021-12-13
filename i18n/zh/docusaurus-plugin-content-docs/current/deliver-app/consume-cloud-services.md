---
title:  交付云服务
---

> 准备工作：使用云服务需要先启用 Addon 里的对应的 terraform 组件，比如 AliCloud 启用 terraform-alibaba、AWS 启用 terraform-aws 和 Azure 启用 terraform-azure 等等。

在本小节中，我们会为大家演示如何交付一个 AliCloud 的 OSS。

首先我们打开 VelaUX Dashboard 的启动页面，选择左侧第四个选项卡 `Addon` ，点开 terraform-alibaba：

![dashboard](../resources/addon-cloud-service-deliver-app.jpg)

接着填入你的 ALICLOUD_ACCESS_KEY，ALICLOUD_REGION 和 ALICLOUD_SECRET_KEY 来 Enable 它。

> 注意：KubeVela 会加密存储以上所有的密钥信息，不用担心泄漏风险

开启成功后，让我们回到左侧第一个 `Application` 第一个选项卡，点击右上角的 `New Application` 开始创建应用：

![dashboard](../resources/dashboard.png)

然后选择你需要的 Name 和 Project 后，新建一个 `Type` 是 alibaba-oss 的应用：

![dashboard](../resources/oss-cloud-service-deliver-app.jpg)
