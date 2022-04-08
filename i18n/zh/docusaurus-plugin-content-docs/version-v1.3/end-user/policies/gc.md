---
title: 垃圾回收
---

默认情况下，KubeVela 应用会在新的版本发布并健康运行后回收掉过时的资源。但是在一些场景下，你可能希望对于过时资源的回收有其他的控制方式，这种情况下你可以使用垃圾回收策略来配置相应的行为。

在垃圾回收策略中，目前主要有两种能力你可以使用。

## 保留过时资源

如果你想要保留应用在先前版本中创建出来的资源，你可以配置垃圾回收策略中的`keepLegacyResource`选项来实现。比如如下应用：

```yaml
# app.yaml
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
  policies:
    - name: keep-legacy-resource
      type: garbage-collect
      properties:
        keepLegacyResource: true
```

1. 首先创建这个应用

``` shell
vela up -f app.yaml
```

```shell
$ vela ls
APP             COMPONENT       TYPE            TRAITS          PHASE   HEALTHY STATUS          CREATED-TIME                 
first-vela-app  express-server  webservice      ingress-1-20    running healthy Ready:1/1       2022-04-06 16:20:25 +0800 CST
```

2. 然后更新它

```yaml
# app1.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server-1
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
  policies:
    - name: keep-legacy-resource
      type: garbage-collect
      properties:
        keepLegacyResource: true
```

``` shell
vela up -f app1.yaml
```

```shell
$ vela ls
APP             COMPONENT               TYPE            TRAITS          PHASE   HEALTHY STATUS          CREATED-TIME                 
first-vela-app  express-server-1        webservice      ingress-1-20    running healthy Ready:1/1       2022-04-06 16:20:25 +0800 CST
```

可以发现旧版本的应用资源和新版本的应用资源同时存在于集群中。

> 在下述步骤中，我们将使用 `kubectl` 命令来做一些验证。你也可以使用 `vela status first-vela-app` 来检查应用及其组件的健康状态。

```
$ kubectl get deploy
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
express-server     1/1     1            1           10m
express-server-1   1/1     1            1           40s
```

```
$ kubectl get svc
NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
express-server     ClusterIP   10.96.102.249   <none>        8000/TCP   10m
express-server-1   ClusterIP   10.96.146.10    <none>        8000/TCP   46s
```

```
$ kubectl get ingress
NAME               CLASS    HOSTS                 ADDRESS   PORTS   AGE
express-server     <none>   testsvc.example.com             80      10m
express-server-1   <none>   testsvc.example.com             80      50s
```

```
$ kubectl get resourcetracker
NAME                        AGE
first-vela-app-default      12m
first-vela-app-v1-default   12m
first-vela-app-v2-default   2m56s
```

在删除该应用时所有的版本资源会被一并回收。

```
$ vela delete first-vela-app
```

> 如果你希望删除某个应用版本下的过时资源，你可以运行`kubectl delete resourcetracker first-vela-app-v1-default`。

## 持久化资源

除了在整个应用维度上保留历史版本资源外，你还可以通过配置部分资源的持久化策略来跳过常规的垃圾回收过程。

在如下所示的样例中，添加了一条规则（rule）。该规则指定所有由`expose`这一运维特征创建出来的资源使用`onAppDelete`策略，即这些资源只有在应用删除时才会被回收。

```shell
$ cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: garbage-collect-app
spec:
  components:
    - name: hello-world
      type: webservice
      properties:
        image: crccheck/hello-world
      traits:
        - type: expose
          properties:
            port: [8000]
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              traitTypes:
                - expose
            strategy: onAppDelete
EOF
```

```shell
$ kubectl get deployment
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
hello-world   1/1     1            1           74s
$ kubectl get service   
NAME          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
hello-world   ClusterIP   10.96.160.208   <none>        8000/TCP   78s
```

如果你升级该应用并使用一个新的组件，你会发现旧版本应用中通过 webservice 组件创建的 Deployment 被删除掉了，但是通过 expose 这一运维特征创建的 Service 资源仍然保留下来。
```shell
$ cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: garbage-collect-app
spec:
  components:
    - name: hello-world-new
      type: webservice
      properties:
        image: crccheck/hello-world
      traits:
        - type: expose
          properties:
            port: [8000]
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              traitTypes:
                - expose
            strategy: onAppDelete
EOF

$ kubectl get deployment
NAME              READY   UP-TO-DATE   AVAILABLE   AGE
hello-world-new   1/1     1            1           10s
$ kubectl get service   
NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
hello-world       ClusterIP   10.96.160.208   <none>        8000/TCP   5m56s
hello-world-new   ClusterIP   10.96.20.4      <none>        8000/TCP   13s
```

如果你想要部署类 Job 组件，希望部署的资源不会被应用回收， 那么你可以使用组件组件类型选择器，同时将回收策略设置为 `never`。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: garbage-collect-app
spec:
  components:
    - name: hello-world-new
      type: job-like-component
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              componentTypes:
                - webservice
            strategy: never
```

另一种对于组件资源的选择方式是使用组件名称选择器。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: create-ns-app
spec:
  components:
    - name: example-addon-namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              componentNames:
                - example-addon-namespace
            strategy: never
```

