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
kubectl wait configuration/pet --for=jsonpath='{.status.apply.state}'=Available --timeout=5m
kubectl get secret pet-conn -o jsonpath='{.data.name}' | base64 -d; echo
```

Now ask for a longer name:

```shell
kubectl patch configuration pet --type merge -p '{"spec":{"variable":{"length":4}}}'
kubectl get configuration pet -w
```

The controller sees the variable change, starts a new apply Job, and Terraform replaces the `random_pet`, since its `length` can't change in place. The Secret follows:

```shell
kubectl get secret pet-conn -o jsonpath='{.data.name}' | base64 -d; echo
```

## 2. A failing apply

`random_id` refuses a negative `byte_length` when it is applied. Save this as `broken.yaml`:

```yaml
apiVersion: terraform.core.oam.dev/v1beta2
kind: Configuration
metadata:
  name: broken
spec:
  hcl: |
    resource "random_id" "bad" {
      byte_length = -1
    }
  inlineCredentials: true
  forceDelete: true
```

```shell
kubectl apply -f broken.yaml
kubectl get configuration broken -w
```

The message on the status says where to look; the Terraform error itself is in the Job's log:

```shell
kubectl get configuration broken -o jsonpath='{.status.apply.message}'; echo
kubectl logs job/broken-apply -c terraform-executor | tail -8
```

The Job keeps retrying (the chart's `jobBackoffLimit` caps it, unlimited by default), so fix the HCL and re-apply, or delete it.

## 3. Delete

```shell
kubectl delete configuration pet
```

`pet` runs `terraform destroy` first, then removes its Secret and state. `broken` never applied anything, and `forceDelete: true` lets it go without waiting for a destroy:

```shell
kubectl delete configuration broken
```

:::caution
`forceDelete` drops the Configuration even when the destroy failed, so anything Terraform did create stays in the cloud, with no state left to destroy it from. Use it for Configurations that never got anywhere, not to hurry a slow destroy. To keep the resources on purpose, set `deleteResource: false` instead.
:::
