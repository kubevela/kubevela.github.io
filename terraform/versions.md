---
title: Versions
description: Which terraform-controller version each KubeVela release is built with, which one the terraform addon installs, and what changed between them.
---

There are two terraform-controller versions in a KubeVela install, and they are not always the same:

- **The API version**: vela-core is built against the controller's Go types for `Configuration`, and renders Terraform components with them. This is the version in KubeVela's `go.mod`.
- **The running controller**: whatever the `terraform` addon (or your own Helm install) deploys.

| KubeVela | Built with terraform-controller | Notes |
| --- | --- | --- |
| v1.12 | [v0.9.1](https://github.com/kubevela/terraform-controller/releases/tag/v0.9.1) | Go 1.27 and Kubernetes 0.37 libraries; pinned images. |
| v1.11 | [v0.8.2](https://github.com/kubevela/terraform-controller/releases/tag/v0.8.2) | |
| v1.10 | [v0.8.2](https://github.com/kubevela/terraform-controller/releases/tag/v0.8.2) | |
| v1.9 | [v0.8.0](https://github.com/kubevela/terraform-controller/releases/tag/v0.8.0) | |

The same table for every product is in the [release notes overview](/docs/release-notes/overview#docs-for-the-other-products).

## What the addon installs

The catalog's `terraform` addon pins its chart: addon **1.1.3**, the current one, installs terraform-controller **v0.7.12**, whatever KubeVela you run. It has no parameter for the chart version. So on any KubeVela release, `vela addon enable terraform` gives you v0.7.12, which:

- lacks `spec.gitRef` (added in 0.8.0), so a Configuration's `gitRef` is pruned and the default branch of a `remote` is cloned;
- predates the connection Secret ownership check of 0.8.2 and 0.9.1;
- runs the older, unpinned images that 0.9.0 replaced for security fixes.

To run the version your KubeVela is built with, install the chart yourself instead of the addon, as on [Install](getting-started/install.md#without-kubevela-the-helm-chart), with `--version 0.9.1` for KubeVela 1.12 or `--version 0.8.2` for 1.10 and 1.11, and `--namespace vela-system` to keep the default `backend.namespace`.

## The 0.9 and 0.8 lines

| Line | Latest | Branch | For |
| --- | --- | --- | --- |
| 0.9 | v0.9.1 | `release-0.9` | KubeVela 1.12 |
| 0.8 | v0.8.2 | `release-0.8` | KubeVela 1.10, 1.11 |

Both get security and bug fixes; new features go to `master`. v0.9.1 and v0.8.2 carry the same fix (connection Secret ownership); 0.9 also moves to current Go and Kubernetes libraries and pins every image it starts. What to check when you move between them is on [Upgrade](operate/upgrade.md#upgrade-notes).
