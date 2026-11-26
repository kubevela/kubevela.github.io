---
title: Install and Use a Crate
---

This page installs a published crate and uses its definitions. Before you start, do the steps in [Crate Registries](./crate-registry.md).

## Select the install namespace

The install namespace is the namespace of the installer Application. KubeVela creates the definitions of the crate in this namespace. The namespace controls which Applications can use the definitions.

| Install namespace | Applications that can use the definitions |
| --- | --- |
| `vela-system` | Applications in all namespaces |
| A different namespace, for example `team-a` | Applications in `team-a` only |

An auxiliary object that does not set `metadata.namespace` also goes into the install namespace. An object that sets `metadata.namespace` keeps that namespace. The owned Application `crate-<name>` is always in `vela-system`.

The install namespace must exist before you install. KubeVela does not create it.

You cannot set a different namespace on the component. If you set a `namespace` property, admission rejects the Application.

A cluster holds one install of each crate name. Two teams cannot install `aws-s3` in two namespaces at the same time.

:::note
When a crate sends objects to managed clusters, the install namespace must also exist on each managed cluster. See [The namespace of runtime objects](./crate-multicluster.md#the-namespace-of-runtime-objects).
:::

## Install with the CLI

`vela crate deploy` writes the installer Application, applies it, and waits until each install tier is healthy.

```shell
kubectl create namespace team-a
vela crate deploy aws-s3 --registry catalog --version 1.0.0 -n team-a
```

```text
Applied Application team-a/crate-aws-s3-deploy
Rendering crate (install tiers are not known yet)...
TIER          	STATUS 	MESSAGE
aws-s3-aux    	Healthy
aws-s3-v1-aux 	Healthy
aws-s3-v1-defs	Healthy
aws-s3-v2-aux 	Healthy
aws-s3-v2-defs	Healthy
Crate "aws-s3" (version 1.0.0) is installed in namespace "team-a"
```

| Flag | Meaning | Default |
| --- | --- | --- |
| `--registry` | The registry name. | The only registry, or `catalog` when there are two or more. If there are two or more and none is named `catalog`, the command fails. See [How KubeVela selects the registry](./crate-registry.md#how-kubevela-selects-the-registry). |
| `--version` | The package version, which is the OCI tag. It is not the API line. | Empty. See [Pin the version](#pin-the-version). |
| `-n`, `--namespace` | The install namespace. | `vela-system` |
| `--timeout` | How long to wait for a healthy install. | `5m0s` |
| `--dry-run` | Print the installer Application. Do not apply it. | `false` |
| `--clusters`, `--cluster-selector`, `--allow-empty` | Send runtime objects to managed clusters. See [Crate Multi-Cluster Placement](./crate-multicluster.md). | Not set |

The command creates the installer Application `crate-<name>-deploy` in the install namespace. In this example, the name is `crate-aws-s3-deploy`.

If the namespace does not exist, the command fails:

```text
Error: failed to apply Application team-a/crate-aws-s3-deploy: cannot create object: namespaces "team-a" not found
```

### Save the Application for GitOps

`--dry-run` prints the Application. Save it and commit it to your repository:

```shell
vela crate deploy aws-s3 --registry catalog --version 1.0.0 -n team-a --dry-run > aws-s3-crate.yaml
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: crate-aws-s3-deploy
  namespace: team-a
spec:
  components:
  - name: aws-s3
    properties:
      crate: aws-s3
      registry: catalog
      version: 1.0.0
    type: crate
status: {}
```

`--dry-run` connects to the registry to find the package. It does not change the cluster. If you do not set `--version`, the output contains `version: ""`.

### Pin the version

An empty `version` resolves to the highest semver tag, for example `1.10.0` before `1.2.0`, when the workflow of the installer Application runs. A new tag in the registry does not run that workflow again, so the installed package stays. Set `version` on each install and each upgrade. On the CLI, pass `--version`.

`vela crate deploy` with no `--version` writes an empty `version`. If the Application stored a version, this change runs the workflow, and KubeVela selects the highest semver tag.

## Install with an Application

The CLI only writes an Application. You can write the same Application yourself and apply it with `kubectl`, Argo CD, or Flux. Use the name that the CLI writes, `crate-<name>-deploy`, and the same namespace. A second installer Application for the same crate is refused.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: crate-aws-s3-deploy
  namespace: team-a
spec:
  components:
    - name: aws-s3
      type: crate
      properties:
        registry: catalog
        version: "1.0.0"
```

`crate` is the crate name. If you do not set it, KubeVela uses the component name. The fields are in the [crate component reference](../../end-user/components/references.md#crate).

Set `version` in production. See [Pin the version](#pin-the-version).

## Check the install

`vela crate deploy` prints a tier table. The install is complete when every row in that table is `Healthy` and the command prints the installed package version.

To see the same tiers later, read the owned Application. Its name is `crate-<name>` in `vela-system`:

```shell
vela status crate-aws-s3 -n vela-system
```

The installer Application is `crate-<name>-deploy` in the install namespace:

```shell
vela status crate-aws-s3-deploy -n team-a
```

To check that an install is complete, use the tier table, or `vela status crate-<name> -n vela-system`.

| Tier | Contents |
| --- | --- |
| `aws-s3-aux` | Objects from `auxiliary/`. All API lines share them. |
| `aws-s3-v1-aux` | Objects from `v1/auxiliary/`. |
| `aws-s3-v1-defs` | The definitions of line `v1`. |
| `aws-s3-v2-aux` | Objects from `v2/auxiliary/`. |
| `aws-s3-v2-defs` | The definitions of line `v2`. |

A tier is not in the list when the package has no objects for it. With placement, an auxiliary tier that has hub objects also has a tier with the suffix `-hub`, for example `aws-s3-aux-hub`. See [Crate Multi-Cluster Placement](./crate-multicluster.md).

A tier is healthy when KubeVela applied its objects. Some objects need more time to become ready, for example a Crossplane provider that downloads its package. The crate author tells you what to wait for. For an example, see [Publish and install](./crate-crossplane.md#publish-and-install).

Look at the owned Application and the package version that KubeVela fetched:

```shell
kubectl -n vela-system get application crate-aws-s3
kubectl -n vela-system get application crate-aws-s3 \
  -o jsonpath='{.metadata.annotations.definition\.oam\.dev/crate-version}{"\n"}'
```

List the definitions that the crate installed:

```shell
kubectl -n team-a get componentdefinitions,traitdefinitions,policydefinitions,workflowstepdefinitions,workloaddefinitions \
  -l definition.oam.dev/crate=aws-s3
```

## Use the definitions

The installed name of a definition is `<crate>-<apiVersion>-<capability>`, for example `aws-s3-v1-bucket`. Do not use this name in an Application. Use the type form `<crate>/<apiVersion>/<capability>`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: photos
  namespace: team-a
spec:
  components:
    - name: photos
      type: aws-s3/v1/bucket
      properties:
        region: eu-west-1
        tags:
          team: photos
```

Traits, policies, and workflow steps from a crate use the same form, for example `type: notes/v1/note` for a trait.

KubeVela finds the definition in the namespace of the Application or in `vela-system`.

### Type rules

| Type | Result |
| --- | --- |
| `aws-s3/v1/bucket` | Correct. KubeVela uses `aws-s3-v1-bucket`. |
| `bucket` | Rejected when `bucket` comes from a crate. A one-part name works only for a definition that is not in a crate. |
| `v1/bucket` | Rejected. A type has one part or three parts. |
| `aws-s3/1/bucket` | Rejected. The middle part must have the form `vN`, `vNalphaN`, or `vNbetaN`, for example `v1` or `v1beta1`. |
| `aws-s3-v1-bucket` | Rejected, because this is the name of a crate definition. |

Admission rejects these types. The error for a one-part name tells you the correct form:

```text
type "bucket" resolves to crate-backed definition "aws-s3-v1-bucket" (crate="aws-s3"); use {crate}/{apiVersion}/{name} (Form 3)
```

When two API lines both have a `bucket` definition, the error is different:

```text
type "bucket" is ambiguous: definitions from crates [aws-s3] all match; use {crate}/{apiVersion}/{name} (Form 3) to disambiguate
```

### Move to a new API line

`aws-s3/v1/bucket` and `aws-s3/v2/bucket` are two different definitions. Both are installed at the same time, so Applications in one namespace can use different lines. A new API line does not change Applications that use the old line.

To move an Application to `v2`:

1. Read the parameters of the `v2` definition. A new line can add, delete, or rename parameters.
2. Change `type` to `aws-s3/v2/bucket` and change the properties.
3. Apply the Application.

Do this one Application at a time. The crate author can delete `v1` from a later package version only after all Applications use `v2`. For a full example with buckets, see [Move an Application to v2](./crate-crossplane.md#move-an-application-to-v2).

## Upgrade the package

Set a new `version` on the installer Application, or run `vela crate deploy` with that tag:

```shell
vela crate deploy aws-s3 --registry catalog --version 1.0.1 -n team-a
```

Always pass `--version`. See [Pin the version](#pin-the-version).

After you install the new tag, KubeVela fetches that tag and changes the owned Application:

- KubeVela installs the API lines that the new package enables.
- KubeVela updates the objects and definitions that changed.
- KubeVela deletes the definitions and objects that the new package does not contain.

After `vela crate deploy` prints the new tiers as `Healthy`, read the `definition.oam.dev/crate-version` annotation on `crate-aws-s3`. During the upgrade, `vela crate deploy` and `vela status` can first show the tiers of the previous version as healthy.

:::caution
If the new package does not contain an API line, or disables it, KubeVela deletes the definitions and the auxiliary objects of that line. The objects that Applications already created from the line stay. But admission rejects every change to an Application that uses the line, and the Application has a `Parsed` condition that is false. The error names the missing definition, for example `trait definition of notes/v1/note not found` for a trait, or `WorkloadDefinition.core.oam.dev "aws-s3-v1-bucket" not found` for a component. Check `vela status` for `Parsed=False`, not just the Healthy line. Move all Applications to the new line before you install such a package. For an example, see [Retire line v1](./crate-crossplane.md#retire-line-v1).
:::

## Change the namespace of an install

This procedure deletes the definitions of the crate until the new install is complete. Before you start, move all Applications away from the definitions, as for [Uninstall a crate](#uninstall-a-crate).

1. Delete the installer Application:

   ```shell
   kubectl -n team-a delete application crate-aws-s3-deploy
   ```

2. Wait until the owned Application is gone:

   ```shell
   kubectl -n vela-system get application crate-aws-s3
   ```

3. Install the crate in the new namespace.

## Uninstall a crate

Delete the installer Application. KubeVela deletes the owned Application and all objects of the crate, including the definitions.

```shell
kubectl -n team-a delete application crate-aws-s3-deploy
```

Before you uninstall a crate, move all Applications away from its definitions.

## Troubleshooting

| Error or symptom | Cause | What to do |
| --- | --- | --- |
| `crate-as-component is disabled` | The feature gate is off. | Turn the gate on. See [Turn the feature on](./crate-registry.md#turn-the-feature-on). |
| `cannot create object: namespaces "team-a" not found` | The install namespace does not exist. | Create the namespace, then install again. |
| `is not a configured crate registry; configured: [catalog]` | Admission rejected the Application. The `registry` property is not the name of a configured registry. | Use a name from `vela crate registry list`. |
| `crate registry "photos-store" not found; configured registries: catalog (crate registry not found)` | `vela crate deploy` has a `--registry` name that is not configured. In a workflow step, the registry was deleted after admission, or admission could not read the registries. See [How KubeVela selects the registry](./crate-registry.md#how-kubevela-selects-the-registry). | Use a name from `vela crate registry list`. |
| `namespace is no longer accepted` | The component sets `namespace`. | Delete the property. Apply the installer Application in the namespace that you want. |
| `existing object Application vela-system/crate-aws-s3 is managed by other application team-a/crate-aws-s3-deploy` | The crate is already installed from a different installer Application. | Use the install that exists, or uninstall it first. See [Change the namespace of an install](#change-the-namespace-of-an-install). |
| `resolves to crate-backed definition` | The Application uses a one-part type. | Use `<crate>/<apiVersion>/<capability>`. |
| `is ambiguous: definitions from crates [...] all match` | The Application uses a one-part type, and two definitions match. | Use `<crate>/<apiVersion>/<capability>`. |
| `WorkloadDefinition.core.oam.dev "aws-s3-v1-bucket" not found` | The crate is installed in a different namespace, or the installed package no longer contains line `v1`. | Install the crate in the namespace of the Application, or in `vela-system`. For a retired line, see the caution in [Upgrade the package](#upgrade-the-package). |
| A tier stays unhealthy | KubeVela cannot apply an object in that tier. For example, the CRD of the object is missing. | Run `vela status crate-<name> -n vela-system` and read the message of the tier. |
