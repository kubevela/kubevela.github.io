---
标题。部署第一个应用程序
---

::注意
在开始之前，请确认你已经根据[安装指南](./install)安装了KubeVela并启用了VelaUX附加组件。
:::

欢迎来到KubeVela! 本节将指导你交付你的第一个应用程序。

## 部署一个经典的应用程序

下面是一个经典的KubeVela应用程序，它包含一个具有操作特性的组件，基本上，它意味着将一个容器镜像部署为具有一个副本的webservice。此外，还有三个策略和工作流程步骤，这意味着将应用程序部署到两个不同的环境中，具有不同的配置。

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
        # The cluster with name local is installed the KubeVela.
        clusters: ["local"]
        namespace: "default"
    - name: target-prod
      type: topology
      properties:
        clusters: ["local"]
        # This namespace must be created before deploying.
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

* 为你的第一个应用程序创建一个环境。

```bash
# This command will create a namespace in the local cluster
vela env init prod --namespace prod
```

<details>
<summary>预期输出</summary>

```console
environment prod with namespace prod created
```
</details>

* 开始部署应用程序

```
vela up -f https://kubevela.net/example/applications/first-app.yaml
```

<details>
<summary>预期输出</summary>

```console
Applying an application in vela K8s object format...
I0516 15:45:18.123356   27156 apply.go:107] "creating object" name="first-vela-app" resource="core.oam.dev/v1beta1, Kind=Application"
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward first-vela-app
             SSH: vela exec first-vela-app
         Logging: vela logs first-vela-app
      App status: vela status first-vela-app
        Endpoint: vela status first-vela-app --endpoint
Application prod/first-vela-app applied.
```
</details>

* 查看应用程序的部署过程和状态

```bash
vela status first-vela-app
```

<details>
<summary>预期输出</summary>

```console
About:

  Name:      	first-vela-app
  Namespace: 	prod
  Created at:	2022-05-16 15:45:18 +0800 CST
  Status:    	workflowSuspending

Workflow:

  ...

Services:

  - Name: express-server
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    Traits:
      ✅ scaler
```
</details>

该应用程序将成为 "workflowSuspending "状态，这意味着该工作流程已经完成了前两个步骤，正在等待该步骤指定的人工审批。

* 访问应用程序

我们可以通过以下方式检查应用程序。

```bash
vela port-forward first-vela-app 8000:8000
```

它将调用浏览器，你可以访问该站点:

<details>
<summary>预期输出</summary>

```
<xmp>
Hello KubeVela! Make shipping applications more enjoyable. 

...snip...
```
</details>

* 恢复工作流程

在我们完成对申请的检查后，我们可以批准工作流程继续进行：

```bash
vela workflow resume first-vela-app
```

<details>
<summary>预期输出</summary>

```console
Successfully resume workflow: first-vela-app
```
</details>

然后其余的将在`prod`命名空间中交付:

```bash
vela status first-vela-app
```

<details>
<summary>预期输出</summary>

```console
About:

  Name:      	first-vela-app
  Namespace: 	prod
  Created at:	2022-05-16 15:45:18 +0800 CST
  Status:    	running

Workflow:

  ...snipt...

Services:

  - Name: express-server
    Cluster: local  Namespace: prod
    Type: webservice
    Healthy Ready:2/2
    Traits:
      ✅ scaler
  - Name: express-server
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    Traits:
      ✅ scaler
```
</details>

很好! 你已经完成了第一个KubeVela应用程序的部署，你也可以在用户界面中查看和管理它。

## 用UI控制台管理应用程序

在完成[VelaUX的安装](./install#2-install-velaux)后，你可以查看和管理创建的应用程序。

* 如果你没有访问的端点，可以通过UI做端口转发。
  ```
  vela port-forward addon-velaux -n vela-system 8080:80
  ```

* VelaUX需要认证，默认用户名是`admin`，密码是**`VelaUX12345`**。

它要求你在第一次登录时用新密码覆盖，请确保记住新密码。

* 检查部署的资源

点击应用程序的卡片，然后你可以查看应用程序的详细信息。

! [first-app-graph](https://static.kubevela.net/images/1.5/first-app-graph.jpg)

UI控制台与控制器共享一个不同的元数据层。这更像是一个公司的PaaS架构，它选择数据库作为真实数据源，而不是依靠Kubernetes的etcd。

默认情况下，如果你使用CLI直接从Kubernetes API管理应用程序，我们会自动将元数据同步到UI后端。一旦你从用户界面控制台部署了应用程序，自动同步过程将被停止，因为数据源可能被改变。

如果在这之后CLI发生了任何变化，UI控制台将检测到差异并展示。然而，不建议从两边都修改应用程序的属性。

总之，如果你是CLI/YAML/GitOps用户，你最好只用CLI来管理应用程序的CRD，只用UI控制台（velaux）作为仪表盘。一旦你从UI控制台管理了应用程序，你需要调整相应的操作行为，从UI、API或velaux提供的Webhook管理应用程序。

## 清理

```bash
vela delete first-vela-app
```

<details>
<summary>预期输出</summary>

```console
Deleting Application "first-vela-app"
app "first-vela-app" deleted from namespace "prod"
```
</details>

这就是kubevela! 你成功地完成了第一个应用程序的交付。祝贺你!

## 接下来的步骤

- 查看[核心概念](./getting-started/core-concept)，了解更多关于它的工作原理。
- 查看[用户指南](./tutorials/webservice)，了解更多你可以用KubeVela实现的东西。
