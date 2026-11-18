---
title: KubeVela vX.Y.0 release notes
sidebar_label: vX.Y.0
description: What changed in KubeVela vX.Y.0.
---

<!--
Copy this file to release-notes/vX.Y/vX.Y.0.md and add the page to
sidebar-release-notes.js. Keep the sections in this order and leave out any
section that has nothing in it. Don't add other sections or ### subheadings.

Each section has a fixed format, shown by the example below its heading:
- Summary is one paragraph.
- Compatibility, Controller flags and feature gates, Helm chart changes and
  Dependencies are tables.
- Every other section is a bullet list.

Keep each bullet to one or two lines. Long explanations, YAML and commands
belong in the upgrade guide (upgrade/vX.Y/index.md); link to it instead. When
a Reference page already documents the thing that changed (definitions, CLI
commands, controller flags, feature gates, config templates), link to it
instead of repeating it here. End a bullet with its PR link when there is one.

List every change since vX.(Y-1).0, including changes that were also backported
to a vX.(Y-1) patch, so the page is complete for anyone upgrading from any
vX.(Y-1) release. Mark each backported change "(backported to vX.(Y-1).Z)" and
keep the "Backported changes" note below; delete the note if nothing was
backported.

Link to regular docs with absolute URLs such as /docs/next/cli/vela/. After
the docs version is cut, change /docs/next/ to /docs/.
-->

**Released:** YYYY-MM-DD ·
[GitHub release](https://github.com/kubevela/kubevela/releases/tag/vX.Y.0) ·
[Full changelog](https://github.com/kubevela/kubevela/compare/vX.(Y-1).0...vX.Y.0) ·
[Upgrade guide](/upgrade-guides/vX.Y/)

:::info Backported changes
These notes list every change since vX.(Y-1).0, so they are complete if you upgrade from any
vX.(Y-1) release. Changes marked **backported to vX.(Y-1).Z** also shipped in that patch; if you
already run it, you have them.
:::

## Summary

One paragraph on the theme of the release and the three to five changes most users care about.

## Compatibility

| Component | Version |
| --- | --- |
| Kubernetes | `>= v1.NN`, tested with v1.NN |
| Go | 1.NN |
| CUE | v0.NN.N |
| Kubernetes client libraries | `k8s.io/client-go` vN.NN.N, `controller-runtime` vN.NN.N |
| Upgrade from | vX.(Y-1).x; see the [upgrade guide](/upgrade-guides/vX.Y/) |

## Breaking changes

<!-- Changes that need action before or during the upgrade. Bold title, what changed, what to do, and a link to the step in the upgrade guide. -->

- **Short title.** What changed and what to do; see
  [the upgrade guide](/upgrade-guides/vX.Y/#anchor) ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)).

## Behaviour changes

<!-- Changes in what the controller, the webhook or Application status do, with no action required. -->

- What behaves differently now ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)).

## CRD changes

<!-- One bullet per CRD added or removed, or per CRD whose fields changed. Keep the closing line. -->

- New CRD `name.group` (`Kind`), for what.
- `Kind` adds `spec.field`.

Apply the CRDs before `helm upgrade`.

## Controller flags and feature gates

<!-- Change is one of: New, New, Alpha / New, Beta, Removed, Renamed from `old`, Default changed. -->

| Name | Change | Default |
| --- | --- | --- |
| `--flag-name` | New | `value` |
| `FeatureGate` | Default changed | `true` |

Details are in [Controller Flags and Feature Gates](/docs/next/platform-engineers/system-operation/bootstrap-parameters/).

## Helm chart changes

<!-- Values in charts/vela-core/values.yaml. Change is one of: New, Removed, Renamed from `old`, Default changed, Changed (say how). Group related values on one row with a wildcard, such as `helmCache.*`. -->

| Value | Change | Default |
| --- | --- | --- |
| `section.value` | New: what it does | `value` |
| `section.old` | Removed | |

## CLI changes

- `vela command` does something new.

Each command's flags are on its page under [vela CLI](/docs/next/cli/vela/).

## New features

- **Feature name**: what it does; see [page](/docs/next/path/) ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)).

## Bug fixes

<!-- Describe the fixed behaviour, not the bug. Fixes in built-in definitions are single lines; their parameters are in the Reference pages. -->

- `thing` now does the right thing ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)).

## Deprecations and removals

- `thing` is deprecated and will be removed in vX.(Y+1); use `other` instead.

## Dependencies

<!-- Versions relative to vX.(Y-1).0. -->

| Dependency | From | To |
| --- | --- | --- |
| Go | 1.NN | 1.NN ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)) |
| CUE | v0.NN.N | v0.NN.N |
| `k8s.io/client-go` | v0.NN.N | v0.NN.N |
| `controller-runtime` | v0.NN.N | v0.NN.N |
| `kubevela/workflow` | v0.N.N | v0.N.N |

## Known issues

- What goes wrong, and the workaround or the release that fixes it.
