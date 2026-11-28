---
title: Pull Requests and Releases
description: How a terraform-controller pull request is checked, reviewed, merged and backported, and how a release is cut.
---

The shared parts, the DCO sign-off (`git commit -s`), the PR template and labels, are in the [contribution process](/docs/contributor/overview).

## Opening a pull request

Open it against `master`, from a branch on your fork. Every pull request to `master` or `release-*` runs:

| Check | Workflow | Runs |
| --- | --- | --- |
| `unit-tests`, `lint` | Unit Test | `make test`, `make lint` |
| `make-reviewable` | Format | `make reviewable`, then fails if the tree changed |
| `e2e-tests` | E2E Test | The [end-to-end tests](build-and-test.md#end-to-end-tests) on kind |
| `build-image` | BuildImage | Builds the image for `linux/amd64` and `linux/arm64`, without pushing it |
| `Check for unapproved licenses` | License | Dependency licences |
| `DCO` | | Every commit signed off |

A first-time contributor's checks wait for a maintainer to approve the run. A maintainer reviews and merges; `master` takes no direct pushes.

## Backports

A fix that a released line needs gets a label per branch before it merges: `backport release-0.9`, `backport release-0.8`. When it merges, the Backport workflow cherry-picks it onto each branch and opens one pull request per label, titled `[Backport release-x.y] <title>`. For a label forgotten at the merge, a maintainer comments `/backport release-0.9` on the merged pull request; adding the label afterwards does nothing.

When a commit doesn't apply, the workflow says so on the pull request, and the backport is done by hand: `git cherry-pick -x` onto the release branch, in a pull request with the same title form.

## Releases

A release is a `vX.Y.Z` tag on a release branch. The tag publishes the controller image (`oamdev/terraform-controller:vX.Y.Z`, also on `ghcr.io/kubevela`) and the chart (`X.Y.Z` on `https://kubevela.github.io/charts`). Before tagging, a maintainer builds a candidate image from the branch (Actions, BuildImage, Run workflow), installs the branch's chart with it, and checks an upgrade from the previous release with a Configuration in place.

A release then reaches KubeVela users in two steps: KubeVela's `go.mod` picks up the new version for the API types, and the catalog's `terraform` addon picks up the chart version. They are separate pull requests to separate repositories, and the addon can lag: see [Versions](../versions.md).

[`RELEASE.md`](https://github.com/kubevela/terraform-controller/blob/master/RELEASE.md) in the repository has the full steps.
