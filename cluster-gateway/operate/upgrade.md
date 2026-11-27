---
title: Upgrade
description: Upgrade Cluster Gateway with KubeVela or on its own, and what changed from 1.9.2 to 1.10.0-alpha.1.
---

The gateway stores nothing, so an upgrade is a rollout of the new image: cluster Secrets stay as they are, and the new pods read them as they start. Requests in flight on an old pod are cut off when it stops, so run more than one replica (see [High Availability](./high-availability.md)) if a watch or `exec` dropping mid-upgrade matters.

## With KubeVela

The vela-core chart pins the gateway's version, so upgrading KubeVela upgrades the gateway. [Versions](../reference/versions.md) lists which one each KubeVela release ships. If you set `multicluster.clusterGateway.image.tag` yourself, clear it or set it to the new version when you upgrade, or the old gateway keeps running beside the new controller.

```shell
helm get values kubevela --namespace vela-system | grep -A3 clusterGateway
```

## On its own

Upgrade from a checkout of the new release, setting `tag` to match:

```shell
git clone --depth 1 --branch v1.10.0-alpha.1 https://github.com/oam-dev/cluster-gateway.git
helm upgrade cluster-gateway ./cluster-gateway/charts/cluster-gateway \
  --namespace cluster-gateway --reuse-values \
  --set tag=v1.10.0-alpha.1 \
  --wait
kubectl wait --for=condition=Available apiservice/v1alpha1.cluster.core.oam.dev --timeout=2m
```

## 1.9.2 to 1.10.0-alpha.1

KubeVela 1.11 ships 1.9.2 and KubeVela 1.12 ships 1.10.0-alpha.1. The API, the cluster Secret format and the gateway's own flags are the same in both. 1.10.0-alpha.1 builds the server on `k8s.io/apiserver` directly, in place of the `apiserver-runtime` library 1.9.2 used, and moves to Kubernetes 0.37 and Go 1.27. Three things change if you set the gateway's arguments yourself:

* The etcd flags (`--etcd-servers` and the rest) are gone; the gateway never used etcd. A Deployment that still passes one stops at startup with `unknown flag`.
* `--feature-gates` takes `Gate=value` pairs only. 1.9.2 also took the `component:Gate=value` form, which 1.10.0-alpha.1 rejects as an unrecognized gate.
* The `MutatingAdmissionPolicy` admission plugin is off unless you list it in `--enable-admission-plugins`.

Neither chart passes an etcd flag or the `component:` form, so a chart install with its own values needs nothing.

## Checking it

After any upgrade:

```shell
kubectl get apiservice v1alpha1.cluster.core.oam.dev
kubectl get clustergateways
kubectl get --raw /apis/cluster.core.oam.dev/v1alpha1/clustergateways/<cluster>/proxy/version
```

If the APIService isn't `True`, see [Troubleshooting](./troubleshooting.md#the-apiservice-isnt-available).
