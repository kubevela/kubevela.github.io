---
title: 管理插件包
---
你可以在 VelaUX 的 Addon 页面管理平台插件包，以获取更多的系统功能。

![alt](../../../resources/addon-list.jpg)

## 启用/停用插件包 (Enable/Disable Addon)

如下图所示，在某个插件包页面点击 `Enable` 启用一个插件包

![alt](../../../resources/addon.jpg)

如果某个插件需要依赖其他插件，只有当被依赖的的插件被启用之后，该插件才能被启用，如下图所示。

![alt](../../../resources/addon-dependency.jpg)

有些复杂的插件包需要设置一些参数才能启用，如下图所示。

![alt](../../../resources/addon-parameter.jpg)

通过点击插件页面的 `Disable` 停用一个插件

> 停用前请确认插件包对应的能力没有被任何应用所使用。

你也可以通过点击页面的 `Upgrade` 来更新插件包。

## 多集群环境中启用插件包

如果你的环境中添加了若干个子集群，启用插件时会在管控集群和所有子集群中均安装此插件包。但如果你的子集群在插件包启用之后，加入环境当中，则需要通过更新操作，让此插件包在子集群中生效。

## 插件包仓库 (Addon Registry)

插件包仓库是一个存储、发现和下载插件的地方。 插件包仓库的地址可以是一个 Git 仓库或者一个对象存储 Bucket。

KubeVela 社区在 Github 上维护了一个官方的[正式插件仓库](https://github.com/kubevela/catalog/tree/master/addons) 和一个[试验阶段插件仓库](https://github.com/kubevela/catalog/tree/master/experimental) 。

你也可以参考这两个仓库，自己定制一个插件仓库， 下图展示如何通过 VelaUX 来管理插件仓库，你可以在这里添加、更新或删除一个插件仓库。

![alt](../../../resources/addon-registry.jpg)

需要注意的是，KubeVela 默认没有添加试验性的插件仓库，但你可以通过点击 `Add Experimental Registry` 一键将它添加进来，并使用其中的插件。

