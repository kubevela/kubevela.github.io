---
title: Code Contribution Guide
---

This guide takes you from a fresh clone of KubeVela to a merged pull request:

- [Run KubeVela Locally](#run-kubevela-locally): build, test and lint
- [Run VelaUX Locally](#run-velaux-locally)
- [Sign Your Commits (DCO)](#sign-your-commits-dco)
- [Create a pull request](#create-a-pull-request), and what happens after you open it
- [Code review](#code-review)
- [Formatting guidelines](#formatting-guidelines) for commits and pull request titles
- [Troubleshooting](#troubleshooting)

## Run KubeVela Locally

This page covers what you need for every pull request: clone, build, test and lint. Running the controller against a cluster, the e2e suites and debugging are documented in the KubeVela repository itself, in [`docs/development`](https://github.com/kubevela/kubevela/tree/master/docs/development), which changes in step with the code.

### Prerequisites

* **Go 1.27.1**, the version in KubeVela's `go.mod`. Any Go 1.21 or later will do to start with: the default `GOTOOLCHAIN=auto` downloads the version `go.mod` asks for.

<details>
  <summary>Install Go</summary>

1. Download the archive for your system from the [official site](https://go.dev/dl/) and follow the [install instructions](https://go.dev/doc/install). On Linux on amd64 that's:

    ```bash
    wget https://go.dev/dl/go1.27.1.linux-amd64.tar.gz
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.27.1.linux-amd64.tar.gz
    ```

1. Add Go, and the tools you install with `go install`, to your `PATH`. Put this in your `~/.bashrc` or `~/.zshrc` so every new terminal has it:

    ```bash
    export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
    ```

    Don't set `GOROOT`. Go finds its own installation, and a stale `GOROOT` is a common way to end up building with the wrong version.

1. (Optional) If the default module proxy is slow where you are, for example in mainland China, point Go at a closer one:

    ```bash
    go env -w GOPROXY=https://goproxy.cn,direct
    ```

</details>

* **Node.js and npm**. `make reviewable` regenerates the Helm chart's README with [readme-generator-for-helm](https://github.com/bitnami/readme-generator-for-helm), and installs it with `npm install -g @bitnami/readme-generator-for-helm` the first time.

* A Kubernetes cluster at a version KubeVela supports (v1.25 or later for 1.12, see [Installation](../installation/kubernetes.mdx)), with `~/.kube/config` configured. You need it to run the controller or the e2e suites; unit tests don't.

The Makefile installs the rest of the toolchain on first use, at the versions it pins in `makefiles/dependency.mk`:

| Tool | Version | Installed by |
| --- | --- | --- |
| golangci-lint | v2.14.0 | `make lint` |
| staticcheck | v0.8.1 | `make staticcheck` |
| CUE | v0.14.1 | `make fmt` and `make manifests`, only when no `cue` is on your `PATH` |
| kustomize | 4.5.4 | `make manifests` |
| setup-envtest (Kubernetes 1.37.0 test binaries) | latest | `make test` |
| goimports | pinned commit | `make fmt`, only when no `goimports` is on your `PATH` |

A `cue` or `goimports` already on your `PATH` is used as it is, so if `make reviewable` reformats files you didn't touch, check that your `cue` is v0.14.1. If you install golangci-lint by hand, install v2 (`go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.14.0`): a v1 binary can't read KubeVela's lint config.

:::tip
You may also be interested in KubeVela's [design](https://github.com/kubevela/kubevela/tree/master/design/vela-core) docs before diving into the code.
:::

### Build

Clone the repository and build the `vela` CLI:

```shell
git clone git@github.com:kubevela/kubevela.git
cd kubevela
make
```

`make` writes the `vela` and `kubectl-vela` binaries to `bin/`. Add that folder to your `PATH` to use them directly:

```shell
export PATH=$PATH:$(pwd)/bin
```

### Testing

It's necessary to write tests for good code quality, please refer to [the principle of test](./principle-of-test.md) before you start.

#### Unit tests

```shell
make test
```

`make test` downloads the Kubernetes 1.37.0 control-plane binaries with `setup-envtest`, so the tests talk to a real API server without a cluster, then runs the unit tests. It also regenerates the CLI and MCP reference into `./bin/doc`.

To run a single package by hand, point `KUBEBUILDER_ASSETS` at the same binaries (`bin/setup-envtest` is there once `make test` has run):

```shell
KUBEBUILDER_ASSETS="$(bin/setup-envtest use 1.37.0 -p path)" go test ./pkg/appfile/...
```

#### Definition tests

If you change a built-in definition under `vela-templates/definitions/internal`, run the definition tests too. CI runs them as their own check, and `make test` leaves them out:

```shell
make test-definitions
```

This runs each definition's `*_test.cue` cases with `vela def test`, then checks that every shipped definition and parameter is covered and that each definition still renders to its golden output. When a change to a render is intended, rewrite the goldens and say so in the pull request, so the change makes the release notes:

```shell
make update-definition-goldens
```

#### E2E tests

The e2e suites run against a cluster with KubeVela installed from the chart, using a test image and the feature gates the suites expect. A controller started by hand doesn't have those, and the specs fail on timeouts rather than with an error. You need [Ginkgo v2](https://onsi.github.io/ginkgo/) on your `PATH`.

- `make e2e-test-local` creates a k3d cluster called `kubevela-debug`, builds and installs the image, and runs the module suites.
- `make e2e-setup-core` installs the chart with the test image (load it into a kind cluster with `make image-load` first) and the feature gates, then `make e2e-test` runs the core suites. To run one suite at a time, use `make e2e-core-application-test`, `make e2e-core-definitions-test`, `make e2e-source-test` and so on.

The [testing guide](https://github.com/kubevela/kubevela/blob/master/docs/development/testing.md) has every target and the cluster each one needs.

### Running and debugging the controller

To run `vela-core` from source against a cluster, debug it from your IDE, or exercise the admission webhooks locally, follow the guides in [`docs/development`](https://github.com/kubevela/kubevela/tree/master/docs/development). For webhooks, `make webhook-debug-setup` creates a k3d cluster, installs the CRDs and points the webhooks at the controller on your machine, so you don't have to delete them to run locally; `make webhook-help` lists the related targets, and [`webhook-debugging.md`](https://github.com/kubevela/kubevela/blob/master/docs/development/webhook-debugging.md) covers the workflow. [Debugging KubeVela with Webhook](../platform-engineers/debug/debugging-kubevela-with-webhook.md) does the same setup by hand, step by step.

If a KubeVela installed from the Helm chart is running in the same cluster, scale it down first, or it competes with your local controller:

```shell
kubectl scale deploy -n vela-system kubevela-vela-core --replicas=0
```

## Run VelaUX Locally

VelaUX, the KubeVela UI, lives in its own repository: the Go API server and the React frontend are both in [kubevela/velaux](https://github.com/kubevela/velaux). Its [contributing guide](https://github.com/kubevela/velaux/blob/main/docs/contributing/velaux.md) covers setting up KubeVela for it, running the server and the UI, and its tests.

## Sign Your Commits (DCO)

KubeVela uses the Developer Certificate of Origin instead of a CLA. The [DCO](https://developercertificate.org) is a short statement saying you wrote the code you're submitting, or otherwise have the right to submit it under the project's license. You agree to it by adding a `Signed-off-by` line to each commit, there's no separate document to sign. See the [Linux Foundation DCO page](https://wiki.linuxfoundation.org/dco) for background.

Git can add that line for you with the `-s` flag:

```shell
git commit -s -m 'This is my commit message'
```

This produces a trailer like the following at the end of the commit message:

```
This is my commit message

Signed-off-by: Random Developer <random@developer.example.org>
```

The email in the sign-off must match the email on your GitHub account, otherwise your pull request may not be able to merge.

### Fixing a missing sign-off

If only your most recent commit is missing the sign-off:

```shell
git commit --amend --signoff
git push --force-with-lease
```

If several commits in your pull request need signing off, rebase the whole branch with sign-off. `<base-branch>` is the branch your pull request targets, usually `master`:

```shell
git rebase --signoff <base-branch>
git push --force-with-lease
```

Since KubeVela squashes pull requests on merge, every source commit still needs a valid sign-off before the pull request can be merged. The squashed commit takes its message from the pull request rather than from any single source commit, so signing off one commit is not enough.

## Create a pull request

We're excited that you're considering making a contribution to the KubeVela project!
This section guides you through the process of creating a [pull request](https://help.github.com/en/articles/about-pull-requests/).

### Before you begin

We know you're excited to create your first pull request. Before we get started:

- If you are working on an existing issue (or a new issue you filed), **first comment on the issue to request assignment and wait for a maintainer to assign it to you** before starting work or raising a pull request. This prevents duplicate effort and ensures maintainers agree on the approach.
- All changes, including simple additions and bug fixes, must have an associated issue assigned by a maintainer. If none exists, open a new issue in the repository you are changing, for example [kubevela/kubevela](https://github.com/kubevela/kubevela/issues/new/choose). A pull request without an assigned issue will not be picked up and may be closed. Automated dependency and backport pull requests are exempt, and maintainers can raise pull requests without an issue if needed. Security vulnerabilities must not be reported in a public issue. Follow the [security policy](https://github.com/kubevela/kubevela/blob/master/SECURITY.md) instead; security fixes handled that way are exempt.
- Make sure your code follows the relevant [code conventions](./code-conventions.md).

### Your first pull request

Before you submit a PR, run this command to ensure it is ready:

```shell
make reviewable
```

It builds the CLI, regenerates the CRDs and definitions, formats the Go and CUE code, and runs `go vet`, golangci-lint and staticcheck. Commit whatever it changes along with your own changes.

If this is your first time contributing to an open-source project on GitHub, make sure you read about [Creating a pull request](https://help.github.com/en/articles/creating-a-pull-request).

To increase the chance of having your pull request accepted, make sure your pull request follows these guidelines:

- Title and description matches the implementation.
- The title follows the [Formatting guidelines](#formatting-guidelines).
- Unless the pull request is exempt, it is associated with one issue and raised only once a maintainer has assigned that issue to you.
- The pull request contains necessary tests that verify the intended behavior.
- If your pull request has conflicts, rebase your branch onto the main branch.

If the pull request fixes a bug:

- Unless the pull request is exempt (see [Before you begin](#before-you-begin)), the description must include `Closes #<issue number>` or `Fixes #<issue number>`, or `Related to #<issue number>` if it only fixes part of the issue.
- To avoid regressions, the pull request should include tests that replicate the fixed bug.
- If the bug is in a release that's still maintained (see the [release process](./release-process.md)), say which release branches need the fix. See [Backports](#backports) below.

### After you open it

If this is your first contribution to the repository, GitHub won't run CI until a maintainer approves the workflow runs, so at first you'll see only the DCO check. That's expected; a maintainer will approve them when they pick up the review.

GitHub asks the code owners listed in [`.github/CODEOWNERS`](https://github.com/kubevela/kubevela/blob/master/.github/CODEOWNERS) for a review. The project's maintainers and reviewers are listed in the community repository's [OWNERS.md](https://github.com/kubevela/community/blob/main/OWNERS.md).

If a week goes by without a review, a comment on the pull request is fine, or ask in [`#kubevela`](https://cloud-native.slack.com/archives/C01BLQ3HTJA) on the CNCF Slack.

#### Backports

Fixes are backported by label. Give the pull request a `backport release-x.y` label for each release branch that needs the fix (if you can't add labels, ask in the pull request and a maintainer will), and once it merges, a bot opens a backport pull request against each of those branches. If the change doesn't cherry-pick cleanly onto a branch, the backport has to be done by hand: cherry-pick it onto that release branch and open the pull request yourself, with a title starting `[Backport release-x.y]`.

## Code review

Once you've created a pull request, the next step is to have someone review your change.
A review is a learning opportunity for both the reviewer and the author of the pull request.

If you think a specific person needs to review your pull request, then you can tag them in the description or in a comment.
Tag a user by typing the `@` symbol followed by their GitHub username.

We recommend that you read [How to do a code review](https://google.github.io/eng-practices/review/reviewer/) to learn more about code reviews.

## Formatting guidelines

A well-written pull request minimizes the time to get your change accepted.
These guidelines help you write good commit messages and descriptions for your pull requests.

### Commit message format

Commit subjects and pull request titles use one format:

```
<Type>(<scope>): <subject>

[optional body]
```

The `<Type>` is capitalised and the `(<scope>)` is optional, for example `Fix(workflow): retry a failed step after suspend`. See [commit messages best practices](https://chris.beams.io/posts/git-commit/) for writing the rest.

#### Examples

Commit message with a scope:

```
Fix(defkit): make ToYAML write an object the controller can render
```

Commit message with no scope and no body:

```
Docs: correct the spelling of CHANGELOG
```

Commit message with a body:

```
Fix(cli): show the type of a list parameter that has a size bound

vela show printed `_|_` as the type of a parameter such as
`list.MinItems(1) & [...string]`. Look through list.MinItems and
list.MaxItems to the list operand before reading its kind.

Fixes #1234
Signed-off-by: Random Developer <random@developer.example.org>
```

#### `<Type>` (required)

`<Type>` is one of:

* **Feat**: A new feature
* **Fix**: A bug fix
* **Docs**: Documentation only changes
* **Style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **Refactor**: A code change that neither fixes a bug nor adds a feature
* **Perf**: A code change that improves performance
* **Test**: Adding missing or correcting existing tests
* **CI**: Changes to the CI workflows
* **Chore**: Changes to the build, dependencies or auxiliary tools
* **Revert**: Reverts an earlier commit

#### `<scope>` (optional)

The scope is the part of KubeVela the change is in, in parentheses: `Fix(cli)`, `Feat(workflow)`, `Chore(deps)`, `Fix(addon)`.

#### `<subject>` (required)

The subject follows the colon and space after the type and scope. It's a short summary of the change, e.g. `Fix: array parsing issue when multiple spaces were contained in string`, instead of `Fix: bug`.

#### `<body>` (optional)

A longer commit body may be provided after the short subject, providing additional contextual information about the code changes. The body MUST begin one blank line after the subject.

### Pull request titles

The KubeVela team _squashes_ all commits into one when we accept a pull request.
The title of the pull request becomes the subject line of the squashed commit message.
We still encourage contributors to write informative commit messages, as they become a part of the Git commit body.

We use the pull request title when we generate change logs for releases. As such, we strive to make the title as informative as possible.

Make sure that the title for your pull request uses the same format as the subject line in the commit message. A check on every pull request looks for one of the types above at the start of the title, and adds the `title-needs-formatting` label when it's missing.

### Pass all the CI checks

Before merge, all test CI should pass green.
- Codecov reports two checks: `codecov/patch` wants 70% of the lines you change covered, and `codecov/project` fails if total coverage drops by more than 0.1%. Neither blocks merge, but reviewers look at them, so aim for 70% on new code.
- Make sure every commit is signed off per the [DCO](#sign-your-commits-dco) requirements.

## Update the docs & website

If your pull request merged and this is a new feature or enhancement, it's necessary to update the docs and send a pull request to the [kubevela.github.io](https://github.com/kubevela/kubevela.github.io) repo.

Learn how to write the docs by the following guide:

* [kubevela.github.io Developer Guide](https://github.com/kubevela/kubevela.github.io/blob/main/README.md)
* [Update KubeVela.io CLI Reference Doc](./cli-ref-doc.md)

Great, you have complete the lifecycle of code contribution, try to [join the community as a member](https://github.com/kubevela/community/blob/main/community-membership.md) if you're interested.

## Troubleshooting

* Errors from `make fmt` (also run by `make reviewable`)

The `fmt` target formats the code with the `goimports` on your `PATH`, which may have been built with an older Go than the one you build KubeVela with. An old `goimports` can't parse current Go and fails like this:

```bash
$ make fmt
go fmt ./...
/<your_go_binary_path>/go/bin/goimports -local github.com/oam-dev/kubevela -w $(go list -f {{.Dir}} ./...)
/<kubevela_clone_path>/kubevela/pkg/cache/informer.go:46:25: expected ']', found any
```

To solve this issue, execute:

```bash
go install golang.org/x/tools/cmd/goimports@latest
```
