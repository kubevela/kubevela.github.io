---
title:  Needs More?
---

## 1. Get from capability registry

You can get more from official capability registry by using KubeVela [plugin](../../kubectlplugin)。

### List

By default, the following command lists capabilities from [the default registry](https://registry.kubevela.net) maintained by KubeVela.

```shell
$ vela trait --discover
Showing trait definition from registry: default
NAME                    REGISTRY        DEFINITION                      APPLIES-TO                      STATUS     
autoscale               default         autoscalers.standard.oam.dev    [deployments.apps]              uninstalled
crd-manual-scaler       default         manualscalertraits.core.oam.dev [deployments.apps]              uninstalled
dynamic-sa              default                                         [deployments.apps]              uninstalled
env                     default                                         [deployments.apps]              installed  
expose                  default                                         []                              installed  
hpa                     default                                         [deployments.apps]              uninstalled
init-container          default                                         [deployments.apps]              installed  
kautoscale              default                                         [deployments.apps]              uninstalled
metrics                 default         metricstraits.standard.oam.dev  [deployments.apps jobs.batch]   uninstalled
node-affinity           default                                         [deployments.apps]              installed  
rollout                 default         canaries.flagger.app            [deployments.apps]              installed  
route                   default         routes.standard.oam.dev         [deployments.apps]              uninstalled
virtualgroup            default                                         [deployments.apps]              uninstalled
```

`--discover` means list components from registry

### Install

Then you can install a trait like:

```shell
$ vela trait get init-container
Getting component definition from registry: default
Installing component: init-container
Successfully install trait: init-container
```

## 2. Designed by yourself

* Read [how to edit definitions](../../platform-engineers/cue/definition-edit) to build your own capability from existing ones.
* [Build your own capability from scratch](../../platform-engineers/cue/advanced)
  and learn more features about how to [define custom traits](../../platform-engineers/traits/customize-trait).
