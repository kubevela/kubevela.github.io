---
title: Change, Fail and Delete
description: Change a Configuration's variables and watch it re-apply, see what a failing apply looks like, and delete a Configuration whose destroy can't run.
---

What a Configuration does after the first apply: a changed variable runs Terraform again, a broken module shows up in the status and the Job's log, and `forceDelete` gets rid of a Configuration whose `terraform destroy` will never succeed.

## 1. Apply, then change a variable

Save this as `pet.yaml`:

```yaml
apiVersion: terraform.core.oam.dev/v1beta2
kind: Configuration
metadata:
  name: pet
spec:
  hcl: |
    variable "length" {
      type    = number
      default = 2
    }

    resource "random_pet" "name" {
      length = var.length
    }

    output "name" {
      value = random_pet.name.id
    }
  variable:
    length: 2
  inlineCredentials: true
  writeConnectionSecretToRef:
    name: pet-conn
    namespace: default
```

```shell
kubectl apply -f pet.yaml
kubectl wait configuration/pet --for=jsonpath='{.status.apply.state}'=Available --timeout=10m
kubectl get secret pet-conn -o jsonpath='{.data.name}' | base64 -d; echo
```

```console
configuration.terraform.core.oam.dev/pet condition met
electric-ocelot
```

Now ask for a longer name:

```shell
kubectl patch configuration pet --type merge -p '{"spec":{"variable":{"length":4}}}'
sleep 5
kubectl wait configuration/pet --for=jsonpath='{.status.apply.state}'=Available --timeout=10m
kubectl get configuration pet
```

The controller sees the variable change and starts a new apply Job, so `pet` goes back to `ProvisioningAndChecking`, then `Available` again:

```console
NAME   APPLY       DESTROY   AGE
pet    Available             36s
```

Terraform replaces the `random_pet`, since its `length` can't change in place, and the Secret follows:

```shell
kubectl get secret pet-conn -o jsonpath='{.data.name}' | base64 -d; echo
```

```console
frequently-wholly-glorious-wolf
```

## 2. A failing apply

A typo in the HCL: the output refers to a resource that isn't there. Save this as `broken.yaml`:

```yaml
apiVersion: terraform.core.oam.dev/v1beta2
kind: Configuration
metadata:
  name: broken
spec:
  hcl: |
    resource "random_id" "this" {
      byte_length = 8
    }

    output "id" {
      value = random_id.thiss.hex
    }
  inlineCredentials: true
  forceDelete: true
```

```shell
kubectl apply -f broken.yaml
kubectl get configuration broken
kubectl get configuration broken -o jsonpath='{.status.apply.message}'; echo
```

```console
NAME     APPLY                     DESTROY   AGE
broken   ProvisioningAndChecking             3m9s
container "terraform-executor" in pod "broken-apply-tkqkx" is waiting to start: PodInitializing
```

:::note A failed run shows as ProvisioningAndChecking
In v0.9.1 the Configuration does not move to `ApplyFailed`: it stays in `ProvisioningAndChecking`, and the message only names the Job's pod. The controller looks for Terraform's `Error:` in the pod log after it has stripped the colour codes the check depends on, so it never finds one. Look at the pod instead.
:::

The pod fails and restarts:

```shell
kubectl get pods -l job-name=broken-apply
```

```console
NAME                 READY   STATUS   RESTARTS      AGE
broken-apply-tkqkx   0/1     Error    5 (87s ago)   3m9s
```

And its log has Terraform's error:

```shell
kubectl logs job/broken-apply -c terraform-executor | sed 's/\x1b\[[0-9;]*m//g' | tail -9
```

```console
╷
│ Error: Reference to undeclared resource
│
│   on main.tf line 6, in output "id":
│    6:   value = random_id.thiss.hex
│
│ A managed resource "random_id" "thiss" has not been declared in the root
│ module.
╵
```

The Job keeps retrying (the chart's `jobBackoffLimit` caps it; unset, it is effectively unlimited), so fix the HCL and re-apply, or delete it.

## 3. Delete

```shell
kubectl delete configuration pet
```

`pet` runs `terraform destroy` first (its `DESTROY` column shows `Destroying` meanwhile), then removes its Secret and state. `broken` never applied anything, and `forceDelete: true` lets it go at once, without a destroy:

```shell
kubectl delete configuration broken
```

```console
configuration.terraform.core.oam.dev "broken" deleted from default namespace
```

:::caution
`forceDelete` drops the Configuration even when the destroy failed, so anything Terraform did create stays in the cloud, with no state left to destroy it from. Use it for Configurations that never got anywhere, not to hurry a slow destroy. To keep the resources on purpose, set `deleteResource: false` instead.
:::
