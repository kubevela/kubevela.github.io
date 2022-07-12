---
title: 用容器镜像运行 vela 命令行
---

当前主题，用于描述如何利用 Docker 容器运行、配置 Vela 命令行工具，以及对其进行版本控制。有关更多使用 Docker 的信息，请参考 [Docker 官方文档](https://docs.docker.com/) 。

由 KubeVela 社区官方支持并维护的 Docker 镜像保障了隔离性、可移植性以及安全性。这种免安装的使用方式允许你在一个基于容器的环境中使用 KubeVela 的命令行工具。

## 前提条件

你必须已经安装好了 Docker 。 如果你不知道如何安装它，请参考 [Docker 安装文档](https://docs.docker.com/install/) 。

运行以下命令来确认 Docker 是否安装成功，确认你得到了以下输出。

```
docker --version
Docker version 20.10.13, build a224086
```

## 运行官方 KubeVela 命令行镜像

官方 KubeVela 命令行镜像托管于 DockerHub 镜像仓库 `oamdev/vela-cli` 中。当你首次运行 `docker run` 命令时，最新版本的镜像将会下载到你的计算机中。随后每次运行 `docker run` 命令时，将会使用你本地的镜像。

使用 `docker run` 命令来运行 KubeVela 命令行镜像。

```
$ docker run --rm -it -v ~/.kube:/root/.kube oamdev/vela-cli <command>
```

该命令的作用方式如下：

* `docker run --rm -it -v ~/.kube:/root/.kube oamdev/vela-cli` – 等价于直接执行 `vela`。每次你运行这个命令，Docker 将会利用你的 `oamdev/vela-cli` 镜像启动一个容器，并且执行你的 `vela` 命令。默认情况下，使用最新版本的 KubeVela 命令行镜像。

    例如，使用 docker 命令调用 `vela version`，你应该运行以下命令。
    ```
    $ docker run --rm -it -v ~/.kube:/root/.kube oamdev/vela-cli version
    CLI Version: master
    Core Version:
    GitRevision: git-1d823780
    GolangVersion: go1.17.10
    ```

* `--rm` – 指定该参数，将会在退出容器的同时删除它。

* `-it` – 指定该参数，将会打开一个伴随标准输入的伪TTY。这将允许你为运行中的 KubeVela 命令行容器提供输入，例如，使用 `vela port-forward` 命令。

* `-v ~/.kube:/root/.kube` - 指定该参数，将会把你环境中的 kube config 配置文件挂载到容器当中。Vela 命令行工具利用该配置文件与 Kubernetes 环境进行交互。

有关 `docker run` 命令的更多信息，请参考 [Docker 参考指引](https://docs.docker.com/engine/reference/run/) 。


## 缩写 Docker 命令

为了简化 Docker `vela` 命令，我们建议利用操作系统的一些能力，在 Linux 或 macOS 操作系统中创建 [symbolic link](https://www.linux.com/tutorials/understanding-linux-links/)(symlink) 或者 [alias](https://www.linux.com/tutorials/aliases-diy-shell-commands/)，在 Windows 系统中则使用 [doskey](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/doskey)。你可以使用以下命令创建一个 `vela` 别名。

```
alias vela='docker run --rm -it -v ~/.kube:/root/.kube oamdev/vela-cli'
```

在别名设置完成后，你可以像使用本地安装的 Vela 命令行一样使用容器中的命令行工具。

```
$ vela version
CLI Version: master
```

## 将 Vela 命令行与 Kubernetes 集成

在 KubeVela 命令行镜像的帮助下，你可以与 Kubernetes API 进行集成，比如，我们可以使用 Kubernetes Job 来安装插件：

```
apiVersion: batch/v1
kind: Job
metadata:
  namespace: vela-system
  name: install-addon
  labels:
    app: vela-cli
spec:
  ttlSecondsAfterFinished: 0
  template:
    metadata:
      name: install-addon
      labels:
        app: vela-cli
    spec:
      containers:
      - name: install
        image: oamdev/vela-cli:latest
        imagePullPolicy: IfNotPresent
        args:
          - addon
          - enable
          - velaux
      restartPolicy: OnFailure
      serviceAccountName: kubevela-vela-core
```

这里有一些前提：

* 所使用的服务账户（serviceaccount）需要具备足够的权限以访问和安装插件，最简单的实现方式是如例子中一样，使用和 vela-core 相同的服务账户。
* 所使用的命名空间需要与服务账户（serviceaccount）的命名空间一致。

你可以更改参数来安装其他插件，或者执行其他命令，它们共享同一个机制。

工作流应该如下：

1. 应用上面的 yaml 文件：

```
$ kubectl apply -f install-velaux.yaml
job.batch/install-addon created
```

2. 检测 job 对应的 pods 是否正常运行：

```
$ kubectl get pods -n vela-system -l app=vela-cli
NAMESPACE     NAME                                        READY   STATUS      RESTARTS   AGE
vela-system   install-addon-zg6lx                         1/1     Running     0          4s
```

3. 检查日志：

```
$ kubectl -n vela-system logs -f install-addon-zg6lx
I0525 05:47:25.788947       1 apply.go:107] "creating object" name="component-uischema-task" resource="/v1, Kind=ConfigMap"

...snip...

To check the initialized admin user name and password by:
    vela logs -n vela-system --name apiserver addon-velaux | grep "initialized admin username"
To open the dashboard directly by port-forward:
    vela port-forward -n vela-system addon-velaux 9082:80
Select "Cluster: local | Namespace: vela-system | Kind: Service | Name: velaux" from the prompt.
Please refer to https://kubevela.io/docs/reference/addons/velaux for more VelaUX addon installation and visiting method.
```

