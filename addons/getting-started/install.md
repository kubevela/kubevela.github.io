---
title: Install Addons
---

Addons need KubeVela on the cluster and the `vela` CLI on your machine. If you don't have them yet, follow [Install KubeVela](/docs/installation/kubernetes). There's nothing else to install: the vela-core chart registers the community catalog as the `KubeVela` registry, so you can list and enable its addons straight away.

## List what's available

```shell
vela addon list
```

```console
NAME                     	REGISTRY	DESCRIPTION                                                    	AVAILABLE-VERSIONS           	STATUS
cert-manager             	KubeVela	Automatically provision and manage TLS certificates in Kuber...	[2.2.0, 2.1.1, 2.1.0]        	-
kruise-rollout           	KubeVela	Rollout workload by kruise controller                          	[1.5.2, 1.5.1]               	-
ingress-nginx            	KubeVela	gateway for serving ingress traffic                            	[1.1.2, 1.1.1]               	-
fluxcd                   	KubeVela	Extended workload to do continuous and progressive delivery    	[3.0.2, 3.0.1, 3.0.0, ...]   	-
velaux                   	KubeVela	KubeVela User Experience (UX). An extensible, application-or...	[v1.9.5, v1.9.4, v1.9.3, ...]	-
```

The list is trimmed here; the catalog has about forty addons. `AVAILABLE-VERSIONS` shows the newest versions in the registry, and `STATUS` is `-` until you enable one, then `enabled` with its version.

## Enable an addon

```shell
vela addon enable fluxcd
```

```console
Addon fluxcd enabled successfully.
Please access addon-fluxcd from the following endpoints:
+---------+--------------------------+----------------------------------------------+-------------------------------------------+-------+
| CLUSTER |        COMPONENT         |           REF(KIND/NAMESPACE/NAME)           |                 ENDPOINT                  | INNER |
+---------+--------------------------+----------------------------------------------+-------------------------------------------+-------+
| local   | fluxcd-source-controller | Service/flux-system/fluxcd-source-controller | fluxcd-source-controller.flux-system:9090 | true  |
+---------+--------------------------+----------------------------------------------+-------------------------------------------+-------+
```

The CLI waits until the addon's Application is running. An addon's dependencies are enabled first: `kruise-rollout` depends on `fluxcd`, so enabling it enables `fluxcd` too if you don't have it.

Each addon's page in the [Addon Catalog](../overview.md) lists its parameters. Set them as `key=value` pairs after the name, and pick a version with `--version`:

```shell
vela addon enable ingress-nginx serviceType=NodePort
vela addon enable fluxcd --version=3.0.2
```

To see an addon's parameters, its versions and what it installs, before or after enabling it:

```shell
vela addon status fluxcd -v
```

```console
fluxcd: enabled (3.0.2)
Extended workload to do continuous and progressive delivery
==> Installed Clusters
[local]
==> Registry Name
KubeVela
==> Available Versions
[3.0.2, 3.0.1, 3.0.0, 2.4.0, 2.3.9, 2.3.8, 2.3.7, 2.3.6, ...]
==> Dependencies ✔
[]
==> Parameters
-> registry: Base URL for images that the FluxCD controllers use, e.g. ghcr.io
-> clusters: Deploy to specified clusters. Leave empty to deploy to all clusters.
-> onlyHelmComponents: OnlyHelmComponents only enable helm associated components, default to false
	default: false
-> sourceControllerOptions: advanced options for Source Controller
-> kustomizeControllerOptions: advanced options for Kustomize Controller
-> imageReflectorControllerOptions: advanced options for Image Reflector Controller
-> namespace: Namespace to deploy to, defaults to flux-system
	default: "flux-system"
-> helmControllerOptions: advanced options for Helm Controller
-> imageAutomationControllerOptions: advanced options for Image Automation Controller
```

## Add the experimental registry

Experimental addons sit in their own registry, which isn't registered by default:

```shell
vela addon registry add experimental --type helm --endpoint=https://kubevela.github.io/catalog/experimental
vela addon enable experimental/<name>
```

## Upgrade and disable

`vela addon upgrade` moves an enabled addon to the newest version, or the one you pass with `--version`, and keeps the parameters you enabled it with unless you set new ones:

```shell
vela addon upgrade fluxcd
```

`vela addon disable` deletes the addon's Application, and with it the controllers and definitions the addon installed. Namespaces it created, such as `flux-system`, are left behind. It refuses while an Application still uses one of the addon's definitions; `--force` skips that check. It doesn't check other addons, so disable the ones that depend on it first:

```shell
vela addon disable fluxcd
```

```console
Successfully disable addon:fluxcd
```

While an Application still uses one of its definitions, you get this instead:

```console
Error: this addon is being used by: default/podinfo applications. Please delete all of them before removing.
```

## More

- [Install and Manage Addons](/docs/end-user/components/more) in the KubeVela docs covers the rest of `vela addon`: enabling on chosen clusters, enabling from VelaUX or with `kubectl`, and managing registries.
- [Air-gapped installation](/docs/platform-engineers/system-operation/offline-installation) covers enabling addons where the cluster can't reach the catalog.
- [vela addon](/docs/cli/vela_addon) is the CLI reference.
