---
title: Nginx Ingress Controller
---


[Nginx Ingress controller](https://kubernetes.github.io/ingress-nginx/) is an Ingress controller for Kubernetes using NGINX as a reverse proxy and load balancer.

**Notice: If your cluster is already have any kinds of [ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/), you don't need to enable this addon.**

## Install

```shell
vela addon enable ingress-controller
```

## Setup with Specified Service Type

There are three service types for this addon which aligned with Kubernetes service, they're `ClusterIP`, `NodePort` and `LoadBalancer`.
By default, the service type is ClusterIP for security.

- `LoadBalancer` type requires your cluster has cloud LoadBalancer available.
    ```shell script
    vela addon enable ingress-controller serviceType=LoadBalancer
    ```
- `NodePort` type requires you can access the Kubernetes Node IP/Port.
    ```shell script
    vela addon enable ingress-controller serviceType=NodePort
    ```

## Get access address 

After specify the service type to `LoadBalancer` or `NodePort`, you can obtain the access address through `vela status`:

```shell
vela status addon-ingress-controller -n vela-system --endpoint
```

If the service type is `ClusterIP`, you use `vela port-forward` map the ingress-controller's port to local

```shell
vela port-forward -n vela-system addon-ingress-controller 9080:80
```

## Uninstall

```shell
vela addon disable ingress-controller
```

## Example

Use this addon by deploy an application:

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

Then access the gateway's endpoint will see:

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-endpoint>/version
Demo: V1
```