---
title: Air-gapped Installation
---

`velad` provides the air-gapped installation experience, it's now the [default installation guide](../../install.mdx#1-install-velad).


## Addons

If your environment can't reach the addon registry or `https://github.com/kubevela/catalog`, clone the catalog, point each addon's images and charts at your registry, then enable the addon from its local directory.

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
    helm push <chart>-<version>.tgz <your chart registry>
    ```

    You can use the ChartMuseum addon as that chart registry; see [*Sync Helm Charts to your ChartMuseum instance*](../addon/addon-registry.md#sync-helm-charts-to-your-chartmuseum-instance).

4. Point the addon at your registries. Many addons take the registry as a parameter (see `parameter.cue` in the addon's directory); otherwise change the image and chart URL in the files under `resources/`.

5. Enable the addon from its local directory:

    ```shell
    vela addon enable ./catalog/addons/<addon>
    ```