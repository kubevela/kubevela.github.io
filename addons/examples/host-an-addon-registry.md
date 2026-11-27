---
title: Host Your Own Addon Registry
---

The `chartmuseum` addon runs [ChartMuseum](https://chartmuseum.com/), a Helm chart repository, in your cluster. KubeVela can use a Helm repository as an addon registry, so this gives you a place to publish your own addons, with versions, without depending on the community catalog.

This publishes the `greeter` addon from [Write an Addon from Scratch](./write-an-addon.md), so build that first and disable it if it's still enabled (`vela addon disable greeter`). Run the commands from the directory that holds `greeter/`.

## Enable the addon

```shell
vela addon enable chartmuseum
```

```console
Addon chartmuseum enabled successfully.
Please access addon-chartmuseum from the following endpoints:
+---------+-------------+---------------------------------+-------------------------------------+-------+
| CLUSTER |  COMPONENT  |    REF(KIND/NAMESPACE/NAME)     |              ENDPOINT               | INNER |
+---------+-------------+---------------------------------+-------------------------------------+-------+
| local   | chartmuseum | Service/vela-system/chartmuseum | http://chartmuseum.vela-system:8080 | true  |
+---------+-------------+---------------------------------+-------------------------------------+-------+
```

ChartMuseum listens inside the cluster only. Forward a local port to it, and leave this running in its own terminal:

```shell
kubectl port-forward -n vela-system svc/chartmuseum 8090:8080
```

## Add it as a registry and publish

```shell
vela addon registry add my-registry --type helm --endpoint=http://localhost:8090
vela addon push greeter my-registry
vela addon list | grep -E 'NAME|greeter'
```

```console
Successfully add an addon registry my-registry
Pushing greeter-0.1.0.tgz to my-registry(http://localhost:8090)... Done
NAME                     	REGISTRY   	DESCRIPTION                                                    	AVAILABLE-VERSIONS           	STATUS
greeter                  	my-registry	An HTTP greeter, and the greeter component type to run your ...	[0.1.0]                      	-
```

`vela addon push` packages the directory as `greeter-<version>.tgz`, with the version from `metadata.yaml`, and uploads it.

## Enable from the registry

Prefix the name with the registry, so `vela` doesn't look in the community catalog. Run it from a directory with no `greeter/` in it: when a directory of that name exists, `vela addon enable greeter` and `vela addon upgrade greeter` use the directory instead of a registry.

```shell
vela addon enable my-registry/greeter message="Hello from my registry"
vela addon status greeter
```

```console
Addon greeter enabled successfully.
Please access addon-greeter from the following endpoints:
+---------+-----------+-----------------------------+---------------------------------+-------+
| CLUSTER | COMPONENT |  REF(KIND/NAMESPACE/NAME)   |            ENDPOINT             | INNER |
+---------+-----------+-----------------------------+---------------------------------+-------+
| local   | greeter   | Service/vela-system/greeter | http://greeter.vela-system:8080 | true  |
+---------+-----------+-----------------------------+---------------------------------+-------+
greeter: enabled (0.1.0)
==> Installed Clusters
[local]
==> Registry Name
my-registry
```

## Publish a new version

Bump `version` in `greeter/metadata.yaml` to `0.2.0` and push again. The registry keeps both:

```shell
vela addon push greeter my-registry
vela addon list | grep -E '^greeter'
```

```console
Pushing greeter-0.2.0.tgz to my-registry(http://localhost:8090)... Done
greeter                  	my-registry	An HTTP greeter, and the greeter component type to run your ...	[0.1.0, 0.2.0]               	enabled (0.1.0)
```

Upgrade to it. The parameters you enabled it with carry over:

```shell
vela addon upgrade greeter --version 0.2.0
vela addon status greeter
kubectl run curl -n vela-system --rm -i --restart=Never --image=curlimages/curl:8.11.1 -- -s http://greeter:8080
```

```console
Addon greeter enabled successfully.
greeter: enabled (0.2.0)
==> Installed Clusters
[local]
==> Registry Name
my-registry
Hello from my registry
```

## Clean up

```shell
vela addon disable greeter
vela addon registry delete my-registry
vela addon disable chartmuseum
```

The registry's URL is `localhost`, so only your machine can use it. To share it, expose ChartMuseum (its `serviceType` parameter, or an Ingress) and turn on `basicAuth`; [Build your Own Registry](../developer/addon-registry.md) covers that and the other registry types.

## Reference

- [chartmuseum addon](../chartmuseum.md)
