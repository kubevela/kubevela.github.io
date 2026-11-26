---
title: Air-gapped Installation
---

`velad` provides the air-gapped installation experience, it's now the [default installation guide](../../install.mdx#1-install-velad).

## Images to mirror

If you install the `vela-core` Helm chart yourself, mirror these images and set `imageRegistry` to your registry. The chart prefixes every image it runs with it.

| Image | Used by | Helm value |
|---|---|---|
| `oamdev/vela-core`, at the chart's version | the controller | `image.repository`, `image.tag` |
| `oamdev/cluster-gateway:v1.10.0-alpha.1` | multi-cluster | `multicluster.clusterGateway.image` |
| `alpine/k8s:1.34.13` | the Job that applies the built-in definitions | `builtinDefinitions.job.image` |
| `oamdev/hello-world:v1`, `oamdev/alpine-k8s:1.18.2` | `helm test` | `test.app`, `test.k8s` |

The chart pins `cluster-gateway` and `alpine/k8s` by digest, so copy them in a way that keeps their digests (a copy of the whole manifest list, not a rebuilt image).

Some built-in definitions run their own image, which `imageRegistry` does not change. Mirror it and set the definition's parameter if you use the definition:

| Image | Definition | Parameter |
|---|---|---|
| `ghcr.io/osscontainertools/kaniko:v1.29.1` (by digest) | `build-push-image` step | `kanikoExecutor` |
| `oamdev/vela-cli:v1.6.4` | `vela-cli` step | `image` |
| `nocalhost-docker.pkg.coding.net/nocalhost/dev-images/<language>:latest` | `nocalhost` trait | `image` (a full image name instead of `go`, `java`, `python`, `node` or `ruby`) |

The `restart-workflow` step runs `bitnami/kubectl:latest` and has no parameter for it. Mirror it under the same name, or edit the definition to point at your registry.


## Addons

If your environment can't reach the addon registry or `https://github.com/kubevela/catalog`, clone the catalog, point each addon's images and charts at your registry, then enable the addon from its local directory. Run steps 1 to 3 on a machine that can reach the internet and your registries, then carry the catalog over to the air-gapped side.

1. Clone [the catalog repo](https://github.com/kubevela/catalog). Community addons are in `./addons/`, experimental ones in `./experimental/addons/`.

    ```shell
    git clone https://github.com/kubevela/catalog
    ```

    To host the catalog yourself, see [*Sync addon catalog to your ChartMuseum instance*](../addon/addon-registry.md#sync-addon-catalog-to-your-chartmuseum-instance).

2. List the images and Helm charts an addon uses, by rendering it without installing anything:

    ```shell
    vela addon enable ./catalog/addons/<addon> --dry-run | grep -E '^\s*(image|url|chart|version):' | sort -u
    ```

    For a component that installs a Helm chart, this lists the chart; the chart's own images are in its `values.yaml`.

3. Copy each image to your registry:

    ```shell
    docker pull <image>
    docker tag <image> <your registry>/<image>
    docker push <your registry>/<image>
    ```

    And each chart to your chart registry:

    ```shell
    helm pull <chart> --repo <url> --version <version>
    vela addon push <chart>-<version>.tgz <your chart registry>
    ```

    `<your chart registry>` is a registry added with `vela addon registry add`, a ChartMuseum URL, or an `oci://` URL.

    You can use the ChartMuseum addon as that chart registry; see [*Sync Helm Charts to your ChartMuseum instance*](../addon/addon-registry.md#sync-helm-charts-to-your-chartmuseum-instance).

4. Point the addon at your registries. Many addons take the registry as a parameter (see `parameter.cue` in the addon's directory); otherwise change the image and chart URL in the files under `resources/`.

5. Enable the addon from its local directory:

    ```shell
    vela addon enable ./catalog/addons/<addon>
    ```