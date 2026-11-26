---
title: Upgrade from v1.7 to v1.8
sidebar_label: v1.7 to v1.8
---

There isn't much to do when upgrading from v1.7.x to v1.8.x.

1. Upgrade the CRDs first. v1.8 changes the Application and ApplicationRevision CRDs, and Helm does
   not upgrade the CRDs in a chart's `crds/` directory:

```
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.8.2/charts/vela-core/crds/core.oam.dev_applicationrevisions.yaml
kubectl apply --server-side --force-conflicts -f https://raw.githubusercontent.com/oam-dev/kubevela/v1.8.2/charts/vela-core/crds/core.oam.dev_applications.yaml
```

2. Upgrade your kubevela chart

```
helm repo remove kubevela 2>/dev/null || true
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.8.2 --wait
```
