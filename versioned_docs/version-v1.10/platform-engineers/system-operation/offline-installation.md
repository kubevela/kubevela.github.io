---
title: Air-gapped Installation
---

`velad` provides the air-gapped installation experience, it's now the [default installation guide](../../installation/standalone.mdx).


## Images to mirror

To install the vela-core chart v1.10.10 without internet access, mirror these images into your registry, by digest where one is given, and point the chart's image values at your copies:

| Image | Used by |
| ----- | ------- |
| `oamdev/vela-core:v1.10.10@sha256:9442ed1be014c618ac81e1ce6186b52610be78128299da5b7b7d874be50f9297` | The controller. |
| `oamdev/cluster-gateway:v1.9.2@sha256:7cc34439263689a4d11042db38ce54f5da893d8e533c01917f2450dcf11a0544` | The cluster-gateway, when multi-cluster is on (the default). |
| `ghcr.io/osscontainertools/kaniko:v1.29.1@sha256:e7cba1f7e70c01c8ee1cbe622d07990c04dea550430c4c81319d26679226cd37` | The default image of the `build-push-image` workflow step; only if you use it without `kanikoExecutor`. |
| `oamdev/vela-cli:v1.6.4` | The default image of the `vela-cli` workflow step; only if you use it without `image`. |

The two workflow step images are not chart values. Point a step at your copy with its own property, `kanikoExecutor` on `build-push-image` or `image` on `vela-cli`, in each step that uses it.

From v1.10.10 the chart no longer needs `oamdev/kube-webhook-certgen`: vela-core makes its own certificates.

## Addon

Please refer to [Enable Addon without Internet Access](./enable-addon-offline.md).