---
title: Versions
description: The Prism version each KubeVela release gets, and what changed between Prism versions.
---

KubeVela doesn't ship Prism. vela-core doesn't depend on it, its chart doesn't install it, and no release pins it. What a hub runs is whatever the `vela-prism` addon in the [catalog](https://github.com/kubevela/catalog/tree/master/addons/vela-prism) held when the addon was enabled or last upgraded. Since June 2023 that has been the `v1.7.0` image, so every KubeVela release still supported gets v1.7.0:

| KubeVela | Prism (addon image) | Published chart |
| --- | --- | --- |
| 1.12 | v1.7.0 | 1.6.0 |
| 1.11 | v1.7.0 | 1.6.0 |
| 1.10 | v1.7.0 | 1.6.0 |
| 1.9 | v1.7.0 | 1.6.0 |

The addon needs KubeVela 1.5 or later (`system.vela` in its metadata). Its catalog entry is labelled `v1.6.0`, which is what `vela addon list` shows, but the image has been `v1.7.0` since the catalog's June 2023 update; before that it was `v1.5.0`.

The same table, with the other products' versions, is in the [release notes overview](/docs/next/release-notes/overview#docs-for-the-other-products).

## Prism releases

| Version | Date | Notes |
| --- | --- | --- |
| v1.7.0 | June 2023 | Dynamic API (chart at the tag only), arm64 image fixed, OCM ManagedCluster listing fixed, shared code moved to `kubevela/pkg`. Never published as a chart. |
| v1.6.0 | October 2022 | Request timeout flags, the `control-plane` label on clusters. The newest published chart. Its arm64 image crashes. |
| v1.5.0 | July 2022 | The addon's image until June 2023. |

`master` has moved on since v1.7.0 (Go 1.27.1, Kubernetes 0.37 libraries, `k8s.io/apiserver` in place of `apiserver-runtime`) without a release, and doesn't start with the arguments today's addon and chart pass: see [Developer Onboarding](../developer/overview.md#reviews-and-releases).

Upgrade notes for each step are on [Upgrade](../operate/upgrade.md#what-changed).
