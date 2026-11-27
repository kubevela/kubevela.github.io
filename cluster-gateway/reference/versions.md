---
title: Versions
description: The Cluster Gateway version each KubeVela release ships, and what changed between them.
---

Each KubeVela release pins one Cluster Gateway version twice: as the Go module in kubevela's `go.mod`, which the controller's client code comes from, and as the image in the vela-core chart (`oamdev/cluster-gateway`). The two always agree.

| KubeVela | Cluster Gateway | Release branch |
| --- | --- | --- |
| 1.12 | 1.10.0-alpha.1 | `release-1.10` |
| 1.11 | 1.9.2 | `release-1.9` |
| 1.10 | 1.9.2 | `release-1.9` |
| 1.9 | 1.9.0-alpha.2 | `release-1.9` |

The same table, with the other products' versions, is in the [release notes overview](/docs/next/release-notes/overview#docs-for-the-other-products).

These pages describe 1.10.0-alpha.1. Where 1.9.2 behaves differently, the page says so.

## Upgrade notes

| From | To | What to check |
| --- | --- | --- |
| 1.9.2 (KubeVela 1.10, 1.11) | 1.10.0-alpha.1 (KubeVela 1.12) | The API, the Secret format and the gateway's own flags are unchanged. If you set the gateway's arguments yourself, drop any etcd flags and the `component:Gate=value` form of `--feature-gates`: see [Upgrade](../operate/upgrade.md#192-to-1100-alpha1). |
| 1.9.0-alpha.2 (KubeVela 1.9) | 1.9.2 (KubeVela 1.10) | Nothing to change. 1.9.2 adds the `Dynamic` credential type, moves to Kubernetes 0.29 libraries and Go 1.23, and accepts the removed `APIPriorityAndFairness` gate instead of failing on it. |

The standalone chart isn't versioned with the gateway: its chart version stays `0.1.0`, and it uses `v0.1.0` as the image tag unless you set `tag`, so always set `tag` to the release you install.
