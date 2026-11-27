---
title: Upgrade
description: Moving to a newer Prism with the addon or the chart, and what changed between versions.
---

Prism stores nothing, so an upgrade carries no data across: replace the pod and the APIs answer from the backing objects as before. The APIs are briefly unavailable while the new pod starts.

## With the addon

The addon's version follows the catalog, not KubeVela. To pick up whatever the catalog now holds:

```shell
vela addon upgrade vela-prism
```

To run a particular image without waiting for the catalog, set it:

```shell
vela addon enable vela-prism image=oamdev/vela-prism:v1.7.0
```

## With the chart

```shell
helm upgrade vela-prism kubevela/vela-prism --version 1.6.0 -n vela-system \
  --set image.tag=v1.7.0 --server-side=false --wait
```

With Helm 4, `--server-side=false` is needed. Helm 4 applies server-side by default, and the chart's patch Job owns the APIServices' `caBundle`, so the upgrade fails on a field conflict:

```console
Error: UPGRADE FAILED: conflict occurred while applying object /v1alpha1.prism.oam.dev apiregistration.k8s.io/v1, Kind=APIService: Apply failed with 1 conflict: conflict with "patch" using apiregistration.k8s.io/v1: .spec.caBundle
```

Helm 3 applies client-side and doesn't need it.

## Between the addon and the chart

The two register the same APIServices, so remove one before installing the other: `vela addon disable vela-prism`, then the chart, or `helm uninstall` (and delete the `vela-prism` Secret it leaves), then the addon.

## What changed

| From | To | What changed |
| --- | --- | --- |
| v1.6.0 | v1.7.0 | The APIs are unchanged. The dynamic API server is added, and starts whether or not it's registered: on the addon, and on the chart with `dynamicAPI.enabled=false`, it logs `configmaps is forbidden` every half minute, which is harmless (see [Troubleshooting](./troubleshooting.md#configmaps-is-forbidden-in-the-logs)). Listing clusters no longer scopes the OCM ManagedCluster lookup to the storage namespace (ManagedClusters are cluster-scoped). The arm64 image runs. The shared code moved to `github.com/kubevela/pkg`, which adds `/cue/compile` and `/cuex/compile` endpoints. Kubernetes libraries 0.26, Go 1.19. |
| v1.5.0 | v1.6.0 | `--request-timeout` and `--min-request-timeout` flags. `Cluster` gains the `cluster.core.oam.dev/control-plane` label. `Grafana` Secrets no longer get an owner reference copied from the `Grafana` object. |

The addon went from v1.5.0 straight to v1.7.0, in June 2023, so an addon install never ran v1.6.0.
