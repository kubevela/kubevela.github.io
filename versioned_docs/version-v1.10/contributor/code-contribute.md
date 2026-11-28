---
title: Code Contribution Guide
---

You will learn the following things in the code contribution guide:

- [How to Run KubeVela Locally](#run-kubevela-locally)
- [How to Run VelaUX Locally](#run-velaux-locally)
- [How to Create a pull request](#create-a-pull-request)
- [Code Review Guide](#code-review)
- [Formatting guidelines of pull request](#formatting-guidelines)
- [Troubleshooting](#troubleshooting)
- [Upgrade Go and Kubernetes Versions](#upgrade-go-and-kubernetes-versions)

## Run KubeVela Locally

This guide helps you get started developing KubeVela.

### Prerequisites

* Golang version 1.19+

<details>
  <summary>Install Golang</summary>

1. Download the archive for your system from the [official site](https://go.dev/dl/) and follow the [install instructions](https://go.dev/doc/install), which unpack it into `/usr/local/go`.

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


* Kubernetes version v1.20+ with `~/.kube/config` configured. (Don't have a test cluster? Try [VelaD](https://github.com/kubevela/velad/blob/main/docs/06.develop_kubevela.md) to develop KubeVela)


* golangci-lint v1.60.1. `make lint`, which `make reviewable` runs, installs it if it's missing.

<details>
  <summary>Install golangci-lint manually</summary>

You can install it manually following [the guide](https://golangci-lint.run/welcome/install/#local-installation) or with this command:

```bash
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.60.1
```

</details>

* kustomize 4.5.4+, it will install automatically if you run `make reviewable`, you can install it manually if the installation broken.

<details>
  <summary>Install kustomize manually</summary>

You can install it manually follow [the guide](https://kubectl.docs.kubernetes.io/installation/kustomize/) or the following commands:

```
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash
```

Move kustomize binary to your KubeVela repo folder:

```shell
mv kustomize ~/kubevela/bin/
```

</details>

* ginkgo 1.14.0+ (just for [E2E test](#integration-and-e2e-test))
  ```
  go install github.com/onsi/ginkgo/v2/ginkgo@latest
  ```

* Nothing to install for the unit tests' API server. `make test` runs `setup-envtest`, which downloads the Kubernetes 1.31.0 control-plane binaries the tests run against. To run a single package by hand, point `KUBEBUILDER_ASSETS` at the same binaries (`bin/setup-envtest` is there once `make test` has run):

  ```bash
  KUBEBUILDER_ASSETS="$(bin/setup-envtest use 1.31.0 -p path)" go test ./pkg/appfile/...
  ```

* [CUE](https://cuelang.org/docs/introduction/installation/) v0.9.2, the version `make reviewable` formats with:
  ```bash
  go install cuelang.org/go/cmd/cue@v0.9.2
  ```

* Other tools for running `make reviewable` in KubeVela. The Makefile installs them if they're missing, or install them yourself:
  ```shell
  go install honnef.co/go/tools/cmd/staticcheck@v0.6.1
  go install golang.org/x/tools/cmd/goimports@latest
  ```
  :::caution
  Note: For macOS, you may need to install [diffutils](https://www.gnu.org/software/diffutils/).
  :::

:::tip
You may also be interested with KubeVela's [design](https://github.com/oam-dev/kubevela/tree/master/design/vela-core) before diving into its code.
:::

### Build

- Clone this project

```shell script
git clone git@github.com:kubevela/kubevela.git
```

KubeVela includes two parts, `vela core` and `vela cli`.

- The `vela core` is actually a K8s controller, it will watch OAM Spec CRD and deploy resources.
- The `vela cli` is a command line tool that can build, run apps(with the help of `vela core`).

For local development, we probably need to build both of them.

- Build Vela CLI

```shell script
make
```

After the vela cli built successfully, `make` command will create `vela` binary to `bin/` under the project.

- Configure `vela` binary to System PATH

```shell script
export PATH=$PATH:/your/path/to/project/kubevela/bin
```

Then you can use `vela` command directly.

- Build Vela Core

```shell script
make manager
```

- Run Vela Core

Firstly make sure your cluster has CRDs, below is the command that can help install all CRDs.

```shell script
make core-install
```

To ensure you have created vela-system namespace and install definitions of necessary module.
you can run the command:

```shell script
make def-install
```

And then run locally:

```shell script
make core-run
```

This command will run controller locally, it will use your local KubeConfig which means you need to have a k8s cluster
locally. If you don't have one, try [VelaD](https://github.com/kubevela/velad/blob/main/docs/06.develop_kubevela.md) 
to develop KubeVela.

When you're developing `vela-core`, make sure the controller installed by helm chart is not running.
Otherwise, it will conflict with your local running controller.

You can check and uninstall it by using helm.

```shell script
helm list -A
helm uninstall -n vela-system kubevela
```

### Testing

It's necessary to write tests for good code quality, please refer to [the principle of test](./principle-of-test.md) before you start.

#### Unit test

```shell script
make test
```

The VelaUX API server's tests live in the VelaUX repository, see [Run VelaUX Locally](#run-velaux-locally).

#### Integration and E2E test

The e2e suites run against KubeVela installed from the chart, with a test image and the feature gates the suites expect. A controller started with `make core-run` doesn't have those, and the specs fail on timeouts. You need [Ginkgo v2](https://onsi.github.io/ginkgo/) on your `PATH`.

Install the test image into a [kind](https://kind.sigs.k8s.io/) cluster and run the suite:

```shell
make image-load
make e2e-setup-core
make e2e-test
```

### Debugging Locally with Remote KubeVela Environment

:::tip
For a comprehensive guide on debugging KubeVela controllers with IDE support, see [Debugging KubeVela Controllers](../platform-engineers/debug/debugging-kubevela-controllers).
:::

To run vela-core locally for debugging with kubevela installed in the remote cluster:
- Firstly, scaling the replicas of `kubevela-vela-core` to 0 for leader election of `controller-manager`:
  ```shell
  kubectl scale deploy -n vela-system kubevela-vela-core --replicas=0
  ```
- Secondly, removing the `WebhookConfiguration`, otherwise an error will be reported when applying your application using `vela-cli` or `kubectl`:
  ```shell
  kubectl delete ValidatingWebhookConfiguration kubevela-vela-core-admission -n vela-system
  kubectl delete MutatingWebhookConfiguration kubevela-vela-core-admission -n vela-system
  ```

Finally, you can use the commands in the above [Build](#build) and [Testing](#Testing) sections, such as `make run`, to code and debug in your local machine.

:::caution
Note you will not be able to test features relate with validating/mutating webhooks in this way.
:::

## Run VelaUX Locally

VelaUX, the KubeVela UI, lives in its own repository: the Go API server and the React frontend are both in [kubevela/velaux](https://github.com/kubevela/velaux). Its [contributing guide](https://github.com/kubevela/velaux/blob/main/docs/contributing/velaux.md) covers setting up KubeVela for it, running the server and the UI, and its tests.

## Create a pull request

We're excited that you're considering making a contribution to the KubeVela project!
This document guides you through the process of creating a [pull request](https://help.github.com/en/articles/about-pull-requests/).

### Before you begin

We know you're excited to create your first pull request. Before we get started, make sure your code follows the relevant [code conventions](./code-conventions.md).

### Your first pull request

Before you submit a PR, run this command to ensure it is ready:
```
make reviewable
```

If this is your first time contributing to an open-source project on GitHub, make sure you read about [Creating a pull request](https://help.github.com/en/articles/creating-a-pull-request).

To increase the chance of having your pull request accepted, make sure your pull request follows these guidelines:

- Title and description matches the implementation.
- Commits within the pull request follow the [Formatting guidelines](#Formatting-guidelines).
- The pull request closes one related issue.
- The pull request contains necessary tests that verify the intended behavior.
- If your pull request has conflicts, rebase your branch onto the main branch.

If the pull request fixes a bug:

- The pull request description must include `Closes #<issue number>` or `Fixes #<issue number>`.
- To avoid regressions, the pull request should include tests that replicate the fixed bug.
- Generally, we will maintain the last 2 releases for bugfix. You should add `backport release-x.x` label or comment `/backport release-x.y` for the releases contained the bug, github bot will automatically backport this PR to the specified release branch after PR merged. If there're any conflicts, you should cherry-pick it manually.

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

Make sure that the title for your pull request uses the same format as the subject line in the commit message. If the format is not followed, we will add a label `title-needs-formatting` on the pull request.

### Pass all the CI checks

Before merge, All test CI should pass green.
- The `codecov/project` should also pass. This means the coverage should not drop. Currently, the coverage of the Pull Request should have at least 70%.
- KubeVela uses [DCO](https://wiki.linuxfoundation.org/dco) for contributor agreements. It requires you to sign-off every commit before the pull request being merged.
  - Git provides a convenient flag `-s` in your commit command to sign-off automatically:
    ```shell
    git commit -s -m 'This is my commit message'
    ```
  - Contributors can also sign-off manually by adding a `Signed-off-by` line to commit messages as the following format, make sure the email matches your github account or the check bot won't pass.
    ```shell
    This is my commit message

    Signed-off-by: Random Developer <random@developer.example.org>
    ```

## Update the docs & website

If your pull request merged and this is a new feature or enhancement, it's necessary to update the docs and send a pull request to the [kubevela.github.io](https://github.com/kubevela/kubevela.github.io) repo.

Learn how to write the docs by the following guide:

* [kubevela.github.io Developer Guide](https://github.com/kubevela/kubevela.github.io/blob/main/README.md)
* [Update KubeVela.io CLI Reference Doc](./cli-ref-doc.md)

Great, you have complete the lifecycle of code contribution, try to [join the community as a member](https://github.com/kubevela/community/blob/main/community-membership.md) if you're interested.

## Troubleshooting

* Errors executing `make core-run`

The `core-run` target uses the `fmt` target to check the format of the files. This step also make use of goimports which
may not have the same version as the base golang installation. For older versions of goimports, you may see the following
error:

```bash
$ make core-run
go fmt ./...
/<your_go_binary_path>/go/bin/goimports -local github.com/oam-dev/kubevela -w $(go list -f {{.Dir}} ./...)
/<kubevela_clone_path>/kubevela/pkg/cache/informer.go:46:25: expected ']', found any
```

To solve this issue, execute:

```bash
go install golang.org/x/tools/cmd/goimports@latest
```

## Upgrade Go and Kubernetes Versions

Before upgrading in `kubevela/kubevela`, first upgrade all dependent repositories so their new tags/commits are available to be consumed in `kubevela/kubevela` repository.

### Scope 

The coordinated upgrade must cover ALL of the following repositories in the sequential order:

```
oam-dev/cluster-register
oam-dev/cluster-gateway
kubevela/pkg
kubevela/kube-trigger
kubevela/workflow
kubevela/terraform-controller
kubevela/prism
oam-dev/stern
oam-dev/terraform-config-inspect
kubevela/kubevela
kubevela/velaux
```

### Process

1. Pick target Go and Kubernetes minor. Confirm a compatible `sigs.k8s.io/controller-runtime`.

2. Upgrade ALL repositories EXCEPT `kubevela/kubevela` first. Do them sequentially respecting real import dependencies (see [Interdependencies example](#interdependencies-example)). The core `kubevela/kubevela` repository MUST be upgraded only after every repo below is merged; `kubevela/velaux` is upgraded last, only after the `kubevela/kubevela` upgrade is complete.

    - `oam-dev/cluster-register`
    - `oam-dev/cluster-gateway`
    - `kubevela/pkg`
    - `kubevela/kube-trigger`
    - `kubevela/workflow`
    - `kubevela/terraform-controller`
    - `kubevela/prism`
    - `oam-dev/stern`
    - `oam-dev/terraform-config-inspect`

3. When upgrading a downstream repo that depends on one you just merged and which is not tagged yet, temporarily reference the upstream commit:
    - `go get github.com/kubevela/pkg@<commit-sha>` (creates a pseudo-version)

4. Only AFTER all other repositories are merged upgrade `kubevela/kubevela`
    - Create the upgrade PR from a branch named `chore/upgrade-k8s-*` (e.g. `chore/upgrade-k8s-1.29-to-1.30`). This naming convention triggers the upgrade verification pipelines.

5. After `kubevela/kubevela` is merged, update the release notes and documentation with the new minimum Go version and supported Kubernetes versions, then upgrade `kubevela/velaux`.

### Interdependencies Example

Example: `kubevela/pkg` -> imported by `kubevela/workflow`.

1. Upgrade & merge PR in `kubevela/pkg`.

2. In `kubevela/workflow` branch:

  ```bash
  go get github.com/kubevela/pkg@<merged-commit-sha>
  go mod tidy
  ```

  (If later tag is released `kubevela/pkg`, run `go get github.com/kubevela/pkg@vX.Y.Z`.)

3. Merge `kubevela/workflow` PR.

4. Repeat this pattern until every non-main repo is merged, then update `kubevela/kubevela` once with all final tags.

### Validation Checklist

Use this template in each PR description:

```
### Upgrade Checklist
- [ ] Go version set to x.y.z in go.mod
- [ ] CI workflows use actions/setup-go with the same version: x.y.z
- [ ] Dockerfile base image updated (based on compatibility with the new Go version)
- [ ] k8s.io/* dependencies bumped to vx.y.z
- [ ] controller-runtime compatible version used
- [ ] All the tests running Kubevela on a Kubernetes cluster (Kind/K3D) use the correct Kubernetes version
- [ ] go mod tidy run cleanly
- [ ] Generated code & CRDs regenerated
```