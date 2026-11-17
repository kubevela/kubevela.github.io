---
title: KubeVela v1.10.x
sidebar_label: Overview
description: Status, releases and pre-releases of KubeVela v1.10.
---

**Status:** Supported. **GA:** 2025-02-05.

**Upgrade guide:** [Upgrade from v1.9 to v1.10](../../upgrade/v1.10/index.md)

:::caution
Don't use v1.10.4. It breaks components whose templates use `import` statements; upgrade straight to v1.10.5 or later.
:::

## Releases

| Version | Date | Summary |
| ------- | ---- | ------- |
| [v1.10.9](./v1.10.9.md) | 2026-06-30 | Security fix for the Terraform remote configuration loader; `status.details` imports compile. |
| [v1.10.8](./v1.10.8.md) | 2026-03-31 | Fixes for `status.details` dynamic keys, apply-once resources and `appliedResources`. |
| [v1.10.7](./v1.10.7.md) | 2026-02-18 | Component removals are persisted and reflected in status. |
| [v1.10.6](./v1.10.6.md) | 2025-12-03 | Preserves `last-applied-configuration` for shared resources. |
| [v1.10.5](./v1.10.5.md) | 2025-11-11 | Fixes the v1.10.4 regression with imports in status validation; namespace admins can't use `vela-system` definitions without permission. |
| [v1.10.4](./v1.10.4.md) | 2025-10-01 | **Deprecated.** Kubernetes v0.31 libraries, enhanced status reporting, Application status metrics, definition permission validation. |
| [v1.10.3](./v1.10.3.md) | 2025-05-12 | Go 1.23.8, StatefulSet component, CueX in component and trait templates, signed releases with SBOMs. |
| [v1.10.2](./v1.10.2.md) | 2025-03-03 | Controller metrics and ServiceMonitor values; new Helm repository URL. |
| [v1.10.1](./v1.10.1.md) | 2025-02-12 | Fixes the addon check. |
| [v1.10.0](./v1.10.0.md) | 2025-02-05 | CUE v0.9.2 and the CueX engine, semantic versions for definitions, CUE required fields, Kubernetes v0.29 libraries. |

## Pre-releases

| Tag | Date |
| --- | ---- |
| [v1.10.0-alpha.1](https://github.com/kubevela/kubevela/releases/tag/v1.10.0-alpha.1) | 2024-10-14 |
