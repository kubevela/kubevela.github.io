---
title: Install Cluster Gateway
sidebar_label: Install
description: Run Cluster Gateway on its own from its Helm chart, or as part of vela-core, and what differs between the two.
---

There are two ways to get Cluster Gateway onto a hub: on its own from its own Helm chart, or with KubeVela, whose vela-core chart installs it for you. Pick one. Both register the same APIService, `v1alpha1.cluster.core.oam.dev`, and a hub can only have one, so a hub runs one gateway.

## With KubeVela

Nothing to do: installing KubeVela installs the gateway, because the vela-core chart's `multicluster.enabled` is `true` by default. See [Install KubeVela](/docs/next/installation/kubernetes). Check it:

```shell
kubectl get deployment kubevela-cluster-gateway -n vela-system
kubectl get apiservice v1alpha1.cluster.core.oam.dev
```

The APIService should show `AVAILABLE` as `True`. Its settings are the `multicluster.clusterGateway.*` chart values, listed in [Configuration](../operate/configuration.md#vela-core-chart-values).

## On its own

The chart lives in the cluster-gateway repository and isn't published to a Helm repository, so install it from a checkout of the release you want:

```shell
git clone --depth 1 --branch v1.10.0-alpha.1 https://github.com/oam-dev/cluster-gateway.git
helm install cluster-gateway ./cluster-gateway/charts/cluster-gateway \
  --namespace cluster-gateway --create-namespace \
  --set tag=v1.10.0-alpha.1 \
  --wait
```

Set `tag`. Without it the chart uses `v` plus its own chart version, `v0.1.0`, and there is no image with that tag.

Check the APIService is available:

```shell
kubectl get apiservice v1alpha1.cluster.core.oam.dev
```

```console
NAME                            SERVICE                           AVAILABLE   AGE
v1alpha1.cluster.core.oam.dev   cluster-gateway/gateway-service   True        12s
```

The chart also creates the namespace the gateway reads cluster Secrets from, `open-cluster-management-credentials` (the `secretNamespace` value), so the install fails if that namespace already exists. With the gateway running, [register a cluster](../guides/register-clusters.md).

The standalone chart is set up for trying the gateway out:

* The gateway makes a self-signed serving certificate each time it starts, and the APIService is created with `insecureSkipTLSVerify: true`. For anything long-lived, give it a certificate with `--tls-cert-file` and `--tls-private-key-file`, and set the APIService's `caBundle` to the CA that signed it.
* Its ServiceAccount can do anything with Secrets in the Secret namespace, which holds every cluster's credential. Keep that namespace for cluster Secrets only, and limit who can read it.

To remove it:

```shell
helm uninstall cluster-gateway --namespace cluster-gateway
```

## What differs between them

| | Standalone chart | vela-core chart |
| --- | --- | --- |
| Deployment | `gateway-deployment` | `<release>-cluster-gateway`, so `kubevela-cluster-gateway` |
| Service | `gateway-service` | `<release>-cluster-gateway-service` |
| Pod labels | `app: gateway` | `app.kubernetes.io/name: vela-core-cluster-gateway` |
| Cluster Secrets read from | `open-cluster-management-credentials` | the release namespace, `vela-system` |
| Serving certificate | self-signed at startup; APIService skips TLS verification | created and renewed by vela-core, or by cert-manager with `secureTLS.certManager.enabled`; APIService verifies it |
| `ClientIdentityPenetration` | off | follows `authentication.enabled` (off by default) |
| Proxy configuration | none | with `ClientIdentityPenetration` on, the `kubevela:ux` group (VelaUX) is not impersonated and acts as the registered credential |
| `clustergateways/proxy` granted to | nobody; grant it yourself | vela-core's ServiceAccount and the `kubevela:client` group |
| Priority and fairness | on | off (`--enable-priority-and-fairness=false`) |
| OCM integration | `ocmIntegration.enabled` | not offered; use the [OCM Cluster-Gateway Manager](/addons/ocm-gateway-manager-addon) addon |

With KubeVela, `vela cluster join` writes cluster Secrets for you. Standalone, you write them yourself, in the format on [Register Clusters](../guides/register-clusters.md).
