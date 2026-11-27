---
title: Quick Start
description: Install terraform-controller with Helm, run one Terraform resource from a Configuration, and read its output from a Secret. No cloud account needed.
---

One complete run, start to finish: install the controller, give it a piece of Terraform, read what Terraform produced, then destroy it. It uses the `random` provider, which needs no credentials, so it works on any cluster, a laptop k3d one included.

You need `kubectl` and `helm` (v3), and a cluster `kubectl` points at.

## 1. Install the controller

```shell
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm upgrade --install terraform-controller kubevela/terraform-controller \
  --version 0.9.1 --namespace terraform --create-namespace \
  --set backend.namespace=terraform --wait
```

```shell
kubectl get pods -n terraform
```

```console
NAME                                   READY   STATUS    RESTARTS   AGE
terraform-controller-d44c4bf5f-9bhjt   1/1     Running   0          13s
```

`backend.namespace=terraform` keeps the Terraform state in the controller's namespace; the default, `vela-system`, only exists alongside KubeVela.

## 2. Apply a Configuration

Save this as `random.yaml`:

```yaml
apiVersion: terraform.core.oam.dev/v1beta2
kind: Configuration
metadata:
  name: random-id
spec:
  hcl: |
    resource "random_id" "server" {
      byte_length = 8
    }

    output "random_id" {
      value = random_id.server.hex
    }
  # The random provider takes no credentials, so no Provider object is needed.
  inlineCredentials: true
  writeConnectionSecretToRef:
    name: random-conn
    namespace: default
```

```shell
kubectl apply -f random.yaml
kubectl get configuration random-id -w
```

The controller starts a Job that runs `terraform init` and `terraform apply`; the first run pulls the Terraform image and the provider, so give it a minute. `Available` means the apply finished and the outputs are written.

## 3. Read the output

Each Terraform `output` becomes a key in the connection Secret:

```shell
kubectl get secret random-conn -o jsonpath='{.data.random_id}' | base64 -d; echo
```

The same value is on the Configuration's status:

```shell
kubectl get configuration random-id -o jsonpath='{.status.apply.outputs}'; echo
```

## 4. Clean up

Deleting the Configuration runs `terraform destroy`, then removes the Secret, the state and the Jobs:

```shell
kubectl delete -f random.yaml
helm uninstall terraform-controller -n terraform
```

## Next

- [How It Works](../concepts/how-it-works.md): what the controller created along the way.
- The [examples](/terraform/examples): the same thing from a KubeVela Application, a module from git, state in a namespace of your choice.
- [Provision a real cloud resource](../guides/consume-cloud-services.md) once a provider is set up.
