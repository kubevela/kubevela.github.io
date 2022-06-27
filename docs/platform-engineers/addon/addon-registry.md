---
title: Build your Own Registry
---

An addon registry can be used for discovering and distributing addons. Currently, KubeVela supports two types of registries: git server and Helm repo.

## Git as registry

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

## Helm Chart repository as registry

A [Helm Chart repository](https://helm.sh/docs/topics/chart_repository/) can be used to store versioned addon packages. [ChartMuseum](https://chartmuseum.com/) is an open-source, easy to deploy, Helm Chart Repository server.

In this tutorial, we are going to use [ChartMuseum](https://chartmuseum.com/) to build our repository. If you already have one, don't worry. You can still follow these steps, except that you cannot utilize `vela addon push` command and will have to manually upload your addon. Note: registries that are compatible with ChartMuseum (e.g. Harbor) should also work.

Follow the instructions [here](https://chartmuseum.com/#Instructions) to set up your ChartMuseum instance. 

> Too complicated to set up? We have got you covered! A ChartMuseum addon is on the way.

For illustration purposes, we will assume your Helm Chart repository is accessible at `http://localhost:8080`. Let's get started!

Use your newly created ChartMuseum repository (or any other Helm Chart repository) as an addon registry. We will name it `localcm`:

```shell
$ vela addon registry add localcm --type helm --endpoint=http://localhost:8080 
# If username and password is required, you can specify them with --username and --password
```

You should see it in the list now:

```shell
$ vela addon registry list
Name    	Type	URL                        
KubeVela	helm	https://addons.kubevela.net
localcm 	helm	http://localhost:8080 
```

Prepare your addon. We will create a new one named `sample-addon` here:

```shell
$ vela addon init sample-addon
```

(Optional) Package your addon (Feel free to skip ahead. We will do this automatically for you if you don't want to package it manually):

```shell
$ vela addon package sample-addon
# You should see a package named sample-addon-1.0.0.tgz
```

Push your addon (`sample-addon`) to the registry (`localcm`) you just added:

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
# This is because we already pushed the exact same addon earlier.
# We need to use `-f` to overwrite it.
```

Your addon is available in the registry now!

```shell
$ vela addon list
NAME         	REGISTRY	DESCRIPTION            	AVAILABLE-VERSIONS 	STATUS  
...
sample-addon 	localcm 	An addon for KubeVela. 	[1.0.0]            	disabled
```

For more advanced usages, please refer to `vela addon push -h`.
