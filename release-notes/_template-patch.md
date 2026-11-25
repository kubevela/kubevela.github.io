---
title: KubeVela vX.Y.Z release notes
sidebar_label: vX.Y.Z
description: What changed in KubeVela vX.Y.Z.
---

<!--
Copy this file to release-notes/vX.Y/vX.Y.Z.md, add it at the top of the
vX.Y.x category in sidebar-release-notes.js, and add a row to the patch table
in release-notes/vX.Y/index.md. Keep the sections in this order and leave out
any section that has nothing in it. Don't add other sections or ### subheadings.

Each section has a fixed format, shown by the example below its heading:
- Summary is one or two sentences.
- Controller flags and feature gates, Helm chart changes and Dependencies are
  tables, in the same format as the minor release notes.
- Every other section is a bullet list.

Keep each bullet to one or two lines and end it with its PR link when there is
one. Long explanations belong in the upgrade guide; link to it instead.
-->

**Released:** YYYY-MM-DD ·
[GitHub release](https://github.com/kubevela/kubevela/releases/tag/vX.Y.Z) ·
[Full changelog](https://github.com/kubevela/kubevela/compare/vX.Y.(Z-1)...vX.Y.Z)

## Summary

What this patch fixes and who should take it.

## Breaking changes

<!-- Changes that need action before or during the upgrade. Bold title, what changed and what to do. -->

- **Short title.** What changed and what to do ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)).

## Behaviour changes

<!-- Changes in what the controller, the webhook, the CLI or Application status do, with no action required. -->

- What behaves differently now ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)).

## CRD changes

<!-- Rare in a patch. One bullet per CRD whose fields changed. Keep the closing line. -->

- `Kind` adds `spec.field`.

Apply the CRDs before `helm upgrade`.

## Controller flags and feature gates

<!-- Change is one of: New, New, Alpha / New, Beta, Removed, Renamed from `old`, Default changed. -->

| Name | Change | Default |
| --- | --- | --- |
| `--flag-name` | New | `value` |

## Helm chart changes

<!-- Change is one of: New, Removed, Renamed from `old`, Default changed, Changed (say how). -->

| Value | Change | Default |
| --- | --- | --- |
| `section.value` | New: what it does | `value` |

## New features

<!-- Only when the patch ships features, which should be rare. -->

- **Feature name**: what it does ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)).

## Bug fixes

- `thing` now does the right thing ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)).

## Dependencies

| Dependency | From | To |
| --- | --- | --- |
| `kubevela/workflow` | v0.N.N | v0.N.N ([#NNNN](https://github.com/kubevela/kubevela/pull/NNNN)) |

## Known issues

- What goes wrong, and the workaround or the release that fixes it.
