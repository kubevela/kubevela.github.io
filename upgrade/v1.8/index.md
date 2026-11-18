---
title: Upgrade from v1.7 to v1.8
sidebar_label: v1.7 to v1.8
---

These isn't too much work to be done for upgrading from v1.7.x to v1.8.x for usage.

1. Upgrade your kubevela chart

```
helm repo add kubevela https://charts.kubevela.net/core
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.8.2 --wait
```
