---
title:  能力管理
---

在 KubeVela 中，开发者可以从任何包含 OAM 抽象文件的 GitHub 仓库中安装更多的能力（例如：新 component 类型或者 traits ）。我们将这些 GitHub 仓库称为 _Capability Centers_ 。

KubeVela 可以从这些仓库中自动发现 OAM 抽象文件，并且同步这些能力到我们的 KubeVela 平台中。

## 添加能力中心

新增能力中心到 KubeVela：

```bash
vela registry config my-center https://github.com/oam-dev/catalog/tree/master/registry
successfully sync 1/1 from my-center remote center
Successfully configured capability center my-center and sync from remote
```

现在，该能力中心 `my-center` 已经可以使用。

## 列出能力中心

你可以列出或者添加更多能力中心。

```bash
vela registry ls
NAME            URL                                                    
default         oss://registry.kubevela.net/                            
my-center       https://github.com/oam-dev/catalog/tree/master/registry 
```

## [可选] 删除能力中心

删除一个

```bash
vela registry remove my-center
```

## 列出所有可用的能力中心

列出某个中心所有可用的ComponentDefinition/TraitDefinition。

```bash
vela trait --discover --registry=my-center
vela comp --discover --registry=my-center
```

## 从能力中心安装能力

我们开始从 `my-center` 安装新 component `clonesetservice` 到你的 KubeVela 平台。

你可以先安装 OpenKruise 。

```shell
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.7.0/kruise-chart.tgz
```

从 `my-center` 中安装 `clonesetservice` component 。

```bash
vela comp get clonesetservice --registry=my-center
```