---
title: Quick Start
---

This enables the `fluxcd` addon and uses the `helm` component type it adds to deploy [podinfo](https://github.com/stefanprodan/podinfo) from its Helm chart. It takes about five minutes on a fresh cluster.

You need a cluster with KubeVela installed and the `vela` CLI. On your laptop, [k3d](https://k3d.io) and the [KubeVela install guide](/docs/installation/kubernetes) get you there.

## 1. Enable the addon

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

## 2. Check what it added

```shell
vela addon status fluxcd
```

```console
fluxcd: enabled (3.0.2)
==> Installed Clusters
[local]
==> Registry Name
KubeVela
```

The new component types are listed with the built-in ones:

```shell
vela comp | grep -E 'NAME|helm |kustomize '
```

```console
NAME       	DEFINITION              	DESCRIPTION
helm       	autodetects.core.oam.dev	helm release is a group of K8s resources from either git
kustomize  	autodetects.core.oam.dev	kustomize can fetching, building, updating and applying
```

## 3. Deploy a Helm chart with it

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo
  namespace: default
spec:
  components:
    - name: podinfo
      type: helm
      properties:
        repoType: helm
        url: https://stefanprodan.github.io/podinfo
        chart: podinfo
        version: 6.11.2
        values:
          replicaCount: 2
EOF
```

```console
Applying an application in vela K8s object format...
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward podinfo
             SSH: vela exec podinfo
         Logging: vela logs podinfo
      App status: vela status podinfo
        Endpoint: vela status podinfo --endpoint
Application default/podinfo applied.
```

Flux fetches the chart and installs it. Wait for the Application to be healthy:

```shell
vela status podinfo
```

```console
About:

  Name:      	podinfo
  Namespace: 	default
  Created at:	2026-11-27 09:56:13 +0000 GMT
  Healthy:   	✅
  Details:   	running

Workflow:

  mode: DAG-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: nx84s8mp5h
    name: podinfo
    type: apply-component
    phase: succeeded

Services:

  - Name: podinfo
    Cluster: local
    Namespace: default
    Type: helm
    Health: ✅
      Message: Fetch repository successfully, Create helm release successfully
    No trait applied
```

## 4. Try it

```shell
vela port-forward podinfo 9898:9898
```

In another terminal:

```shell
curl -s localhost:9898 | head -5
```

```console
{
  "hostname": "podinfo-bbb5c4555-qc5cd",
  "version": "6.11.2",
  "revision": "b501abd1f0f2acf49c39f2d9cd47b460578d87f0",
  "color": "#34577c",
```

## 5. Clean up

Delete the Application first. `vela addon disable` refuses while an Application still uses the addon's component types:

```shell
vela delete podinfo -y
vela addon disable fluxcd
```

```console
Start deleting application default/podinfo
Delete application default/podinfo succeeded
Successfully disable addon:fluxcd
```

## Next

- See what else is in the [Addon Catalog](../overview.md).
- Work through the [Examples](../examples/overview.md), which use more of the catalog's addons together.
- Write your own with [Make Your Own Addon](../developer/make-your-own-addon.md).
