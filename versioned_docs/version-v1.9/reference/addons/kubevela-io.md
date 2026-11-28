---
title: KubeVela.io
---

This addon runs a copy of the KubeVela documentation site in your cluster, for air-gapped environments.

It deploys the `oamdev/kubevela-io:latest` image in `vela-system`, with two Services in front of it: `kubevela-io` (ClusterIP) and `kubevela-io-np` (NodePort), both on port 80.

## Install

```shell
vela addon enable kubevela-io
```

To remove it:

```shell
vela addon disable kubevela-io
```

## Open the site

Forward a local port to the site:

```shell
vela port-forward addon-kubevela-io -n vela-system
```

Or use the NodePort Service. Find its port:

```shell
kubectl get svc kubevela-io-np -n vela-system
```

The node port is the second number under `PORT(S)`, for example `31234` in `80:31234/TCP`. Open `http://<node IP>:<node port>`. You can also put an Ingress in front of the `kubevela-io` Service.

## Use your own image

The addon has no parameters, so the image is set in its files. In an air-gapped environment, push `oamdev/kubevela-io:latest` (or an image you built from the [docs source](https://github.com/kubevela/kubevela.github.io)) to your own registry. Then copy the addon from the [catalog](https://github.com/kubevela/catalog/tree/master/addons/kubevela-io), change the image in `resources/deployment/kubevela-io-deployment.yaml`, and enable it from the local directory:

```shell
vela addon enable ./kubevela-io
```
