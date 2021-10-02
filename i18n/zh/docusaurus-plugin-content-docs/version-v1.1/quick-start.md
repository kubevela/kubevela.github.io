---
title:  交付第一个应用
---

欢迎来到 KubeVela! 在本小节中，我们会向你介绍一些例子来帮助你理解如何使用 KubeVela 解决应用交付中的实际问题。

在实践之前，请确保您已经按照《快速安装》文档，在您的控制平面集群中安装了 KubeVela。

## 一个最简单的示例

KubeVela 中一个比较简单的应用部署定义，大致如下所示：

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
        port: 8000
      traits:
        - type: ingress-1-20
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

我们可以直接使用 `kubectl` 把它提交给 KubeVela：

```bash
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/vela-app.yaml
```

上述命令一旦执行，KubeVela 就会帮助你在目标集群中交付一个 `Web 服务`类型的组件，且该组件的容器镜像是`crccheck/hello-world`。在本示例中，我们并没有特别指明目标集群是哪个，所以 KubeVela 会默认把应用部署在它所在的集群也就是控制平面集群当中。

而由于我们已经在上述 YAML 文件中为这个组件绑定了一个 `ingress` 类型的运维特征，KubeVela 就会指导 Kubernetes 自动为这个组件背后的工作负载配置 Service、端口映射和 HTTP 路由规则。所以只要目标集群具备 Ingress 能力，上述 YAML 一部署成功，你就可以立刻通过外域名来问这个应用了。

```
$ curl -H "Host:testsvc.example.com" http://<your ip address>/
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

## 交付更多的组件

KubeVela 允许你部署的组件类型是非常丰富的。在上面的例子中，`Web Service`组件实际上就是一个预先编写好的[CUE](https://cuelang.org/) 文件。

你还可以其它很多类型，比如：

### Helm 组件

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis-comp
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        url: https://charts.bitnami.com/bitnami
        repoType: helm
```

### Terraform 云资源组件

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rds-cloud-source
spec:
  components:
    - name: sample-db
      type: alibaba-rds
      properties:
        instance_name: sample-db
        account_name: oamtest
        password: U34rfwefwefffaked
        writeConnectionSecretToRef:
          name: db-conn
```

### 来自 Git 仓库的组件（基于 Kustomize）

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: git-app
spec:
  components:
    - name: git-comp
      type: kustomize
      properties:
        repoType: git
        url: https://github.com/<path>/<to>/<repo>
        git:
          branch: master
        path: ./app/dev/
```

当然，还有更多。欢迎查看边栏中的《选择待交付组件》章节来阅读关于部署各种类型的详细文档。如果你需要的话，你还可以在 KubeVela 中添加自己的组件类型。

## 绑定运维特征

KubeVela 能做的远不止部署，还包括运维。它允许你为待交付组件绑定预先定义好的各种运维行为（叫做运维特征），并且这个绑定会立刻生效。接下来，我们就为 Web 服务组件绑定一个“分批发布”运维特征：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v1
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
```

好了，接下来，只要上述 YAML 中的镜像版本发生变化，KubeVela 就会按照你所定义的分批策略来更新对应的应用实例了。

如果你想了解 KubeVela 所支持的所有运维特征，欢迎查看边栏中的《绑定运维特征》章节，同样的，KubeVela 允许你非常容易的在平台中添加自己的运维特征。

## 定义交付策略与交付工作流

组件与运维特征只是 KubeVela 非常基本的功能。KubeVela 本身实际上是一个全功能的持续交付（CD）系统，并且原生支持面向混合环境（比如混合云/多云/多集群）应用交付。

举个例子：

> 我要交付一个包括了两个组件的微服务应用，要求先需要在预发集群当中部署 1 个副本，然后暂停交付过程，请主管进行人工审核。当审核通过后，再继续部署到生产集群中，并且需要部署为3个副本。

想象一下，你需要在 CI/CD 流水线里编写多少“脏乱差”的一次性脚本或者胶水代码才能让上述流程自动化的、保证一定正确性的执行起来？

而在 KubeVela 中，上述流程可以非常容易的通过如下所示的声明式工作流建模出来：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app
  namespace: default
spec:
  components:
    - name: hello-world-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: scaler
          properties:
            replicas: 1
    - name: data-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000000'
  policies:
    - name: example-multi-env-policy
      type: env-binding
      properties:
        envs:
          - name: staging
            placement: # selecting the cluster to deploy to
              clusterSelector:
                name: cluster-staging
            selector: # selecting which component to use
              components:
                - hello-world-server

          - name: prod
            placement:
              clusterSelector:
                name: cluster-prod
            patch: # overlay patch on above components
              components:
                - name: hello-world-server
                  type: webservice
                  traits:
                    - type: scaler
                      properties:
                        replicas: 3

    - name: health-policy-demo
      type: health
      properties:
        probeInterval: 5
        probeTimeout: 10

  workflow:
    steps:
      # deploy to staging env
      - name: deploy-staging
        type: deploy2env
        properties:
          policy: example-multi-env-policy
          env: staging

      # manual check
      - name: manual-approval
        type: suspend

      # deploy to prod env
      - name: deploy-prod
        type: deploy2env
        properties:
          policy: example-multi-env-policy
          env: prod
```  

不需要任何“脏乱差”脚本，KubeVela 就能够以完全自动化、高确定性的声明式工作流完成所有的应用交付动作。更为重要的是，KubeVela 希望你继续使用你现有的 CI 方案，而 KubeVela 则负责帮助你更好的完成 CD 流程。

## 下一步

上述所有功能，只是 KubeVela 这个现代化的云原生应用交付与管理平台的冰山一角。您可以从下面步骤来开始更好的了解 KubeVela:

- 查看 KubeVela 的[`应用部署模型`](./core-concepts/application)，进一步理解其是如何工作的。
- 查看 KubeVela 的[`系统架构`](./core-concepts/architecture)，了解 KubeVela 本身的设计与架构原理。
- 加入 KubeVela 中文社区钉钉群，群号：23310022。