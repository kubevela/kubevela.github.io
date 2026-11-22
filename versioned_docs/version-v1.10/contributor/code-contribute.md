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

1. Install go1.19 from [official site](https://go.dev/dl/). Unpack the binary and place it somewhere, assume it's in the home path `~/go/`, below is an example command, you should choose the right binary according to your system.
  ```
  wget https://go.dev/dl/go1.20.2.linux-amd64.tar.gz
  tar xzf go1.20.2.linux-amd64.tar.gz
  ```

If you want to keep multiple golang version in your local develop environment, you can download the package and unfold it into some place, like `~/go/go1.19.1`, then the following commands should also change according to the path.

1. Set environment variables for Golang

  ```
  export PATH=~/go/bin/:$PATH
  export GOROOT=~/go/
  export GOPATH=~/gopath/
  ```

  Create a gopath folder if not exist `mkdir ~/gopath`. These commands will add the go binary folder to the `PATH` environment (let it to be the primary choice for go), and set the `GOROOT` environment to this go folder. Please add these lines to your `~/.bashrc` or `~/.zshrc` file, so that you don't need to set these environment variables every time you open a new terminal.

1. (Optional) Some area like China may be too slow to connect to the default go registry, you can configure GOPROXY to speed up the download process. 
  ```
  go env -w GOPROXY=https://goproxy.cn,direct
  ```


</details>


* Kubernetes version v1.20+ with `~/.kube/config` configured. (Don't have a test cluster? Try [VelaD](https://github.com/kubevela/velad/blob/main/docs/06.develop_kubevela.md) to develop KubeVela)


* golangci-lint 1.49.0+, it will install automatically if you run `make`, you can install it manually if the installation broken.

<details>
  <summary>Install golangci-lint manually</summary>

You can install it manually follow [the guide](https://golangci-lint.run/usage/install/#local-installation) or the following command:

```
cd ~/go/ && curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s v1.49.0
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

* ginkgo 1.14.0+ (just for [E2E test](#e2e-test))
  ```
  go install github.com/onsi/ginkgo/v2/ginkgo@latest
  ```

* kubebuilder v3.1.0+ and you need to manually install the dependency tools for unit test.

<details>
  <summary>Install Kubebuilder manually</summary>

linux:

```
wget https://storage.googleapis.com/kubebuilder-tools/kubebuilder-tools-1.21.2-linux-amd64.tar.gz
tar -zxvf  kubebuilder-tools-1.21.2-linux-amd64.tar.gz
mkdir -p /usr/local/kubebuilder/bin
sudo mv kubebuilder/bin/* /usr/local/kubebuilder/bin
```

macOS:

```
curl -O https://storage.googleapis.com/kubebuilder-tools/kubebuilder-tools-1.21.2-darwin-amd64.tar.gz
tar -zxvf  kubebuilder-tools-1.21.2-darwin-amd64.tar.gz
mkdir -p /usr/local/kubebuilder/bin
sudo mv kubebuilder/bin/* /usr/local/kubebuilder/bin
```

For other OS or system architecture, please refer to https://storage.googleapis.com/kubebuilder-tools/

</details>


* [CUElang](https://github.com/cue-lang/cue/blob/master/doc/install.md) v0.4.3+
  ```
  go install cuelang.org/go/cmd/cue@latest
  ```

* Other tools for running `make reviewable` in KubeVela.
  ```shell
  go install honnef.co/go/tools/cmd/staticcheck@2022.1
  go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.6.2
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

To execute the unit test of the API module, the mongodb service needs to exist locally.

```shell script
make unit-test-apiserver
```

#### Integration and E2E test

**Before e2e test start, make sure you have vela-core running.**

```shell script
make core-run
```

Start to test.

```shell script
make e2e-test
```

### Debugging Locally with Remote KubeVela Environment

:::tip
For a comprehensive guide on debugging KubeVela controllers with IDE support, see [Debugging KubeVela Controllers](../platform-engineers/debug/debugging-kubevela-controllers.md).
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

VelaUX is the UI console of KubeVela, it's also an addon including apiserver code in `kubevela` repo and the frontend code in `velaux` repo.

Before start, please make sure you have already started the vela controller environment in kubevela repo directory.

```shell
make run-apiserver
```

By default, the apiserver will be serving at "0.0.0.0:8000".

Get the VelaUX code by:

```shell
git clone git@github.com:kubevela/velaux.git
```

Configure the apiserver address:

```shell
cd velaux
echo "BASE_DOMAIN='http://127.0.0.1:8000'" > .env
```

Make sure you have installed [yarn](https://classic.yarnpkg.com/en/docs/install).

```shell
yarn install
yarn start
```

To execute the e2e test of the API module, the mongodb service needs to exist locally.

```shell script
# save your config
mv ~/.kube/config  ~/.kube/config.save

kind create cluster --image kindest/node:v1.20.7@sha256:688fba5ce6b825be62a7c7fe1415b35da2bdfbb5a69227c499ea4cc0008661ca --name worker
kind get kubeconfig --name worker --internal > /tmp/worker.kubeconfig
kind get kubeconfig --name worker > /tmp/worker.client.kubeconfig

# restore your config
mv ~/.kube/config.save  ~/.kube/config

make e2e-apiserver-test
```

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

KubeVela follows the [conventional-commits](https://www.conventionalcommits.org/en/v1.0.0/) and [commit messages best practices](https://chris.beams.io/posts/git-commit/) to improve better history information.

The commit message should be structured as follows:

```
<type>[optional scope]: <subject>

[optional body]
```

#### Examples:

Commit message with scope:

```
Feat(lang): add polish language
```

Commit message with no body:

```
Docs: correct spelling of CHANGELOG
```

Commit message with multi-paragraph body:

```
Fix: correct minor typos in code

see the issue for details

on typos fixed.

Reviewed-by: Z
Refs #133
```

#### `<type>` (required)

Type is required to better capture the area of the commit, based on the [Angular convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines).

We capitalize the `<type>` to make sure the subject line is capitalized. `<type>` can be one of the following:

* **Feat**: A new feature
* **Fix**: A bug fix
* **Docs**: Documentation only changes
* **Build**: Changes that affect the build system or external dependencies 
* **Style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **Refactor**: A code change that neither fixes a bug nor adds a feature
* **Perf**: A code change that improves performance
* **Test**: Adding missing or correcting existing tests
* **Chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

#### `<scope>` (optional)

Scope is optional, it may be provided to a commit’s type, to provide additional contextual information and is contained within parenthesis, it is could be anything specifying place of the commit change. Github issue link is
also a valid scope. For example: Fix(cli), Feat(api), Fix(#233), etc.

You can use `*` when the change affects more than a single scope.

#### `<subject>` (required)

The subject MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., "Fix: array parsing issue when multiple spaces were contained in string", instead of "Fix: bug".

#### `<body>` (optional)

A longer commit body may be provided after the short subject, providing additional contextual information about the code changes. The body MUST begin one blank line after the description.

#### Area

The area should use upper camel case, e.g. UpperCamelCase.

Prefer using one of the following areas:

- **Application:** Changes to the application controller.
- **Component:** Changes to the component related code or definition controller.
- **Trait:** Changes to the trait related code or definition controller.
- **CUE:** Changes to the CUE related logic.
- **Docs:** Changes to documentation.

**Examples**

- `Application: Support workflow in application controller`
- `CUE: Fix patch parse issues`
- `Docs: Changed url to URL in all documentation files`

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

If your pull request merged and this is a new feature or enhancement, it's necessary to update the docs and send a pull request to [kubevela.io](https://github.com/kubevela/kubevela.io) repo.

Learn how to write the docs by the following guide:

* [kubevela.io Developer Guide](https://github.com/kubevela/kubevela.io/blob/main/README.md)
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