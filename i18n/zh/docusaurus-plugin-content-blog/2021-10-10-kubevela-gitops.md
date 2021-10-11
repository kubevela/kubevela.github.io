---
title: 基于 KubeVela 的 GitOps 交付
author: Tianxin Dong
author_title: KubeVela 团队
author_url: https://github.com/oam-dev/kubevela
author_image_url: https://kubevela.io/img/logo.svg
tags: [ kubevela ]
description: ""
image: https://raw.githubusercontent.com/oam-dev/kubevela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

KubeVela 作为一个简单、易用、且高可扩展的云原生应用管理工具，能让开发人员方便快捷地在 Kubernetes 上定义与交付现代微服务应用，无需了解任何 Kubernetes 基础设施相关的细节。

KubeVela 背后的 OAM 模型天然解决了应用构建过程中对复杂资源的组合、编排等管理问题，同时也将后期的运维策略模型化，这意味着 KubeVela 可以结合 GitOps 管理复杂大规模应用，收敛团队与系统规模变大以后的系统复杂度问题。

## 什么是 GitOps

GitOps 是一种现代化的持续交付手段，它的核心思想是：在拥有一个包含环境基础设施及各种应用配置的 Git 仓库中，配合一个自动化过程————使得每次仓库被更新后，自动化过程都能逐渐将环境更新到最新配置。

这样的方式允许开发人员通过直接更改 Git 仓库中的代码和配置来自动部署应用，使用 GitOps 的好处有很多，如：
- 提高生产效率。通过自动的持续部署能够加快平均部署时间，增加开发效率。
- 降低开发人员部署的门槛。通过推送代码而非容器配置，开发人员可以不需要了解 Kubernetes 的内部实现，便可以轻易部署。
- 使变更记录可追踪。通过 Git 来管理集群，可以使每一次更改都可追踪，加强了审计跟踪。
- 可通过 Git 的回滚/分支功能来恢复集群。

## KubeVela 与 GitOps

KubeVela 作为一个声明式的应用交付控制平面，天然就可以以 GitOps 的方式进行使用，并且这样做会在 GitOps 的基础上为用户提供更多的益处和端到端的体验，包括：
- 应用交付工作流（CD 流水线）
  - 即：KubeVela 支持在 GitOps 模式中描述过程式的应用交付，而不只是简单的声明终态；
- 处理部署过程中的各种依赖关系和拓扑结构；
- 在现有各种 GitOps 工具的语义之上提供统一的上层抽象，简化应用交付与管理过程；
- 统一进行云服务的声明、部署和服务绑定；
- 提供开箱即用的交付策略（金丝雀、蓝绿发布等）；
- 提供开箱即用的混合云/多云部署策略（放置规则、集群过滤规则等）；
- 在多环境交付中提供 Kustomize 风格的 Patch 来描述部署差异，而无需学习任何 Kustomize 本身的细节；
- …… 以及更多。

在本文中，我们主要讲解直接使用 KubeVela 在 GitOps 模式下进行交付的步骤。

## GitOps 工作流

GitOps 工作流分为 CI 和 CD 两个部分：

* CI（Continuous Integration）：持续集成对业务代码进行代码构建、构建镜像并推送至镜像仓库。目前有许多成熟的 CI 工具：如开源项目常用的 GitHub Action、Travis 等，以及企业中常用的 Jenkins、Tekton 等。在本文中，我们使用 GitHub Action 来完成 CI 这一步，你也可以使用别的 CI 工具来代替此步，KubeVela 围绕 GitOps 可以对接任意工具下的 CI 流程。
* CD（Continuous Delivery）：持续部署会自动更新集群中的配置，如将镜像仓库中的最新镜像更新到集群中。
  * 目前主要有两种方案的 CD：
    * Push-Based：Push 模式的 CD 主要是通过配置 CI 流水线来完成的，这种方式需要将集群的访问秘钥共享给 CI，从而使得 CI 流水线能够通过命令将更改推送到集群中。这种方式的集成可以参考我们之前发表的博客：[使用 Jenkins + KubeVela 完成应用的持续交付](/blog/2021/09/02/kubevela-jenkins-cicd)。
    * Pull-Based：Pull 模式的 CD 会在集群中监听仓库（代码仓库或者配置仓库）的变化，并且将这些变化同步到集群中。这种方式与 Push 模式相比，由集群主动拉取更新，从而避免了秘钥暴露的问题。这也是本文介绍的核心内容。

交付的面向人员有以下两种，我们将分别介绍：

1. 面向平台管理员/运维人员的基础设施交付，用户可以通过直接更新仓库中的配置文件，从而更新集群中的基础设施配置，如系统的依赖软件、安全策略、存储、网络等基础设施配置。
2. 面向终端开发者的交付，用户的代码一旦合并到应用代码仓库，就自动化触发集群中应用的更新，可以更高效的完成应用的迭代，与 KubeVela 的灰度发布、流量调拨、多集群部署等功能结合可以形成更为强大的自动化发布能力。

## 面向平台管理员/运维人员的交付

如图所示，对于平台管理员/运维人员而言，他们并不需要关心应用的代码，所以只需要准备一个 Git 配置仓库并部署 KubeVela 配置文件，后续对于应用及基础设施的配置变动，便可通过直接更新 Git 配置仓库来完成，使得每一次配置变更可追踪。

![alt](/img/gitops/ops-flow.jpg)

### 准备配置仓库

> 具体的配置可参考 [示例仓库](https://github.com/oam-dev/samples/tree/master/9.GitOps_Demo/for-SREs)。

在本例中，我们将部署一个 MySQL 数据库软件作为项目的基础设施，同时部署一个业务应用，使用这个数据库。配置仓库的目录结构如下:

* `clusters/` 中包含集群中的 KubeVela GitOps 配置，用户需要将 `clusters/` 中的文件手动部署到集群中。这个是一次性的管控操作，执行完成后，KubeVela 便能自动监听配置仓库中的文件变动且自动更新集群中的配置。其中，`clusters/apps.yaml` 将监听 `apps/` 下所有应用的变化，`clusters/infra.yaml` 将监听 `infrastructure/` 下所有基础设施的变化。
* `apps/` 目录中包含业务应用的所有配置，在本例中为一个使用数据库的业务应用。
* `infrastructure/` 中包含一些基础设施相关的配置和策略，在本例中为 MySQL 数据库。


```shell
├── apps
│   └── my-app.yaml
├── clusters
│   ├── apps.yaml
│   └── infra.yaml
└── infrastructure
    └── mysql.yaml
```

> KubeVela 建议使用如上的目录结构管理你的 GitOps 仓库。`clusters/` 中存放相关的 KubeVela GitOps 配置并需要被手动部署到集群中，`apps/` 和 `infrastructure/` 中分别存放你的应用和基础设施配置。通过把应用和基础配置分开，能够更为合理的管理你的部署环境，隔离应用的变动影响。

#### `clusters/` 目录

首先，我们来看下 clusters 目录，这也是 KubeVela 对接 GitOps 的初始化操作配置目录。

以 `clusters/infra.yaml` 为例：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: infra
spec:
  components:
  - name: database-config
    type: kustomize
    properties:
      repoType: git
      # 将此处替换成你需要监听的 git 配置仓库地址
      url: https://github.com/FogDong/KubeVela-GitOps-Infra-Demo
      # 如果是私有仓库，还需要关联 git secret
      # secretRef: git-secret
      # 自动拉取配置的时间间隔，由于基础设施的变动性较小，此处设置为十分钟
      pullInterval: 10m
      git:
        # 监听变动的分支
        branch: main
      # 监听变动的路径，指向仓库中 infrastructure 目录下的文件
      path: ./infrastructure
```

`apps.yaml` 与 `infra.yaml` 几乎保持一致，只不过监听的文件目录有所区别。
在 `apps.yaml` 中，`properties.path` 的值将改为 `./apps`，表明监听 `apps/` 目录下的文件变动。

cluster 文件夹中的 GitOps 管控配置文件需要在初始化的时候一次性手动部署到集群中，在此之后 KubeVela 将自动监听 `apps/` 以及 `infrastructure/` 目录下的配置文件并定期更新同步。

#### `apps/` 目录

`apps/` 目录中存放着应用配置文件，这是一个配置了数据库信息以及 Ingress 的简单应用。该应用将连接到一个 MySQL 数据库，并简单地启动服务。在默认的服务路径下，会显示当前版本号。在 `/db` 路径下，会列出当前数据库中的信息。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
  namespace: default
spec:
  components:
    - name: my-server
      type: webservice
      properties:
        image: ghcr.io/fogdong/test-fog:master-cba5605f-1632714412
        port: 8088
        env:
          - name: DB_HOST
            value: mysql-cluster-mysql.default.svc.cluster.local:3306
          - name: DB_PASSWORD
            valueFrom:
              secretKeyRef:
                name: mysql-secret
                key: ROOT_PASSWORD
      traits:
        - type: ingress
          properties:
            domain: testsvc.example.com
            http:
              /: 8088
```

这是一个使用了 KubeVela 内置组件类型 `webservice` 的应用，该应用绑定了 Ingress 运维特征。通过在应用中声明运维能力的方式，只需一个文件，便能将底层的 Deployment、Service、Ingress 集合起来，从而更为便捷地管理应用。

#### `infrastructure/` 目录

`infrastructure/` 目录下存放一些基础设施的配置。此处我们使用 [mysql controller](https://github.com/bitpoke/mysql-operator) 来部署了一个 MySQL 集群。

> 注意，请确保你的集群中有一个 secret，并通过 `ROOT_PASSWORD` 声明了 MySQL 密码。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: mysql
  namespace: default
spec:
  components:
    - name: mysql-controller
      type: helm
      properties:
        repoType: helm
        url: https://presslabs.github.io/charts
        chart: mysql-operator
        version: "0.4.0"
    - name: mysql-cluster
      type: raw
      properties:
        apiVersion: mysql.presslabs.org/v1alpha1
        kind: MysqlCluster
        metadata:
          name: mysql-cluster
        spec:
          replicas: 1
          # 关联 secret 名称
          secretName: mysql-secret
  
  workflow:
    steps:
      - name: deploy-operator
        type: apply-component
        properties:
          component: mysql-controller
      - name: deploy-mysql
        type: apply-component
        properties:
          component: mysql-cluster
```

在这个 MySQL 应用中，我们使用了 KubeVela 工作流的能力。工作流分为两个步骤，第一个步骤会去部署 MySQL 的 controller。当 controller 部署成功且正确运行后，第二个步骤将开始部署 MySQL 集群。

#### 部署 `clusters/` 目录下的文件

配置完以上文件并存放到 Git 配置仓库后，我们需要在集群中手动部署 `clusters/` 目录下的 KubeVela GitOps 配置文件。

首先，在集群中部署 `clusters/infra.yaml`。可以看到它自动在集群中拉起了 `infrastructure/` 目录下的 MySQL 部署文件：

```shell
kubectl apply -f clusters/infra.yaml
```

```shell
$ vela ls

APP   	COMPONENT       	TYPE      	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME
infra 	database-config 	kustomize 	       	running	healthy	      	2021-09-26 20:48:09 +0800 CST
mysql 	mysql-controller	helm      	       	running	healthy	      	2021-09-26 20:48:11 +0800 CST
└─  	mysql-cluster   	raw       	       	running	healthy	      	2021-09-26 20:48:11 +0800 CST
```

接着，在集群中部署 `clusters/apps.yaml`，可以看到它自动拉起了 `apps/` 目录下的应用部署文件：

```shell
kubectl apply -f clusters/apps.yaml
```

```shell
APP   	COMPONENT       	TYPE      	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME
apps  	apps            	kustomize 	       	running	healthy	      	2021-09-27 16:55:53 +0800 CST
infra 	database-config 	kustomize 	       	running	healthy	      	2021-09-26 20:48:09 +0800 CST
my-app	my-server       	webservice	ingress	running	healthy	      	2021-09-27 16:55:55 +0800 CST
mysql 	mysql-controller	helm      	       	running	healthy	      	2021-09-26 20:48:11 +0800 CST
└─  	mysql-cluster   	raw       	       	running	healthy	      	2021-09-26 20:48:11 +0800 CST
```

至此，我们通过部署 KubeVela GitOps 配置文件，自动在集群中拉起了应用及数据库。

通过 curl 应用的 Ingress，可以看到目前的版本是 0.1.5，并且成功地连接到了数据库：

```shell
$ kubectl get ingress
NAME        CLASS    HOSTS                 ADDRESS         PORTS   AGE
my-server   <none>   testsvc.example.com   <ingress-ip>    80      162m

$ curl -H "Host:testsvc.example.com" http://<ingress-ip>
Version: 0.1.5

$ curl -H "Host:testsvc.example.com" http://<ingress-ip>/db
User: KubeVela
Description: It's a test user
```

### 修改配置

完成了首次部署后，我们可以通过修改配置仓库中的配置，来完成集群中应用的配置更新。

修改应用 Ingress 的 Domain：

```yaml
...
      traits:
        - type: ingress
          properties:
            domain: kubevela.example.com
            http:
              /: 8089
```

经过一段时间后，重新查看集群中的 Ingress：

```shell
NAME        CLASS    HOSTS                 ADDRESS         PORTS   AGE
my-server   <none>   kubevela.example.com  <ingress-ip>    80      162m
```

可以看到，Ingress 的 Host 地址已被成功更新。

通过这种方式，我们可以方便地通过更新 Git 配置仓库中的文件，从而自动化更新集群中的配置。

## 面向终端开发者的交付

如图所示，对于终端开发者而言，在 KubeVela Git 配置仓库以外，还需要准备一个应用代码仓库。在用户更新了应用代码仓库中的代码后，需要配置一个 CI 来自动构建镜像并推送至镜像仓库中。KubeVela 会监听镜像仓库中的最新镜像，并自动更新配置仓库中的镜像配置，最后再更新集群中的应用配置。使用户可以达成在更新代码后，集群中的配置也自动更新的效果。

![alt](/img/gitops/dev-flow.jpg)

### 准备代码仓库

准备一个代码仓库，里面包含一些源代码以及对应的 Dockerfile。

这些代码将连接到一个 MySQL 数据库，并简单地启动服务。在默认的服务路径下，会显示当前版本号。在 `/db` 路径下，会列出当前数据库中的信息。

```go
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = fmt.Fprintf(w, "Version: %s\n", VERSION)
	})
	http.HandleFunc("/db", func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("select * from userinfo;")
		if err != nil {
			_, _ = fmt.Fprintf(w, "Error: %v\n", err)
		}
		for rows.Next() {
			var username string
			var desc string
			err = rows.Scan(&username, &desc)
			if err != nil {
				_, _ = fmt.Fprintf(w, "Scan Error: %v\n", err)
			}
			_, _ = fmt.Fprintf(w, "User: %s \nDescription: %s\n\n", username, desc)
		}
	})

	if err := http.ListenAndServe(":8088", nil); err != nil {
		panic(err.Error())
	}
```

我们希望用户改动代码进行提交后，自动构建出最新的镜像并推送到镜像仓库。这一步 CI 可以通过集成 GitHub Actions、Jenkins 或者其他 CI 工具来实现。在本例中，我们通过借助 GitHub Actions 来完成持续集成。具体的代码文件及配置可参考 [示例仓库](https://github.com/oam-dev/samples/tree/master/9.GitOps_Demo/for-developers/app-code)。

### 配置秘钥信息

在新的镜像推送到镜像仓库后，KubeVela 会识别到新的镜像，并更新仓库及集群中的 `Application` 配置文件。因此，我们需要一个含有 Git 信息的 Secret，使 KubeVela 向 Git 仓库进行提交。部署如下文件，将其中的用户名和密码替换成你的 Git 用户名及密码（或 Token）：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: git-secret
type: kubernetes.io/basic-auth
stringData:
  username: <your username>
  password: <your password>
```

### 准备配置仓库

配置仓库与之前面向运维人员的配置大同小异，只需要加上与镜像仓库相关的配置即可。具体配置请参考 [示例仓库](https://github.com/oam-dev/samples/tree/master/9.GitOps_Demo/for-developers/kubevela-config)。

修改 `clusters/` 中的 `apps.yaml`，该 GitOps 配置会监听仓库中 `apps/` 下的应用文件变动以及镜像仓库中的镜像更新：

```yaml
...
  imageRepository:
    # 镜像地址
    image: <your image>
    # 如果这是一个私有的镜像仓库，可以通过 `kubectl create secret docker-registry` 创建对应的镜像秘钥并相关联
    # secretRef: imagesecret
    filterTags:
      # 可对镜像 tag 进行过滤
      pattern: '^master-[a-f0-9]+-(?P<ts>[0-9]+)'
      extract: '$ts'
    # 通过 policy 筛选出最新的镜像 Tag 并用于更新
    policy:
      numerical:
        order: asc
    # 追加提交信息
    commitMessage: "Image: {{range .Updated.Images}}{{println .}}{{end}}"
```

修改 `apps/my-app.yaml` 中的 image 字段，在后面加上 `# {"$imagepolicy": "default:apps"}` 的注释。KubeVela 会通过该注释去更新对应的镜像字段。`default:apps` 是上面 GitOps 配置对应的命名空间和名称。

```yaml
spec:
  components:
    - name: my-server
      type: webservice
      properties:
        image: ghcr.io/fogdong/test-fog:master-cba5605f-1632714412 # {"$imagepolicy": "default:apps"}
```

将 `clusters/` 中包含镜像仓库配置的文件更新到集群中后，我们便可以通过修改代码来完成应用的更新。

### 修改代码

将代码文件中的 `Version` 改为 `0.1.6`，并修改数据库中的数据:

```go
const VERSION = "0.1.6"

...

func InsertInitData(db *sql.DB) {
	stmt, err := db.Prepare(insertInitData)
	if err != nil {
		panic(err)
	}
	defer stmt.Close()

	_, err = stmt.Exec("KubeVela2", "It's another test user")
	if err != nil {
		panic(err)
	}
}
```

提交该改动至代码仓库，可以看到，我们配置的 CI 流水线开始构建镜像并推送至镜像仓库。

而 KubeVela 会通过监听镜像仓库，根据最新的镜像 Tag 来更新配置仓库中 `apps/` 下的应用 `my-app`。

此时，可以看到配置仓库中有一条来自 `kubevelabot` 的提交，提交信息均带有 `Update image automatically.` 前缀。你也可以通过 `{{range .Updated.Images}}{{println .}}{{end}}` 在 `commitMessage` 字段中追加你所需要的信息。

![alt](/img/gitops/gitops-commit.png)

> 值得注意的是，如果你希望将代码和配置放在同一个仓库，需要过滤掉来自 `kubevelabot` 的提交来防止流水线的重复构建。可以在 CI 中通过如下配置过滤：
> 
> ```shell
> jobs:
>  publish:
>    if: "!contains(github.event.head_commit.message, 'Update image automatically')"
> ```

重新查看集群中的应用，可以看到经过一段时间后，应用 `my-app` 的镜像已经被更新。

> KubeVela 会通过你配置的 `interval` 时间间隔，来每隔一段时间分别从配置仓库及镜像仓库中获取最新信息：
> * 当 Git 仓库中的配置文件被更新时，KubeVela 将根据最新的配置更新集群中的应用。
> * 当镜像仓库中多了新的 Tag 时，KubeVela 将根据你配置的 policy 规则，筛选出最新的镜像 Tag，并更新到 Git 仓库中。而当代码仓库中的文件被更新后，KubeVela 将重复第一步，更新集群中的文件，从而达到了自动部署的效果。

通过 `curl` 对应的 `Ingress` 查看当前版本和数据库信息：

```shell
$ kubectl get ingress
NAME        CLASS    HOSTS                 ADDRESS         PORTS   AGE
my-server   <none>   kubevela.example.com  <ingress-ip>    80      162m

$ curl -H "Host:kubevela.example.com" http://<ingress-ip>
Version: 0.1.6

$ curl -H "Host:kubevela.example.com" http://<ingress-ip>/db
User: KubeVela
Description: It's a test user

User: KubeVela2
Description: It's another test user
```

版本已被成功更新！至此，我们完成了从变更代码，到自动部署至集群的全部操作。

## 总结

在运维侧，如若需要更新基础设施（如数据库）的配置，或是应用的配置项，只需要修改配置仓库中的文件，KubeVela 将自动把配置同步到集群中，简化了部署流程。

在研发侧，用户修改代码仓库中的代码后，KubeVela 将自动更新配置仓库中的镜像。从而进行应用的版本更新。

通过与 GitOps 的结合，KubeVela 加速了应用从开发到部署的整个流程。