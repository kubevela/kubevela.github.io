---
title: 构建你的 Registry
---

插件 registry 可以用来发现和分发插件。 目前，KubeVela 支持两种类型的 registry：git 服务 和 helm 仓库。

## Git 作为 registry

Git 仓库下多级目录可以用作插件 registry。

Git 类型的 registry 目前支持 github, gitlab, gitee。

一个典型的插件 registry 类似于 [catalog](https://github.com/kubevela/catalog/tree/master/addons) 。 你可以克隆这个仓库到本地目录然后推到你自己的 git 仓库上。

```yaml
$ git clone https://github.com/kubevela/catalog/tree/master/addons
$ git remote add <repoName> <you git server address>
$ git push -u <repoName> master
```

假如你的仓库类型是 github，你可以用这个命令添加你的插件 registry。

```yaml
vela addon registry add my-repo --type git --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

计入你的仓库类习惯是 gitee, 你可以这样：

```yaml
vela addon registry add my-repo --type gitee --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

假如你的仓库类型是 gitlab, 你可以这样：

```yaml
vela addon registry add my-repo --type gitlab --gitRepoName=<repoName> --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

## Helm chart 仓库作为 registry

[Helm chart 仓库](https://helm.sh/docs/topics/chart_repository/) 可以用来存储打包的插件。

你可以根据以下的 [教程](https://helm.sh/docs/topics/chart_repository/#hosting-chart-repositories) 来建立你自己的 helm 仓库。

假如你已经有这样一个仓库， 你可以遵循以下的步骤打包插件并推送到 helm 仓库。

打包插件：

```yaml
$ vela addon package <addon-path>
```

使用 [helm cli](https://helm.sh/docs/intro/install/#helm) 将上一步产生的插件包推送到 helm 仓库。


```yaml
$ helm plugin install https://github.com/chartmuseum/helm-push
$ helm cm-push <addon-pacakge> <remote>
```

更多的信息可以参考 [chartmuseum docs](https://github.com/chartmuseum/helm-push) 。

然后你可以使用以下命令把这个仓库添加为插件 registry：

```yaml
vela addon registry add my-repo --type helm --endpoint=<URL>
```

假如你的 helm 仓库访问需要用户名和密码， 你可以用以下设置：

```yaml
vela addon registry add my-repo --type helm --endpoint=<URL> --username=<username> --password=<passwor>
```

Helm 仓库类型的插件 registry 可以存储插件的多个版本。不久的将来我们将支持 [chart-museum](https://chartmuseum.com/docs/) 插件，和提供更简单的方法去构建你自己带有版本控制插件 registry。