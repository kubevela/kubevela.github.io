---
title: A Module from Git
description: Run Terraform kept in a git repository, pinned to a tag, with a subdirectory as the root module.
---

Rather than inline HCL, a Configuration can point at a git repository: `remote` is the repository, `path` the directory holding the root module, and `gitRef` the branch, tag or commit to check out. The controller clones it in an init container before Terraform runs.

This one uses the `random` module in terraform-controller's own repository, pinned to the `v0.9.1` tag, so it needs no credentials and the module can't change under you.

## 1. Apply it

Save this as `remote.yaml`:

```yaml
apiVersion: terraform.core.oam.dev/v1beta2
kind: Configuration
metadata:
  name: random-remote
spec:
  remote: https://github.com/kubevela/terraform-controller.git
  path: examples/tf-native/random
  gitRef:
    tag: v0.9.1
  inlineCredentials: true
  writeConnectionSecretToRef:
    name: random-remote-conn
    namespace: default
```

```shell
kubectl apply -f remote.yaml
kubectl wait configuration/random-remote --for=jsonpath='{.status.apply.state}'=Available --timeout=10m
kubectl get configuration random-remote
```

```console
NAME            APPLY       DESTROY   AGE
random-remote   Available             36s
```

## 2. Check what ran

The apply Job's pod clones the repository in its `git-configuration` init container:

```shell
kubectl logs job/random-remote-apply -c git-configuration
```

```console
Cloning into '/opt/tf-backend'...
```

Terraform's own output is in the main container, `terraform-executor` (it is coloured; `| sed 's/\x1b\[[0-9;]*m//g'` strips the escapes):

```shell
kubectl logs job/random-remote-apply -c terraform-executor | tail -6
```

```console
Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

random_id = "b489e985fcee6157"
```

And the output in the connection Secret:

```shell
kubectl get secret random-remote-conn -o jsonpath='{.data.random_id}' | base64 -d; echo
```

```console
b489e985fcee6157
```

## 3. Clean up

```shell
kubectl delete -f remote.yaml
```

## Notes

- `remote` takes a public repository over HTTPS. For a private one, use an SSH URL and `gitCredentialsSecretReference`, naming a Secret in the Configuration's namespace with the private key under `ssh-privatekey` (the `kubernetes.io/ssh-auth` layout) and the host's key under `known_hosts`.
- `gitRef` takes one of `branch`, `tag` or `commit`. Without it, the default branch is cloned, so a change to the repository changes what the next apply runs.
- A KubeVela component type does the same with `schematic.terraform.type: remote`, `configuration: <repository URL>` and `path`: see [Extend Cloud Resources](../extend/cloud-resource-component.md).
