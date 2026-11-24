---
title: Crate Registries
---

This page prepares a cluster for crates. You install the CLI, turn on the feature, and tell KubeVela where your crates are stored.

## Install the vela CLI

The `vela crate` commands are part of the vela CLI. Use a CLI with the same version as vela-core.

```shell
curl -fsSl https://kubevela.io/script/install.sh | bash
vela version
```

For other install methods, see [Install KubeVela CLI](../../installation/kubernetes.mdx#install-vela-cli).

## Turn the feature on

The `crate` component works only when the feature gate `EnableCrateComponent` is true. The gate is false by default.

To install KubeVela with the gate on:

```shell
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install --create-namespace -n vela-system kubevela kubevela/vela-core \
  --set featureGates.enableCrateComponent=true \
  --wait
```

To turn the gate on in an installation that you have:

```shell
helm upgrade kubevela kubevela/vela-core -n vela-system \
  --version <chart-version> \
  --reset-then-reuse-values \
  --set featureGates.enableCrateComponent=true \
  --wait
```

`--reset-then-reuse-values` needs Helm 3.14 or later. It keeps only the values that you set, so the gates that are on stay on. Do not use `--reuse-values`, which can fail or keep the images of an older release. Set `--version` to the chart version that `helm list -n vela-system` shows, so that Helm does not install a different chart.

If you do not use Helm, add this argument to the vela-core controller:

```text
--feature-gates=EnableCrateComponent=true
```

To install crates from an addon, also set `featureGates.enableAddonComponent=true`. See [Crates in Addons](./crate-addon.md).

If the gate is off, admission rejects an Application with a `type: crate` component. The error contains this text:

```text
crate-as-component is disabled; enable the EnableCrateComponent feature gate to use type: crate components
```

## What a crate registry is

A crate registry is a name for an OCI repository prefix. For example, the name `catalog` can point to `oci://ghcr.io/myorg/crates`. The crate `aws-s3` is then stored at `ghcr.io/myorg/crates/aws-s3`, and each package version is a tag.

The name belongs to the cluster, not to the crate. Each cluster can point `catalog` to a different location. A `type: crate` component and the `vela crate` commands use the name, so the same Application works on all clusters.

KubeVela stores the registries in the ConfigMap `vela-crate-registry` in `vela-system`. It stores the password of each registry in the Secret `crate-registry-<name>` in `vela-system`. Crate registries are separate from addon registries. A new installation has no crate registries.

Only OCI registries are supported. A Git repository or a Helm chart repository cannot hold crates.

## Add a registry

Use `oci://` for a registry with TLS:

```shell
vela crate registry add catalog oci://ghcr.io/myorg/crates
```

Use `http://` for a registry with no TLS, for example a local test registry:

```shell
vela crate registry add local http://registry.local:5000/crates
```

The CLI rejects a URL that starts with `https://`, and it shows the `oci://` form of the URL:

```text
Error: crates cannot read a registry over https; "https://ghcr.io/myorg/crates" is either a Helm chart repository, which crates do not support, or an OCI registry addressed with the wrong scheme -- if it is the latter, use "oci://ghcr.io/myorg/crates"
```

The CLI also rejects a URL with no scheme, such as `ghcr.io/myorg/crates`.

The `--type` flag is optional. The only type is `oci`, and the CLI reads it from the URL.

The registry name becomes part of a Secret name. It must be a lowercase RFC 1123 subdomain, for example `catalog` or `team-a.crates`.

### Add a registry that needs a password

Give a username and a password. Give both, or neither. Read the password from stdin, so it does not go into your shell history:

```shell
printf '%s' "$REGISTRY_TOKEN" | vela crate registry add ghcr oci://ghcr.io/myorg/crates \
  --username robot --password-stdin
```

`--password` is also available, but the value is visible in the process list and in the shell history.

An `http://` registry does not accept credentials. The CLI rejects the command:

```text
Error: credentials are not supported for http:// crate registries; use oci:// for authenticated registries
```

### Example: private packages on GHCR

A private package on GitHub Container Registry needs a GitHub token with the `read:packages` scope. A token with `write:packages` also has this scope. Use your GitHub user name as the username and the token as the password:

```shell
printf '%s' "$GITHUB_TOKEN" | vela crate registry add ghcr oci://ghcr.io/myorg/crates \
  --username my-github-user --password-stdin
```

KubeVela stores the token in the Secret `crate-registry-ghcr` in `vela-system`, under the key `token`. The entry in the ConfigMap `vela-crate-registry` refers to the Secret:

```json
"ghcr": {"name": "ghcr", "helm": {"url": "oci://ghcr.io/myorg/crates", "username": "my-github-user", "tokenSecretRef": "crate-registry-ghcr"}}
```

Without credentials, the controller cannot pull a private package. The workflow step of the `type: crate` component fails:

```text
failed to pull addon chart ghcr.io/myorg/crates/aws-s3:1.0.0: failed to authorize: failed to fetch anonymous token: unexpected status from GET request to https://ghcr.io/token?scope=repository%3Amyorg%2Fcrates%2Faws-s3%3Apull&service=ghcr.io: 401 Unauthorized
```

`vela crate deploy` also fetches the package on your workstation. There, the CLI can use your Docker credentials, for example from `docker login ghcr.io`. A registry with no credentials can then work on your workstation and fail in the controller. Always give the credentials to the registry.

## Look at the registries

```shell
vela crate registry list
vela crate registry get ghcr
```

Example output:

```text
NAME   	TYPE	URL                       	PATH
catalog	oci 	oci://ghcr.io/myorg/crates
ghcr   	oci 	oci://ghcr.io/myorg/crates

NAME	TYPE	URL                       	USERNAME
ghcr	oci 	oci://ghcr.io/myorg/crates	my-github-user
```

## Change or delete a registry

`update` changes a registry that exists. It fails if the name does not exist.

```shell
vela crate registry update catalog oci://ghcr.io/myorg/crates-mirror
```

`add` with a name that exists replaces that registry. Use `update` when you want the command to fail on a wrong name.

If you change the URL and give no new password, KubeVela keeps the stored credentials only when the registry host stays the same. When `update` changes the host, KubeVela deletes the stored credentials and the Secret.

```shell
vela crate registry delete catalog
```

`delete` also deletes the Secret of the registry.

## How KubeVela selects the registry

A `type: crate` component and `vela crate deploy` take an optional registry name.

| Registry name | Result |
| --- | --- |
| A name from `vela crate registry list` | KubeVela uses that registry. |
| A name that is not configured | Admission rejects the Application. See the error below. |
| Empty, and the cluster has one registry | KubeVela uses that registry. |
| Empty, and the cluster has two or more registries | KubeVela uses the registry named `catalog`. If no registry has that name, the install fails. |

Admission checks a registry name that you set. If the name is not configured, admission rejects the Application. The message lists the names that you can use:

```text
"spec.components[0].properties.registry": is not a configured crate registry; configured: [catalog]
```

Admission does not check these two cases. KubeVela resolves the registry when it fetches the package, and the workflow step of the `type: crate` component fails.

An empty `registry` on a cluster that has two or more registries, none of them named `catalog`:

```text
several crate registries are configured and none is named "catalog"; pass --registry with one of: one, two
```

A name that admission could not check, because it could not read the ConfigMap `vela-crate-registry`. The same message shows when you delete a registry after admission:

```text
crate registry "photos-store" not found; configured registries: catalog (crate registry not found)
```

`vela crate deploy` prints that last message for a `--registry` name that is not configured. It does not apply the Application.

## Publish credentials

`vela crate publish` pushes from your workstation or from CI. You can give the target in two ways.

With `--registry`, the CLI reads the URL and the credentials of that registry from the cluster. `--username` and `--password` replace the stored credentials for this push.

```shell
vela crate publish ./aws-s3 --registry catalog
```

If you give neither `--registry` nor a repository prefix, the CLI selects the registry with the rules in [How KubeVela selects the registry](#how-kubevela-selects-the-registry).

With a repository prefix as the second argument, the CLI does not read the registry from the cluster. Do not use `--registry` together with a repository prefix. Give `--username` with `--password-stdin`, or give neither and use your Docker credentials, for example from `docker login`.

```shell
docker login ghcr.io
vela crate publish ./aws-s3 oci://ghcr.io/myorg/crates
vela crate publish ./aws-s3 123456789012.dkr.ecr.us-west-2.amazonaws.com/crates
```

### A registry URL must work from two places

`vela crate deploy` fetches the package from your workstation before it applies the Application. Then the vela-core controller fetches the package from the cluster. Both fetches use the URL of the registry. If a URL works only inside the cluster, the command fails on your workstation:

```text
Error: registry "catalog": crate "aws-s3": pull OCI chart: failed to pull addon chart oci-registry.crate-registry.svc.cluster.local:5000/crates/aws-s3:1.0.0: failed to do request: Head "http://oci-registry.crate-registry.svc.cluster.local:5000/v2/crates/aws-s3/manifests/1.0.0": dial tcp: lookup oci-registry.crate-registry.svc.cluster.local: no such host
```

Use a host name that resolves on your workstation and in the cluster.

## Next steps

- [Install and Use a Crate](./crate-install.md)
- [Build and Publish a Crate](./crate-author.md)
