---
title: Contributor Onboarding
---

This part of the docs is for writing addons: your own, for your platform, or one for the community catalog, [kubevela/catalog](https://github.com/kubevela/catalog). An addon is a directory of files, not a program, so there's no build step. You write it, enable it from the directory on a test cluster, and once it works you publish it to a registry or open a pull request against the catalog.

| Step | Page |
| --- | --- |
| Scaffold an addon and enable it | [Make Your Own Addon](./make-your-own-addon.md) |
| Write its Application, in CUE or YAML | [Addon Application in CUE or YAML](./addon-application.md) |
| Look up a file or a `metadata.yaml` field | [Addon Reference](./addon-reference.md) |
| Run it on a local cluster, and run the catalog's own checks | [Test an Addon Locally](./test-locally.md) |
| Publish it to your own registry | [Build your Own Registry](./addon-registry.md) |
| Contribute it to the catalog | [Contribute to the Catalog](./contribute.md) |

The `vela addon` commands and the addon format are part of KubeVela itself, in `pkg/addon` of [kubevela/kubevela](https://github.com/kubevela/kubevela). A change to how addons are rendered or installed is a KubeVela pull request; see KubeVela's [contribution guide](/docs/contributor/overview).

## Prerequisites

| Tool | Version | For |
| --- | --- | --- |
| A Kubernetes cluster | Any KubeVela supports; these pages use [k3d](https://k3d.io) | Enabling the addon |
| KubeVela and the `vela` CLI | The release you target; the catalog's CI uses v1.11.0 | `vela addon init`, `enable`, `package`, `push` |
| `cue` | v0.14 | Rendering an addon's CUE without a cluster (optional) |
| Go | 1.27.1, as in the catalog's `go.mod` | Running the catalog's checks locally (optional) |

## The catalog repository

```shell
git clone https://github.com/kubevela/catalog
```

| Path | What's there |
| --- | --- |
| `addons/` | Verified addons, one directory each. Published to the `KubeVela` registry. |
| `experimental/addons/` | Experimental addons. Published to the `experimental` registry. |
| `examples/` | Example Applications that use the addons, one directory per addon. |
| `test/e2e-test/addon-test/` | The CI program that enables changed addons (`main.go`), the `PENDING` list of addons it skips, and `definition-test/testdata/<addon>/`, Applications that must reach `running` once their addon is enabled. |
| `test/e2e-test/hack/check-semver.sh` | Checks that every addon's version is a semantic version. |
| `hack/addons/syn_addon_package.go` | Packages each addon and builds the registry index, on every merge. |
| `.github/workflows/` | `addon-test.yaml` runs the checks on each pull request; `addon.yaml` publishes the registries. |
| `legacy/` | Old definitions and charts, kept for reference. Not published. |

The default branch is `master`.
