---
title: 构建你的 Registry
---

插件 registry 可以用来发现和分发插件。 目前，KubeVela 支持两种类型的 registry：git 服务 和 helm 仓库。

## Git 作为 registry

Git 仓库下多级目录可以用作插件 registry。

Git 类型的 registry 目前支持 Github, Gitlab, Gitee。

一个典型的插件 registry 类似于 [catalog](https://github.com/kubevela/catalog/tree/master/addons) 。 你可以克隆这个仓库到本地目录然后推到你自己的 git 仓库上。

```yaml
$ git clone https://github.com/kubevela/catalog/tree/master/addons
$ git remote add <repoName> <you git server address>
$ git push -u <repoName> master
```

假如你的仓库类型是 Github，你可以用这个命令添加你的插件 registry。

```yaml
vela addon registry add my-repo --type git --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

假如你的仓库类习惯是 Gitee, 你可以这样：

```yaml
vela addon registry add my-repo --type gitee --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

假如你的仓库类型是 Gitlab, 你可以这样：

```yaml
vela addon registry add my-repo --type gitlab --gitRepoName=<repoName> --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

## 构建和推送到定制的 Helm Chart 仓库

[Helm chart 仓库](https://helm.sh/docs/topics/chart_repository/) 可以用来存储打包的插件。 [ChartMuseum](https://chartmuseum.com/) 是一个开源的容易部署的 Helm Chart 仓库服务器。  
在这个教程中，我们将使用 [ChartMuseum](https://chartmuseum.com/) 来构建我们的仓库。假如你已经有这样一个仓库，不用担心。 你依然可以遵循以下步骤，除了你不能使用 `vela addon push` 命令和需要手动更新你的插件。  
请注意：你也可以使用兼容 ChartMuseum 的 registry, 例如（ Harbor ）。 他们都具体同样的功能。
### 使用 ChartMuseum 创建插件 registry

KubeVela已经有相应的 ChartMuseum 插件。 你可以创建你自己的 ChartMuseum 实例或者使用 KubeVela 的插件。 要使用它，运行：

```shell
$ vela addon enable chartmuseum
```

> 要自定义插件的参数, 可以:
> - 使用 VelaUX 和 当要安装插件时填写相应的参数表格
> - 或者查看通过命令 `vela addon status chartmuseum -v` 查看可用的参数，和通过命令 `vela addon enable chartmuseum externalPort=80` 来指定相应的参数。
>
> 在这个教程中将假设你使用默认的参数。

在成功安装插件之后，我们必须保证可以通过默认的端口转发（8080）的方式访问 ChartMuseum 。

```shell
vela port-forward -n vela-system addon-chartmuseum 8080:8080 --address 0.0.0.0
```

> 通常，你可能需要配置 ingress（可以通过插件的参数来实现）来实现外界的访问。 

使用你刚刚创建的 ChartMuseum 仓库（或者其他  Helm Chart 仓库 ）作为插件 registry。 我们将其命名为 `localcm` :
```shell
$ vela addon registry add localcm --type helm --endpoint=http://localhost:8080 
# 假如需要提供用户名和密码，你可以用 --username and --password 来分别指定它
```

你现在可以在列表中看到：
```shell
$ vela addon registry list
Name    	Type	URL                        
...
localcm 	helm	http://localhost:8080 
```

### 推送插件到你的 registry

> 请注意： 你需要升级 CLI 版本到 v1.5.0+ 来使用这个特性。

准备你的插件。 我们将在这里创建一个名为 `sample-addon` 的插件：

```shell
$ vela addon init sample-addon
# A conventional addon directory will be created
# ./sample-addon
# ├── definitions
# ├── metadata.yaml
# ├── readme.md
# ├── resources
# ├── schemas
# └── template.yaml
```

（可选）打包你的插件：
> 可以略过这一步。 假如你不想手动打包插件，我们可以为你完成这一步骤。

```shell
$ vela addon package sample-addon
# 你将看到名为 sample-addon-1.0.0.tgz 的包
```

推送你的插件 (`sample-addon`) 到你刚添加的 registry (`localcm`)：

```shell
# 请注意我们如何为你自动打包插件。
$ vela addon push sample-addon localcm
Pushing sample-addon-1.0.0.tgz to localcm(http://localhost:8080)... Done
# 假如你自己打包，仅仅替换 `sample-addon` 为 `sample-addon-1.0.0.tgz`

# 除了 registry 名（localcm， 就像我们之前创建的时候一样）， URLs 也同样支持。
# 假如你使用 URLs， 你甚至不需要将它添加为 addon registry。 

$ vela addon push sample-addon-1.0.0.tgz http://localhost:8080 -f
Pushing sample-addon-1.0.0.tgz to http://localhost:8080... Done
# 特别留意 `-f` 选项。
# 这是因为我们之前已经推送了相同插件到 registry。
# 我们需要使用 `-f` 来覆盖旧的。
```

> 更多高级的使用方法，请参考 `vela addon push -h`。  

现在registry 里面已经有你可用的插件了！

```shell
$ vela addon list
NAME          REGISTRY   DESCRIPTION             AVAILABLE-VERSIONS  STATUS  
...
sample-addon  localcm    An addon for KubeVela.  [1.0.0]             disabled
```

## 同步插件到 air-gapped 环境的 ChartMuseum

就像 [*Air-gapped Installation for Addon*](../system-operation/enable-addon-offline) 里描述的，你可以从本地的文件系统安装插件。但是有些插件需要 Helm Chart 的形式，你需要为此构建 Chart 仓库。这部分内容将解决这一问题。你也可以从 [addon catalog](https://github.com/kubevela/catalog) 学习如何同步插件到 ChartMuseum 实例上，因此你可以直接从 registry 安装插件，而不用从本地文件系统来安装。
### 目标

- ChartMuseum 插件的 Air-gapped 安装
- 同步插件目录到你的 ChartMuseum 实例
- 同步 Helm Charts 到你的 ChartMuseum 实例

### ChartMuseum 插件的 Air-gapped 安装

因为安装 ChartMuseum 插件的所有文件存储在 catalog 中，你需要先从 [addon catalog](https://github.com/kubevela/catalog) 下载：

```shell
$ git clone --depth=1 https://github.com/kubevela/catalog
```
移动到 ChartMuseum 插件目录：

```shell
$ cd catalog/addons/chartmuseum
```
现在你需要同步 ChartMuseum 镜像到你的集群。例如，你可以预加载原始的镜像到你到集群中或者同步镜像到你的私有镜像 registry然后使用自定义的镜像。
为了弄清楚 ChartMuseum 正在使用的默认镜像：

```shell
$ cat resources/parameter.cue | grep "image"
	// +usage=ChartMuseum image
	image: *"ghcr.io/helm/chartmuseum:v0.15.0" | string
# 在写这篇文章的此时，ChartMuseum 使用ghcr.io/helm/chartmuseum:v0.15.0 镜像
# 下载这个镜像到你的私有集群中。
```

使用你的自定义镜像来安装插件：

```shell
$ vela addon enable . image=your-private-repo.com/chartmuseum:v0.15.0
# 因为你已经在 chartmuseum/ 目录下，可以使用 `.`
```

现在 ChartMuseum 插件应该已经安装了。

### 同步插件目录到你的 ChartMuseum 实例


在你继续之前，你必须保证你可以访问你的 ChartMuseum 实例。查看之前关于如何使用插件 registry 的部分。我们假设你使用之前部分描述的相同配置（例如，你可以正常访问名为 `localcm` 的实例）。

在你刚刚克隆的仓库里，移动到 `catalog/addons`。 你应该可以看到社区验证过的一系列插件。  

你可以同步所有在 catalog 里面的插件到你的 ChartMuseum 实例和在你的私有环境里使用他们。我们可以使用命令 `vela addon push` 打包这些插件并同步到 ChartMuseum 中。  

据我们知道，我们可以使用以下命令推送单个插件到 ChartMuseum：

```shell
# 推送 chartmusem/ 到 localcm registry
vela addon push chartmuseum localcm
```

Therefore, we can use a loop to push all addons to ChartMuseum:

```shell
# 你的 PWD 应为 catalog/addons
# 将你自己的 registry 名替换 `localcm`。
for i in *; do \
    vela addon push $i localcm -f; \
done;

Pushing cert-manager-1.7.1.tgz to localcm(http://10.2.1.4:8080)... Done
Pushing chartmuseum-4.0.0.tgz to localcm(http://10.2.1.4:8080)... Done
Pushing cloudshell-0.2.0.tgz to localcm(http://10.2.1.4:8080)... Done
...
```

恭喜，现在所有社区验证的插件都可以在你的 ChartMuseum 实例中使用了（用命令 `vela addon list` 来查看，和使用命令 `vela addon enable addon-name` 来安装它们。同样你可以以同样的方来使用 `experimental` 的插件。
### 同步 Helm Charts 到你的 ChartMuseum 实例

当你需要安装 Helm Chart 形式的插件而你不能直接访问 Chart 的时候，这个特别有用。  

我们这里将以 `dex` 插件为例。这个插件是从 `dexidp` 使用名为 `dex` 的 Chart。 我们可以将这个 Chart 导入到我们的 ChartMuseum 的实例并修改 `dex` 插件来使用我们自定义的 Chart。  

查看 `template.yaml` 或者 `resources/` 目录来看看 `dex` 使用什么 Chart。  

你知道相应的 Chart 之后，拉取相应的 Chart：
```shell
# 添加仓库
$ helm repo add dexidp https://charts.dexidp.io
# 拉取相应的 Chart
$ helm pull dexidp/dex --version 0.6.5
# 你应该可以看到名为 `dex-0.6.5.tgz` 的包
```

Push the Chart to ChartMuseum:
推送 Chart 到 ChartMuseum
```shell
$ vela addon push dex-0.6.5.tgz localcm
# 假如你有安装好的 Helm 插件， 也可以使用 helm cm-push
```

现在你的 ChartMuseum 实例中已经有 `dex` 了。 是时候取使用它。
修改  `template.yaml` 或者 `resources/` 目录下的 Helm component 来使用你自定义的 Chart：

```yaml
# template.yaml of dex addon
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: dex
  namespace: vela-system
spec:
  components:
    - name: dex
      type: helm
      properties:
        chart: dex
        version: "0.6.5"
        # Put your ChartMuseum URL here
        url: "http://10.2.1.4:8080"
        repoType: helm
```

很好！在你安装插件之后，它旧尝试从你的 ChartMuseum 实例中拉取相应的 Chart 了。（你也可以考虑将 Chart 中的镜像变得本地可用）。