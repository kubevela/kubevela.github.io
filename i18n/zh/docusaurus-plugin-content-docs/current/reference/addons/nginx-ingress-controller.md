---
title: Nginx Ingress Controller
---

[Nginx Ingress controller](https://kubernetes.github.io/ingress-nginx/) 通过借助 nginx 实现了 Ingress controller 的功能为集群提供代理和负载均衡的功能。

##  安装

```shell
vela addon enable ingress-nginx
```

## 指定 Service Type

可以选择三种服务类型，出于安全考虑默认是 `ClusterIP`，还可以指定为`NodePort` 和 `LoadBalancer`。

- `LoadBalancer` 需要你的集群运行在某个公有云上，并有一种支持的 cloud LoadBalancer。
    ```shell script
    vela addon enable ingress-nginx serviceType=LoadBalancer
    ```   
  
- `NodePort` 类型需要你能够访问集群节点的 IP和端口
    ```shell script
    vela addon enable ingress-nginx serviceType=NodePort
    ```
  
## 获取网关地址

如果指定了服务类型是 `NodePort` 和 `LoadBalancer`，你可以通过下面的命令，获取到网关的地址：

```shell
vela status addon-ingress-nginx -n vela-system --endpoint
```

如果是 `ClusterIP` 类型，又可以通过 `vela port-forward` 命令将网关的端口映射到本地：

```shell
vela port-forward -n vela-system addon-ingress-nginx 9080:80
```

## 卸载

```shell
vela addon disable ingress-nginx
```

## 例子

部署下面的应用：
```yaml
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: demo
spec:
  components:
  - name: demo
    type: webservice
    properties:
      image: barnett/canarydemo:v1
      ports:
      - port: 8090
    traits:
    - type: gateway
      properties:
        domain: canary-demo.com
        http:
          "/version": 8090
EOF
```

访问网关地址：

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-endpoint>/version
Demo: V1
```
