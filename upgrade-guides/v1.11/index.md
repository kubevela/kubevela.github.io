---
title: Upgrade from v1.10 to v1.11
sidebar_label: v1.10 to v1.11
---

Read the [v1.11.0 release notes](../../release-notes/v1.11/v1.11.0.md) before you upgrade.

v1.11.x upgrades the underlying CUE engine from v0.9.2 to v0.14.1. CUE v0.14 turns previously-tolerated syntax (list arithmetic, unquoted error field labels) into hard errors, and enables two new experimental evaluator behaviors (`evalv3`, `keepvalidators`) that can change how existing definitions behave.

:::note
The CUE engine change is non-breaking by default. The controller renders legacy definitions through an automatic compatibility layer, and the Helm chart disables the two breaking CUE experiments out of the box. See [CUE 0.14 Compatibility Layer](cue-compatibility-layer.md) for the full reference, flags, and CLI tooling to find and permanently fix affected definitions. v1.11 also changes the Application `Ready` condition and turns `MultiStageComponentApply` on; see [Behaviour changes](../../release-notes/v1.11/v1.11.0.md#behaviour-changes).
:::

1. Upgrade the CRDs first. v1.11 changes the Application, ApplicationRevision, DefinitionRevision,
   PolicyDefinition, TraitDefinition and Workflow CRDs, and Helm does not upgrade the CRDs in a
   chart's `crds/` directory:

```
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm pull kubevela/vela-core --version 1.11.2 --untar
kubectl apply --server-side --force-conflicts -f vela-core/crds/
```

2. Upgrade your kubevela chart

```
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.11.2 --wait
```

3. (Optional, recommended) Scan for definitions relying on the compatibility layer, and permanently upgrade them:

```
vela def compatibility-check definitions
vela def upgrade my-definition.cue -o my-definition.upgraded.cue
```

v1.11 also raises the Go toolchain and Kubernetes client library versions. If you build custom controllers, providers or addons against KubeVela's Go modules, see [Dependencies](../../release-notes/v1.11/v1.11.0.md#dependencies) in the v1.11.0 release notes.
