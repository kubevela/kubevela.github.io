---
title: Traefik
---

Traefik is a modern HTTP reverse proxy and load balancer made to deploy microservices with ease. you can use this addon as a cluster gateway or a microservices gateway.

## Install

:::caution
The addon installs Traefik's Helm chart from `https://charts.kubevela.net/community`, and that host no longer resolves. Until the catalog publishes a version of the addon that pulls the chart from elsewhere, `vela addon enable traefik` creates the addon's Application but the chart is never fetched, so Traefik doesn't start.
:::

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
  namespace: default
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
          port: 8000
      type: http-route
```

2. Configure a HTTPS domain for a component.

Create the Secret that holds the certificate with the addon's `tls-certificate` config template, passing the certificate and private key base64-encoded:

```bash
vela config create example -t tls-certificate -n default cert=<CERT_BASE64> key=<KEY_BASE64>
```

This writes the Secret `default/example` with the keys `tls.crt` and `tls.key`, which the trait's `secrets` names.

The example application configuration:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-https
  namespace: default
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
          port: 8000
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
 TLSPort | The gateway's HTTPS listener port. | int | false | 8443 
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

### tls-certificate (config template)

Manages a TLS certificate as a Secret with the keys `tls.crt` and `tls.key`. Create one with `vela config create <name> -t tls-certificate cert=<CERT_BASE64> key=<KEY_BASE64>`.

#### Properties

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 cert | The certificate, base64-encoded. | string | true |  
 key | The certificate's private key, base64-encoded. | string | true |  