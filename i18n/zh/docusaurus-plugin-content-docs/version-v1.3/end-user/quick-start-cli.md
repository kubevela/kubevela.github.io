---
title:  交付第一个应用
---

欢迎来到 KubeVela! 在本小节中，我们会向你介绍一些例子来帮助你理解如何使用 KubeVela 解决应用交付中的实际问题。

在实践之前，请确保你已经按照 [快速安装](../install.mdx) 文档，在你的控制平面集群中安装了 KubeVela。

## 一个最简单的示例

KubeVela 中一个简单的应用部署定义，大致如下所示：

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
vela up -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/vela-app.yaml
```

上述命令一旦执行，KubeVela 就会帮助你在目标集群中交付一个 `Web 服务`类型的组件，且该组件的容器镜像是`crccheck/hello-world`。在本示例中，我们并没有特别指明目标集群是哪个，所以 KubeVela 会默认把应用部署在它所在的集群也就是控制平面集群当中。

而由于我们已经在上述 YAML 文件中为这个组件绑定了一个 `ingress` 类型的运维特征，KubeVela 就会指导 Kubernetes 自动为这个组件背后的工作负载配置 Service、端口映射和 HTTP 路由规则。所以只要目标集群具备 [Ingress 能力](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)，上述 YAML 一部署成功，你就可以立刻通过外域名来问这个应用了。

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

非常棒！至此你已经完成了第一个 KubeVela 应用的部署，最简单的应用只需要包含一个组件，可以没有运维特征、策略或者工作流。

## 下一步

* 学习[多集群应用部署](../case-studies/multi-cluster)，除了组件和运维特征，了解策略系统和工作流带来的更丰富能力。
* 想要开箱即用的图形化交互体验？查看 [VelaUX](../quick-start) 了解图形化控制台的使用方式。