---
title: Upgrade from v1.9 to v1.10
sidebar_label: v1.9 to v1.10
---

Read the [v1.10.0 release notes](/release-notes/v1.10/v1.10.0/) before you upgrade.

:::caution
Upgrade to v1.10.5 or later, not v1.10.4. v1.10.4 breaks components whose templates use `import`
statements. The commands below use v1.10.9, the latest v1.10 patch.
:::

## Check your definitions

v1.10 renders definitions with the CueX engine on CUE v0.9.2 (v1.9 used CUE v0.5.0). Before you
upgrade, check that your custom ComponentDefinitions, TraitDefinitions, PolicyDefinitions and
WorkflowStepDefinitions still compile, for example with `vela def vet <file>` using the v1.10 CLI.

Also check:

- `ref-objects` components that reference resources outside the `core.oam.dev` group and the empty
  group must set `group`; see [Distribute Reference Objects](/docs/end-user/components/ref-objects/).
- If you pass `--leader-election-resource-lock` to the controller, remove it. The flag no longer
  exists and the controller fails to start with it.

## Upgrade steps

1. Upgrade the CRDs, please make sure you upgrade the CRDs first before upgrade the helm chart. v1.10
   adds the `packages.cue.oam.dev` CRD.

```
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm pull kubevela/vela-core --version 1.10.9 --untar
kubectl apply -f vela-core/crds/
```

2. Upgrade your kubevela chart

```
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.10.9 --wait
```

3. Download and upgrade to the corresponding CLI

```
curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.10.9
```

4. Upgrade VelaUX or other addon

```
vela addon upgrade velaux
```
