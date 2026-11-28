---
title: Expose an Application with ingress-nginx
---

The built-in `gateway` trait writes an Ingress for a component, but something has to serve it. The `ingress-nginx` addon installs the NGINX Ingress controller, which serves Ingresses of class `nginx`, the class `gateway` uses by default.

This runs on the cluster from the [Examples overview](./overview.md), created with Traefik turned off and ports 8080 and 8443 on your machine mapped to the cluster's load balancer:

```shell
k3d cluster create addons-demo --k3s-arg "--disable=traefik@server:0" -p "8080:80@loadbalancer" -p "8443:443@loadbalancer"
vela install --yes
```

## Enable the addon

`ingress-nginx` depends on `fluxcd`, which `vela addon enable` enables first. A `LoadBalancer` Service gets an address from k3s's built-in load balancer:

```shell
vela addon enable ingress-nginx serviceType=LoadBalancer
```

```console
Addon ingress-nginx enabled successfully.
Please access addon-ingress-nginx from the following endpoints:
+---------+---------------+----------------------------------------------------------------------+----------------------------------------------------------------------+-------+
| CLUSTER |   COMPONENT   |                       REF(KIND/NAMESPACE/NAME)                       |                               ENDPOINT                               | INNER |
+---------+---------------+----------------------------------------------------------------------+----------------------------------------------------------------------+-------+
| local   | nginx-ingress | Service/vela-system/nginx-ingress-ingress-nginx-controller           | http://10.211.0.3                                                    | false |
| local   | nginx-ingress | Service/vela-system/nginx-ingress-ingress-nginx-controller           | https://10.211.0.3                                                   | false |
| local   | nginx-ingress | Service/vela-system/nginx-ingress-ingress-nginx-controller-admission | https://nginx-ingress-ingress-nginx-controller-admission.vela-system | true  |
| local   | nginx-ingress | Service/vela-system/nginx-ingress-ingress-nginx-controller-metrics   | nginx-ingress-ingress-nginx-controller-metrics.vela-system:10254     | true  |
+---------+---------------+----------------------------------------------------------------------+----------------------------------------------------------------------+-------+
```

## Deploy

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: hello
  namespace: default
spec:
  components:
    - name: hello
      type: webservice
      properties:
        image: hashicorp/http-echo:1.0
        args: ["-text=hello from KubeVela", "-listen=:8080"]
        ports:
          - port: 8080
      traits:
        - type: gateway
          properties:
            domain: hello.localtest.me
            http:
              "/": 8080
EOF
```

```console
Applying an application in vela K8s object format...
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward hello
             SSH: vela exec hello
         Logging: vela logs hello
      App status: vela status hello
        Endpoint: vela status hello --endpoint
Application default/hello applied.
```

`localtest.me` and its subdomains resolve to `127.0.0.1`, so the host name works without editing `/etc/hosts`.

```shell
vela status hello --endpoint
```

```console
Please access hello from the following endpoints:
+---------+-----------+--------------------------+---------------------------+-------+
| CLUSTER | COMPONENT | REF(KIND/NAMESPACE/NAME) |         ENDPOINT          | INNER |
+---------+-----------+--------------------------+---------------------------+-------+
| local   | hello     | Service/default/hello    | http://hello.default:8080 | true  |
| local   | hello     | Ingress/default/hello    | http://hello.localtest.me | false |
+---------+-----------+--------------------------+---------------------------+-------+
```

## Try it

```shell
curl -s http://hello.localtest.me:8080/
```

```console
hello from KubeVela
```

A host name the Ingress doesn't know gets the controller's default backend:

```shell
curl -s -o /dev/null -w '%{http_code}\n' http://other.localtest.me:8080/
```

```console
404
```

Keep the cluster and the Application for the next example, [Serve HTTPS with cert-manager](./https-with-cert-manager.md). To clean up instead:

```shell
vela delete hello -y
vela addon disable ingress-nginx
```

## Reference

- [ingress-nginx addon](../nginx-ingress-controller.md)
- [`gateway` trait](/docs/end-user/traits/references#gateway)
