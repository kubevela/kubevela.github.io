---
title: 交付第一个应用
---

> 开始之前，请确认你已完成 KubeVela 的安装，参考 [安装指导文档](./install.mdx)

欢迎使用 KubeVela, 在该章节中你可以学习到使用 KubeVela 部署一个基础的应用。

## 通过 CLI 部署应用

下面给出了一个经典的 OAM 应用定义，它包括了一个无状态服务组件和运维特征，三个部署策略和工作流步骤。此应用描述的含义是将一个服务部署到两个目标命名空间，并且在第一个目标部署完成后等待人工审核后部署到第二个目标，且在第二个目标时部署2个实例。

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
        image: oamdev/hello-world
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
      - name: manual-approval
        type: suspend
      - name: deploy2prod
        type: deploy
        properties:
          policies: ["target-prod", "deploy-ha"]
```

* 开始应用部署

```bash
# 此命令用于在管控集群创建命名空间
vela env init prod --namespace prod
vela up -f https://kubevela.net/example/applications/first-app.yaml
```

> 需要注意的是需要你的部署环境可以正常获取 `oamdev/hello-world` 镜像

* 查看部署状态

```bash
vela status first-vela-app
```

正常情况下应用完成第一个目标部署后进入暂停状态。

* 人工审核，批准应用进入第二个目标部署

```bash
vela workflow resume first-vela-app
```

* 通过下述方式来访问该应用

```bash
$ vela port-forward first-vela-app 8000:8000
```

上述命令将创建本地代理并打开本地浏览器，你可以查看到如下内容：

```
<xmp>
Hello KubeVela! Make shipping applications more enjoyable. 

...snip...
```

## 基于 UI 管理应用

如果你已完成 [VelaUX 安装](./install#2-install-velaux)， 你可以通过 UI 来管理和可视化应用。

本地测试模式下通过下述命令即可打开 UI 界面。

```bash
vela port-forward addon-velaux -n vela-system 8080:80
```

UI 控制台需要用户认证，默认的账号是： `admin` 密码是： **`VelaUX12345`**。

首次登录后会进入修改密码和设置邮箱流程，请正确设置你的企业邮箱（后期不可修改）和谨记修改后的密码。

* 查看第一个应用的部署拓扑图

通过 CLI 部署的应用会自动同步到 UI 侧，你可以进入应用页面查看到应用的相关可视化状态，比如：资源拓扑图，实例等。如果你未在 CLI 侧执行审核操作，应用页面右上方将显示审核窗口。

> 如果你在 UI 侧执行一次应用的部署，该应用将被 UI 完全接管，此时不建议再从 CLI 来修改应用部署属性，可通过 UI 提供的方式：界面、API 和 Webhook 来执行部署。

![first-app-graph](https://static.kubevela.net/images/1.5/first-app-graph.jpg)

## 清理

```bash
$ vela delete first-vela-app
Deleting Application "first-vela-app"
app "first-vela-app" deleted from namespace "prod"
```

处于同步状态的应用，如果通过 CLI 删除后，UI 侧的应用同步删除。

## 下一步

- 阅读 [核心概念](./getting-started/core-concept) 文档获取核心概念解读。
- 阅读 [用户手册](./tutorials/webservice) 获取更多特性玩法。
