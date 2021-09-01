---
title:  Want More？
---

## 1. Get from capability registry

You can get more from official capability registry by using KubeVela [plugin](../../../developers/references/kubectl-plugin#install-kubectl-vela-plugin)。

### List

By default, the commands will list capabilities from [repo](https://registry.kubevela.net) maintained by KubeVela.

```shell
$ kubectl vela comp --discover
Showing components from registry: oss://registry.kubevela.net
NAME     	REGISTRY	DEFINITION      
webserver	default 	deployments.apps
```

### Install

Then you can install a component like:

```shell
$ kubectl vela comp get webserver
Installing component capability webserver
Successfully install component: webserver                                                                                             
```

## 2. Designed by yourself

* Read [how to edit definitions](../../cue/definition-edit) to build your own capability from existing ones.
* [Build your own capability from scratch](../../cue/advanced)
  and learn more features about how to [define custom components](../custom-component).