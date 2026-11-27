---
title: State in a Namespace of Your Own
description: Keep a Configuration's Terraform state in a namespace and Secret you choose, and look at what Terraform stored.
---

By default the Terraform state goes to a Secret in the namespace the chart's `backend.namespace` names. `spec.backend` puts one Configuration's state somewhere else: here, a `tf-state` namespace, under a Secret name you pick. That's useful when teams keep their own state apart, or when you want to back the state up with the rest of a namespace.

## 1. Apply it

Save this as `backend.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tf-state
---
apiVersion: terraform.core.oam.dev/v1beta2
kind: Configuration
metadata:
  name: random-state
spec:
  hcl: |
    resource "random_pet" "name" {
      length = 2
    }

    output "name" {
      value = random_pet.name.id
    }
  backend:
    backendType: kubernetes
    kubernetes:
      namespace: tf-state
      secret_suffix: random-state
  inlineCredentials: true
  writeConnectionSecretToRef:
    name: random-state-conn
    namespace: default
```

```shell
kubectl apply -f backend.yaml
kubectl get configuration random-state -w
```

## 2. Look at the state

Terraform's `kubernetes` backend names the Secret `tfstate-<workspace>-<secret_suffix>`, and the workspace is always `default`:

```shell
kubectl get secret -n tf-state
```

The state is gzipped JSON under the `tfstate` key:

```shell
kubectl get secret -n tf-state tfstate-default-random-state -o jsonpath='{.data.tfstate}' \
  | base64 -d | gunzip | jq '{serial, outputs}'
```

## 3. Clean up

```shell
kubectl delete configuration random-state
kubectl delete namespace tf-state
```

Delete the Configuration first: the destroy needs its state.

## Notes

- `backendType: s3` keeps the state in an S3 bucket instead (`s3.bucket`, `s3.key`, and `s3.region`, which defaults to the Provider's); the controller takes the AWS credentials from the Configuration's Provider, and the bucket must already exist.
- Leave out `kubernetes.namespace` and the state goes to the chart's `backend.namespace`, under your `secret_suffix`.
