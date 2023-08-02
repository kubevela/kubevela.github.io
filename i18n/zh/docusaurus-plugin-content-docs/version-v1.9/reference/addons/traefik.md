---
title: Traefik
---

Traefik 是一个现代化且易用的 HTTP 反向代理和负载均衡服务，用于部署微服务。你可以使用该插件作为你的集群网关活着微服务系统的网关。


## 插件安装

```bash
vela addon enable traefik
```

### 访问 Traefik 的 UI

默认安装情况下 Traefik 无法直接访问，可通过 port-forward 进行本地代理，这仅适用于调试阶段。

```bash
vela port-forward -n vela-system addon-traefik 
```

expected output:

```bash
Forwarding from 127.0.0.1:9000 -> 9000
Forwarding from [::1]:9000 -> 9000

Forward successfully! Opening browser ...
Handling connection for 9000
```

你可以通过 `http://127.0.0.1:9000/dashboard/` 地址访问到 Traefik 的 UI 可视化面板。

### 设置网关流量接入方式

如果你使用云上的集群，使用 LoadBalancer 暴露 Traefik 的访问入口是最佳方案。

```bash
vela addon enable traefik serviceType=LoadBalancer
```

如果在自建集群，需要根据你是作为集群网关还是应用网关来选择流量接入方式。

## 如何使用

1. 为组件配置一个 HTTP 域名

```bash
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example
  namespace: e2e-test
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
    - properties:
        domains:
        - example.domain.com
        rules:
        - path:
            type: PathPrefix
            value: /
          port: 8080
      type: http-route
```

2. 为组件配置一个 HTTPS 域名

首先需要准备一个证书并创建一个 Secret。

```yaml

apiVersion: v1
type: Opaque
data:
  tls.crt: <BASE64>
  tls.key: <BASE64>
kind: Secret
metadata:
  annotations:
    config.oam.dev/alias: ""
    config.oam.dev/description: ""
  labels:
    config.oam.dev/catalog: velacore-config
    config.oam.dev/multi-cluster: "true"
    config.oam.dev/project: addons
    config.oam.dev/type: config-tls-certificate
    workload.oam.dev/type: config-tls-certificate
  name: example
```

应用配置案例如下：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-https
  namespace: e2e-test
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
    - properties:
        domains:
        - example.domain.com
        rules:
        - path:
            type: PathPrefix
            value: /
          port: 8080
        secrets: 
        - name: example
      type: https-route
```

## XDefinitions

### http-route(trait)

基于 HTTP 路由规则来将请求从网关代理到应用。

#### 参数说明

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | -------------
 gatewayName | Specify the gateway name | string | false | traefik-gateway 
 listenerName | Specify the listener name of the gateway | string | false | web 
 domains | Specify some domains, the domain may be prefixed with a wildcard label (*.) | []string | true |  
 rules | Specify some HTTP matchers, filters and actions. | [[]rules](#rules) | true |  

##### rules

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 path | An HTTP request path matcher. If this field is not specified, a default prefix match on the "/" path is provided. | [path](#path) | false |  
 headers | Conditions to select a HTTP route by matching HTTP request headers. | [[]headers](#headers) | false |  
 serviceName | Specify the service name of component, the default is component name. | string | false |  
 port | Specify the service port of component. | int | true |  

###### headers

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name |  | string | true |  
 type |  | string | true |  
 value |  | string | true |  

###### path

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 type |  | string | true | PathPrefix 
 value |  | string | true | / 

### https-route(trait)

基于 HTTPS 路由规则来将请求从网关代理到应用。

#### 参数说明

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 secrets | Specify the TLS secrets | [[]secrets](#secrets) | true |  
 TLSPort |  | int | true | 443 
 domains | Specify some domains, the domain may be prefixed with a wildcard label (*.) | []string | true |  
 rules | Specify some HTTP matchers, filters and actions. | [[]rules](#rules) | true |  


##### rules

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 path | An HTTP request path matcher. If this field is not specified, a default prefix match on the "/" path is provided. | [path](#path) | false |  
 port | Specify the service port of component. | int | true |  
 headers | Conditions to select a HTTP route by matching HTTP request headers. | [[]headers](#headers) | false |  
 serviceName | Specify the service name of component, the default is component name. | string | false |  


###### headers

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name |  | string | true |  
 type |  | string | true |  
 value |  | string | true |  


###### path

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 type |  | string | true | PathPrefix 
 value |  | string | true | / 


##### secrets

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name |  | string | true |  
 namespace |  | string | false |  

### tcp-route(trait)

基于四层的 TCP 路由规则来将请求从网关代理到应用。

#### 参数说明

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 rules | Specify the TCP matchers | [[]rules](#rules) | true |  


##### rules

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 gatewayPort | Specify the gateway listener port | int | true |  
 port | Specify the service port of component. | int | true |  
 serviceName | Specify the service name of component, the default is component name. | string | false |  

### config-tls-certificate(config)

用于扩展集成配置的选项，支持用户配置 TLS 证书用于上述 HTTPs规则。

#### 参数说明

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 cert | the certificate public key encrypted by base64 | string | true |  
 key | the certificate private key encrypted by base64 | string | true |  
