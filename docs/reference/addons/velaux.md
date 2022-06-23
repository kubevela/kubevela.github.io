---
title: VelaUX
---

## Install

```shell script
vela addon enable velaux --version=v1.4.3
```

expected output:
```
Addon: velaux enabled Successfully.
```

VelaUX needs authentication. The default username is `admin` and the password is `VelaUX12345`. Please must set and remember the new password after the first login.

By default, VelaUX didn't have any exposed port.

## Visit VelaUX by port-forward

Port forward will work as a proxy to allow visiting VelaUX dashboard by local port.

```
vela port-forward addon-velaux -n vela-system
```

Choose `> Cluster: local | Namespace: vela-system | Component: velaux | Kind: Service` for visit.

## Setup with Specified Service Type

There are three service types for VelaUX addon which aligned with Kubernetes service, they're `ClusterIP`, `NodePort` and `LoadBalancer`.

By default the service type is ClusterIP for security.

If you want to expose your VelaUX dashboard for convenience, you can specify the service type.

- `LoadBalancer` type requires your cluster has cloud LoadBalancer available.
    ```shell script
    vela addon enable velaux serviceType=LoadBalancer
    ```
- `NodePort` type requires you can access the Kubernetes Node IP/Port.
    ```shell script
    vela addon enable velaux serviceType=NodePort
    ```

After the service type specified to `LoadBalancer` or `NodePort`, you can obtain the access address through `vela status`:

```
vela status addon-velaux -n vela-system --endpoint
```

The expected output:
```
+----------------------------+----------------------+
|  REF(KIND/NAMESPACE/NAME)  |       ENDPOINT       |
+----------------------------+----------------------+
| Service/vela-system/velaux | http://<IP address> |
+----------------------------+----------------------+
```

## Setup with Ingress domain

If you have ingress and domain available in your cluster, you can also deploy VelaUX by specify a domain like below:

```bash
vela addon enable velaux domain=example.doamin.com
```

The expected output:
```
I0112 15:23:40.428364   34884 apply.go:106] "patching object" name="addon-velaux" resource="core.oam.dev/v1beta1, Kind=Application"
I0112 15:23:40.676894   34884 apply.go:106] "patching object" name="addon-secret-velaux" resource="/v1, Kind=Secret"
Addon: velaux enabled Successfully.
Please access the velaux from the following endpoints:
+----------------------------+---------------------------+
|  REF(KIND/NAMESPACE/NAME)  |         ENDPOINT          |
+----------------------------+---------------------------+
| Ingress/vela-system/velaux | http://example.doamin.com |
+----------------------------+---------------------------+
```

If you enabled the traefik addon, you can set the `gatewayDriver` parameter to use the Gateway API.

```shell script
vela addon enable velaux domain=example.doamin.com gatewayDriver=traefik
```

## Setup with MongoDB database

VelaUX supports the Kubernetes and MongoDB as the database. the default is Kubernetes. We strongly advise using the MongoDB database to power your production environment.

```shell script
vela addon enable velaux dbType=mongodb dbURL=mongodb://<MONGODB_USER>:<MONGODB_PASSWORD>@<MONGODB_URL>
```

## Specify the addon image

By default the image repo is docker hub, you can specify the image repo by the `repo` parameter: 

```
vela addon enable velaux repo=acr.kubevela.net
```

You can try to specify the `acr.kubevela.net` image registry as an alternative, It's maintained by KubeVela team, and we will upload/sync the built-in addon image for convenience.

This feature can also help you to build your private installation, just upload all images to your private image registry.