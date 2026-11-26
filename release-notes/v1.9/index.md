---
title: KubeVela v1.9.x
sidebar_label: Overview
description: Status, releases and pre-releases of KubeVela v1.9.
---

**Status:** End of life. **GA:** 2023-06-15. Later patches (v1.9.12 to v1.9.15) carry backported security and stability fixes; v1.9.15 also has breaking changes, so read its release notes before upgrading. Upgrade to a supported version.

**Upgrade guide:** [Upgrade from v1.8 to v1.9](../../upgrade-guides/v1.9/index.md)

:::caution
Don't use v1.9.10. It has a fatal client bug ([#6493](https://github.com/kubevela/kubevela/issues/6493)); use v1.9.11 or later.
:::

## Releases

| Version | Date | Summary |
| ------- | ---- | ------- |
| [v1.9.15](./v1.9.15.md) | 2026-11-21 | vela-core manages its serving certificates (installs on Kubernetes 1.36 and later), and workflow HTTP refuses cloud-metadata and link-local addresses. |
| [v1.9.14](./v1.9.14.md) | 2026-06-30 | Security fix for the Terraform remote configuration loader; preserves `last-applied-configuration` for shared resources. |
| [v1.9.13](./v1.9.13.md) | 2024-09-29 | Workflow v0.6.1, fixing suspend. |
| [v1.9.12](./v1.9.12.md) | 2024-09-19 | Quieter startup logs and a `vela-cli` volumes fix. |
| [v1.9.11](./v1.9.11.md) | 2024-04-22 | Fixes the v1.9.10 client bug and the `startup-probe` trait. |
| [v1.9.10](./v1.9.10.md) | 2024-03-15 | **Don't use.** zstd encoder concurrency fix and different service and container ports. |
| [v1.9.9](./v1.9.9.md) | 2024-01-22 | Fixes for the `hpa` trait and `cron-task`, and loading local ComponentDefinitions. |
| [v1.9.8](./v1.9.8.md) | 2024-01-02 | Labels and annotations on the `gateway` trait; Helm template namespace fix. |
| [v1.9.7](./v1.9.7.md) | 2023-11-02 | `vela workflow list`, `apply-component` namespace, webhook validation of CUE templates, terraform-controller v0.8.0. |
| [v1.9.6](./v1.9.6.md) | 2023-08-15 | Reverts `apply-component` namespace support; removes unused controller options. |
| [v1.9.5](./v1.9.5.md) | 2023-07-28 | Offline dry-run with the `deploy` step. |
| [v1.9.4](./v1.9.4.md) | 2023-07-12 | Workflow v0.6.0, `container-ports` trait, arm64 build fix. |
| [v1.9.3](./v1.9.3.md) | 2023-07-04 | `vela install` switches between the old and new registry; reverts the applicator change. |
| [v1.9.2](./v1.9.2.md) | 2023-06-29 | `vela dry-run` with definitions outside `vela-system`. |
| [v1.9.1](./v1.9.1.md) | 2023-06-23 | Addon registry on `kubevela.github.io` with redirects; `vela top` crash fix. |
| [v1.9.0](./v1.9.0.md) | 2023-06-15 | Legacy API removal, registry move to GitHub, pause reconcile, multiple policies of one type, resource update policy. |

## Pre-releases

| Tag | Date |
| --- | ---- |
| [v1.9.0-beta.3](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-beta.3) | 2023-06-09 |
| [v1.9.0-beta.2](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-beta.2) | 2023-06-02 |
| [v1.9.0-beta.1.post1](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-beta.1.post1) | 2023-05-30 |
| [v1.9.0-beta.1](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-beta.1) | 2023-05-26 |
| [v1.9.0-alpha.5](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-alpha.5) | 2023-05-19 |
| [v1.9.0-alpha.4](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-alpha.4) | 2023-05-16 |
| [v1.9.0-alpha.3](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-alpha.3) | 2023-04-28 |
| [v1.9.0-alpha.2](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-alpha.2) | 2023-04-23 |
| [v1.9.0-alpha.1](https://github.com/kubevela/kubevela/releases/tag/v1.9.0-alpha.1) | 2023-04-18 |
