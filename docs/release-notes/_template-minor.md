---
title: KubeVela vX.Y.0 release notes
sidebar_label: vX.Y.0
description: What changed in KubeVela vX.Y.0.
---

<!--
Copy this file to docs/release-notes/vX.Y/vX.Y.0.md and add the page to the
"Release Notes" category in sidebars.js. Leave out any section that has
nothing in it. Keep each entry to a line or two: when a Reference page
already documents the thing that changed (definitions, CLI commands,
controller flags, feature gates, config templates), link to it instead of
repeating it here.
-->

**Released:** YYYY-MM-DD ·
[GitHub release](https://github.com/kubevela/kubevela/releases/tag/vX.Y.0) ·
[Full changelog](https://github.com/kubevela/kubevela/compare/vX.(Y-1).0...vX.Y.0) ·
[Upgrade guide](../../upgrade/vX.Y/index.md)

## Summary

One paragraph on the theme of the release, then the three to five changes most users care about.

## Compatibility

| Component | Version |
| --- | --- |
| Kubernetes | `>= v1.NN`, tested with `v1.NN` |
| Go | `1.NN` |
| CUE | `v0.NN.N` |
| Kubernetes client libraries | `k8s.io/client-go vN.NN.N`, `controller-runtime vN.NN.N` |
| Upgrade from | vX.(Y-1).x only; see the [upgrade guide](../../upgrade/vX.Y/index.md) |

## Breaking changes

Changes that need action before or during the upgrade. Each entry links to the step in the upgrade guide.

## Behaviour changes

Changes in what the controller, the webhook or Application status do, with no action required.

## CRD changes

CRDs added or removed, and fields added, changed or deprecated. Remind Helm users to apply the CRDs before `helm upgrade`.

## Controller flags and feature gates

| Name | Change | Default |
| --- | --- | --- |
| `--flag-name` | New | `value` |
| `FeatureGate` | Default changed | `true` |

Details are in [Controller Flags and Feature Gates](../../platform-engineers/system-operation/bootstrap-parameters.md).

## Helm chart changes

New, changed and removed values in `charts/vela-core/values.yaml`, hooks and images.

## CLI changes

New commands and changed flags, each linking to its page under [vela CLI](../../cli/vela.md).

## New features

## Bug fixes

Fixes in built-in definitions go here as single lines. Their parameters are in the Reference pages.

## Deprecations and removals

## Dependencies

## Known issues and quirks
