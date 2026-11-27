---
title: Contribute to the Catalog
---

Once an addon works on your own cluster, you can open a pull request against [kubevela/catalog](https://github.com/kubevela/catalog) so every KubeVela user can enable it. The shared parts of contributing, such as signing off your commits for the DCO, are the same as for KubeVela itself: see the [contribution guide](/docs/contributor/overview). This page covers what's particular to the catalog.

## Experimental first

A new addon goes in `experimental/addons/<name>/`, never straight into `addons/`. To be accepted as experimental it needs:

- an `icon` and a `url` in `metadata.yaml` that both resolve;
- a `README.md` that says what the addon is, why you'd use it, what it installs, and shows a basic example;
- ideally, example Applications in `examples/<name>/`. They're not required, but they make a review much easier.

Once merged, it's published to the `experimental` registry, and users enable it with `vela addon enable experimental/<name>`.

## Promotion to verified

To move an experimental addon into `addons/`, open a pull request that moves the directory and shows that the addon:

- enables cleanly in the catalog's CI (see [What CI checks](#what-ci-checks));
- has a page in the [Addon Catalog](../overview.md) on this site. That's a pull request against [kubevela/kubevela.io](https://github.com/kubevela/kubevela.io), with the page in `addons/` and an entry in `sidebar-addons.js`.

Most addons that ship a CRD operator also ship test Applications in `test/e2e-test/addon-test/definition-test/testdata/<name>/`, so CI checks the definitions work, not just that the controllers start.

## Every change bumps the version

The catalog keeps every version it has ever published: the registry index is rebuilt on each merge, and a package is written as `<name>-<version>.tgz`. A change that keeps the old version overwrites that version's package, so anyone who already enabled it gets different files under the same version. To stop that, CI refuses any change to an addon's files unless the same pull request changes its `metadata.yaml`, and `make check-addon-semver` refuses a version that isn't a semantic version.

Bump the patch version for a fix and the minor version for a new feature or parameter. The addon's version is its own, not that of the software it installs: `fluxcd` 3.0.2 installs source-controller v1.1.0.

## What CI checks

The `Addon-test` workflow (`.github/workflows/addon-test.yaml`) runs on every pull request to `master`, unless it only changes Markdown or images:

1. `make check-addon-semver`.
2. It creates two KinD clusters, installs KubeVela v1.11.0 on one, and joins the other as the managed cluster `worker`.
3. It runs `test/e2e-test/addon-test/main.go` with the list of changed files. That program:
   - fails if an addon's files changed without its `metadata.yaml`;
   - works out which verified addons the change touches, plus the addons that depend on them, and enables each with `vela addon enable addons/<name>`, dependencies first;
   - after each one, applies the Applications in `definition-test/testdata/<name>/`, if there are any, and waits for them to reach `running`.

A change to `.github/`, the `Makefile` or any `.go` file enables every verified addon.

Two things in there are easy to miss:

- **Experimental addons are never enabled by CI.** The version check applies to them, but the enable step only looks in `addons/`. Test an experimental addon yourself before you open the pull request, as in [Test an Addon Locally](./test-locally.md), and say how in the pull request's "How has this code been tested?" section.
- **`test/e2e-test/addon-test/PENDING` lists addons CI skips**, such as ones whose charts can no longer be fetched. An addon on that list isn't enabled even when it changes, so a pull request that touches one needs the same manual testing.

## The pull request

The catalog's pull request template asks for:

- a title that starts with its type, such as `[Addon]`, `[example]` or `[Doc]`;
- what changed and how you tested it;
- the version bump in `metadata.yaml`;
- docs and examples updated where they apply.

Every pull request needs a review from one of the maintainers in `.github/CODEOWNERS`, and some addons, such as `fluxcd`, `velaux` and the `terraform` family, have owners of their own. Once it merges, the `Publish Registry to Github Page` workflow (`.github/workflows/addon.yaml`) packages every addon and publishes both registries, so the new version is listed by `vela addon list` within a few minutes.

## Fixing an addon

If an addon is broken, open an issue, or a pull request with the fix and the version bump. If you can't fix it but CI keeps failing on it, adding it to `PENDING` with a comment saying why is an acceptable stop-gap; take it out again in the pull request that fixes it.
