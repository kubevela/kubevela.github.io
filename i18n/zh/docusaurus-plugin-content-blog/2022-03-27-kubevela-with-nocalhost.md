---
title: KubeVela X Nocalhost
author: Tianxin Dong and Yicai Yu
author_title: KubeVela、Nocalhost 团队
author_url: https://github.com/oam-dev/kubevela
author_image_url: https://kubevela.io/img/logo.svg
tags: [ kubevela ]
description: ""
image: https://raw.githubusercontent.com/oam-dev/kubevela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

在云原生快速发展的当下，如何便捷地在 Kubernetes 集群中进行开发、调试及部署成了每位开发者都需要面对的问题。

当一个新应用需要开发上线时，我们希望本地 IDE 中调试的结果能和云端保持一致。同时，当新代码被推送至代码仓库中后，环境中的应用也同样可以实时更新，且这整个过程是稳定可靠的。

而借助 KubeVela 以及 Nocalhost，我们可以完成这样一种部署过程：

![alt](/img/nocalhost/0.png)

如图：通过 KubeVela 创建应用，将应用部署到测试环境后，暂停部署。使用 Nocalhost 在测试环境中对应用进行云端联调。调试完毕后，将调试完毕的代码推送到代码仓库，通过 KubeVela 进行 GitOps 部署，在测试环境进行验证后，再同步更新到生产环境。

在本文中，我们将介绍如何使用 KubeVela 及 Nocalhost 完成上述云端应用开发及上线的全过程。

## 什么是 KubeVela

KubeVela 是一个简单易用且高度可扩展的应用交付和管理平台，基于 Kubernetes 与 OAM 技术构建。其核心功能是让开发人员方便快捷地在 Kubernetes 上定义与交付现代微服务应用，而无需了解任何 Kubernetes 本身相关的细节。

KubeVela 提供了 VelaUX 功能让整个应用分发的过程可视化，使应用组装、分发、交付的流程变得更简单。在 UX 上，不仅可以便捷地通过页面及时了解整个交付链路状态，还可以通过配置触发器，使应用随着制品仓库的更新而更新。

## 什么是 Nocalhost

Nocalhost 是一个允许开发者直接在 Kubernetes 集群内开发应用的工具。

Nocalhost 的核心功能是：提供 Nocalhost IDE 插件（包括 VSCode 和 Jetbrains 插件），将远端的工作负载更改为开发模式。在开发模式下，容器的镜像将被替换为包含开发工具（例如 JDK、Go、Python 环境等）的开发镜像。当开发者在本地编写代码时，任何修改都会实时被同步到远端开发容器中，应用程序会立即更新（取决于应用的热加载机制或重新运行应用），开发容器将继承原始工作负载所有的声明式配置（ConfigMap、Secret、Volume、Env 等）。

Nocalhost 还提供： VSCode 和 Jetbrains IDE 一键 Debug 和 HotReload；在 IDE 内直接提供开发容器的终端，获得和本地开发一致的体验；提供基于 Namespace 隔离的开发空间和 Mesh 开发空间 。此外，Nocalhost 还提供了 Server 端帮助企业管理 Kubernetes 应用、开发者和开发空间，方便企业统一管理各类开发和测试环境。

在使用 Nocalhost 开发 Kubernetes 的应用过程中，免去了镜像构建，更新镜像版本，等待集群调度 Pod 的过程，把编码/测试/调试反馈循环(code/test/debug cycle)从分钟级别降低到了秒级别，大幅提升开发效率。

## 调试云端应用

我们以一个简单的前端应用为例，首先，我们通过 VelaUX 在测试环境中部署该应用。

> 关于如何开启 KubeVela 的 VelaUX 插件，请查看 ...

### 使用 VelaUX 部署云端应用

在 VelaUX 中创建一个环境，每个环境中可以有多个部署目标，我们以一个包含了测试部署目标以及生产部署目标的环境为例。

首先，创建两个部署目标，一个用于测试部署，一个用于生产部署。这里的部署目标会分别将资源下发到 local 集群的 test 以及 prod namespace 当中。你也可以通过 VelaUX 的集群管理功能，来添加新的集群用于部署。

![alt](/img/nocalhost/1.png)

创建完部署目标后，新建一个环境，环境中包含这两个部署目标。

![alt](/img/nocalhost/2.png)

创建完环境后，新建应用来进行云端调试。这个前端应用会在 80 端口暴露服务，因此，我们把这个应用的 80 端口打开。

![alt](/img/nocalhost/3.png)

创建完应用后，应用会默认带一个工作流，自动将应用部署到两个部署目标当中。但我们并不希望未经过调试的应用直接部署到生产目标中。因此，我们来编辑一下这个默认工作流：在部署到测试目标和生产目标中添加一个暂停步骤。

![alt](/img/nocalhost/4.png)

完成这些配置后，我们来为这个应用添加一个 Nocalhost 的 Trait，用于云端调试。
在这里，详细介绍一下 Nocalhost Trait 中的几个参数：

![alt](/img/nocalhost/5.png)

Command 分两种，Debug 和 Run。开发时在插件右键点击 Remote Debug、Remote Run 会在远端 Pod 中运行对应的命令，从而达到云端 Debug 的效果。在这里，我们使用的是前端应用，所以将命令设置为 yarn serve。 

![alt](/img/nocalhost/6.png)

![alt](/img/nocalhost/7.png)

这里的 Image 指的是调试镜像，Nocalhost 默认提供了五种语言的镜像（go/java/python/ruby/node），可以通过填写语言名来使用内置镜像，当然，也可以填写完整镜像名以使用自定义镜像。
开启 HotReload 意味着开启热加载功能，能够在修改代码后直接看到效果。PortForwad 会将云端应用的 80 端口转发到本地的 8080 端口。

![alt](/img/nocalhost/8.png)

在 Sync 部分，将 Type 设置为 sendReceive (双向同步)，或者设置为 send （单向发送）。 完成配置后，部署该应用。可以看到，应用在部署到测试目标之后，将自动暂停。

![alt](/img/nocalhost/9.png)

此时，打开 VSCode 或者 Jetbrains IDE 中的 Nocalhost 插件页面，可以在 test namespace 下看到我们已部署的应用，点击应用旁边的锤子按钮进入调试模式：

![alt](/img/nocalhost/10.png)

进入 Nocalhost 调试模式后，可以看到，IDE 中的终端已经被替换成了容器的终端。通过 ls 命令，可以看到容器内的所有文件。

![alt](/img/nocalhost/11.png)

此时，右键 Nocalhost 中的应用，可以选择进入 Remote Debug 或者 Remote Run 模式。这两个按键将自动执行我们之前配置的 Debug 和 Run 命令。

![alt](/img/nocalhost/12.png)

进入 Debug 模式后，可以看到，我们的云端应用被转发到了本地的 8080 端口：

![alt](/img/nocalhost/13.png)

打开本地浏览器，可以看到，目前我们部署的前端应用版本为 v1.0.0：

![alt](/img/nocalhost/14.png)

此时，我们可以在本地 IDE 中修改一下代码，将版本修改为 v2.0.0：

![alt](/img/nocalhost/15.png)

在之前的 Nocalhost 配置中，我们已经开启了热加载功能。因此，我们再次刷新一下本地的 8080 端口页面，可以看到，应用版本已经变成了 v2.0.0：

![alt](/img/nocalhost/16.png)

此时，我们可以终止 Nocalhost 的调试模式。由于在之前的 sync 设置中，我们设置了 syncReceive 模式（双向同步），所以当终止调试模式后，本地 IDE 中依旧是我们更新过的代码。此时，我们可以将这份已更新的代码推送至代码仓库中。

![alt](/img/nocalhost/17.png)

## 使用 GitOps 进行发布

在我们结束调试后，环境上的应用依旧是之前 v1.0.0 的版本。那么，该使用什么方式来更新环境中的应用呢？

在整个云端调试的过程中，我们修改的是源代码。因此，我们可以借助 GitOps 的模式，以代码作为更新来源，来完成对环境中应用的更新。

KubeVela 同时支持了 Pull 模式以及 Push 模式的 GitOps 发布，在此，我们以 Push 模式举例。

> 关于 Pull 模式的 GitOps 支持，可以查看这篇文章 ...

查看 VelaUX 中部署的应用，可以看到，每个应用都会拥有一个默认 Trigger：

![alt](/img/nocalhost/18.png)

点击 Manual Trigger 查看详情， 可以看到，VelaUX 为每个应用提供了一个 Webhook URL，请求该地址，并带上需要更新的字段（如：镜像等），可以方便快捷的完成应用的更新。（注：由于需要对外暴露地址，需要在部署 VelaUX 的时候使用 LoadBalancer 或者使用其他方式暴露 VelaUX 的服务）。

![alt](/img/nocalhost/19.png)

在 Curl Command 里，还提供了手动 Curl 该触发器的请求示例。我们来详细解析一下请求体：

```json
{
  // 必填，此次触发的更新信息
  "upgrade": {
    // Key 为应用的名称
    "<application-name>": {
      // 需要更新的值，这里的内容会被 Patch 更新到应用上
      "image": "<image-name>"
    }
  },
  // 可选，此次触发携带的代码信息
  "codeInfo": {
    "commit": "<commit-id>",
    "branch": "<branch>",
    "user": "<user>",
  }
}
```

upgrade 下是本次触发要携带的更新信息，在应用名下，是需要被 Patch 更新的值。默认推荐的是更新镜像 image，也可以扩展这里的字段来更新应用的其他属性。

codeInfo 中是代码信息，可以选择性地携带，比如提交 ID、分支、提交者等，一般这些值可以通过在 CI 系统中使用变量替换来指定。

当我们经过更新后的代码被合入代码仓库后，我们可以通过代码仓库中的 CI 配置来完成和 VelaUX Trigger 的对接。以 GitLab CI 为例，可以增加如下步骤：

```json
webhook-request:
  stage: request
  before_script:
    - apk add --update curl && rm -rf /var/cache/apk/*
  script:
    - |
      curl -X POST -H "Content-Type: application/json" -d '{"upgrade":{"'"$APP_NAME"'":{"image":"'"$BUILD_IMAGE"'"}},"codeInfo":{"user":"'"$CI_COMMIT_AUTHOR"'","commit":"'"$CI_COMMIT_SHA"'","branch":"'"$CI_COMMIT_BRANCH"'"}}' $WEBHOOK_URL
```

配置完成后，当代码被更新时，将自动触发该 CI，并且更新对应 VelaUX 中的应用。

![alt](/img/nocalhost/20.png)

当镜像被更新后，再次查看应用的页面，可以看到，已经变成了 v2.0.0 版本。
在测试部署目标中验证完毕后，我们可以点击应用工作流中的 Continue ，使最新版本的应用部署到生产部署目标中。

![alt](/img/nocalhost/21.png)

部署完毕后，查看生产环境中的应用，可以看到，生产环境中已经是最新的 v2.0.0 版本：

![alt](/img/nocalhost/22.png)

## 总结

使用 KubeVela + Nocalhost，不仅能够便捷地在开发环境中进行云端的联调测试，还能在测试完成后一键更新部署到生产环境，使整个开发上线过程稳定可靠。
