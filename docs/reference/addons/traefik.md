---
title: Traefik
---

Traefik is an HTTP reverse proxy and load balancer. Enable this addon to run Traefik as a gateway for your cluster, then expose components with its `http-route`, `https-route` and `tcp-route` traits.

:::caution
The addon installs Traefik's Helm chart from `https://charts.kubevela.net/community`, and that host no longer resolves. Until the catalog publishes a version of the addon that pulls the chart from elsewhere, `vela addon enable traefik` creates the addon's Application but the chart is never fetched, so Traefik doesn't start.
:::

## Install

```bash
vela addon enable traefik
```

If your cluster has a cloud load balancer, expose Traefik through it:

```bash
vela addon enable traefik serviceType=LoadBalancer
```

### Parameters

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 serviceType | Type of the Traefik Service: `ClusterIP`, `NodePort`, `LoadBalancer` or `ExternalName`. | string | false | ClusterIP
 accessLog | Print the access log to the Traefik container's stdout. | bool | false | true
 exposeDashboard | Expose the Traefik dashboard on port 9000. | bool | false | true
 autoscaling | Scale the Traefik instances with a HorizontalPodAutoscaler. | bool | false |
 entryPoints | Extra entry points, each with `name`, `port` and `protocol` (`TCP` or `UDP`, default `TCP`). Only configured ports can be used by the `tcp-route` trait. The built-in entry points are `8000` (HTTP) and `8443` (HTTPS). | []object | false |
 upgradeCRD | Upgrade the CRDs when upgrading Traefik. | bool | false | false

### Open the Traefik dashboard

Forward a local port to the dashboard:

```bash
vela port-forward -n vela-system addon-traefik
```

Expected output:

```bash
Forwarding from 127.0.0.1:9000 -> 9000
Forwarding from [::1]:9000 -> 9000

Forward successfully! Opening browser ...
Handling connection for 9000
```

Then open `http://127.0.0.1:9000/dashboard/`.

## Expose a component over HTTP

Add the `http-route` trait. Each rule's `port` is the component's service port, so it must match a port the component exposes:

```yaml
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
        - type: http-route
          properties:
            domains:
              - example.domain.com
            rules:
              - path:
                  type: PathPrefix
                  value: /
                port: 8000
```

## Expose a component over HTTPS

The `https-route` trait reads the certificate from a Secret. Create it with the addon's `tls-certificate` config template, passing the certificate and private key base64-encoded:

```bash
vela config create example -t tls-certificate -n default cert=<CERT_BASE64> key=<KEY_BASE64>
```

This writes the Secret `default/example` with the keys `tls.crt` and `tls.key`. Name it in the trait's `secrets`:

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
        - type: https-route
          properties:
            domains:
              - example.domain.com
            rules:
              - path:
                  type: PathPrefix
                  value: /
                port: 8000
            secrets:
              - name: example
```

A Secret in another namespace takes `namespace` beside `name`.

## Definitions

### http-route(trait)

Defines HTTP rules for mapping requests from a Gateway to an Application.

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

Defines HTTPS rules for mapping requests from a Gateway to an Application.

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

Defines TCP rules for mapping requests from a Gateway to an Application.


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
