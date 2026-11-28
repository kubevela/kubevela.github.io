---
title: Configuration
description: The addon's parameters, the Helm chart's values, and the flags of the vela-prism binary.
---

## Addon parameters

Set with `vela addon enable vela-prism <name>=<value>`, or again later to change them; the addon page, [vela-prism](/addons/vela-prism#parameters), has the same table.

| Parameter | Default | What it sets |
| --- | --- | --- |
| `namespace` | `vela-system` | Where cluster Secrets and OCM ManagedClusters are read from (`--storage-namespace`), and the namespace in the APIServices' service reference. Leave it at `vela-system`: see below. |
| `image` | `oamdev/vela-prism:v1.7.0` | The image. |
| `imagePullPolicy` | `IfNotPresent` | `IfNotPresent`, `Never` or `Always`. |
| `cpu` | `0.1` | CPU request and limit. |
| `memory` | `200Mi` | Memory request and limit. |

The Deployment and Service always go to `vela-system`, and the serving certificate names `vela-prism.vela-system.svc`, whatever `namespace` says. Set `namespace` to anything else and the APIServices point at a Service that isn't there (`ServiceNotFound`), so every Prism API stops answering; set it back to `vela-system` to recover. A KubeVela that keeps its clusters elsewhere needs the chart. The addon has no parameter for `--observability-namespace`, so its Grafana Secrets are always in `o11y-system`, and none for replicas: it runs one pod.

## Helm chart values

For the published chart, 1.6.0. The chart at the `v1.7.0` tag has the same values plus `dynamicAPI.enabled`.

| Value | Default | What it sets |
| --- | --- | --- |
| `replicaCount` | `1` | Replicas. Prism keeps no state, so more than one is safe; the hub spreads requests across them through the Service. |
| `port` | `9443` | `--secure-port`, and the Service and APIService port. |
| `imageRegistry` | `""` | Prefix for every image the chart uses, including the certificate Jobs'. End it with `/`. |
| `image.repository` | `oamdev/vela-prism` | |
| `image.tag` | `v1.6.0` (`latest` at the tag) | Set `v1.7.0`: see [Install](../getting-started/install.md#from-the-helm-chart). |
| `image.pullPolicy` | `IfNotPresent` | |
| `resources.limits` | `cpu: 100m`, `memory: 200Mi` | Limits only; no requests are set, so Kubernetes uses the limits as requests. |
| `secureTLS.enabled` | `true` | Generate a certificate with Jobs and verify it from the hub. `false` registers the APIServices with `insecureSkipTLSVerify`. |
| `secureTLS.certPath` | `/etc/k8s-apiserver-certs` | Where the certificate is mounted (`--cert-dir`). |
| `secureTLS.certGen.image` | `oamdev/kube-webhook-certgen:v2.3` | The Job that makes the certificate. |
| `secureTLS.certPatch.image` | `oamdev/cluster-gateway:v1.4.0` | The Job that writes the CA into the APIServices. |
| `dynamicAPI.enabled` | `true` | Chart at the tag only: register `dynamic.prism.oam.dev`, and give Prism read and write on every resource. See [Dynamic Resources](../guides/dynamic-resources.md). |

The chart sets `--storage-namespace` to the release namespace, so install it where KubeVela keeps its clusters.

## Flags

Both installs run `vela-prism --secure-port=9443 --feature-gates=APIPriorityAndFairness=false --cert-dir=/etc/k8s-apiserver-certs --storage-namespace=<namespace>`. Prism's own flags:

| Flag | Default | What it does |
| --- | --- | --- |
| `--storage-namespace` | `vela-system` | Namespace of cluster Secrets, and of the ManagedClusters Prism looks up by name. |
| `--observability-namespace` | `o11y-system` | Namespace of the `grafana.<name>` Secrets behind `Grafana` objects. |
| `--request-timeout` | `1m0s` | How long a request may take, including the call to Grafana behind a dashboard or datasource. |
| `--min-request-timeout` | `1800` | The standard API server setting; Prism has no watches for it to apply to. |

The rest are the standard Kubernetes API server flags (`--secure-port`, `--cert-dir`, `--tls-cert-file`, `--authentication-kubeconfig`, audit logging, and so on) and klog's (`-v`, `--vmodule`). `vela-prism --help` lists them all.

`--feature-gates=APIPriorityAndFairness=false` turns off API Priority and Fairness inside Prism; the hub's kube-apiserver still applies its own.

The addon has no way to change the other flags: a hand edit to its Deployment lasts only until KubeVela next applies `addon-vela-prism`, for instance when the addon is enabled again. Use the chart for that. On a chart install, the arguments are in the template; `helm template` and a post-renderer, or a fork of the chart, are the ways in.

## Sizing

Prism holds nothing in memory between requests and has no informers, except the ConfigMap informer for dynamic resources in v1.7.0. Every `get` or `list` is a fresh read of the backing objects, so its cost follows how often clients call it, not how many objects there are. The defaults (0.1 CPU, 200Mi) are plenty for a hub where people run `vela status`; give it more if a dashboard or controller polls `apprt` or `vela-clusters` in a loop.
