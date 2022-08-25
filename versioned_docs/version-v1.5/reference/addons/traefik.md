---
title: Traefik
---

Traefik is a modern HTTP reverse proxy and load balancer made to deploy microservices with ease. you can use this addon as a cluster gateway or a microservices gateway.

## Install

```bash
vela addon enable traefik
```

### Visit Traefik dashboard by port-forward

Port forward will work as a proxy to allow visiting Traefik dashboard by local port.

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

You can visiting Traefik dashboard with address `http://127.0.0.1:9000/dashboard/`.

### Setup with Specified Service Type

If your cluster has cloud LoadBalancer available:

```bash
vela addon enable traefik serviceType=LoadBalancer
```

## How to use

1. Configure a HTTP domain for a component.

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

2. Configure a HTTPS domain for a component.

You should create a secret that includes the certificate first.

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

The example application configuration:

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

## Definitions

### http-route(trait)

defines HTTP rules for mapping requests from a Gateway to Application.

#### Properties

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

defines HTTPS rules for mapping requests from a Gateway to Application.

#### Properties

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

defines TCP rules for mapping requests from a Gateway to Application.


#### Properties

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

This component definition is designed to manage the TLS certificate

#### Properties

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 cert | the certificate public key encrypted by base64 | string | true |  
 key | the certificate private key encrypted by base64 | string | true |  