---
title: Module Registries
---

This page prepares a cluster for modules. You install the CLI, turn on the feature, and tell KubeVela where your modules are stored.

## Install the vela CLI

The `vela module` commands are part of the vela CLI. Use a CLI with the same version as vela-core.

```shell
curl -fsSl https://kubevela.io/script/install.sh | bash
vela version
```

For other install methods, see [Install KubeVela CLI](../../installation/kubernetes.mdx#install-vela-cli).

## Turn the feature on

The `module` component works only when the feature gate `EnableModuleComponent` is true. The gate is false by default.

To install KubeVela with the gate on:

```shell
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install --create-namespace -n vela-system kubevela kubevela/vela-core \
  --set featureGates.enableModuleComponent=true \
  --wait
```

To turn the gate on in an installation that you have:

```shell
helm upgrade kubevela kubevela/vela-core -n vela-system \
  --reuse-values \
  --set featureGates.enableModuleComponent=true \
  --wait
```

If you do not use Helm, add this argument to the vela-core controller:

```text
--feature-gates=EnableModuleComponent=true
```

To install modules from an addon, also set `featureGates.enableAddonComponent=true`. See [Modules in Addons](./module-addon.md).

If the gate is off, admission rejects an Application with a `type: module` component. The error contains this text:

```text
module-as-component is disabled; enable the EnableModuleComponent feature gate to use type: module components
```

## What a module registry is

A module registry is a name for an OCI repository prefix. For example, the name `catalog` can point to `oci://ghcr.io/myorg/modules`. The module `aws-s3` is then stored at `ghcr.io/myorg/modules/aws-s3`, and each package version is a tag.

The name belongs to the cluster, not to the module. Each cluster can point `catalog` to a different location. A `type: module` component and the `vela module` commands use the name, so the same Application works on all clusters.

KubeVela stores the registries in the ConfigMap `vela-module-registry` in `vela-system`. It stores the password of each registry in the Secret `module-registry-<name>` in `vela-system`. Module registries are separate from addon registries. A new installation has no module registries.

Only OCI registries are supported. A Git repository or a Helm chart repository cannot hold modules.

## Add a registry

Use `oci://` for a registry with TLS:

```shell
vela module registry add catalog oci://ghcr.io/myorg/modules
```

Use `http://` for a registry with no TLS, for example a local test registry:

```shell
vela module registry add local http://registry.local:5000/modules
```

The CLI rejects a URL that starts with `https://`, and it shows the `oci://` form of the URL:

```text
Error: modules cannot read a registry over https; "https://ghcr.io/myorg/modules" is either a Helm chart repository, which modules do not support, or an OCI registry addressed with the wrong scheme -- if it is the latter, use "oci://ghcr.io/myorg/modules"
```

The CLI also rejects a URL with no scheme, such as `ghcr.io/myorg/modules`.

The `--type` flag is optional. The only type is `oci`, and the CLI reads it from the URL.

The registry name becomes part of a Secret name. It must be a lowercase RFC 1123 subdomain, for example `catalog` or `team-a.modules`.

### Add a registry that needs a password

Give a username and a password. Give both, or neither. Read the password from stdin, so it does not go into your shell history:

```shell
printf '%s' "$REGISTRY_TOKEN" | vela module registry add ghcr oci://ghcr.io/myorg/modules \
  --username robot --password-stdin
```

`--password` is also available, but the value is visible in the process list and in the shell history.

An `http://` registry does not accept credentials. The CLI rejects the command:

```text
Error: credentials are not supported for http:// module registries; use oci:// for authenticated registries
```

### Example: private packages on GHCR

A private package on GitHub Container Registry needs a GitHub token with the `read:packages` scope. A token with `write:packages` also has this scope. Use your GitHub user name as the username and the token as the password:

```shell
printf '%s' "$GITHUB_TOKEN" | vela module registry add ghcr oci://ghcr.io/myorg/modules \
  --username my-github-user --password-stdin
```

KubeVela stores the token in the Secret `module-registry-ghcr` in `vela-system`, under the key `token`. The entry in the ConfigMap `vela-module-registry` refers to the Secret:

```json
"ghcr": {"name": "ghcr", "helm": {"url": "oci://ghcr.io/myorg/modules", "username": "my-github-user", "tokenSecretRef": "module-registry-ghcr"}}
```

Without credentials, the controller cannot pull a private package. The workflow step of the `type: module` component fails:

```text
failed to pull addon chart ghcr.io/myorg/modules/aws-s3:1.0.0: failed to authorize: failed to fetch anonymous token: unexpected status from GET request to https://ghcr.io/token?scope=repository%3Amyorg%2Fmodules%2Faws-s3%3Apull&service=ghcr.io: 401 Unauthorized
```

`vela module deploy` also fetches the package on your workstation. There, the CLI can use your Docker credentials, for example from `docker login ghcr.io`. A registry with no credentials can then work on your workstation and fail in the controller. Always give the credentials to the registry.

## Look at the registries

```shell
vela module registry list
vela module registry get ghcr
```

Example output:

```text
NAME   	TYPE	URL                        	PATH
catalog	oci 	oci://ghcr.io/myorg/modules
ghcr   	oci 	oci://ghcr.io/myorg/other

NAME	TYPE	URL                      	USERNAME
ghcr	oci 	oci://ghcr.io/myorg/other	robot
```

## Change or delete a registry

`update` changes a registry that exists. It fails if the name does not exist.

```shell
vela module registry update catalog oci://ghcr.io/myorg/modules-mirror
```

`add` with a name that exists replaces that registry. Use `update` when you want the command to fail on a wrong name.

If you change the URL and give no new password, KubeVela keeps the stored credentials only when the registry host stays the same. When `update` changes the host, KubeVela deletes the stored credentials and the Secret.

```shell
vela module registry delete catalog
```

`delete` also deletes the Secret of the registry.

## How KubeVela selects the registry

A `type: module` component and `vela module deploy` take an optional registry name.

| Registry name | Result |
| --- | --- |
| A name from `vela module registry list` | KubeVela uses that registry. |
| A name that is not configured | The install fails. See the error below. |
| Empty, and the cluster has one registry | KubeVela uses that registry. |
| Empty, and the cluster has two or more registries | KubeVela uses the registry named `catalog`. If no registry has that name, the install fails. |

Admission does not check the registry name. KubeVela accepts the Application, and the workflow step of the `type: module` component fails. The message lists the names that you can use:

```text
module registry "photos-store" not found; configured registries: catalog (module registry not found)
```

## Publish credentials

`vela module publish` pushes from your workstation or from CI. You can give the target in two ways.

With `--registry`, the CLI reads the URL and the credentials of that registry from the cluster. `--username` and `--password` replace the stored credentials for this push.

```shell
vela module publish ./aws-s3 --registry catalog
```

If you give neither `--registry` nor a repository prefix, the CLI selects the registry with the rules in [How KubeVela selects the registry](#how-kubevela-selects-the-registry).

With a repository prefix as the second argument, the CLI does not read the registry from the cluster. Do not use `--registry` together with a repository prefix. Give `--username` with `--password-stdin`, or give neither and use your Docker credentials, for example from `docker login`.

```shell
docker login ghcr.io
vela module publish ./aws-s3 oci://ghcr.io/myorg/modules
vela module publish ./aws-s3 123456789012.dkr.ecr.us-west-2.amazonaws.com/modules
```

### A registry URL must work from two places

`vela module deploy` fetches the package from your workstation before it applies the Application. Then the vela-core controller fetches the package from the cluster. Both fetches use the URL of the registry. If a URL works only inside the cluster, the command fails on your workstation:

```text
Error: registry "catalog": module "aws-s3": pull OCI chart: failed to pull addon chart oci-registry.module-registry.svc.cluster.local:5000/modules/aws-s3:1.0.0: failed to do request: Head "http://oci-registry.module-registry.svc.cluster.local:5000/v2/modules/aws-s3/manifests/1.0.0": dial tcp: lookup oci-registry.module-registry.svc.cluster.local: no such host
```

Use a host name that resolves on your workstation and in the cluster.

## Next steps

- [Install and Use a Module](./module-install.md)
- [Build and Publish a Module](./module-author.md)
