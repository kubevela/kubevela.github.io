---
title: Troubleshooting
description: Find out why a Configuration is stuck, from its status, its Jobs and the controller's log.
---

Start from the Configuration's status, then the Job it ran, then the controller.

```shell
kubectl get configuration <name>
kubectl get configuration <name> -o jsonpath='{.status.apply.message}'; echo
```

The `APPLY` column is `status.apply.state`; [How It Works](../concepts/how-it-works.md#lifecycle) lists each state.

## The Terraform log

The apply Job is `<name>-apply` (or `<uid>-apply` with `controllerNamespace` set). Terraform's output is in the `terraform-executor` container; `terraform init` runs before it in the `terraform-init` init container:

```shell
kubectl logs job/<name>-apply -c terraform-init
kubectl logs job/<name>-apply -c terraform-executor
```

A remote module is cloned by the `git-configuration` init container first: look there when the state is `TerraformInitError` with a `remote`.

## Common cases

| What you see | Why, and what to do |
| --- | --- |
| `ProviderNotFound` | No Provider called `default` in `default`, or the one `providerRef` names. Create it (`vela config create ... -t terraform-<cloud>`), set `providerRef`, or for Terraform that needs no credentials, set `inlineCredentials: true`. |
| `ProviderNotReady` | The Provider's Secret is missing or lacks a key that cloud needs: `kubectl get provider <name> -o yaml` has the message. |
| Stays in `ProvisioningAndChecking` | Check the Job's pod: an image that can't be pulled, a pod that can't be scheduled (`jobNodeSelector`, `resources`), or Terraform still working. Cloud resources such as databases can take many minutes. |
| `ProvisioningAndChecking`, the Job's pod in `Init:ImagePullBackOff` with `no match for platform in manifest` | An arm64 node: the default `terraformImage` is amd64 only. See [Install](../getting-started/install.md#without-kubevela-the-helm-chart). |
| Stays in `ProvisioningAndChecking`, the Job's pod in `Error` and restarting | Terraform refused or the cloud API failed: the `terraform-executor` log has the error (v0.9.1 never sets `ApplyFailed`). Fix the HCL or the variables and re-apply; each change starts a new Job. |
| Stuck in `GeneratingTerraformOutputs` | The apply worked, but the connection Secret was refused: see [Upgrade](upgrade.md#to-091-and-082). |
| `terraform-init` fails with `Error loading state: namespaces "..." not found` | `backend.namespace` (or `spec.backend.kubernetes.namespace`) names a namespace that doesn't exist (the `vela-system` default, outside KubeVela). Create it, or reinstall the chart with `backend.namespace` set. |
| Deletion hangs in `Destroying` | The destroy Job is failing: read its `terraform-executor` log. If the resources are already gone by other means, set `forceDelete: true` on the Configuration and delete it again. |

## The controller

```shell
kubectl logs -n <namespace> deploy/terraform-controller
```

The controller logs each reconcile with the Configuration's name. For a field you set that seems to have no effect, check it survived: `kubectl get configuration <name> -o yaml`. A field missing there was pruned by an old CRD: see [Upgrade](upgrade.md).
