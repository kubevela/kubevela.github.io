---
title: Module
---

`module` installs a versioned package of definitions into the cluster. The package lives in an OCI registry. An Application with `type: module` fetches one version of it and installs the definitions and the auxiliary objects that back them.

The component is off until you turn on the `EnableModuleComponent` feature gate. On a Helm install of vela-core:

```shell
helm upgrade vela-core kubevela/vela-core -n vela-system \
  --reuse-values \
  --set featureGates.enableModuleComponent=true
```

The controller then starts with `--feature-gates=EnableModuleComponent=true`. Without the gate, a `type: module` component fails at render with `module-as-component is disabled`.

For what a module contains, and how to author one, see [Modules](../../platform-engineers/module/intro.md).

## Register the registry

A module registry is an OCI registry that holds published module packages. `oci://` is a TLS registry. `http://` is a registry served without TLS. Add it once per cluster:

```shell
vela module registry add catalog oci://ghcr.io/myorg/modules
vela module registry list
```

When the cluster has one registry, `deploy` and a `type: module` component can leave `registry` empty and that registry is used. When more than one registry is configured, name the one you want. An empty `registry` is resolved when the module is fetched: the only configured registry, or the one named `catalog` if several exist.

A component that sets `registry` to a name this cluster does not have is rejected at apply, before the Application is stored. The error is on `properties.registry` and lists the names from `vela module registry list`:

```text
is not a configured module registry; configured: [catalog]
```

The same check rejects a name when the cluster has no module registries at all. A Git-backed registry is also rejected at apply. Modules are fetched from an OCI registry only. If the registry ConfigMap cannot be read, apply is allowed through and the fetch reports the problem later.

## Install with the CLI

`vela module deploy` writes an Application with one `type: module` component, applies it, and waits until the install tiers are healthy.

```shell
# Pin the package version. This is the OCI tag from the module's _module.cue,
# not an API line (v1, v2).
vela module deploy store --registry catalog --version 1.0.0

# Install into a namespace. Definitions land in this namespace.
vela module deploy store --registry catalog --version 1.0.0 -n team-a

# Print the Application and do not apply it.
vela module deploy store --registry catalog --version 1.0.0 --dry-run
```

Leave `--version` empty to install the highest published semver tag.

The command applies an Application named `module-<name>-deploy` in the target namespace. KubeVela then creates one owned Application, `module-<name>`, in `vela-system`. That owned Application is the install. Its annotation `definition.oam.dev/module-version` is the package version that was fetched.

## Install with an Application

The same install, written out for GitOps:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: module-store-deploy
  namespace: team-a
spec:
  components:
    - name: store
      type: module
      properties:
        module: store
        registry: catalog
        version: "1.0.0"
```

### Properties

| Name | Description | Required | Default |
| --- | --- | --- | --- |
| `module` | Module name. Must match `module` in the package's `_module.cue`. | no | the component name |
| `registry` | Name from `vela module registry add`. A name that is not configured is rejected at apply. | no | the only configured registry, or `catalog` when several exist |
| `version` | Package version, the OCI tag. Empty selects the highest published semver tag. This is not the API line. | no | `""` (latest) |

`namespace` is not a property. Setting it is rejected. Definitions install into the namespace of the Application that contains the `type: module` component.

```text
namespace is no longer accepted: a module's definitions install into the namespace of the Application that installs it
```

## What gets installed

For each enabled API line, the owned Application applies that line's auxiliary objects, then its definitions. A line with `enabled: false` in `_version.cue` is packaged but not installed.

Definitions are named `<module>-<apiVersion>-<capability>` and created in the installing Application's namespace. A module named `store` with a v1 component whose capability key is `bucket` installs `store-v1-bucket` in that namespace.

Check the install:

```shell
vela status module-store-deploy -n team-a
kubectl -n vela-system get application module-store \
  -o jsonpath='{.metadata.annotations.definition\.oam\.dev/module-version}{"\n"}'
kubectl -n team-a get componentdefinitions -l definition.oam.dev/module=store
```

`vela status` reports one tier per piece of the install, for example `store-aux`, `store-v1-aux`, and `store-v1-defs`. The module is ready when the installer Application is `running` and every tier is healthy.

## Use an installed definition

Refer to a capability with the three-part type `module/apiVersion/name`. The middle segment is the API line (`v1`, `v2`, `v1beta1`), and it must match `^v\d+(alpha\d+|beta\d+)?$`.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: photos
  namespace: team-a
spec:
  components:
    - name: photos
      type: store/v1/bucket
      properties:
        bucketName: photos
      traits:
        - type: store/v1/labeler
          properties:
            labels:
              team: platform
```

The Application has to live in a namespace that can see those definitions. A module installed into `team-a` does not resolve from `default`. Admission reports the definition name as not found.

A one-segment type such as `bucket` is the legacy form. It is accepted only when it matches exactly one definition. If two lines of the same module both provide `bucket`, admission rejects it:

```text
type "bucket" is ambiguous: definitions from modules [store] all match;
use {module}/{apiVersion}/{name} (Form 3) to disambiguate.
```

A two-segment type such as `v1/bucket` is rejected. Write `store/v1/bucket`.

## Change the package version

Publish the new package (`1.1.0` in `_module.cue`), then set `version` on the installer. The owned Application refetches that tag and reconciles. Lines that the new package enables are added. Lines it disables, and definitions it no longer contains, are removed.

```yaml
properties:
  module: store
  registry: catalog
  version: "1.1.0"
```

Confirm the running package with `definition.oam.dev/module-version` on `module-store`, not only with `vela status` of the installer. During the reconcile the previous tiers can still look healthy for a moment.

To move the install to another namespace, delete the installer Application and wait until `module-<name>` is gone, then install again in the new namespace. The definitions follow that Application.
