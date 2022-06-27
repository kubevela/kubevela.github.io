---
title: Dex
---

这个插件为 VelaUX 提供了 Dex 登录

Dex 是一种身份服务，它使用 [OpenID Connect](https://openid.net/connect/) 来为其他应用程序登录提供身份验证能力。 Dex 通过 “[connectors](https://dexidp.io/docs/connectors/)” 充当其他身份提供者的门户。 这允许 Dex 将身份验证推迟到 LDAP 服务器、SAML 提供者或已建立的身份提供者（如 GitHub、Google 和 Active Directory）。 客户端只需编写一次与 Dex 交互的身份验证逻辑，然后 Dex 处理 给定后端的协议。

更多详情请参阅 [Dex 网站](https://dexidp.io/docs/)。

## 安装插件

```shell
$ vela addon enable dex
```

##  卸载插件

```shell
$ vela addon uninstall dex
```
