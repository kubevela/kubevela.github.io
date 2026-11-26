---
title: Release Notes
sidebar_label: Overview
description: KubeVela release notes, supported versions and compatibility.
---

Each KubeVela minor version has its own section, with a page for its GA (general availability) release, the first stable `vX.Y.0`, and a page for every patch release (`vX.Y.1`, `vX.Y.2`, and so on). Pre-releases (alpha, beta and rc tags) don't get their own pages; each minor version's overview lists them, and their changes are rolled up into the `.0` page.

Before you upgrade, read the release notes for the version you are moving to, then follow its [upgrade guide](../upgrade-guides/overview.mdx).

## Supported versions

KubeVela maintains the last two minor releases; see [Release Process and Cadence](/docs/contributor/release-process/).

| Version | GA date | Latest release | Status | Kubernetes | Upgrade guide |
| ------- | ------- | ------------ | ------ | ---------- | ------------- |
| [v1.12.x](./v1.12/index.md) | Unreleased | v1.12.0-alpha.2 (pre-release) | In development | Tested with v1.37; `>= v1.25` implied by CEL rules, not tested | [v1.11 to v1.12](../upgrade-guides/v1.12/index.md) |
| [v1.11.x](./v1.11/index.md) | 2026-07-20 | [v1.11.2](./v1.11/v1.11.2.md) | Supported | Tested with v1.31 | [v1.10 to v1.11](../upgrade-guides/v1.11/index.md) |
| [v1.10.x](./v1.10/index.md) | 2025-02-05 | [v1.10.10](./v1.10/v1.10.10.md) | Supported | Tested with v1.29; from v1.10.4 built on the v1.31 libraries and tested with v1.31 | [v1.9 to v1.10](../upgrade-guides/v1.10/index.md) |
| [v1.9.x](./v1.9/index.md) | 2023-06-15 | [v1.9.15](./v1.9/v1.9.15.md) | End of life | Tested with v1.26 | [v1.8 to v1.9](../upgrade-guides/v1.9/index.md) |

Releases before v1.9 are documented only on [GitHub Releases](https://github.com/kubevela/kubevela/releases). Their upgrade steps are listed in the [upgrade path table](../upgrade-guides/overview.mdx#upgrade-path).

## Component versions

| Version | Go | CUE | `k8s.io/client-go` | `controller-runtime` | `kubevela/workflow` |
| ------- | -- | --- | ------------------ | -------------------- | ------------------- |
| v1.12.0 (release-1.12) | 1.27.1 | v0.14.1 | v0.37.1 | v0.25 | v0.8.0-alpha.2 |
| v1.11.2 | 1.23.8 | v0.14.1 | v0.31.10 | v0.19.7 | v0.7.3 |
| v1.11.1 | 1.23.8 | v0.14.1 | v0.31.10 | v0.19.7 | v0.7.3 (pre-release commit) |
| v1.11.0 | 1.23.8 | v0.14.1 | v0.31.10 | v0.19.7 | v0.7.2 |
| v1.10.10 | 1.23.8 | v0.9.2 | v0.31.10 | v0.19.7 | v0.6.5 |
| v1.10.9 | 1.23.8 | v0.9.2 | v0.31.10 | v0.19.7 | v0.6.3 (pre-release commit) |
| v1.10.0 | 1.22.0 | v0.9.2 | v0.29.2 | v0.17.6 | v0.6.1 (pre-release commit) |
| v1.9.15 | 1.19 | v0.5.0 | v0.26.3 | v0.14.6 | v0.6.2 (pre-release commit) |
| v1.9.14 | 1.19 | v0.5.0 | v0.26.3 | v0.14.6 | v0.6.1 |
| v1.9.0 | 1.19 | v0.5.0 | v0.26.3 | v0.14.6 | v0.5.1 (pre-release commit) |

These matter if you build controllers, providers or addons against KubeVela's Go modules.

## How the notes are organised

A minor release page (`vX.Y.0`) has these sections, and leaves out any that are empty:

- **Summary** and **Compatibility**.
- **Breaking changes**: changes that need action, each linking to the step in the upgrade guide.
- **Behaviour changes**: changes in what the controller, the webhook or Application status do.
- **CRD changes**, **Controller flags and feature gates**, **Helm chart changes** and **CLI changes**.
- **New features**, **Bug fixes**, **Deprecations and removals**, **Dependencies** and **Known issues**.

A patch release page (`vX.Y.Z`) uses the same sections, in the same order, without Compatibility, CLI changes and Deprecations and removals.

The release notes say what changed and link to the Reference pages for the details. The Reference pages are versioned with the docs, so the version selector shows each release's state:

- Built-in definitions: [components](/docs/end-user/components/references/), [traits](/docs/end-user/traits/references/), [policies](/docs/end-user/policies/references/) and [workflow steps](/docs/end-user/workflow/built-in-workflow-defs/).
- [Controller Flags and Feature Gates](/docs/platform-engineers/system-operation/bootstrap-parameters/).
- [vela CLI](/docs/cli/vela/).
