---
title: Configure the Controller
description: The terraform-controller Helm chart's values, what each one changes, and how to set them through the KubeVela addon.
---

The chart's values (v0.9.1). Set them with `--set` or a values file on `helm upgrade --install`, or, through the KubeVela addon, as `values`:

```shell
vela addon enable terraform values='{"jobBackoffLimit":"5","backend":{"namespace":"tf-state"}}'
```

| Value | Default | Does |
| --- | --- | --- |
| `image.repository`, `image.tag`, `image.pullPolicy` | `oamdev/terraform-controller`, the chart's version, `Always` | The controller image. |
| `terraformImage` | `oamdev/docker-terraform:1.1.6@sha256:…` | The image the Terraform Jobs run: Terraform 1.1.9. Set your own to use another Terraform, or a mirror. Published for `linux/amd64` only. |
| `gitImage` | `alpine/git:2.54.0@sha256:…` | The init container that clones a `remote` module. |
| `busyboxImage` | `busybox:1.38.0@sha256:…` | The init container that copies the HCL into the Job's working directory. |
| `backend.namespace` | `vela-system` | Where the default Kubernetes backend keeps each Configuration's state. Outside KubeVela, set it to a namespace that exists. |
| `controllerNamespace` | `""` | Run every Terraform Job, and its ConfigMap and variable Secret, in this one namespace instead of each Configuration's own. Their names then use the Configuration's UID. |
| `jobNodeSelector` | `null` | Node selector for the Terraform Jobs: a map, or the same as a JSON string. |
| `jobBackoffLimit` | `""` (unlimited) | How many times a failing Terraform Job is retried before it is marked failed. |
| `resources.limits`, `resources.requests` | `500m`/`500Mi`, `250m`/`250Mi` | CPU and memory **for the Terraform Jobs**, not for the controller. |
| `githubBlocked` | `'false'` | `'true'` rewrites `remote` modules from GitHub to their Gitee mirrors, for clusters that can't reach GitHub. |
| `featureGates.AllowDeleteProvisioningResource` | `true` | Allow deleting a Configuration whose apply never finished; the destroy cleans up what it did create. |
| `replicaCount` | `1` | Controller replicas. There is no leader election flag in the chart, so keep it at 1. |

To remove `jobNodeSelector` once set, `helm upgrade --reset-then-reuse-values --set jobNodeSelector=null` (Helm 3.14 or later): with `--reuse-values`, Helm keeps the old map.

## Controller flags

The chart sets these on the controller; to change others, patch the Deployment:

| Flag | Default | Does |
| --- | --- | --- |
| `--controller-namespace` | from `controllerNamespace` | As above. |
| `--feature-gates` | from `featureGates` | As above. |
| `--namespace` | all | Watch Configurations in one namespace only. |
| `--informer-re-sync-interval` | `10s` | How often every Configuration is reconciled again. |
| `--metrics-addr` | `:38080` | Where the controller serves Prometheus metrics. |
| `--enable-leader-election` | `false` | Leader election, for more than one replica. |
