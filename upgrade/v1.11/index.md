---
title: Upgrade from v1.10 to v1.11
sidebar_label: v1.10 to v1.11
---

Read the [v1.11.0 release notes](/release-notes/v1.11/v1.11.0/) before you upgrade.

v1.11.x upgrades the underlying CUE engine from v0.9.2 to v0.14.1. CUE v0.14 turns previously-tolerated syntax (list arithmetic, unquoted error field labels) into hard errors, and enables two new experimental evaluator behaviors (`evalv3`, `keepvalidators`) that can change how existing definitions behave.

:::note
This upgrade is non-breaking by default. The controller renders legacy definitions through an automatic compatibility layer, and the Helm chart disables the two breaking CUE experiments out of the box. See [CUE 0.14 Compatibility Layer](cue-compatibility-layer.md) for the full reference, flags, and CLI tooling to find and permanently fix affected definitions.
:::

1. Upgrade your kubevela chart

```
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.11.0 --wait
```

2. (Optional, recommended) Scan for definitions relying on the compatibility layer, and permanently upgrade them:

```
vela def compatibility-check definitions
vela def upgrade my-definition.cue
```

v1.11 also raises the Go toolchain and Kubernetes client library versions. If you build custom controllers, providers or addons against KubeVela's Go modules, see [Dependencies](/release-notes/v1.11/v1.11.0/#dependencies) in the v1.11.0 release notes.
