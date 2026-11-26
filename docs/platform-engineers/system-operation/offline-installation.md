---
title: Air-gapped Installation
---

`velad` provides the air-gapped installation experience, it's now the [default installation guide](../../install.mdx#1-install-velad).

## Images to mirror

If you install the `vela-core` Helm chart yourself, mirror these images and set `imageRegistry` to your registry. The chart prefixes every image it runs with it.

| Image | Used by | Helm value |
|---|---|---|
| `oamdev/vela-core`, at the chart's version | the controller | `image.repository`, `image.tag` |
| `oamdev/cluster-gateway:v1.10.0-alpha.1` | multi-cluster | `multicluster.clusterGateway.image` |
| `alpine/k8s:1.34.13` | the Job that applies the built-in definitions | `builtinDefinitions.job.image` |
| `oamdev/hello-world:v1`, `oamdev/alpine-k8s:1.18.2` | `helm test` | `test.app`, `test.k8s` |

The chart pins `cluster-gateway` and `alpine/k8s` by digest, so copy them in a way that keeps their digests (a copy of the whole manifest list, not a rebuilt image).

Some built-in definitions run their own image, which `imageRegistry` does not change. Mirror it and set the definition's parameter if you use the definition:

| Image | Definition | Parameter |
|---|---|---|
| `ghcr.io/osscontainertools/kaniko:v1.29.1` (by digest) | `build-push-image` step | `kanikoExecutor` |
| `oamdev/vela-cli:v1.6.4` | `vela-cli` step | `image` |
| `nocalhost-docker.pkg.coding.net/nocalhost/dev-images/<language>:latest` | `nocalhost` trait | `image` (a full image name instead of `go`, `java`, `python`, `node` or `ruby`) |

The `restart-workflow` step runs `bitnami/kubectl:latest` and has no parameter for it. Mirror it under the same name, or edit the definition to point at your registry.


## Addon

Please refer to [Enable Addon without Internet Access](./enable-addon-offline.md).