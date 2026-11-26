---
title: Release Process And Cadence
---

KubeVela is being developed using the following process:

* Maintainers commit to work on set of features and enhancements and create GitHub milestone to track the work.
* We are trying to avoid delaying release and prefer moving the feature into the next release if we cannot complete it on time.
* The new release is published every **2~3 month**.
* Critical bug-fixes are cherry-picked into the release branch and delivered using patch releases as frequently as needed, we will maintain the last **2 releases**.

![develop-flow](../resources/develop-code-flow.jpg)

## Release Planning

We are using [GitHub milestones](https://github.com/kubevela/kubevela/milestones) to perform release planning and tracking. Each release milestone includes two type of issues:

* Issues that maintainers committed to working on. Maintainers decide which features they are committing to work on during the next release based on their availability. Typically issues added offline by each maintainer and finalized during the contributors' meeting or [community meetings](https://github.com/kubevela/community#community-meetings). Each such issue should be assigned to maintainer who plans to implement and test it.
* Nice to have improvements contributed by community contributors. Nice to have issues are typically not critical, smallish enhancements that could be contributed by community contributors. Maintainers are not committing to implement them but committing to review PR from the community.

The milestone should have a clear description of the most important features as well as the expected end date. This should provide clarity to end-users about what to expect from the next release and when.

In addition to the next milestone, we need to maintain a draft of the upcoming release milestone.

## Community Contributions

We receive a lot of contributions from our awesome community, and we're very grateful for that fact. However, reviewing and testing PRs is a lot of (unplanned) work and therefore, we cannot guarantee that contributions (especially large or complex ones) made by the community receive a timely review within a release's time frame. Maintainers may decide on their own to put work on a PR together with the contributor and in this case, the maintainer will self-assigned the PR and thereby committing to review, eventually merge and later test it on the release scope.

## Release Testing

We have a code freeze period two weeks before the release until the release branch is created. During code freeze no feature PR should be merged and it is ok to merge bug fixes.

Maintainers should drive testing and work on fixing last-minute issues before every release. 

## Release SOP

The maintainers are responsible to drive releases and follow the standard operating procedure to make sure the quality of this release.

> We're following the `major.minor.patch` version. The `major` version is incremented when there are incompatible API changes. The `minor` version is incremented when there are new features. The `patch` version is incremented when there are bug fixes.

1. Write a clear release note including:
   * New Features, Enhancement and Bugfixes.
   * Deprecation and Breaking Changes.
   * Brief notes about how to install and upgrade.
2. Create a new release branch from the `release-x.y` branch when release a new `minor` release.
3. Create new `patch` releases corresponding to the release branch.
4. Make sure the release materials are generated successfully from the Github actions:
   * Images from [Registry Pipeline](https://github.com/kubevela/kubevela/actions/workflows/registry.yml).
   * Helm Charts from [Publish Chart Pipeline](https://github.com/kubevela/kubevela/actions/workflows/chart.yml).
   * CLI binaries from [Release Pipeline](https://github.com/kubevela/kubevela/actions/workflows/release.yml).
5. Update docs and examples to use the new release.
   * For every `minor` release, before cutting the docs version:
     * Add `release-notes/vX.Y/vX.Y.0.md` from `release-notes/_template-minor.md` (see [How to add release notes](#how-to-add-release-notes)). Write `release-notes/vX.Y/index.md` by hand, using the previous minor's `index.md` as the model (status, releases table, pre-releases); it has no template. Add a row to the [release notes overview](../release-notes/overview.md).
     * Add the upgrade guide `upgrade-guides/vX.Y/index.md`, add it to `sidebar-upgrade.js`, and link it from the [upgrade overview](../upgrade-guides/overview.mdx).
     * Regenerate the definition and CLI reference docs; see [CLI and definition reference docs](./cli-ref-doc.md).
     * Refresh [Controller Flags and Feature Gates](../platform-engineers/system-operation/bootstrap-parameters.md) from `cmd/core/app/config` and `pkg/features/controller_features.go`.
     * Create a new docs version for the new `minor` release.
     * In `release-notes/vX.Y/` and `upgrade-guides/vX.Y/`, change links from `/docs/next/...` to `/docs/...`. Until the version is cut, these pages link to Next because the pages they describe exist only there.
   * For every `patch` release:
     * Add `release-notes/vX.Y/vX.Y.Z.md` from the patch template and a row to the patch table in `release-notes/vX.Y/index.md`.
     * Update the `top tip` in `docusaurus.config.js` to link to the new release notes page.

## How to add release notes

Release notes live in `release-notes/` and upgrade guides in `upgrade-guides/`, both at the repository root. Edit them only there. Each time Docusaurus starts or builds the site, `scripts/sync-release-pages.js` copies both folders into every docs version (`docs/` and each `versioned_docs/version-*/`), so every version shows them in its sidebar under Releases. The copies are git-ignored and get overwritten, so a change made in a copy is lost. `yarn start` copies the folders again when you save a change. A note added after a version is cut, such as a patch for an older minor, shows up in every version. Link between these pages with relative `.md` links, for example `../../upgrade-guides/v1.12/index.md`: the folders have the same layout in every copy, so readers stay in the docs version they are reading. Link to the regular docs with absolute URLs such as `/docs/next/cli/vela/` (`/docs/cli/vela/` once the docs version is cut). The sync also writes the Releases sidebar group into each `versioned_sidebars/*.json` file, so nothing needs to be added for a new version.

The release notes have a folder per minor version (`vX.Y/`). The folder has an `index.md` overview (status, patch table, pre-releases) and one page per release: the GA (general availability) release `vX.Y.0` and each patch release `vX.Y.Z`. Pre-releases don't get their own pages; list them in `index.md` and roll their changes into the `.0` page.

1. Copy `release-notes/_template-minor.md` (for `vX.Y.0`) or `release-notes/_template-patch.md` (for `vX.Y.Z`). Files starting with `_` are not published.
2. Fill in the sections from the GitHub release and from the diff against the previous tag:
   * commits: `git log --no-merges <prev>..<tag>`
   * CRDs: `git diff <prev> <tag> -- charts/vela-core/crds/`
   * flags and feature gates: `git diff <prev> <tag> -- cmd/core/app/ pkg/features/`
   * chart values: `git diff <prev> <tag> -- charts/vela-core/values.yaml`
   * dependencies: `git diff <prev> <tag> -- go.mod`
3. Keep entries short. When a Reference page documents the thing that changed (built-in definitions, CLI commands, controller flags, config templates), link to it instead of repeating it. The minor release notes list every change since the previous `.0`, including changes backported to a patch of the previous minor version; mark those "(backported to v1.11.1)" and keep the "Backported changes" note from the template.
4. Add the page to `sidebar-release-notes.js`, newest first.