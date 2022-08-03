---
title: cert-manager
---

This addon is for cert-manager, which is managing the kubernetes certificates.

Install the certificate manager on your Kubernetes cluster to enable adding the webhook component (only needed once per Kubernetes cluster).

## Install

```shell
vela addon enable cert-manager
```

## Uninstall

```shell
vela addon disable cert-manager
```