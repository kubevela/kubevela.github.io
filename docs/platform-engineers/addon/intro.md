---
title: Make Your Own Addon
---

import AddonMechanism from '@site/src/components/AddonMechanism';

An addon is a directory with three kinds of files: metadata (`metadata.yaml`, `README.md`), definitions and UI schemas, and an Application that installs the operator behind them. This page builds one from a Helm chart, enables it on your cluster and checks that it worked. Every file and field an addon can carry is listed in the [Addon reference](./reference.md).

:::tip
For a longer walkthrough that builds an addon around the Redis operator, see the blog post [building an addon from scratch](/blog/2022/10/18/building-addon-introduction).
:::

## How an addon is installed

<AddonMechanism />

1. An [addon registry](./addon-registry.md) stores addons so they can be shared. It can be a Git repository, a Helm chart repository or an OCI registry. You can also enable an addon straight from a directory on your machine.
2. When you enable an addon from the CLI or VelaUX, KubeVela reads its files, assembles them into an Application named `addon-<name>` in `vela-system` and applies it, along with the addon's definitions and UI schemas.
3. The Application controller then delivers that Application like any other, to the hub and, if the addon asks for it, to your managed clusters.

## Quick start

This builds an addon that installs [podinfo](https://github.com/stefanprodan/podinfo) from its Helm chart, published in an OCI registry.

### 1. Create the scaffold

```shell
vela addon init podinfo --helm-repo oci://ghcr.io/stefanprodan/charts --chart podinfo --chart-version 6.11.2
```

```console
Scaffold created in directory podinfo. What to do next:
- Check out our guide on how to build your own addon: https://kubevela.io/docs/platform-engineers/addon/intro
- Review and edit what we have generated in podinfo
- To enable this addon, run: vela addon enable podinfo
```

The directory holds a starting point for every part of an addon:

```shell
$ ls podinfo
README.md     definitions   metadata.yaml parameter.cue resources     schemas       template.cue  views
```

The chart is installed by `resources/helm.cue`, a component of the `helm` type:

```cue
output: {
	name: "addon-podinfo"
	type: "helm"
	properties: {
		repoType: "oci"
		url:      "oci://ghcr.io/stefanprodan/charts"
		chart:    "podinfo"
		version:  "6.11.2"
	}
}
```

The `helm` component type comes from the [fluxcd](../../reference/addons/fluxcd.md) addon, so the scaffold lists `fluxcd` under `dependencies` in `metadata.yaml`, and enabling `podinfo` enables `fluxcd` first. The addon's version is set to the chart version, `6.11.2`.

The other files (`definitions/mytrait.cue`, `schemas/myschema.yaml`, `views/my-view.cue`, `resources/myresource.cue`) are samples. Edit them or delete them; pass `--no-samples` to leave them out.

### 2. Enable it from the local directory

```shell
vela addon enable ./podinfo
```

```console
Addon podinfo enabled successfully.
```

The CLI prints any endpoints the addon's Application exposes after that line.

### 3. Check it

```shell
vela addon status podinfo
```

```console
podinfo: enabled (6.11.2)
==> Installed Clusters
[local]
==> Registry Name
local
```

`local` as the registry means the addon was enabled from a directory. The chart itself is a HelmRelease in `vela-system`, so `vela status addon-podinfo -n vela-system` shows its health like any other Application.

To pick up an edit, run `vela addon enable ./podinfo` again. To remove it, run `vela addon disable podinfo`.

## Other starting points

Base the addon on Kubernetes objects at remote URLs, such as CRDs. The scaffold adds a `ref-objects` component that reads them:

```shell
vela addon init my-addon --url https://example.com/crd1.yaml --url https://example.com/crd2.yaml
```

Write the addon's definitions in Go with [defkit](../defkit/overview.md) instead of CUE. The scaffold adds a `godef/` Go module, with a stub for each definition you name:

```shell
vela addon init my-addon --godef --components api --traits scaler
```

The flags combine, so one addon can start from a Helm chart, remote objects and Go definitions together. `vela addon init --help` lists them all.

## Next steps

- Write the addon's Application in [CUE](./addon-cue.md) or [YAML](./addon-cue.md#write-it-in-yaml).
- Look up a file or a `metadata.yaml` field in the [Addon reference](./reference.md).
- Publish it to an [addon registry](./addon-registry.md).
- Build addons for cloud resources with the [Terraform addon tooling](./terraform.md).

## Known limits

An addon can't be installed on managed clusters only. vela-core renders every resource on the hub, so any [CRD](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) the addon's definitions use must also be installed on the hub, or rendering fails with `no matches for kind`.

## Contribute an addon

Besides publishing an addon in your own registry, you can open a pull request against the [verified addons](https://github.com/kubevela/catalog/tree/master/addons) or [experimental addons](https://github.com/kubevela/catalog/tree/master/experimental/addons) in the community catalog. Once it merges, every KubeVela user can find and enable it.

- A new addon starts as experimental. It needs:
    - An icon URL and a project URL in `metadata.yaml` that resolve.
    - A `README.md` that says what the addon is, why you'd use it, what it installs, and a basic example.
    - Examples in the catalog's [examples directory](https://github.com/kubevela/catalog/tree/master/examples) make it more likely to be accepted.
- To be promoted to verified, an experimental addon must:
    - Pass the catalog's [addon e2e test](https://github.com/kubevela/catalog/tree/master/test/e2e-test/addon-test), which checks that it enables.
    - Have a page in the [addon documentation](../../reference/addons/overview.md).
- If you hit a problem with an addon, open an issue or a pull request to fix it, and bump the addon's version in that pull request.
