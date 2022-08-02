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

[Helm chart 仓库](https://helm.sh/docs/topics/chart_repository/) 可以用来存储插件，并带有版本管理。 [ChartMuseum](https://chartmuseum.com/) 是一个开源的容易部署的 Helm Chart 仓库服务器。  
在这个教程中，我们将使用 [ChartMuseum](https://chartmuseum.com/) 来构建我们的仓库。假如你已经有这样一个仓库，不用担心，除了你不能使用 `vela addon push` 命令和需要手动更新你的插件， 你依然可以遵循以下步骤。  
注：你也可以使用兼容 ChartMuseum 的 registry （例如 Harbor ），它们都具有同样的功能。
### 使用 ChartMuseum 创建插件 registry

KubeVela 已经提供了 ChartMuseum 插件，你可以手动创建你自己的 ChartMuseum 实例或者使用 KubeVela 的插件。 要使用该插件，运行：

```shell
$ vela addon enable chartmuseum
```

> 如果要自定义插件的参数，任选其一:
> - 使用 VelaUX 并且在启用插件时填写相应的参数
> - 或者查看通过命令 `vela addon status chartmuseum -v` 查看可用的参数，并通过命令 `vela addon enable chartmuseum externalPort=80` 来指定相应的参数。
>
> 在这个教程中将假设你使用默认的参数。

在成功安装插件之后，为了保证你能够访问 ChartMuseum ，我们将转发默认端口（8080）：

```shell
vela port-forward -n vela-system addon-chartmuseum 8080:8080 --address 0.0.0.0
```

> 一般来说，你可能需要配置 ingress（可以通过插件的参数来实现）来实现外界的访问。 

使用你刚刚创建的 ChartMuseum 仓库（或者其他  Helm Chart 仓库 ）作为插件 registry ，我们将其命名为 `localcm` :
```shell
$ vela addon registry add localcm --type helm --endpoint=http://localhost:8080 
# 假如需要提供用户名和密码，你可以用 --username 和 --password 来分别指定它们
```

你现在可以在列表中看到自建 registry 了：
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
> 你可以略过这一步。 假如你不想手动打包插件，我们将会自动为你完成这一步骤。

```shell
$ vela addon package sample-addon
# 你将看到名为 sample-addon-1.0.0.tgz 的包
```

推送你的插件 (`sample-addon`) 到你刚添加的 registry (`localcm`)：

```shell
# 请注意我们如何为你自动打包插件。
$ vela addon push sample-addon localcm
Pushing sample-addon-1.0.0.tgz to localcm(http://localhost:8080)... Done
# 假如你自己打包了，只需替换 `sample-addon` 为 `sample-addon-1.0.0.tgz`

# 除了 registry 名（见上 localcm ）， URL 也同样支持。
# 假如你使用 URL， 你甚至不需要将它添加为插件 registry。 

$ vela addon push sample-addon-1.0.0.tgz http://localhost:8080 -f
Pushing sample-addon-1.0.0.tgz to http://localhost:8080... Done
# 特别留意 `-f` 选项。
# 这是因为我们之前已经推送了相同的插件到同一个 registry。
# 我们需要使用 `-f` 来覆盖旧的。
```

> 更多高级的使用方法，请参考 `vela addon push -h`。  

现在 registry 里面已经有你的插件了！

```shell
$ vela addon list
NAME          REGISTRY   DESCRIPTION             AVAILABLE-VERSIONS  STATUS  
...
sample-addon  localcm    An addon for KubeVela.  [1.0.0]             disabled
```

## 在离线环境中同步插件到 ChartMuseum

就像 [*插件的离线安装*](../system-operation/enable-addon-offline) 里描述的，你可以从本地文件系统安装插件。但是有些插件中需要 Helm Chart ，那么你将需要为此构建 Chart 仓库，这部分内容将解决这一问题。你也可以学习到如何从 [addon catalog](https://github.com/kubevela/catalog) 同步插件到自建的 ChartMuseum 实例上，这样你可以直接从 registry 安装插件，而不用从本地文件系统来安装。
### 目标

- ChartMuseum 插件的离线安装
- 同步 addon catalog 到你的 ChartMuseum 实例
- 同步 Helm Chart 到你的 ChartMuseum 实例

### ChartMuseum 插件的离线安装

因为安装 ChartMuseum 插件的所需文件存储在 catalog 中，你需要先下载 [addon catalog](https://github.com/kubevela/catalog) ：

```shell
$ git clone --depth=1 https://github.com/kubevela/catalog
```
移动到 ChartMuseum 插件目录：

```shell
$ cd catalog/addons/chartmuseum
```
现在你需要想方设法同步 ChartMuseum 镜像到你的集群。例如，你可以预加载 ChartMuseum 镜像到你到集群中，或者同步 ChartMuseum 镜像到你的私有镜像仓库然后在插件中使用自定义镜像。
你可以这样找出 ChartMuseum 正在使用的默认镜像：

```shell
$ cat resources/parameter.cue | grep "image"
	// +usage=ChartMuseum image
	image: *"ghcr.io/helm/chartmuseum:v0.15.0" | string
# 在写这篇文章的此时，ChartMuseum 使用ghcr.io/helm/chartmuseum:v0.15.0 镜像
# 你需要下载这个镜像并同步到你的私有集群中。
```

使用你的自定义镜像来安装插件：

```shell
$ vela addon enable . image=your-private-repo.com/chartmuseum:v0.15.0
# 因为你已经在 chartmuseum/ 目录下，可以使用 `.`
```

现在 ChartMuseum 插件应该已经启用了。

### 同步 addon catalog 到你的 ChartMuseum 实例


在你继续之前，你必须保证你可以访问你的 ChartMuseum 实例。查看之前关于如何使用 ChartMuseum 作为插件 registry 的章节。我们假设你使用与之前部分的相同配置（也就是说，你可以通过访问名为 `localcm` registry 来访问它）。

在你刚刚克隆的仓库里，移动到 `catalog/addons`，你应该可以看到一系列社区认证的插件。  

你可以同步所有在 catalog 里面的插件到你的 ChartMuseum 实例并在你的私有环境里使用他们。我们将利用 `vela addon push` 打包这些插件并同步到 ChartMuseum 中。  

众所周知，我们可以使用以下命令推送单个插件到 ChartMuseum：

```shell
# 推送 chartmusem/ 到 localcm registry
vela addon push chartmuseum localcm
```

那么，我们可以利用一个循环来推送所有的插件到 ChartMuseum：

```shell
# 你的当前工作目录应为 catalog/addons
# 将 `localcm` 替换为你自己的 registry 名称
for i in *; do \
    vela addon push $i localcm -f; \
done;

Pushing cert-manager-1.7.1.tgz to localcm(http://10.2.1.4:8080)... Done
Pushing chartmuseum-4.0.0.tgz to localcm(http://10.2.1.4:8080)... Done
Pushing cloudshell-0.2.0.tgz to localcm(http://10.2.1.4:8080)... Done
...
```

恭喜，现在所有社区认证的插件都可以在你的 ChartMuseum 实例中使用了（用命令 `vela addon list` 来查看，并使用命令 `vela addon enable addon-name` 来安装它们）。同样地，你可以类似的方法来同步 `experimental` 的插件。
### 同步 Helm Charts 到你的 ChartMuseum 实例

当你需要安装内部使用了 Helm Chart 的插件，而你不能直接访问使用的 Chart 的时候，这个特别有用。  

我们这里将以 `dex` 插件为例，这个插件从 `dexidp` 中使用了名为 `dex` 的 Chart。 我们可以将这个 Chart 导入到我们的 ChartMuseum 的实例并修改 `dex` 插件来使用我们自己导入的 Chart。  

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
# 假如你的 helm 安装好了 cm-push 插件， 也可以使用 helm cm-push
```

现在你的 ChartMuseum 实例中已经有 `dex` 了。 是时候取使用它了：
修改  `template.yaml` 或者 `resources/` 目录下的 Helm component 来使用你自定义的 Chart：

```yaml
# dex addon 的 template.yaml
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
        # 把你的 ChartMuseum URL 填入这里
        url: "http://10.2.1.4:8080"
        repoType: helm
```

很好！在你安装 `dex` 插件时，它将尝试从你的 ChartMuseum 实例中拉取相应的 Chart 。（当然，你也应该使 Chart 中的镜像在你的私有集群中可用）