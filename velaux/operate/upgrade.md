---
title: Upgrade VelaUX
description: Upgrade the velaux addon, change its parameters, and remove it.
---

VelaUX is upgraded, reconfigured and removed as the `velaux` addon. Its data, the projects, environments, targets, users and application records, is kept apart from the addon (in ConfigMaps in the `kubevela` namespace, or in your database), so none of these lose it.

## Upgrade

```shell
vela addon upgrade velaux
```

This installs the version the addon registry holds now, keeping the parameters you enabled it with. To pick a version:

```shell
vela addon upgrade velaux --version v1.9.5
```

`vela addon list` shows the version that's installed and the versions the registry offers. Which VelaUX goes with which KubeVela, and the notes for each upgrade, are in [Versions](../reference/versions.md).

## Change a parameter

`vela addon upgrade` also changes parameters. The ones you pass are merged with the ones you set before:

```shell
vela addon upgrade velaux serviceType=NodePort
```

Running `vela addon enable velaux` again with new parameters works too, but it applies only the parameters on that command line: anything you set before and don't repeat goes back to its default. The parameters are listed in [Install Options](install-options.md#parameters).

## Remove VelaUX

```shell
vela addon disable velaux
```

This deletes the `addon-velaux` Application and with it the VelaUX server, its Service and RBAC. It doesn't touch what VelaUX deployed: the Applications it created for your environments keep running, and the controller keeps reconciling them. Enabling VelaUX again later picks up its stored data.

To remove the data as well, with the default `kubeapi` store:

```shell
kubectl delete namespace kubevela
```
