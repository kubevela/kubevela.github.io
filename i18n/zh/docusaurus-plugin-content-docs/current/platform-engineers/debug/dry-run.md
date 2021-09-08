---
title: 本地试运行
---

如果你是一个 DevOps 用户或者运维管理员，并且对 Kubernetes 有所了解，为了保证一个应用部署计划在 Kubernetes 运行时集群的表现符合期望，在开发调试阶段，你也可以通过下面的试运行功能提前确认这个部署计划背后的逻辑是否正确。

KubeVela 提供了本地试运行（Dry-run）的功能，来满足你的这个需求。

### 如何使用

我们将以一个应用部署计划的示例，来进行讲解。

首先编写如下的 YAML 文件：

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: ingress
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

可以看到，我们的期望是交付一个 Web Service 的组件，使用来自 `crccheck/hello-world` 的镜像，并最终提供一个可供对外访问的网关，地址域名为 `testsvc.example.com`，端口号 8000。

然后打开本地试运行模式，使用如下命令：

```shell
kubectl vela dry-run -f app.yaml
```
```console
---
# Application(vela-app) -- Comopnent(express-server)
---

apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    workload.oam.dev/type: webservice
spec:
  selector:
    matchLabels:
      app.oam.dev/component: express-server
  template:
    metadata:
      labels:
        app.oam.dev/component: express-server
    spec:
      containers:
      - image: crccheck/hello-world
        name: express-server
        ports:
        - containerPort: 8000

---
apiVersion: v1
kind: Service
metadata:
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    trait.oam.dev/resource: service
    trait.oam.dev/type: ingress
  name: express-server
spec:
  ports:
  - port: 8000
    targetPort: 8000
  selector:
    app.oam.dev/component: express-server

---
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    trait.oam.dev/resource: ingress
    trait.oam.dev/type: ingress
  name: express-server
spec:
  rules:
  - host: testsvc.example.com
    http:
      paths:
      - backend:
          serviceName: express-server
          servicePort: 8000
        path: /

---
```

查看本地试运行模式给出的信息，我们可以进行确认：

1. Kubernetes 集群内部 Service 和我们期望的 `kind: Deployment` 部署，在相关的镜像地址、域名端口上，是否能匹配。
2. 最终对外的 Ingress 网关，与 Kubernetes 集群内部的 `Service`，在相关的镜像地址、域名端口上，是否能匹配。

在完成上述信息确认之后，我们就能进行后续的开发调试步骤了。

最后，你还可以通过 `kubectl vela dry-run -h` 来查看更多可用的本地试运行模式：

```
Usage:
  vela dry-run

Examples:
kubectl vela dry-run

Flags:
  -d, --definition string   specify a definition file or directory, it will only be used in dry-run rather than applied to K8s cluster
  -f, --file string         application file name (default "./app.yaml")
  -h, --help                help for dry-run
  -n, --namespace string    specify namespace of the definition file, by default is default namespace (default "default")
```
