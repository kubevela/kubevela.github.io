---
title: Expose an Application
---

Once the application runs, you need a way to reach it. This page shows five ways, from a quick test on your own machine to a public domain with TLS.

| Method | Needs | Protocols | Use when |
| --- | --- | --- | --- |
| [Port forward](#port-forward) | Nothing | TCP | You're testing from your own machine. |
| [NodePort](#nodeport) | Nodes you can reach | TCP, UDP | You're on a local or bare-metal cluster with no load balancer. |
| [LoadBalancer](#loadbalancer) | A cloud provider (AWS, Azure, Alibaba Cloud, ...) or a load balancer such as MetalLB | TCP, UDP | One service needs its own public IP. |
| [`gateway` trait (Ingress)](#gateway-trait-ingress) | An ingress controller in the cluster | HTTP, HTTPS | Several services share one address, routed by domain and path. |
| [Traefik routes](#traefik-routes) | The `traefik` addon | HTTP, HTTPS, TCP | You want Gateway API routes, or TCP behind one shared address. |

Every example below deploys the same component, `express-server`, which serves a "Hello World" page on port 8000. In VelaUX, you set the same properties on the component, and add the traits with **Add Trait**.

## Port forward

Deploy the application with no extra settings:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
            expose: true
```

Forward a local port to it, then open `http://127.0.0.1:8000` or, in another terminal:

```shell
vela port-forward webservice-app 8000:8000
curl http://127.0.0.1:8000/
```

<details>
<summary>expected output</summary>

```console
<xmp>
Hello World
...
</xmp>
```
</details>

The forward lasts as long as the command runs, so it's for testing only.

## NodePort

Set `exposeType: NodePort` on the component. Each exposed port opens on every node; set `nodePort` to pick the port (from 30000 to 32767), or leave it out and Kubernetes picks one.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
            expose: true
            nodePort: 30080
        exposeType: NodePort
```

Call it on any node's address:

```shell
curl http://<node address>:30080/
```

The response is the same "Hello World" page.

## LoadBalancer

Set `exposeType: LoadBalancer` on the component. The component's Service gets an external address from your cloud provider.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
            expose: true
        exposeType: LoadBalancer
```

Find the address and call it:

```shell
kubectl get service express-server
curl http://<EXTERNAL-IP>:8000/
```

If `EXTERNAL-IP` stays `<pending>`, the cluster has no load balancer; use one of the other methods.

For a component type other than `webservice`, the same applies: its definition must create a Service of type `LoadBalancer`.

## `gateway` trait (Ingress)

Needs an ingress controller in the cluster. The trait uses the `nginx` ingress class unless you set `class`.

The `gateway` trait creates a Service and an Ingress for the component. `http` maps each request path to a container port, so here requests to `/` go to port 8000. Leave `expose` off the port: the trait creates the Service itself, with the component's name.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

`vela status webservice-app` shows the address on the trait (`Visiting URL: testsvc.example.com, IP: <address>`) once the ingress controller assigns one. Call it with the domain in the `Host` header:

```shell
curl -H "Host: testsvc.example.com" http://<address>/
```

The response is the same "Hello World" page. See the [gateway trait](../end-user/traits/references.md#gateway) for TLS, path types and more than one gateway on a component.

## Traefik routes

The `traefik` addon installs Traefik with Gateway API support, and adds three traits: [`http-route`](/addons/traefik#http-routetrait), [`https-route`](/addons/traefik#https-routetrait) and [`tcp-route`](/addons/traefik#tcp-routetrait).

```shell
vela addon enable traefik serviceType=LoadBalancer
```

Leave out `serviceType=LoadBalancer` on a cluster with no load balancer; the examples then need `kubectl port-forward` to the `traefik` Service instead. Find Traefik's address with:

```shell
kubectl get service traefik -n vela-system
```

See [Traefik](/addons/traefik) for the addon's other settings.

### HTTP

Give at least one rule. Each rule's `port` is a port on the component's Service, so the port needs `expose: true`; a rule can also match on `path` and `headers`.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
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
              - testsvc.example.com
            rules:
              - port: 8000
```

The route attaches to the addon's `traefik-gateway` Gateway on its `web` listener; set `gatewayName` and `listenerName` to use another one.

```shell
curl -H "Host: testsvc.example.com" http://<traefik address>/
```

The response is the same "Hello World" page.

### HTTPS

`https-route` reads the certificate from a TLS Secret in the application's namespace, and each entry in `secrets` names one. Create it first:

```shell
kubectl create secret tls kubevela --cert=tls.crt --key=tls.key
```

In VelaUX, you can create the Secret as a **TLS Certificate** under **Admin Dashboard > Global Configs** instead (the config template comes with the `traefik` addon); the Secret takes the name you give the certificate.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
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
              - testsvc.example.com
            secrets:
              - name: kubevela
            rules:
              - port: 8000
```

The trait creates its own Gateway listening on `TLSPort` (default `8443`, Traefik's `websecure` entry point, which the `traefik` Service publishes on port 443).

```shell
curl -k --resolve testsvc.example.com:443:<traefik address> https://testsvc.example.com/
```

Drop `-k` once the certificate is signed by a CA your machine trusts.

### TCP

Use `tcp-route` for a service with its own protocol, such as Redis, behind Traefik's shared address. Each rule's `gatewayPort` must be a Traefik entry point, so add one when you enable the addon:

```shell
vela addon enable traefik serviceType=LoadBalancer 'entryPoints[0].name=redis' 'entryPoints[0].port=16379'
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: redis-app
spec:
  components:
    - name: redis
      type: webservice
      properties:
        image: redis:7
        ports:
          - port: 6379
            expose: true
      traits:
        - type: tcp-route
          properties:
            rules:
              - gatewayPort: 16379
                port: 6379
```

`port` is the port on the component's Service, and `serviceName` (default: the component's name) picks a different Service.

```shell
redis-cli -h <traefik address> -p 16379 ping
```

```console
PONG
```
