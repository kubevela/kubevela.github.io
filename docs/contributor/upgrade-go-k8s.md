---
title: Upgrade Go and Kubernetes Versions
---

This page is for maintainers. It covers bumping the Go toolchain and the Kubernetes libraries across the KubeVela repositories in one coordinated pass.

Before upgrading in `kubevela/kubevela`, first upgrade all dependent repositories so their new tags/commits are available to be consumed in `kubevela/kubevela` repository.

## Scope 

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

## Process

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

## Interdependencies Example

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

## Validation Checklist

Use this template in each PR description:

```
## Upgrade Checklist
- [ ] Go version set to x.y.z in go.mod
- [ ] CI workflows use actions/setup-go with the same version: x.y.z
- [ ] Dockerfile base image updated (based on compatibility with the new Go version)
- [ ] k8s.io/* dependencies bumped to vx.y.z
- [ ] controller-runtime compatible version used
- [ ] All the tests running Kubevela on a Kubernetes cluster (Kind/K3D) use the correct Kubernetes version
- [ ] go mod tidy run cleanly
- [ ] Generated code & CRDs regenerated
```