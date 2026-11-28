---
title: Upgrade
description: Upgrade terraform-controller with Helm or the KubeVela addon, upgrade its CRDs, and what changed in 0.9.
---

## With Helm

```shell
helm repo update kubevela
helm upgrade terraform-controller kubevela/terraform-controller --version 0.9.1 -n <namespace> --reuse-values
```

Helm installs a chart's `crds/` on the first install and never touches them again, so apply the new release's CRDs yourself:

```shell
kubectl apply --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/kubevela/terraform-controller/v0.9.1/chart/crds/terraform.core.oam.dev_configurations.yaml \
  -f https://raw.githubusercontent.com/kubevela/terraform-controller/v0.9.1/chart/crds/terraform.core.oam.dev_providers.yaml
```

Without that, a field added since your first install (`spec.gitRef` arrived in 0.8.0) is dropped by the API server when it is written: the Configuration is accepted, and the field is silently gone.

## With the KubeVela addon

```shell
vela addon upgrade terraform upgradeCRD=true
```

`upgradeCRD=true` has the addon upgrade the CRDs along with the chart. The addon decides the chart version, not you: see the [Versions](../versions.md) page for what it installs.

## Upgrade notes

### To 0.9.1 (and 0.8.2)

A Configuration now writes into, and deletes, only the connection Secret it created, labelled as its own:

```yaml
terraform.core.oam.dev/created-by: terraform-controller
terraform.core.oam.dev/owned-by: <configuration name>
terraform.core.oam.dev/owned-namespace: <configuration namespace>
```

Secrets the controller created since 0.7.10 carry these labels already, so nothing changes for them. A Configuration whose `writeConnectionSecretToRef` names some other Secret has already run its apply, and waits in `GeneratingTerraformOutputs` with a message saying why:

- **Another Configuration owns the Secret**: two Configurations write one Secret. Give one of them another `writeConnectionSecretToRef`.
- **No Configuration owns it**: if it is this Configuration's, written by a controller older than 0.7.10, label it as the message shows (`kubectl label secret --overwrite -n <ns> <secret> terraform.core.oam.dev/created-by=terraform-controller terraform.core.oam.dev/owned-by=<name> terraform.core.oam.dev/owned-namespace=<ns>`). If it belongs to something else, point `writeConnectionSecretToRef` at a new name.

### To 0.9.0

- The controller and the images it starts are pinned by digest: `terraformImage` is `oamdev/docker-terraform:1.1.6` (Terraform 1.1.9 on Alpine 3.24), `gitImage` and `busyboxImage` no longer float on `latest`. If you mirror images, mirror these.
- Built with Go 1.27.1 and Kubernetes client libraries v0.37. The `linux/arm64` image now really contains an arm64 controller.
- `jobNodeSelector` works as a map or a JSON string; a value wrapped in single quotes, the old workaround, keeps working.
- `spec.remote` with `gitCredentialsSecretReference` works with current `alpine/git` (OpenSSH 10).

The full notes are on each [GitHub release](https://github.com/kubevela/terraform-controller/releases).
