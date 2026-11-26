---
title: Configure Cluster Gateway
sidebar_label: Configuration
description: Cluster Gateway's flags, feature gates and chart values, the vela-core flags and values that control it, identity exchange, and running it highly available.
---

Cluster Gateway is configured with command-line flags. With the standalone chart, a few of them are chart values; anything else means editing the Deployment's `args`. With KubeVela, the vela-core chart sets the flags from its `multicluster.clusterGateway.*` values, and vela-core has flags of its own for how it talks to the gateway.

## Gateway flags

These are the gateway's own flags, the same in 1.9.2 and 1.10.0-alpha.1:

| Flag | Default | What it does |
| --- | --- | --- |
| `--secret-namespace` | `vela-system` | The namespace cluster Secrets are read from. |
| `--authorize-proxy-subpath` | `false` | Also check the request inside the proxy against the hub's RBAC, as the calling user: a request for Pods on a member cluster then needs permission for Pods on the hub too. |
| `--cluster-gateway-proxy-config` | | Path to a [proxy configuration](#identity-exchange) file. |
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

Three things changed in 1.10.0-alpha.1:

* The etcd flags (`--etcd-servers` and the rest) are gone; the gateway never used etcd. A Deployment that still passes one stops at startup with `unknown flag`.
* `--feature-gates` takes `Gate=value` pairs only. 1.9.2 also took the `component:Gate=value` form, which 1.10.0-alpha.1 rejects as an unrecognized gate.
* The `MutatingAdmissionPolicy` admission plugin is off unless you list it in `--enable-admission-plugins`.

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

With `ClientIdentityPenetration` on, the gateway impersonates the calling hub user on the member cluster. Rules in a proxy configuration change who it impersonates, per user, group or cluster. The first rule that matches wins:

```yaml
apiVersion: cluster.core.oam.dev/v1alpha1
kind: ClusterGatewayProxyConfiguration
spec:
  clientIdentityExchanger:
    rules:
      - name: super-user
        type: PrivilegedIdentityExchanger
        source:
          group: platform-admins
      - name: ci-in-prod
        type: StaticMappingIdentityExchanger
        source:
          user: system:serviceaccount:ci:deployer
          cluster: prod
        target:
          user: ci-deployer
          groups:
            - deployers
```

| Rule type | What reaches the member cluster |
| --- | --- |
| `PrivilegedIdentityExchanger` | The registered credential itself, with no impersonation. |
| `StaticMappingIdentityExchanger` | The `target` user, groups and UID. |

`source` matches on `user`, `group`, `uid` and `cluster`, and on the regular expressions `userPattern`, `groupPattern` and `clusterPattern`; every field you give has to match. Point `--cluster-gateway-proxy-config` at the file for rules that apply to every cluster. For one cluster, put the same YAML in its Secret's `cluster.core.oam.dev/cluster-gateway-proxy-configuration` annotation; its rules are tried before the file's. The vela-core chart ships one rule, `PrivilegedIdentityExchanger` for the `kubevela:ux` group, so VelaUX isn't impersonated.

## High availability

The gateway holds no state of its own: every replica reads the same Secrets, and any replica can serve any request. Run more than one once other clusters depend on it, because every request to a member cluster goes through it.

With KubeVela:

```shell
helm upgrade kubevela kubevela/vela-core --namespace vela-system --reuse-values \
  --set multicluster.clusterGateway.replicaCount=3 --wait
```

The chart spreads the replicas across nodes where it can, and [High Availability Deploy](/docs/next/platform-engineers/system-operation/high-availability#cluster-gateway) shows a PodDisruptionBudget that covers them.

Standalone:

```shell
helm upgrade cluster-gateway ./cluster-gateway/charts/cluster-gateway --namespace cluster-gateway \
  --reuse-values --set replicas=3 --wait
```

Each replica keeps its own Secret cache and its own cache of `Dynamic` credentials, so with three replicas a `Dynamic` command runs up to three times per expiry.
