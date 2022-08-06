---
title: Build your Own Registry
---

An addon registry can be used for discovering and distributing addons. Currently, KubeVela supports two kinds of registries:

- Git Repo, you just need to push addon artifacts to any git repository to work. This kind relies on git to manage addon version while kubevela can only recognize the latest version.
- Helm repo, addon registry can share the same infrastructure with your helm charts, the format are strictly aligned. But addon can's be installed by helm, it need render for special files such as CUE. The package version management is aligned with Helm and KubeVela can recognize versions and install with a specified one.

## Build Addon Registry with Git Repository

A directory with some subdirectories stored in a git repository can be used as an addon registry.

The git type registry type supports GitHub, GitLab, and Gitee.

A typical git addon registry is like [catalog](https://github.com/kubevela/catalog/tree/master/addons). You can clone this repo to your local path and then push to your own git repository.

```yaml
$ git clone https://github.com/kubevela/catalog/tree/master/addons
$ git remote add <repoName> <you git server address>
$ git push -u <repoName> master
```

If your repository type is GitHub, you can use this command to add your addon registry.

```yaml
vela addon registry add my-repo --type git --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

If your type is Gitee, you can use:

```yaml
vela addon registry add my-repo --type gitee --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

If your type is GitLab, you can use:

```yaml
vela addon registry add my-repo --type gitlab --gitRepoName=<repoName> --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

Push new addons just like checking code into your git repository.

## Build and push to custom Helm Chart repository

A [Helm Chart repository](https://helm.sh/docs/topics/chart_repository/) can be used to store versioned addon packages. [ChartMuseum](https://chartmuseum.com/) is an open-source and easy-to-deploy Helm Chart Repository server.

In this tutorial, we are going to use [ChartMuseum](https://chartmuseum.com/) to build our repository. If you don't have ChartMuseum but already have some helm registries, you can re-use your registry with the following guide. The only exception for not having ChartMuseum is that you cannot utilize `vela addon push` command and will have to manually upload your addon.

Note: you can also use registries that are compatible with ChartMuseum (e.g. Harbor). They will have the same capabilities.

### Install ChartMuseum by Addon

> You can skip this step if you already have ChartMuseum.

We have provided a ChartMuseum addon, you can also create your own ChartMuseum instance or re-use exist one.

To enable it, run:

```shell
vela addon enable chartmuseum
```

If you don't have access to the default registry, refer to [the air gap installation of chartmuseum](#sync-addons-to-chartmuseum-in-an-air-gapped-environment).

> To customize addon parameters, either:
> - use VelaUX and fill out the form when enabling addon
> - or check out what parameters are available using `vela addon status chartmuseum -v`, and specify it using `vela addon enable chartmuseum externalPort=80`
> 
> This tutorial will assume you used the default parameters.

After successfully enabling the addon, we need to make sure ChartMuseum is accessible to you by forwarding the default port (8080):

```shell
vela port-forward -n vela-system addon-chartmuseum 8080:8080 --address 0.0.0.0
```

> Typically, you would configure ingress (achievable using addon parameters) to make the addon accessible to the outside.

### Add an addon registry using Helm Repository

Use your newly created ChartMuseum repository (or any other Helm Chart repository) as an addon registry. We will name it `localcm`:

```shell
$ vela addon registry add localcm --type helm --endpoint=http://localhost:8080 
# If username and password is required, you can specify them with --username and --password
```

You should see it in the list now:

```shell
$ vela addon registry list
Name    	Type	URL                        
...
localcm 	helm	http://localhost:8080 
```

### Push an addon to your registry

> Note: you need to upgrade your CLI to v1.5.0+ for this feature.

Prepare your addon. We will create a new one named `sample-addon` here:

```shell
$ vela addon init sample-addon
# A conventional addon directory will be created
# ./sample-addon
# ├── definitions
# ├── metadata.yaml
# ├── readme.md
# ├── resources
# ├── schemas
# └── template.yaml
```

(Optional) Package your addon:

> Feel free to skip ahead. We will do this automatically for you if you don't want to package it manually.

```shell
$ vela addon package sample-addon
# You should see a package named sample-addon-1.0.0.tgz
```

Push your addon (`sample-addon`) to the registry (`localcm`) that you just added:

```shell
# Notice how we automatically package the addon for you. 
$ vela addon push sample-addon localcm
Pushing sample-addon-1.0.0.tgz to localcm(http://localhost:8080)... Done
# If you packaged it yourself, just replace `sample-addon` with `sample-addon-1.0.0.tgz`

# In addition to registry names (localcm, as we saw earlier), URLs are also supported.
# If you use URLs, you don't even have to add it as an addon registry.
$ vela addon push sample-addon-1.0.0.tgz http://localhost:8080 -f
Pushing sample-addon-1.0.0.tgz to http://localhost:8080... Done
# Notice the `-f` option.
# This is because we already pushed the exact same addon to the same registry earlier.
# We need to use `-f` to overwrite it.
```

> For more advanced usages, please refer to `vela addon push -h`.

Your addon is available in the registry now!

```shell
$ vela addon list
NAME          REGISTRY   DESCRIPTION             AVAILABLE-VERSIONS  STATUS  
...
sample-addon  localcm    An addon for KubeVela.  [1.0.0]             disabled
```

## Sync addons to ChartMuseum in an air-gapped environment

As described in [*Air-gapped Installation for Addon*](../system-operation/enable-addon-offline), you can enable an addon from local filesystem. But some addons required a Helm Chart, then you will need to build a Chart repository for that. This section is to tackle that problem. You will also learn how to sync [addon catalog](https://github.com/kubevela/catalog) to your ChartMuseum instance, so that you can directly enable an addon from a registry, instead of enabling it from local filesystem.

### Goals

- Air-gapped installation of ChartMuseum addon
- Sync addon catalog to your ChartMuseum instance
- Sync Helm Charts to your ChartMuseum instance

### Air-gapped installation of ChartMuseum addon

Since all the required files to install ChartMuseum addon are stored in the catalog, you need to download [addon catalog](https://github.com/kubevela/catalog) first:

```shell
$ git clone --depth=1 https://github.com/kubevela/catalog
```
Navigate to ChartMuseum addon directory:

```shell
$ cd catalog/addons/chartmuseum
```
Now, you need to find a way to sync ChartMuseum image to your cluster. For example, you can pre-load the original image into your cluster or sync the image to your private image registry and use a custom image.

To find out the default image that ChartMuseum is using:

```shell
$ cat resources/parameter.cue | grep "image"
	// +usage=ChartMuseum image
	image: *"ghcr.io/helm/chartmuseum:v0.15.0" | string
# At the time of writing, ChartMuseum is using ghcr.io/helm/chartmuseum:v0.15.0
# Fetch this image and make it available in your private cluster.
```

To use your custom image and enable the addon:

```shell
$ vela addon enable . image=your-private-repo.com/chartmuseum:v0.15.0
# Since you are already inside chartmuseum/ dir, we use `.`
```

Now ChartMuseum addon should be enabled.

### Sync addon catalog to your ChartMuseum instance

Before you continue, you need to make sure you can access your ChartMuseum instance. Check out the previous section on how to use it as an addon registry. We will assume you are using the same settings as the previous section (i.e. you can properly access it,  and named as `localcm`).

Inside the repo that you just cloned, navigate to `catalog/addons`. You should see a list of community-verified addons. 

You can sync all of our addons in the catalog to your ChartMuseum instance and use them in your private environment. We will leverage `vela addon push` command (CLI v1.5 or later) to package these and sync them to ChartMuseum.

As we all know, we can push a single addon to ChartMuseum by:

```shell
# push chartmusem/ to localcm registry
vela addon push chartmuseum localcm
```

Therefore, we can use a loop to push all addons to ChartMuseum:

```shell
# You PWD should be catalog/addons.
# Replace `localcm` with you own registry name.
for i in *; do \
    vela addon push $i localcm -f; \
done;

Pushing cert-manager-1.7.1.tgz to localcm(http://10.2.1.4:8080)... Done
Pushing chartmuseum-4.0.0.tgz to localcm(http://10.2.1.4:8080)... Done
Pushing cloudshell-0.2.0.tgz to localcm(http://10.2.1.4:8080)... Done
...
```

Congratulations, all community-verified addons are now available in your ChartMuseum instance (check it out using `vela addon list`, and enable them using `vela addon enable addon-name`). You can do the same thing with `experimental` addons.

### Sync Helm Charts to your ChartMuseum instance

This is useful when you need to enable an addon that uses a Helm Chart inside, but you cannot access the Chart.

We will take `dex` addon as an example here. It originally uses a Chart named `dex` from `dexidp`. We are going to make that Chart available in our ChartMuseum instance and modify `dex` addon to use our custom Chart.

Check `template.yaml` or `resources/` directory to find out what Chart is `dex` using.

After you know the right Chart, pull the corresponding Chart:

```shell
# Add the repo
$ helm repo add dexidp https://charts.dexidp.io
# Pull the right Chart
$ helm pull dexidp/dex --version 0.6.5
# You should see a package named `dex-0.6.5.tgz`
```

Push the Chart to ChartMuseum:

```shell
$ vela addon push dex-0.6.5.tgz localcm
# You can use helm cm-push as well, if you have the Helm plugin installed.
```

Now you have `dex` inside your ChartMuseum instance. It is time to use it.

Edit `template.yaml` or Helm component in `resources/` to use your custom Chart:

```yaml
# template.yaml of dex addon
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: dex
  namespace: vela-system
spec:
  components:
    - name: dex
      type: helm
      properties:
        chart: dex
        version: "0.6.5"
        # Put your ChartMuseum URL here
        url: "http://10.2.1.4:8080"
        repoType: helm
```

Great! After you enable this addon, it will try to fetch the Chart from your ChartMuseum instance. (You should also consider making the images inside the Chart available to you too.)
