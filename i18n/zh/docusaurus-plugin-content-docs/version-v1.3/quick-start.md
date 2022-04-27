---
title: 交付第一个应用
---

> 开始之前，请确认你已完成 KubeVela 的安装，参考 [安装指导文档](./install.mdx)

欢迎使用 KubeVela, 在该章节中你可以学习到使用 KubeVela 部署一个基础的应用。

## 通过 CLI 部署应用

下面给出了一个经典的 OAM 应用定义，它包括了一个无状态服务组件和运维特征，三个部署策略和带有三个部署的工作流。此应用描述的含义是将一个服务部署到两个目标命名空间，并且在第一个目标部署完成后等待人工审核后部署到第二个目标，且在第二个目标时部署2个实例。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        ports:
         - port: 8000
           expose: true
      traits:
        - type: scaler
          properties:
            replicas: 1
  policies:
    - name: target-default
      type: topology
      properties:
        # local 集群即 Kubevela 所在的集群
        clusters: ["local"]
        namespace: "default"
    - name: target-prod
      type: topology
      properties:
        clusters: ["local"]
        # 此命名空间需要在应用部署前完成创建
        namespace: "prod"
    - name: deploy-ha
      type: override
      properties:
        components:
          - type: webservice
            traits:
              - type: scaler
                properties:
                  replicas: 2
  workflow:
    steps:
      - name: deploy2default
        type: deploy
        properties:
          policies: ["target-default"]
      - type: suspend
      - name: deploy2prod
        type: deploy
        properties:
          policies: ["target-prod", "deploy-ha"]
```

* 开始应用部署

```bash
# 此命令用于在管控集群创建命名空间
$ vela env init prod --namespace prod
$ vela up -f https://kubevela.net/example/applications/first-app.yaml
```

> 需要注意的是需要你的部署环境可以正常获取 `crccheck/hello-world` 镜像

* 查看部署状态

```bash
$ vela status first-vela-app
```

正常情况下应用完成第一个目标部署后进入暂停状态。

* 人工审核，批准应用进入第二个目标部署

```bash
$ vela workflow resume first-vela-app
```

* 通过下述方式来访问该应用

```bash
$ vela port-forward first-vela-app 8000:8000
<xmp>
Hello World


                                       ##         .
                                 ## ## ##        ==
                              ## ## ## ## ##    ===
                           /""""""""""""""""\___/ ===
                      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~ ~ /  ===- ~~~
                           \______ o          _,/
                            \      \       _,'
                             `'--.._\..--''
</xmp>
```

到这里，你已完成了第一个应用的部署。

> 目前，通过 CLI 创建的应用会同步到 UI 进行可视化，但它是只读的。

## 通过 UI 部署应用

登陆到 KubeVela UI 控制后，默认你将进入应用管理页面。点击页面右上方的 `新建应用` 按钮，输入应用基础信息：

1. 应用名称、别名等基础信息；
2. 选择一个应用所属项目，平台默认生成了 `Default` 项目，你可以根据需要创建新的项目；
3. 选择主组件类型，这里我们选择默认的 `webservice` 类型。
4. 选择部署环境，部署环境选项由不同的项目决定。

### 设置部署参数

设置完应用基础信息后进入第二步，设置主组件的部署参数，我们需要设置的参数包括：

- 镜像地址： `crccheck/hello-world`
- 端口信息：将默认的 80 端口变更为 8080 端口。

![create hello world app](https://static.kubevela.net/images/1.3/create-helloworld.jpg)

确认创建后即可完成应用配置，控制台创建的应用默认会根据所选环境生成 [工作流](./getting-started/core-concept#workflow) 和一个设置副本数的 [运维特征](./getting-started/core-concept#trait)。

### 执行工作流部署应用

点击应用详情页右上方的 `部署` 按钮，选择指定环境的工作流即可开始部署应用。

![](./resources/succeed-first-vela-app.jpg)

### 删除应用

如果在你测试完成后需要删除该应用，操作方式如下：

1. 进入应用环境页面，点击 `回收` 按钮完成所有环境的资源回收。
2. 回到应用列表页面，点击卡片中的操作按钮，点击删除选项确认删除即可。

到此，你完成了 KubeVela 的初体验。

## 下一步

- 阅读 [核心概念](./getting-started/core-concept) 文档获取核心概念解读。
- 阅读 [用户手册](./tutorials/webservice) 获取更多特性玩法。
