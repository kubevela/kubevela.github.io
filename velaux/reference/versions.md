---
title: Versions
description: Which VelaUX each KubeVela release gets, what each VelaUX release is built against, and how to upgrade.
---

VelaUX is released on its own, and reaches a cluster as the `velaux` addon. The addon registry holds one version at a time, so what you get is whatever the registry holds when you run `vela addon enable velaux`, not something fixed by the KubeVela release.

## VelaUX for each KubeVela release

| KubeVela | VelaUX addon | Notes |
| --- | --- | --- |
| v1.12 | v1.9.5 | Works, but doesn't cover what 1.12 adds: sources and modules, the ConfigTemplate CRD, the `+ui` parameter markers, config Secrets that 1.12 adopted. |
| v1.11 | v1.9.5 | |
| v1.10 | v1.9.5 | |
| v1.9 | v1.9.5 | The addon needs KubeVela v1.9.0 or later (`system.vela: ">=v1.9.0"` in its metadata). |

The same table, with the other products, is in the [release notes overview](/docs/next/release-notes/overview#docs-for-the-other-products).

## VelaUX releases

Each VelaUX server is built against a KubeVela and Workflow release, which sets the API it understands.

| VelaUX | Released | Built with | KubeVela | Workflow |
| --- | --- | --- | --- | --- |
| [v1.9.5](https://github.com/kubevela/velaux/releases/tag/v1.9.5) | 2025-03-13 | Go 1.22 | v1.9.4 | v0.6.0 |
| [v1.9.4](https://github.com/kubevela/velaux/releases/tag/v1.9.4) | 2024-07-11 | Go 1.22 | v1.9.4 | v0.6.0 |
| [v1.9.3](https://github.com/kubevela/velaux/releases/tag/v1.9.3) | 2023-08-08 | Go 1.19 | v1.9.4 | v0.6.0 |
| [v1.9.2](https://github.com/kubevela/velaux/releases/tag/v1.9.2) | 2023-07-22 | Go 1.19 | v1.9.1 | v0.6.0 |
| [v1.9.1](https://github.com/kubevela/velaux/releases/tag/v1.9.1) | 2023-06-26 | Go 1.19 | v1.9.1 | v0.6.0 |

[v1.12.0-alpha.1](https://github.com/kubevela/velaux/releases/tag/v1.12.0-alpha.1) (2026-11-05) is a pre-release of the VelaUX that follows KubeVela 1.12. It isn't in the addon registry, and these docs don't cover it yet.

## Upgrade

Upgrading VelaUX is upgrading the addon:

```shell
vela addon upgrade velaux
```

It keeps the parameters you enabled it with, unless you pass new ones, and VelaUX keeps its data: projects, users, applications and their history stay where `dbType` put them. See [Upgrade VelaUX](../operate/upgrade.md) for the details, including how to pin a version.

Upgrade notes:

- **To v1.9.5 from earlier 1.9 releases:** no data migration; upgrade the addon.
- **Upgrading KubeVela to 1.12 with VelaUX 1.9.5 installed:** nothing to do for VelaUX. Applications that use the 1.12 additions still deploy, but VelaUX shows only what 1.9.5 knows about.
