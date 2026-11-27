---
title: How It Works
description: The Configuration and Provider objects, what the controller creates for each Configuration, where the state lives, and the states a Configuration moves through.
---

terraform-controller has two objects of its own, `Configuration` and `Provider`, both in `terraform.core.oam.dev`. Everything else it does is ordinary Kubernetes: a Job runs Terraform, and Secrets and ConfigMaps carry what goes in and what comes out.

## Configuration

A `Configuration` (`terraform.core.oam.dev/v1beta2`) is one Terraform root module and its inputs:

| Field | What it is |
| --- | --- |
| `hcl` | The Terraform, inline. |
| `remote`, `path`, `gitRef` | Or a git repository holding it, a directory inside it, and a `branch`, `tag` or `commit`. One of `hcl` and `remote` is required, not both. |
| `variable` | Values for the module's variables. |
| `writeConnectionSecretToRef` | The Secret the outputs go to, one key per Terraform `output`. |
| `providerRef` | The `Provider` holding the cloud credentials. Defaults to `default` in `default`. |
| `inlineCredentials` | `true` when the Terraform needs no Provider: no credentials, or credentials it finds itself. |
| `backend` | Where the state goes, if not the default: see [State](#state). |
| `deleteResource` | `false` keeps the cloud resources when the Configuration is deleted. Defaults to `true`. |
| `forceDelete` | Delete the Configuration even if `terraform destroy` can't run. The resources may be left behind. |
| `customRegion` | A region that overrides the Provider's. |
| `gitCredentialsSecretReference` | SSH credentials for a private `remote`. |
| `JobEnv` | Extra environment variables for the Terraform Job. |

A KubeVela component of a Terraform type becomes one of these: vela-core sets `hcl` or `remote` from the ComponentDefinition's `schematic.terraform`, and turns the component's properties into `variable`, except the fields above, which it passes through. So `writeConnectionSecretToRef`, `providerRef` and `deleteResource` work as component properties on every Terraform component type.

## Provider

A `Provider` (`terraform.core.oam.dev/v1beta1`) holds one set of cloud credentials:

```yaml
apiVersion: terraform.core.oam.dev/v1beta1
kind: Provider
metadata:
  name: default
  namespace: default
spec:
  provider: aws          # alibaba, aws, azure, baidu, ec, gcp, huawei, tencent, ucloud, vsphere or custom
  region: us-east-1
  credentials:
    source: Secret
    secretRef:
      namespace: vela-system
      name: aws-account-creds
      key: credentials
```

The controller reads the Secret, checks it has what that cloud needs, and marks the Provider `ready`. When a Configuration runs, the credentials go to the Terraform Job as the environment variables that cloud's Terraform provider reads (`AWS_ACCESS_KEY_ID`, `ALICLOUD_ACCESS_KEY`, ...). On KubeVela, `vela config create -t terraform-<cloud>` writes both the Secret and the Provider.

## What the controller creates

For a Configuration called `random-id` in `default`:

| Object | Where | Holds |
| --- | --- | --- |
| ConfigMap `tf-random-id` | Configuration's namespace | The Terraform, with the backend block added. |
| Secret `variable-random-id` | Configuration's namespace | The variables and credentials, as environment variables for the Job. |
| Job `random-id-apply` | Configuration's namespace | `terraform init` and `terraform apply`, in the `terraformImage` the chart sets. Started again when the HCL or a variable changes. |
| Secret `tfstate-default-random-id` | the backend namespace | The Terraform state. |
| Secret from `writeConnectionSecretToRef` | where it says | The outputs. |
| Job `random-id-destroy` | Configuration's namespace | `terraform destroy`, when the Configuration is deleted. |

The Jobs run as the `tf-executor-service-account` ServiceAccount, which the controller creates in each namespace it runs a Job in. With the chart's `controllerNamespace` set, every Job, ConfigMap and variable Secret goes to that one namespace instead, named by the Configuration's UID rather than its name.

The controller labels the connection Secret as the Configuration's own (`terraform.core.oam.dev/owned-by`, `owned-namespace`, `created-by`). It only writes into, and only deletes, a Secret with its own labels, so two Configurations can't share one, and it never takes over a Secret it didn't create.

## State

By default the state goes to a Secret through Terraform's `kubernetes` backend, in the namespace the chart's `backend.namespace` names (`vela-system` unless set). Set `spec.backend` to put it elsewhere:

```yaml
spec:
  backend:
    backendType: kubernetes
    kubernetes:
      namespace: tf-state
      secret_suffix: my-app
```

`backendType: s3` stores it in an S3 bucket instead. A `backend` block written in the HCL itself is replaced by the controller's.

## Lifecycle

`status.apply.state` says where a Configuration is:

```
  (new) ──▶ ProvisioningAndChecking ──▶ GeneratingTerraformOutputs ──▶ Available
                     │                                                    │
                     ▼                                    HCL or variable changes
                ApplyFailed                                               │
                                                                          ▼
                                                              ConfigurationReloading ──▶ ProvisioningAndChecking

  deleted ──▶ Destroying ──▶ (gone)        or DestroyFailed
```

| State | Means |
| --- | --- |
| `ProvisioningAndChecking` | The apply Job is running. |
| `GeneratingTerraformOutputs` | The apply finished; the outputs are being written to the Secret. It stays here if the Secret is refused, with the reason in `status.apply.message`. |
| `Available` | Done: the resources exist and the outputs are written. |
| `ConfigurationReloading` | The HCL or a variable changed; a new apply Job is starting. |
| `ApplyFailed`, `TerraformInitError` | Terraform failed. In v0.9.1 these are never reached: a failing run stays in `ProvisioningAndChecking`, and the error is only in the Job's pod log (see [Change, Fail and Delete](../examples/update-and-delete.md#2-a-failing-apply)). |
| `ProviderNotFound`, `ProviderNotReady` | The `providerRef` names no Provider, or one whose credentials don't check out. |
| `ConfigurationSpecNotValid` | Both or neither of `hcl` and `remote` are set. |
| `InvalidRegion`, `InvalidGitCredentialsSecretReference`, ... | A referenced setting is missing or malformed. |
| `Destroying`, `DestroyFailed` | The destroy Job is running, or failed. The finalizer keeps the Configuration until it succeeds. |

On delete, the controller runs the destroy Job and removes the Configuration's finalizer once it succeeds. With `deleteResource: false` it skips the destroy and only cleans up its own objects. The `AllowDeleteProvisioningResource` feature gate, on by default, lets you delete a Configuration whose apply never finished, destroying whatever it did create.
