---
title:  Needs More？
---

## 1. Get from capability registry

You can get more from official capability registry by using KubeVela [plugin](../../kubectlplugin)。

### List

By default, the following command lists capabilities from [the default registry](https://registry.kubevela.net) maintained by KubeVela.

```shell
$ vela comp --discover
Listing component definition from registry: default
NAME            REGISTRY        DEFINITION                      STATUS     
kustomize       default         autodetects.core.oam.dev        installed  
webserver       default         deployments.apps                uninstalled
```

`--discover` means list components from registry

### Install

Then you can install a component like:

```shell
$ vela comp get webserver
Getting component definition from registry: default
Installing component: webserver
Successfully install component: webserver
```

## 2. Designed by yourself

* Read [how to edit definitions](../../platform-engineers/cue/definition-edit) to build your own capability from existing ones.
* [Build your own capability from scratch](../../platform-engineers/cue/advanced)
  and learn more features about how to [define custom components](../../platform-engineers/components/custom-component).