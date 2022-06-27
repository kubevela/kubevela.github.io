---
title: 访问应用程序
---

服务部署完成之后，接下来就是发布你的应用。

有很多种方法可以发布你的应用程序，对于测试环境来说，你完全可以使用端口转发或者 NodePort 方式。生产环境则可以使用 LoadBalancer 方式或者通过集群网关。本文主要关注生产环境。

## 使用云厂商提供的 LoadBalancer 方式

这种方式仅限于云服务，像阿里云， AWS， Azure等。

对于 webservice 组件来说，你只需要设置`ExposeType`为`LoadBalancer`，这意味着这个组件会生成一个以 LoadBalancer 方式访问的 Kubernetes 服务。部署成功之后，你可以获得服务访问点。

参考以下配置：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        ports:
          - port: 8080
            expose: true
        exposeType: LoadBalancer
```

对于其他的组件，同样的只需要生成使用 LoadBalancer 访问方式的 Kubernetes 服务即可。

## 使用 Ingress 网关提供的 HTTP 域名方式

这种方式需要你在集群中事先安装 ingress 控制器。

用户可以为组件绑定`gateway`特征来生成 Ingress，参考以下配置：

```yaml
traits:
- type: gateway
  properties:
    domain: testsvc.example.com
    http:
        "/": 8000
        "/manage": 8090
```

这意味着可以通过域名`testsvc.example.com`来访问这个组件，这里有两条访问规则，以`/manage`开头的请求路径将会访问组件的 8090 端口，其余的将会访问组件的 8000 端口。

在 VelaUX 控制台中，你可以点击`Add Trait`按钮并选择`gateway`。参考以下配置：

![gateway trait](https://static.kubevela.net/images/1.4/gateway-trait.jpg)

## 使用 Traefik 方式

这种方式需要提前安装 traefik 插件。

```bash
$ vela addon enable traefik
```

获取更多关于插件的帮助，请参考[Traefik 插件](../reference/addons/traefik)

这个插件提供了三种特征, 包含 [http-route](../reference/addons/traefik#http-routetrait), [https-route](../reference/addons/traefik#https-routetrait) 和 [tcp-route](../reference/addons/traefik#tcp-routetrait)。

### 使用 HTTP/HTTPS 方式

你可以点击`Add Trait`按钮并选择 `http-route`。参考以下配置：

![http route trait](https://static.kubevela.net/images/1.4/http-route-trait.jpg)

```yaml
traits:
- type: http-route
  properties:
    domains:
    - testsvc.example.com
    rules:
    - port: 80
    gatewayName: traefik-gateway
    listenerName: web
```

这里只允许出现一个规则。端口号要和服务暴露的端口号一致。 路由规则可以使用的条件包含 HTTP 头和请求路径。

对于 HTTPS 访问方式，你首先得创建一个 TLS 证书。在 VelaUX 控制台中，打开集成页面，然后选择 `TLS Certificate` 类型。点击创建按钮，你需要提供base64格式的证书公私钥。

![new tls](https://static.kubevela.net/images/1.4/new-tls.jpg)

这将生成密钥并与应用程序一起分发到托管集群。

然后打开应用程序配置页面并单击 Add Trait 按钮并选择 https-route trait 类型。 参考以下配置：

![https route trait](https://static.kubevela.net/images/1.4/https-route-trait.jpg)

```yaml
traits:
- type: https-route
  properties:
    domains:
    - testsvc.example.com
    TLSPort: 8443
    secrets:
    - name: kubevela
    rules:
    - port: 80
```

Secrets 名称需要与证书配置的名称相同。

### 使用 TCP 方式

这种方式适用于流协议的服务，复用同一个公网IP地址。

你可以单击`Add Trait`按钮并选择`tcp-route`。 参考以下配置：

![tcp route trait](https://static.kubevela.net/images/1.4/tcp-route.jpg)

```yaml
traits:
- type: https-route
  properties:
    rules:
    - gatewayPort: 16379
        port: 6379
        serviceName: redis-master
```
