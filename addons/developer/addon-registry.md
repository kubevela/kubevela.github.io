---
title: Build your Own Registry
---

An addon registry is where `vela` discovers addons and installs them from. You can build one on whatever already holds your artifacts:

| Type | `--type` | Versions | `vela addon push` | Credentials | Use it when |
| --- | --- | --- | --- | --- | --- |
| OCI registry | `oci` | Yes, each tag is a version | Yes | `--username` with `--password-stdin` (or `--password`) | You already run an OCI registry, such as ECR, GHCR, Harbor or Docker Hub. |
| Helm repository | `helm` | Yes | ChartMuseum and compatible servers only | `--username` with `--password-stdin` (or `--password`); `--insecureSkipTLS` for a self-signed certificate | You already run a Helm chart repository. |
| GitHub | `git` | Latest only | No, push with `git` | `--gitToken` | You want addons reviewed and merged like code. |
| GitLab | `gitlab` | Latest only | No, push with `git` | `--gitToken`, plus `--gitlabRepoName` | As GitHub, on GitLab. |
| Gitee | `gitee` | Latest only | No, push with `git` | `--gitToken` | As GitHub, on Gitee. |
| Object storage | `OSS` | Latest only | No, upload the files | None, the bucket must be readable | You serve static files from a bucket, such as Alibaba Cloud OSS. |

"Latest only" means `vela` installs whatever the registry holds now; you can't pick an older version. OCI and Helm registries store versioned addon packages, and `vela addon enable <addon> --version <version>` installs a specific one. A Helm repository stores addons as charts, but Helm itself can't install them, since addons contain CUE that only `vela` renders.

## Build an addon registry with an OCI registry

An OCI registry stores each addon as a Helm chart at `<endpoint>/<addon name>`, tagged with the addon's version. When you don't ask for a version, `vela` installs the highest one.

### Push addons

Push an addon directory or a packaged `.tgz` to an `oci://` URL. `vela addon push` packages a directory for you:

```shell
printf '%s' "$REGISTRY_PASSWORD" | vela addon push sample-addon oci://registry.example.com/addons --username myuser --password-stdin
```

This pushes `oci://registry.example.com/addons/sample-addon`, tagged with the version in the addon's `metadata.yaml`. Use `-v` to push a different version.

If you've already logged in with `helm registry login` or `docker login`, leave out `--username` and `--password-stdin`, and `vela` uses those saved credentials:

```shell
vela addon push sample-addon oci://registry.example.com/addons
```

The `HELM_REPO_USERNAME` and `HELM_REPO_PASSWORD` environment variables work in place of the flags. Use `--use-http` for a registry that only speaks plain HTTP, such as a local test registry. The ChartMuseum flags (`--access-token`, `--auth-header`, `--ca-file`, `--cert-file`, `--key-file` and `--insecure`) don't apply to OCI and are refused.

Each push also updates a catalog of the addons under the same endpoint, stored as the chart `kubevela-addon-catalog`. That catalog is how `vela addon list` finds the addons, since an OCI registry has no index of its own. If the catalog can't be updated, for example because your credentials can't push to that repository, the addon is still pushed and `vela` prints a warning. `vela addon list` then falls back to listing the registry's repositories, which not every registry allows (Docker Hub doesn't).

### Add the registry

```shell
printf '%s' "$REGISTRY_PASSWORD" | vela addon registry add my-oci --type oci --endpoint=oci://registry.example.com/addons --username=myuser --password-stdin
```

The endpoint must use the `oci://` scheme. Give `--username` and a password together, or neither for a registry that allows anonymous pulls. The password is kept in a Secret in `vela-system`, not in the registry's ConfigMap.

Once the registry is added, you can push to it by name, and `vela` uses the credentials stored with it:

```shell
vela addon push sample-addon my-oci
```

### Amazon ECR

ECR takes the user `AWS` and a token from the AWS CLI:

```shell
aws ecr get-login-password --region <region> | vela addon registry add ecr --type oci --endpoint=oci://<account>.dkr.ecr.<region>.amazonaws.com/addon --username=AWS --password-stdin
```

An ECR token expires after 12 hours. Refresh the stored one with `vela addon registry update`, which takes the same flags:

```shell
aws ecr get-login-password --region <region> | vela addon registry update ecr --type oci --endpoint=oci://<account>.dkr.ecr.<region>.amazonaws.com/addon --username=AWS --password-stdin
```

ECR refuses a push to a repository that doesn't exist, unless your registry creates repositories on push. Create one for each addon, such as `addon/sample-addon`, and one named `addon/kubevela-addon-catalog` for the catalog.

## Build Addon Registry with Git Repository

A directory with some subdirectories stored in a git repository can be used as an addon registry. GitHub, GitLab and Gitee are supported.

A typical git addon registry is like [catalog](https://github.com/kubevela/catalog/tree/master/addons), whose addons sit in its `addons/` directory. To start from it, clone it and push it to your own git repository:

```shell
git clone https://github.com/kubevela/catalog
cd catalog
git remote add <repoName> <your git server address>
git push -u <repoName> master
```

If your repository is on GitHub, add it as a registry with:

```shell
vela addon registry add my-repo --type git --endpoint=<URL> --path=<path> --gitToken=<git token>
```

For the copy of the catalog above, `--path=addons`.

If it's on Gitee:

```shell
vela addon registry add my-repo --type gitee --endpoint=<URL> --path=<path> --gitToken=<git token>
```

If it's on GitLab:

```shell
vela addon registry add my-repo --type gitlab --gitlabRepoName=<repoName> --endpoint=<URL> --path=<path> --gitToken=<git token>
```

Push new addons just like checking code into your git repository.

## Build an addon registry with object storage

A bucket that serves its files over HTTP works as a registry too, laid out like the git catalog: one directory per addon. Add it with:

```shell
vela addon registry add my-bucket --type OSS --endpoint=<URL> --bucket=<bucket name> --path=<path>
```

The type is written in capitals, `OSS`. There are no credentials, so the bucket must be publicly readable.

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
# If username and password is required, you can specify them with --username and --password (or --password-stdin)
# If the repo setup with self-signed certificate, you can use flag `--insecureSkipTLS` to add it.
```

You should see it in the list now:

```shell
$ vela addon registry list
Name    	Type	URL                        
...
localcm 	helm	http://localhost:8080 
```

### Push an addon to your registry

Prepare your addon. We will create a new one named `sample-addon` here:

```shell
$ vela addon init sample-addon
# A conventional addon directory will be created
# ./sample-addon
# ├── README.md
# ├── definitions
# │   └── mytrait.cue
# ├── metadata.yaml
# ├── parameter.cue
# ├── resources
# │   └── myresource.cue
# ├── schemas
# │   └── myschema.yaml
# ├── template.cue
# └── views
#     └── my-view.cue
```

The files under `definitions/`, `resources/`, `schemas/` and `views/` are samples; `--no-samples` leaves them out.

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

As described in [*Air-gapped Installation for Addon*](/docs/platform-engineers/system-operation/offline-installation#addons), you can enable an addon from local filesystem. But some addons required a Helm Chart, then you will need to build a Chart repository for that. This section is to tackle that problem. You will also learn how to sync [addon catalog](https://github.com/kubevela/catalog) to your ChartMuseum instance, so that you can directly enable an addon from a registry, instead of enabling it from local filesystem.

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

You can sync all of our addons in the catalog to your ChartMuseum instance and use them in your private environment. We will use the `vela addon push` command to package these and sync them to ChartMuseum.

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
$ helm pull dexidp/dex --version 0.15.3
# You should see a package named `dex-0.15.3.tgz`
```

Push the Chart to ChartMuseum:

```shell
$ vela addon push dex-0.15.3.tgz localcm
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
        version: "0.15.3"
        # Put your ChartMuseum URL here
        url: "http://10.2.1.4:8080"
        repoType: helm
        # Keep the addon's `values` as they are
```

Great! After you enable this addon, it will try to fetch the Chart from your ChartMuseum instance. (You should also consider making the images inside the Chart available to you too.)
