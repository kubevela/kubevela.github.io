---
title: A Terraform Component in an Application
description: Write a ComponentDefinition from a piece of Terraform, use it in a KubeVela Application, and hand its output to a workload as an environment variable.
---

The KubeVela way to use Terraform: a platform engineer turns a Terraform module into a component type, and an Application uses it next to the workload that needs its output. The output reaches the workload through the connection Secret. Here the module makes a random ID, so it runs without a cloud account; a real one (a database, a bucket) works the same way.

You need KubeVela installed, and terraform-controller [installed](../getting-started/install.md).

## 1. The component type

Save this as `random-id-def.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: random-id
  namespace: vela-system
  annotations:
    definition.oam.dev/description: A random ID, from Terraform's random provider
  labels:
    type: terraform
spec:
  workload:
    definition:
      apiVersion: terraform.core.oam.dev/v1beta2
      kind: Configuration
  schematic:
    terraform:
      type: hcl
      configuration: |
        variable "byte_length" {
          description = "How many random bytes the ID has"
          type        = number
          default     = 8
        }

        resource "random_id" "this" {
          byte_length = var.byte_length
        }

        output "ID" {
          value = random_id.this.hex
        }
```

```shell
kubectl apply -f random-id-def.yaml
vela show random-id
```

```console
+----------------------------+--------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+-----------+
|            NAME            |                            DESCRIPTION                             |                           TYPE                            | REQUIRED | DEFAULT | IMMUTABLE |
+----------------------------+--------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+-----------+
| byte_length                | How many random bytes the ID has.                                  | number                                                    | false    |         |           |
| writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false    |         |           |
+----------------------------+--------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+-----------+


#### writeConnectionSecretToRef
+-----------+------------------------------------------------------------------------------+--------+----------+---------+-----------+
|   NAME    |                                 DESCRIPTION                                  |  TYPE  | REQUIRED | DEFAULT | IMMUTABLE |
+-----------+------------------------------------------------------------------------------+--------+----------+---------+-----------+
| name      | The secret name which the cloud resource connection will be written to.      | string | true     |         |           |
| namespace | The secret namespace which the cloud resource connection will be written to. | string | false    |         |           |
+-----------+------------------------------------------------------------------------------+--------+----------+---------+-----------+
```

The table comes from the module's variables, plus `writeConnectionSecretToRef`. The other fields a Configuration takes (`providerRef`, `deleteResource`, `inlineCredentials`, ...) aren't listed, but work as properties on every Terraform component type.

## 2. The Application

Save this as `app.yaml`. The `random-id` component writes its output to the `app-id` Secret; the `printer` component waits for it (`dependsOn`) and reads it as `APP_ID`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: terraform-demo
spec:
  components:
    - name: app-id
      type: random-id
      properties:
        byte_length: 4
        # random needs no credentials, so the component uses no Provider.
        inlineCredentials: true
        writeConnectionSecretToRef:
          name: app-id
    - name: printer
      type: webservice
      dependsOn:
        - app-id
      properties:
        image: busybox:1.38.0
        cmd: ["sh", "-c", "echo APP_ID=$APP_ID; sleep 3600"]
        env:
          - name: APP_ID
            valueFrom:
              secretKeyRef:
                name: app-id
                key: ID
```

```shell
vela up -f app.yaml
vela status terraform-demo
```

While Terraform runs, `app-id` reports `wait healthy` and `printer` waits on it (`Pending on DependsOn: app-id`). Once the Configuration is `Available`:

```console
About:

  Name:      	terraform-demo
  Namespace: 	default
  Created at:	2026-11-27 10:50:24 +0000 GMT
  Healthy:   	✅
  Details:   	running

Workflow:

  mode: DAG-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: ox57r93qqu
    name: app-id
    type: apply-component
    phase: succeeded
  - id: 1lele1gm3e
    name: printer
    type: apply-component
    phase: succeeded

Services:

  - Name: printer
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:1/1
    No trait applied

  - Name: app-id
    Cluster: local
    Namespace: default
    Type: random-id
    Health: ✅
      Message: Cloud resources are deployed and ready to use
    No trait applied
```

```shell
kubectl logs deploy/printer
```

```console
APP_ID=ceb9f903
```

`byte_length: 4` gives 4 bytes, 8 hex characters.

## 3. Clean up

```shell
vela delete terraform-demo -y
kubectl delete -f random-id-def.yaml
```

Deleting the Application deletes the Configuration, which runs `terraform destroy` before it goes.

## Going further

- `vela def init <name> --type component --provider aws --local main.tf` writes the ComponentDefinition for you from a local file or a git repository: see [Extend Cloud Resources](../extend/cloud-resource-component.md). It only takes the cloud providers it knows (`alibaba`, `aws`, `azure`, `gcp`, ...), so for anything else, write it as above.
- A cloud component type takes a `providerRef` instead of `inlineCredentials`: see [Provision Cloud Resources](../guides/consume-cloud-services.md).
