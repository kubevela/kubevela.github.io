---
title: Pull Requests
description: What a VelaUX pull request needs, what CI runs on it, and how it is reviewed and merged.
---

The parts every KubeVela repository shares, signing off each commit (DCO), the PR template and labels, are in KubeVela's [contribution process](/docs/contributor/overview). This page covers what's particular to VelaUX.

## Before you open it

Run the same checks CI does:

```shell
yarn lint          # frontend
yarn test          # frontend unit tests
make reviewable    # server: go mod tidy, fmt, vet, staticcheck, golangci-lint
make check-diff    # reviewable, then fails if it changed anything
```

Then the server tests that cover your change; see [Testing](testing.md).

A change you can see in the UI is easier to review with a screenshot or a short recording in the PR description.

## The title

A check (`PR Title Checker`) labels the PR `title-needs-formatting` unless its title starts with one of `Feat:`, `Fix:`, `Docs:`, `Test:`, `Chore:`, `CI:`, `Perf:`, `Refactor:`, `Revert:` or `Style:`, or the same with a scope, such as `Fix(ui):`. Backports opened by the bot start with `[Backport`. PRs are squash merged, so the title becomes the commit subject on `main`.

## What CI runs

| Check | Workflow | What it does |
| --- | --- | --- |
| `check` | `staticcheck.yml` | On Node 16: `yarn install`, `yarn lint`, `yarn test`; then `make check-diff` on the Go side. |
| `server-unit-tests` | `server-test.yml` | `make unit-test-server-ci` with MySQL, PostgreSQL and MongoDB running and envtest's API server. |
| `server-e2e-tests` | `server-test.yml` | Builds the image, starts two k3d clusters, installs KubeVela, and runs `make e2e-server-test`. |
| `arm64-build-test` | `arm64-build-test.yml` | Builds the image for arm64. |
| `DCO` | | Every commit is signed off. |
| `codecov/*` | | Coverage. A failed upload on a fork PR shows as a failure; it isn't a required check. |

A first-time contributor's workflows wait for a maintainer to approve the run, so a new PR can show only the DCO check for a while.

## Review and merge

- Reviewers come from `.github/CODEOWNERS`, which assigns the whole repository, and `pkg/` and `packages/` separately, to the maintainers. Ask on the PR, or in the KubeVela Slack, if nobody has picked it up.
- A maintainer merges once it's approved and CI is green. VelaUX only allows squash merges.
- To get a fix into a release branch, the PR carries a `backport release-x.y` label (ask a maintainer if you can't set labels); the backport workflow opens the backport PR once the original merges.
- Changes that users will notice need docs: open a PR against [kubevela.io](https://github.com/kubevela/kubevela.io) for the pages under `velaux/`.
