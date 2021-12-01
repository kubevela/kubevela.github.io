---
title: 插件管理系统
---

插件管理系统用于管理和扩展 KubeVela 的平台功能。
用户可以通过 UI/CLI 交互界面来启用或停用插件，从而安装或卸载 KubeVela 平台的扩展功能。
插件通过插件注册中心来存储、发现、分发等。

KubeVela 社区在 Github 上维护了一个官方的 [插件注册中心](https://github.com/oam-dev/catalog/tree/master/addons) ，里面有一些官方维护的插件。
此外，用户还可以自行定制和添加插件注册中心。

## 插件注册中心 (Addon Registry)

插件注册中心是一个上传和存储、发现和下载插件的地方。
插件注册中心的地址可以是一个 Git 仓库或者一个对象存储 Bucket。
一个插件注册中心的模样可以参考这个 [官方例子](https://github.com/oam-dev/catalog/tree/master/addons) 。

你可以通过 UI/CLI 来管理插件注册中心。下图展示如何通过 UI 来添加一个注册中心：

![alt](../../resources/addon-registry.jpg)

## 启用/停用插件 (Enable/Disable Addon)

你可以通过 UI/CLI 获取插件注册中心的插件列表，并启用/停用某个插件。

下面例子是一个插件在 UI 上的展示图：

![alt](../../resources/addon.jpg)

如果某个插件需要依赖其他插件，只有当被依赖的的插件被启用之后，该插件才能被启用，如下图所示。

![alt](../../resources/addon-dependency.jpg)

有些复杂的插件需要设置一些参数才能启用，如下图所示。

![alt](../../resources/addon-parameter.jpg)
