---
title: Air-gapped Installation
---

`velad` provides the air-gapped installation experience, it's now the [default installation guide](../../install.mdx#1-install-velad).


## Images to mirror

To install the vela-core chart v1.11.2 without internet access, mirror these images into your registry, by digest where one is given, and point the chart's image values at your copies:

| Image | Used by |
| ----- | ------- |
| `oamdev/vela-core:v1.11.2@sha256:899a35de58c8855f55338cd530111efb438d16fee56e18e44b62696d57bf695e` | The controller. |
| `oamdev/cluster-gateway:v1.9.2@sha256:7cc34439263689a4d11042db38ce54f5da893d8e533c01917f2450dcf11a0544` | The cluster-gateway, when multi-cluster is on (the default). |
| `alpine/k8s:1.34.13@sha256:4011c68d73de6803987509ad1ab9520124a27e31484e3f0e45f95a74ecac7a45` | The Job that installs the built-in definitions on install and upgrade. |
| `ghcr.io/osscontainertools/kaniko:v1.29.1@sha256:e7cba1f7e70c01c8ee1cbe622d07990c04dea550430c4c81319d26679226cd37` | The default image of the `build-push-image` workflow step; only if you use it without `kanikoExecutor`. |
| `oamdev/vela-cli:v1.6.4` | The default image of the `vela-cli` workflow step; only if you use it without `image`. |

From v1.11.1 the chart no longer needs `oamdev/kube-webhook-certgen`: vela-core makes its own certificates.

## Addon

Please refer to [Enable Addon without Internet Access](./enable-addon-offline.md).