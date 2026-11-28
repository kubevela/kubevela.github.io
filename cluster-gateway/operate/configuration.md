---
title: Configure Cluster Gateway
sidebar_label: Configuration
description: Cluster Gateway's flags, feature gates and chart values, and the vela-core flags and values that control it.
---

Cluster Gateway is configured with command-line flags. With the standalone chart, a few of them are chart values; anything else means editing the Deployment's `args`. With KubeVela, the vela-core chart sets the flags from its `multicluster.clusterGateway.*` values, and vela-core has flags of its own for how it talks to the gateway.

## Gateway flags

These are the gateway's own flags, the same in 1.9.2 and 1.10.0-alpha.1:

| Flag | Default | What it does |
| --- | --- | --- |
| `--secret-namespace` | `vela-system` | The namespace cluster Secrets are read from. |
| `--authorize-proxy-subpath` | `false` | Also check the request inside the proxy against the hub's RBAC, as the calling user: a request for Pods on a member cluster then needs permission for Pods on the hub too. |
| `--cluster-gateway-proxy-config` | | Path to a [proxy configuration](../guides/identity-exchange.md) file. |
| `--ocm-integration` | `false` | Read each cluster's endpoint and CA from its OCM `ManagedCluster` instead of the Secret. The Secret still holds the credential. |
| `--proxy-host`, `--proxy-port` | none, `8090` | OCM cluster-proxy's address, for clusters with the `ClusterProxy` endpoint type. Setting `--proxy-host` requires the three below. |
| `--proxy-ca-cert`, `--proxy-cert`, `--proxy-key` | | The CA and client certificate for connecting to cluster-proxy. |
| `--virtual-clutser-with-control-plane` | `true` | List the hub as the `local` cluster in `virtualclusters`. The flag is spelled that way. |
| `--user-agent` | | The User-Agent for the gateway's own requests to the hub. |
| `--standalone-debug-mode` | `false` | Run on a workstation with authorization and admission off. Only allowed with `--bind-address=127.0.0.1`. |

It's built on the Kubernetes API server library, so it also takes the standard aggregated API server flags. The ones that matter here:

| Flag | Default | What it does |
| --- | --- | --- |
| `--secure-port` | `443` | The HTTPS port. Both charts set `9443`. |
| `--tls-cert-file`, `--tls-private-key-file` | | The serving certificate. Without them the gateway writes a self-signed one at startup. |
| `--authorization-always-allow-paths` | `/healthz,/readyz,/livez` | Paths served without asking the hub. vela-core's chart adds `/metrics`. |
| `--enable-priority-and-fairness` | `true` | API priority and fairness on the gateway's own requests. vela-core's chart turns it off. |
| `--feature-gates` | | The [feature gates](#feature-gates) below. |
| `-v` | `0` | Log verbosity. |

1.10.0-alpha.1 dropped the etcd flags and the `component:Gate=value` form of `--feature-gates`: see [Upgrade](./upgrade.md).

## Feature gates

| Gate | Default | What it does |
| --- | --- | --- |
| `SecretCache` | `true` (beta) | Read cluster Secrets from an informer on the Secret namespace instead of from the hub on every request. |
| `OCMClusterCache` | `true` (beta) | The same for OCM `ManagedCluster`s, with `--ocm-integration`. |
| `ClientIdentityPenetration` | `false` (alpha) | Impersonate the original hub user on the member cluster, so the member's RBAC applies to them. The registered credential needs permission to impersonate. Enables the per-cluster proxy configuration below. |
| `HealthinessCheck` | `false` (alpha) | Show the health status stored in each cluster Secret's annotations, which the `health` subresource writes. |

`APIPriorityAndFairness`, a gate Kubernetes has removed, is still accepted: the gateway turns it into `--enable-priority-and-fairness` instead of refusing to start.

## Standalone chart values

| Value | Default | What it does |
| --- | --- | --- |
| `image` | `oamdev/cluster-gateway` | The image. |
| `tag` | `v` + chart version | The image tag. Always set it: the default, `v0.1.0`, doesn't exist. |
| `replicas` | `1` | Number of gateway pods. |
| `secretNamespace` | `open-cluster-management-credentials` | Passed as `--secret-namespace`; the chart creates this namespace. |
| `ocmIntegration.enabled` | `false` | Passes `--ocm-integration`. |
| `ocmIntegration.clusterProxy.enabled` | `false` | Passes the `--proxy-*` flags, with the certificates from the `proxy-client` and `proxy-server-ca` Secrets. |
| `ocmIntegration.clusterProxy.endpoint.host`, `.port` | `proxy-entrypoint.open-cluster-management-cluster-proxy`, `8090` | cluster-proxy's address. |
| `featureGate.healthiness` | `false` | Turns `HealthinessCheck` on. |
| `featureGate.secretCache` | `false` | Turns `SecretCache` on. It is on by default anyway, so `false` here does not turn it off. |

## vela-core chart values

| Value | Default | What it does |
| --- | --- | --- |
| `multicluster.enabled` | `true` | Install the gateway and start vela-core with `--enable-cluster-gateway`. |
| `multicluster.clusterGateway.direct` | `true` | vela-core calls the gateway's Service directly (`--cluster-gateway-url`) instead of going through the hub's kube-apiserver. |
| `multicluster.clusterGateway.replicaCount` | `1` | Number of gateway pods. |
| `multicluster.clusterGateway.port` | `9443` | The gateway's port. |
| `multicluster.clusterGateway.image.repository`, `.tag`, `.pullPolicy` | `oamdev/cluster-gateway`, the pinned release, `IfNotPresent` | The image. |
| `multicluster.clusterGateway.resources` | 50m / 20Mi requested, 500m / 200Mi limit | Pod resources. |
| `multicluster.clusterGateway.secureTLS.enabled` | `true` | Serve a real certificate and have the APIService verify it. |
| `multicluster.clusterGateway.secureTLS.certManager.enabled` | `false` | Have cert-manager issue the certificate. When `false`, vela-core creates and renews it. |
| `multicluster.clusterGateway.secureTLS.certPath` | `/etc/k8s-cluster-gateway-certs` | Where the certificate is mounted in the gateway's pod. |
| `multicluster.metrics.enabled` | `false` | vela-core collects metrics from every cluster through the gateway (`--enable-cluster-metrics`). |
| `multicluster.clusterGateway.serviceMonitor.enabled`, `.additionalLabels` | `false`, `{}` | A Prometheus ServiceMonitor, with `multicluster.metrics.enabled`. |
| `authentication.enabled` | `false` | Also sets `ClientIdentityPenetration` on the gateway. |

The gateway's Secret namespace is the release namespace, and the chart doesn't expose its other flags.

## vela-core flags

vela-core's own flags for the gateway are listed with the rest in [Controller Flags and Feature Gates](/docs/next/platform-engineers/system-operation/bootstrap-parameters#flags). In short:

| Flag | What it does |
| --- | --- |
| `--enable-cluster-gateway` | Turn on multi-cluster. vela-core waits up to five minutes at startup for the gateway's APIService to become available, then exits. |
| `--cluster-gateway-url` | Call the gateway at this address instead of through the hub's kube-apiserver. |
| `--cluster-gateway-ca-file` | The CA to verify the gateway with, for `--cluster-gateway-url`. Without it, vela-core skips verification. |
| `--cluster-gateway-tls-secret`, `--cluster-gateway-service` | The Secret and Service for the serving certificate vela-core creates, renews, and writes into the APIService's `caBundle`. |
| `--enable-cluster-metrics`, `--cluster-metrics-interval` | Collect metrics from every cluster through the gateway, every 15 seconds by default. |

vela-core reads and writes cluster Secrets in the namespace of the Service the APIService points at, so a gateway serving KubeVela has to read Secrets from its own namespace.

## Identity exchange

With `ClientIdentityPenetration` on, rules in a proxy configuration decide who the gateway impersonates on each member cluster. They're covered in [Identity Exchange](../guides/identity-exchange.md).

## High availability

The gateway holds no state of its own, so it scales by adding replicas: see [High Availability](./high-availability.md).
