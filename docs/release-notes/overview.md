---
title: Release Notes
sidebar_label: Overview
description: KubeVela release notes, supported versions and compatibility.
---

Each KubeVela minor version has its own section, with a page for every GA and patch release. Pre-releases (alpha, beta and rc tags) don't get their own pages; each minor version's overview lists them, and their changes are rolled up into the `.0` page.

Before you upgrade, read the release notes for the version you are moving to, then follow its [upgrade guide](../upgrade/overview.mdx).

## Supported versions

KubeVela maintains the last two minor releases; see [Release Process and Cadence](../contributor/release-process.md).

| Version | GA date | Latest patch | Status | Kubernetes | Upgrade guide |
| ------- | ------- | ------------ | ------ | ---------- | ------------- |
| [v1.12.x](./v1.12/index.md) | Unreleased | v1.12.0-alpha.1 | In development | `>= v1.25`, tested with v1.37 | [v1.11 to v1.12](../upgrade/v1.12/index.md) |
| [v1.11.x](./v1.11/index.md) | 2026-07-20 | [v1.11.1](./v1.11/v1.11.1.md) | Supported | `>= v1.19, <= v1.31` | [v1.10 to v1.11](../upgrade/v1.11/index.md) |
| [v1.10.x](./v1.10/index.md) | 2025-02-05 | [v1.10.9](./v1.10/v1.10.9.md) | Supported | `>= v1.19, <= v1.29`; from v1.10.4 built on the v1.31 libraries | [v1.9 to v1.10](../upgrade/v1.10/index.md) |
| [v1.9.x](./v1.9/index.md) | 2023-06-15 | [v1.9.14](./v1.9/v1.9.14.md) | End of life | `>= v1.19, <= v1.29` | [v1.8 to v1.9](../upgrade/v1.9/index.md) |

Releases before v1.9 are documented only on [GitHub Releases](https://github.com/kubevela/kubevela/releases). Their upgrade steps are under [Upgrade > Older versions](../upgrade/v1.8/index.md).

## Component versions

| Version | Go | CUE | `k8s.io/client-go` | `controller-runtime` | `kubevela/workflow` |
| ------- | -- | --- | ------------------ | -------------------- | ------------------- |
| v1.12.0 (release-1.12) | 1.27.1 | v0.14.1 | v0.37.1 | v0.25 | v0.8.0-alpha |
| v1.11.1 | 1.23.8 | v0.14.1 | v0.31.10 | v0.19.7 | v0.7.3 |
| v1.11.0 | 1.23.8 | v0.14.1 | v0.31.10 | v0.19.7 | v0.7.2 |
| v1.10.9 | 1.23.8 | v0.9.2 | v0.31.10 | v0.19.7 | v0.6.3 |
| v1.10.0 | 1.22.0 | v0.9.2 | v0.29.2 | v0.17.6 | v0.6.1 |
| v1.9.14 | 1.19 | v0.5.0 | v0.26.3 | v0.14.6 | v0.6.1 |
| v1.9.0 | 1.19 | v0.5.0 | v0.26.3 | v0.14.6 | v0.5.1 |

These matter if you build controllers, providers or addons against KubeVela's Go modules.

## How the notes are organised

A minor release page (`vX.Y.0`) has these sections, and leaves out any that are empty:

- **Summary** and **Compatibility**.
- **Breaking changes**: changes that need action, each linking to the step in the upgrade guide.
- **Behaviour changes**: changes in what the controller, the webhook or Application status do.
- **CRD changes**, **Controller flags and feature gates**, **Helm chart changes** and **CLI changes**.
- **New features**, **Bug fixes**, **Deprecations and removals**, **Dependencies** and **Known issues and quirks**.

A patch release page (`vX.Y.Z`) has a shorter set: Summary, Breaking or behaviour changes, Helm chart and flag changes, Bug fixes and Known issues.

The release notes say what changed and link to the Reference pages for the details. The Reference pages are versioned with the docs, so the version selector shows each release's state:

- Built-in definitions: [components](../end-user/components/references.md), [traits](../end-user/traits/references.md), [policies](../end-user/policies/references.md) and [workflow steps](../end-user/workflow/built-in-workflow-defs.md).
- [Controller Flags and Feature Gates](../platform-engineers/system-operation/bootstrap-parameters.md).
- [vela CLI](../cli/vela.md).
