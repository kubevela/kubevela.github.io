---
title: Install and Use a Module
---

This page installs a published module and uses its definitions. Before you start, do the steps in [Module Registries](./module-registry.md).

## Select the install namespace

The install namespace is the namespace of the installer Application. KubeVela creates the definitions of the module in this namespace. The namespace controls which Applications can use the definitions.

| Install namespace | Applications that can use the definitions |
| --- | --- |
| `vela-system` | Applications in all namespaces |
| A different namespace, for example `team-a` | Applications in `team-a` only |

An auxiliary object that does not set `metadata.namespace` also goes into the install namespace. An object that sets `metadata.namespace` keeps that namespace. The owned Application `module-<name>` is always in `vela-system`.

The install namespace must exist before you install. KubeVela does not create it.

You cannot set a different namespace on the component. If you set a `namespace` property, admission rejects the Application.

A cluster holds one install of each module name. Two teams cannot install `aws-s3` in two namespaces at the same time.

:::note
When a module sends objects to managed clusters, the install namespace must also exist on each managed cluster. See [The namespace of runtime objects](./module-multicluster.md#the-namespace-of-runtime-objects).
:::

## Install with the CLI

`vela module deploy` writes the installer Application, applies it, and waits until each install tier is healthy.

```shell
kubectl create namespace team-a
vela module deploy aws-s3 --registry catalog --version 1.0.0 -n team-a
```

```text
Applied Application team-a/module-aws-s3-deploy
Rendering module (install tiers are not known yet)...
TIER          	STATUS 	MESSAGE
aws-s3-aux    	Healthy
aws-s3-v1-aux 	Healthy
aws-s3-v1-defs	Healthy
aws-s3-v2-aux 	Healthy
aws-s3-v2-defs	Healthy
Module "aws-s3" (version 1.0.0) is installed in namespace "team-a"
```

| Flag | Meaning | Default |
| --- | --- | --- |
| `--registry` | The registry name. | The only registry, or `catalog` when there are two or more |
| `--version` | The package version, which is the OCI tag. It is not the API line. | On a first install, the highest semver tag. The Application stores an empty version. A later deploy with an empty version keeps that package. |
| `-n`, `--namespace` | The install namespace. | `vela-system` |
| `--timeout` | How long to wait for a healthy install. | `5m0s` |
| `--dry-run` | Print the installer Application. Do not apply it. | `false` |
| `--clusters`, `--cluster-selector`, `--allow-empty` | Send runtime objects to managed clusters. See [Module Multi-Cluster Placement](./module-multicluster.md). | Not set |

The command creates the installer Application `module-<name>-deploy` in the install namespace. In this example, the name is `module-aws-s3-deploy`.

If the namespace does not exist, the command fails:

```text
Error: failed to apply Application team-a/module-aws-s3-deploy: cannot create object: namespaces "team-a" not found
```

### Save the Application for GitOps

`--dry-run` prints the Application. Save it and commit it to your repository:

```shell
vela module deploy aws-s3 --registry catalog --version 1.0.0 -n team-a --dry-run > aws-s3-module.yaml
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: module-aws-s3-deploy
  namespace: team-a
spec:
  components:
  - name: aws-s3
    properties:
      module: aws-s3
      registry: catalog
      version: 1.0.0
    type: module
status: {}
```

`--dry-run` connects to the registry to find the package. It does not change the cluster. If you do not set `--version`, the output contains `version: ""`.

On a first install, KubeVela selects the highest semver tag, for example `1.10.0` before `1.2.0`, and stores `version` as `""`. A later deploy with no `--version` leaves that empty value. The installed package stays. A tag you publish later stays unused until you pass `--version`.

If the Application already stores a version, a deploy with no `--version` writes `""` over that version. KubeVela then selects the highest semver tag.

## Install with an Application

The CLI only writes an Application. You can write the same Application yourself and apply it with `kubectl`, Argo CD, or Flux.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: aws-s3-module
  namespace: team-a
spec:
  components:
    - name: aws-s3
      type: module
      properties:
        registry: catalog
        version: "1.0.0"
```

`module` is the module name. If you do not set it, KubeVela uses the component name. The fields are in the [module component reference](../../end-user/components/references.md#module).

Set `version` in production. If you leave it empty, a first install selects the highest semver tag, for example `1.10.0` before `1.2.0`, and stores `version` as `""`. A package you publish later stays unused until you set `version`.

## Check the install

`vela module deploy` prints a tier table. The install is complete when every row in that table is `Healthy` and the command prints the installed package version.

To see the same tiers later, read the owned Application. Its name is `module-<name>` in `vela-system`:

```shell
vela status module-aws-s3 -n vela-system
```

The installer Application is `module-<name>-deploy` in the install namespace:

```shell
vela status module-aws-s3-deploy -n team-a
```

The `Ready:N/N` message on that installer can stay at an old count after the tiers change. Use the tier table and `vela status` on `module-aws-s3` as the completion check. Those two show the installed tiers.

This count stayed old on two installs. After you retire line `v2`, `vela status` on the installer can still show `Ready:5/5` while three `v1` tiers remain. For `notes`, package `1.2.0` had two healthy tiers and the installer stayed `Ready:1/1`. Package `1.10.0` had one tier and the installer stayed `Ready:2/2`.

| Tier | Contents |
| --- | --- |
| `aws-s3-aux` | Objects from `auxiliary/`. All API lines share them. |
| `aws-s3-v1-aux` | Objects from `v1/auxiliary/`. |
| `aws-s3-v1-defs` | The definitions of line `v1`. |
| `aws-s3-v2-aux` | Objects from `v2/auxiliary/`. |
| `aws-s3-v2-defs` | The definitions of line `v2`. |

A tier is not in the list when the package has no objects for it.

A tier is healthy when KubeVela applied its objects. Some objects need more time to become ready, for example a Crossplane provider that downloads its package. The module author tells you what to wait for. For an example, see [Publish and install](./module-crossplane.md#publish-and-install).

Look at the owned Application and the package version that KubeVela fetched:

```shell
kubectl -n vela-system get application module-aws-s3
kubectl -n vela-system get application module-aws-s3 \
  -o jsonpath='{.metadata.annotations.definition\.oam\.dev/module-version}{"\n"}'
```

List the definitions that the module installed:

```shell
kubectl -n team-a get componentdefinitions,traitdefinitions,policydefinitions,workflowstepdefinitions \
  -l definition.oam.dev/module=aws-s3
```

## Use the definitions

The installed name of a definition is `<module>-<apiVersion>-<capability>`, for example `aws-s3-v1-bucket`. Do not use this name in an Application. Use the type form `<module>/<apiVersion>/<capability>`:

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

Traits, policies, and workflow steps from a module use the same form, for example `type: notes/v1/note` for a trait.

KubeVela finds the definition in the namespace of the Application or in `vela-system`.

### Type rules

| Type | Result |
| --- | --- |
| `aws-s3/v1/bucket` | Correct. KubeVela uses `aws-s3-v1-bucket`. |
| `bucket` | Rejected when `bucket` comes from a module. A one-part name works only for a definition that is not in a module. |
| `v1/bucket` | Rejected. A type has one part or three parts. |
| `aws-s3/1/bucket` | Rejected. The middle part must have the form `vN`, `vNalphaN`, or `vNbetaN`, for example `v1` or `v1beta1`. |
| `aws-s3-v1-bucket` | Rejected, because this is the name of a module definition. |

Admission rejects these types. The error for a one-part name tells you the correct form:

```text
type "bucket" resolves to module-backed definition "aws-s3-v1-bucket" (module="aws-s3"); use {module}/{apiVersion}/{name} (Form 3)
```

When two API lines both have a `bucket` definition, the error is different:

```text
type "bucket" is ambiguous: definitions from modules [aws-s3] all match; use {module}/{apiVersion}/{name} (Form 3) to disambiguate
```

### Move to a new API line

`aws-s3/v1/bucket` and `aws-s3/v2/bucket` are two different definitions. Both are installed at the same time, so Applications in one namespace can use different lines. A new API line does not change Applications that use the old line.

To move an Application to `v2`:

1. Read the parameters of the `v2` definition. A new line can add, delete, or rename parameters.
2. Change `type` to `aws-s3/v2/bucket` and change the properties.
3. Apply the Application.

Do this one Application at a time. The module author can delete `v1` from a later package version only after all Applications use `v2`. For a full example with buckets, see [Move an Application to v2](./module-crossplane.md#move-an-application-to-v2).

## Upgrade the package

Set a new `version` on the installer Application, or run `vela module deploy` with that tag:

```shell
vela module deploy aws-s3 --registry catalog --version 1.0.1 -n team-a
```

Pass `--version`. A deploy with no `--version` leaves an empty `version` as it is. The installed package stays. A tag you publish later stays unused until you pass `--version`.

If the Application already stores a version, a deploy with no `--version` writes `""` over that version. KubeVela then selects the highest semver tag.

After you install the new tag, KubeVela fetches that tag and changes the owned Application:

- KubeVela installs the API lines that the new package enables.
- KubeVela updates the objects and definitions that changed.
- KubeVela deletes the definitions and objects that the new package does not contain.

After `vela module deploy` prints the new tiers as `Healthy`, read the `definition.oam.dev/module-version` annotation on `module-aws-s3`. During the upgrade, `vela module deploy` and `vela status` can first show the tiers of the previous version as healthy.

:::caution
If the new package does not contain an API line, or disables it, KubeVela deletes the definitions and the auxiliary objects of that line. The objects that Applications already created from the line stay. But admission rejects every change to an Application that uses the line, and the Application has a `Parsed` condition that is false. The error names the missing definition, for example `trait definition of notes/v1/note not found` for a trait, or `WorkloadDefinition.core.oam.dev "aws-s3-v1-bucket" not found` for a component. Do not use only the Healthy line from `vela status`. An Application that still has a trait from that line printed Healthy with a green check, while `Parsed=False` and `Ready=False`. An Application whose component type is that line printed Healthy with a red cross and phase `rendering`. Move all Applications to the new line before you install such a package. For an example, see [Retire line v1](./module-crossplane.md#retire-line-v1).
:::

## Change the namespace of an install

1. Delete the installer Application:

   ```shell
   kubectl -n team-a delete application module-aws-s3-deploy
   ```

2. Wait until the owned Application is gone:

   ```shell
   kubectl -n vela-system get application module-aws-s3
   ```

3. Install the module in the new namespace.

## Uninstall a module

Delete the installer Application. KubeVela deletes the owned Application and all objects of the module, including the definitions.

```shell
kubectl -n team-a delete application module-aws-s3-deploy
```

Before you uninstall a module, move all Applications away from its definitions.

## Troubleshooting

| Error or symptom | Cause | What to do |
| --- | --- | --- |
| `module-as-component is disabled` | The feature gate is off. | Turn the gate on. See [Turn the feature on](./module-registry.md#turn-the-feature-on). |
| `cannot create object: namespaces "team-a" not found` | The install namespace does not exist. | Create the namespace, then install again. |
| `module registry "photos-store" not found; configured registries: catalog` | The registry name is wrong. | Use a name from `vela module registry list`. |
| `namespace is no longer accepted` | The component sets `namespace`. | Delete the property. Apply the installer Application in the namespace that you want. |
| `existing object Application vela-system/module-aws-s3 is managed by other application team-a/module-aws-s3-deploy` | The module is already installed from a different installer Application. | Use the install that exists, or uninstall it first. See [Change the namespace of an install](#change-the-namespace-of-an-install). |
| `resolves to module-backed definition` | The Application uses a one-part type. | Use `<module>/<apiVersion>/<capability>`. |
| `is ambiguous: definitions from modules [...] all match` | The Application uses a one-part type, and two definitions match. | Use `<module>/<apiVersion>/<capability>`. |
| `WorkloadDefinition.core.oam.dev "aws-s3-v1-bucket" not found` | The module is installed in a different namespace. | Install the module in the namespace of the Application, or in `vela-system`. |
| A tier stays unhealthy | KubeVela cannot apply an object in that tier. For example, the CRD of the object is missing. | Run `vela status module-<name> -n vela-system` and read the message of the tier. |
