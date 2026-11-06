---
title: Modules
---

A module is a versioned package of KubeVela definitions, plus the auxiliary objects those definitions need at runtime. You publish the package to an OCI registry and install one version of it as an Application component. Consumers then use the definitions by API line (`v1`, `v2`, `v1beta1`), the same way a Kubernetes API group has versions that can exist side by side.

This is the module system that ships with the `type: module` component. It is alpha and off by default. Turn it on with the `EnableModuleComponent` feature gate, then follow [Install a module](../../end-user/components/module.md).

## Why modules

A definition is the contract an Application author binds to: the `type` string and the parameter schema behind it. Shipping that contract as loose files in an addon has two sharp edges.

- An addon upgrade replaces its definitions in place. A new required field, a renamed field, or a changed output lands on every consumer at once. There is no second copy of the contract to migrate toward.
- An addon version is a release number. It does not say whether `bucket` still accepts the same parameters it accepted last month. Pinning the addon does not give you a name for the contract.

A module splits those. The **package version** (`1.2.3`, the OCI tag) is what you publish and what an installer pins. The **API line** (`v1`, `v2`) is the contract. Breaking the parameter contract means adding a line, not editing the line consumers already use. `v1` and `v2` of the same capability install together, under different definition names, and an Application moves from one to the other by changing its `type`.

The module name is the package and the namespace of those names. Two modules can both offer a `v1` of `bucket`. The installed objects are `store-v1-bucket` and `backup-v1-bucket`, and an Application picks one with `store/v1/bucket` or `backup/v1/bucket`.

## Package layout

`vela module init` writes a skeleton that already parses.

```shell
vela module init store
```

```text
store/
  _module.cue
  README.md
  auxiliary/                 # objects shared by every API line
  v1/
    _version.cue
    auxiliary/               # objects used only by this line
    definitions/
      example.cue
```

`_module.cue` has two parsed fields. Anything else in the file is kept in the artifact for people reading the source and is not interpreted.

```cue
module:  "store"     // DNS-1123 label. Becomes the OCI repo name and the name prefix.
version: "1.0.0"     // strict semver, no leading v. This is the OCI tag.
```

Each directory at the module root whose name starts with `v` is an API line, and it must contain `_version.cue`.

```cue
apiVersion: "v1"     // ^v\d+(alpha\d+|beta\d+)?$  so v1, v2, v1beta1, v1alpha2
enabled:    true     // false: the line is packaged, and nothing from it is installed
```

`apiVersion` should match the directory name. Two directories that resolve to the same `apiVersion` are a parse error.

A definition file has a capability key and a `template`. The key is the capability name. The installed object is `<module>-<apiVersion>-<key>`.

```cue
"bucket": {
  type: "component"   // component, trait, policy, workflow-step, or workload
  attributes: workload: type: "autodetects.core.oam.dev"
  description: "Object storage bucket."
}

template: {
  parameter: bucketName: string
  output: {
    apiVersion: "v1"
    kind:       "ConfigMap"
    metadata: name: context.name
    data: bucket: parameter.bucketName
  }
}
```

`auxiliary/` holds plain YAML or CUE that the module needs beside its definitions: a ConfigMap, a Secret, a ServiceAccount, RBAC. Objects under the module-level `auxiliary/` install once for the whole module. Objects under `v1/auxiliary/` install only with the v1 line. CUE auxiliary is evaluated when the module is rendered.

A line with `enabled: false` still travels in the published artifact. Turning it on later is a new package version with that flag flipped. The render skips it until then, so a preview line can ship without becoming a type anyone can use.

## Publish

```shell
vela module registry add catalog oci://ghcr.io/myorg/modules

# Tag is the version field in _module.cue.
vela module publish ./store --registry catalog

# Show the target and the annotations, and do not push.
vela module publish ./store --registry catalog --dry-run
```

You can also pass the repository prefix directly:

```shell
vela module publish ./store oci://ghcr.io/myorg/modules
vela module publish ./store http://127.0.0.1:5000/modules
```

A published tag is immutable. The next change gets a new `version` in `_module.cue` and a new publish. `--version` on the command retags the push for a throwaway build and does not rewrite the version inside the artifact. `--force` overwrites a tag that is already there.

The registry record is cluster configuration, the same idea as an addon registry. `vela module registry` supports `add`, `update`, `list`, `get`, and `delete`. Use `oci://` for a TLS registry. Use `http://` only for a registry served without TLS. Credentials are stored for `oci://` registries (`--username` and `--password`, or `--password-stdin`) and are refused for `http://`.

An Application that names a registry is checked at apply against that list. An unknown name is rejected on `properties.registry`, and the message lists the registries that are configured (`is not a configured module registry; configured: [...]`). A Git-backed entry is rejected the same way, because a module package is an OCI artifact. Leaving `registry` empty skips that check. The fetch then uses the only configured registry, or the one named `catalog` when more than one exists.

## Install

An installer is an Application. `vela module deploy store --registry catalog --version 1.0.0 -n team-a` is the short form. The Application it writes is the form to commit:

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

That component fetches the package and renders an owned Application named `module-store` in `vela-system`. The owned Application applies auxiliary objects first and definitions last, per enabled line. Definitions are created in `team-a`, the namespace of the Application that installed the module, not in a namespace chosen by a property.

Consumers in `team-a` bind a line explicitly:

```yaml
type: store/v1/bucket
```

`store/v2/bucket` is a different definition and can be installed at the same time. A trait from another line of the same module is a normal trait reference, `type: store/v1/labeler`. Changing `version` on the installer moves the cluster to that package: newly enabled lines appear, and definitions the new package does not contain are removed.

The full install, status, and type-reference rules are in [Module component](../../end-user/components/module.md).

## Modules and addons

An addon can carry modules. The addon is still the thing an operator enables. The module is the package of definitions inside it. Both forms live under the addon's `modules/` directory, and both need `EnableModuleComponent`.

An inline module is authored in the addon. The directory is the same layout as a published module, and nothing is fetched:

```text
my-addon/
  metadata.yaml
  resources/
  modules/
    store/
      _module.cue
      v1/
        _version.cue
        definitions/
          bucket.cue
```

An imported module points at a package you already published. `modules/_imports.cue` lists one entry per module. Each entry becomes its own `type: module` component on the addon's Application.

```cue
imports: [{
  module: "store"
  sources: [{registry: "catalog", version: "1.0.0"}]
}, {
  module: "backup"
  enabled: false
  sources: [{registry: "catalog", version: "1.0.0"}]
}]
```

`enabled: false` skips that module. `registry` is a module registry name from `vela module registry add`. Omit `registry` when the cluster has a single module registry. `version` is the package tag.

The addon's own Application runs in `vela-system`. For an imported or inline module, the definitions still install into the namespace of the Application that enabled the addon. The addon renderer records that namespace, and the module component honors it only on an addon-owned Application.

Inline directories and `_imports.cue` can both be present. Every immediate subdirectory of `modules/` is an inline module and must contain `_module.cue`.
