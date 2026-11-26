---
title: Access Application
---

Once the application runs, you need a way to reach it.

There are multiple ways to do this, for testing, such as Port Forward and Node Port. for production, such as LoadBalancer and via cluster gateway. This section focus on the production environment.

Every example below deploys the same component, `express-server`, which serves a "Hello World" page on port 8000.

## Use LoadBalancer by Cloud Provider

This way is only suitable for the cloud environment, such as Aliyun, AWS, and Azure.

For the webservice component, you only need to set the `exposeType` to `LoadBalancer`, it means this component will generate a Kubernetes Service with LoadBalancer type. After deployment, you could get the service endpoints.

For Example:

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

<details>
<summary>expected output</summary>

```console
<xmp>
Hello World
...
</xmp>
```
</details>

For other components, similarly, only need to generate the Kubernetes Service with LoadBalancer type.

## Use HTTP Domain by Ingress Gateway

Needs an ingress controller in the cluster.

Users could bound the `gateway` trait for the component to generate the Ingress. The trait creates the Service itself, so leave `expose` off the port. For example:

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

This means accessing the component service by domain `testsvc.example.com`, and every request path goes to the component's port 8000. Add more paths to `http` to send them to other ports.

`vela status webservice-app` shows the address on the trait once the ingress controller assigns one. Call it with the domain in the `Host` header:

```shell
curl -H "Host: testsvc.example.com" http://<address>/
```

The response is the same "Hello World" page.

In VelaUX, you can click the `Add Trait` button and select the `gateway` trait type. refer to follow configuration:

![gateway trait](https://kubevela.io/images/1.4/gateway-trait.jpg)

## Use Traefik

This way required installed the traefik addon firstly.

```bash
vela addon enable traefik serviceType=LoadBalancer
```

Find Traefik's address with `kubectl get service traefik -n vela-system`. Get more info about this addon, refer to [Traefik Addon](../reference/addons/traefik.md)

This addon provides three traits, including [http-route](../reference/addons/traefik.md#http-routetrait), [https-route](../reference/addons/traefik.md#https-routetrait) and [tcp-route](../reference/addons/traefik.md#tcp-routetrait).

### HTTP/HTTPS

For HTTP, you can click the `Add Trait` button and select the `http-route` trait type. refer to follow configuration:

![http route trait](https://kubevela.io/images/1.4/http-route-trait.jpg)

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
            gatewayName: traefik-gateway
            listenerName: web
```

Give at least one rule. The port is the same as the service port, the route condition supports the Header and Request Path.

```shell
curl -H "Host: testsvc.example.com" http://<traefik address>/
```

The response is the same "Hello World" page.

For HTTPS, you must create the TLS certificate firstly. In VelaUX, open the Integrations page, there is a `TLS Certificate` type. Click the New button, You need to provide the certificate public and private keys and encoded the content by base64.

![new tls](https://kubevela.io/images/1.4/new-tls.jpg)

This will generate the secret and distribute to managed clusters with the application. The secret name is the same as the name of the certificate configuration, and that is the name you give in `secrets` below.

Then open the application configuration page and click the `Add Trait` button and select the `https-route` trait type. refer to follow configuration:

![https route trait](https://kubevela.io/images/1.4/https-route-trait.jpg)

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
            TLSPort: 8443
            secrets:
              - name: kubevela
            rules:
              - port: 8000
```

```shell
curl -k --resolve testsvc.example.com:443:<traefik address> https://testsvc.example.com/
```

The response is the same "Hello World" page. Drop `-k` once the certificate is signed by a CA your machine trusts.

### TCP

This way is suitable for the service with the stream protocol, reusing the same public IP address. Each rule's `gatewayPort` must be a Traefik entry point, so add one when you enable the addon:

```shell
vela addon enable traefik serviceType=LoadBalancer 'entryPoints[0].name=redis' 'entryPoints[0].port=16379'
```

You can click the `Add Trait` button and select the `tcp-route` trait type. refer to follow configuration:

![tcp route trait](https://kubevela.io/images/1.4/tcp-route.jpg)

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

```shell
redis-cli -h <traefik address> -p 16379 ping
```

```console
PONG
```
