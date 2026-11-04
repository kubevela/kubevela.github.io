---
title: Use Modules in an Addon
---

:::caution
This combines two alpha features. Both the `EnableAddonComponent` and the `EnableModuleComponent` feature gates must be on:

```shell
helm upgrade --install vela-core kubevela/vela-core \
  -n vela-system --create-namespace \
  --set featureGates.enableAddonComponent=true \
  --set featureGates.enableModuleComponent=true
```
:::

An [addon](../addon/intro.md) and a [module](./intro.md) solve different parts of the same problem. The addon installs a system capability: an operator, its CRDs, its controllers. The module ships the definitions that applications use on top of that capability, versioned by API line.

An addon can import modules. When the addon is installed as a [`type: addon` component](../addon/addon-as-component.md), every module it imports is installed with it, after the addon's own resources, and is removed with it. One Application manifest, which you can keep in Git, then describes the whole stack: the operator, the definitions, and the versions of both. The addon and the modules themselves are still fetched from their registries.

## Import a module

List the modules in a `modules/_imports.cue` file in the addon package:

```text
store-platform/
├── metadata.yaml
├── template.cue
├── parameter.cue
├── definitions/
│   └── platform-owner.cue
├── resources/
│   └── operator.yaml
└── modules/
    └── _imports.cue
```

```cue title="modules/_imports.cue"
imports: [{
	module: "demo-store"
	sources: [{
		registry: "catalog"
		version:  "1.0.0"
	}]
}]
```

| Field | Required | Description |
| --- | --- | --- |
| `module` | Yes | Name of the module. |
| `enabled` | No | Defaults to `true`. An import with `enabled: false` is skipped. |
| `sources` | Yes | Exactly one entry. |
| `sources[].registry` | No | Name of the [module registry](./intro.md#add-a-module-registry). Empty uses the [default registry](./intro.md#the-default-registry). |
| `sources[].version` | No | The exact module version. Empty resolves to the highest published version when the module is first installed. |
| `sources[].versions` | No | Accepted, but not enforced yet. Every enabled API line of the module is installed, and the controller logs a warning. |

The file is plain CUE. It is evaluated on its own, so it cannot refer to `parameter` or `context`. A module version therefore cannot be an addon parameter. It is fixed by the addon version.

Publish the addon as usual, for example with `vela addon push` to an [OCI addon registry](../addon/addon-oci-registry.md), and install it as a component:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: store-platform
  namespace: vela-system
spec:
  components:
    - name: store-platform
      type: addon
      properties:
        registry: my-addons
        version: "1.0.0"
```

## What gets installed

The install is a chain of three Applications. Each one owns the next and has its own ResourceTracker.

| Application | Namespace | Holds |
| --- | --- | --- |
| Your Application, for example `store-platform` | your choice | The `type: addon` component. |
| `addon-<addon>` | `vela-system` | The addon's resources and definitions, plus one `type: module` component per enabled import. |
| `module-<module>` | `vela-system` | The module's tiers: its auxiliary objects and definitions per API line. |

The module definitions are installed into the namespace of **your** Application, not into `vela-system` where `addon-<addon>` lives. The addon renderer records that namespace on `addon-<addon>` as the annotation `modules.oam.dev/install-namespace`, and every `type: module` component of the addon reads it from there. Install the addon from `vela-system` to make the module definitions available to the whole cluster, or from a team's namespace to keep them to that team. See [Choose the install namespace](./module-as-component.md#choose-the-install-namespace).

```shell
$ kubectl -n vela-system get app addon-store-platform \
    -o jsonpath='{range .spec.components[*]}{.name}{"\t"}{.type}{"\t"}{.dependsOn}{"\n"}{end}'
store-platform-resources   k8s-objects
demo-store                 module         ["store-platform-resources"]
addon-definitions          k8s-objects
```

Each import becomes a component named after the module, with the `module`, `registry` and `version` of the import as its properties. If the addon already has a component with that name, the generated one is named `<module>-2`, `<module>-3`, and so on.

The generated component depends on every component rendered from the addon's `resources/` directory, and on `addon-auxiliaries` when the addon's `template.cue` has `outputs`. The module's CRDs, compositions and definitions are therefore applied only after those components are healthy. A component built from YAML files in `resources/` is a `k8s-objects` component, which is healthy as soon as its objects are applied. It does not wait for an operator's Deployment to become ready. Components written directly in the addon's `template.cue`, including `resources/*.cue` files with a `package main` header that are merged into it, are not in that list.

The rest works as described in [How it works](./module-as-component.md#how-it-works) for a module, and in [How it works](../addon/addon-as-component.md#how-it-works) for an addon. A definition from the addon's `definitions/` directory keeps its own name. A definition from the module is installed as `<module>-<apiVersion>-<name>`. Applications use both:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: photos
  namespace: default
spec:
  components:
    - name: photos
      type: demo-store/v1/bucket        # from the module
      properties:
        bucketName: photos
      traits:
        - type: demo-store/v1/labeler   # from the module
          properties:
            labels:
              team: platform
        - type: platform-owner          # from the addon's definitions/
          properties:
            team: platform
```

Module definitions installed through an addon carry the `addons.oam.dev/name` label of the addon, not the module.

## Write the module component yourself

Instead of an import, the addon's `template.cue` can declare a `type: module` component directly. Use this when you want to choose the component's name or its `dependsOn` yourself:

```cue title="template.cue"
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: components: [{
		name: "tenant-store"
		type: "module"
		dependsOn: ["store-platform-resources"]
		properties: {
			module:   "demo-store"
			registry: "catalog"
			version:  "1.0.0"
		}
	}]
}
```

It installs into the namespace of the Application that installs the addon, like an imported module. It cannot set `namespace`. A component written in `template.cue` gets no automatic `dependsOn`, so set it yourself. If `_imports.cue` also lists the same module, the component in `template.cue` wins and the import is skipped.

## Upgrade

The addon version pins the module version. To move to a new module version, publish a new addon version whose `_imports.cue` names it, and change `version` in your `type: addon` component:

- A module version that adds a definition or changes an auxiliary object is applied in place.
- A module version that disables an API line removes that line's definitions and auxiliary objects.
- An addon version that drops an import removes the whole `module-<module>` Application, with its definitions, auxiliary objects and CRDs. Removing a CRD deletes every custom resource of that kind in the cluster.
- Going back to the earlier addon version restores what it had.

An import without `version` is resolved to the highest published module version when the addon is installed. A newer module version is fetched only when the workflow of the `addon-<addon>` Application runs again, not when your own Application's workflow runs again:

```shell
vela workflow restart addon-store-platform -n vela-system
```

## Ownership

Every addon and every module has one owner in the cluster:

- A second Application that installs the same addon fails with `existing object Application vela-system/addon-<addon> is managed by other application ...` until the first is deleted.
- A second addon that imports the same module fails with `existing object Application vela-system/module-<module> is managed by other application vela-system/addon-<first addon>`. Its other modules still install. When the first owner is gone, restart the workflow of the second `addon-<addon>` Application.
- If two modules ship a definition with the same short name, both are installed, because their full names differ. A short-name reference to it is then ambiguous and is rejected. Use `<module>/<apiVersion>/<name>`.

## Registries

Addons and modules are fetched from separate registries:

| | Addon registry | Module registry |
| --- | --- | --- |
| Configured with | `vela addon registry add` | `vela module registry add` |
| Stored in | ConfigMap `vela-addon-registry` | ConfigMap `vela-module-registry` |
| Types for components | Helm, OCI and object storage. Git, Gitee and GitLab are refused. | OCI only. |
| Default when no registry is named | Every configured addon registry except Git ones is searched. | The only registry, or the one named `catalog`. |
| Unknown registry name | Rejected at admission: `is not a configured addon registry`. | Fails at render: `module registry "<name>" not found`. |

The `registry` in `_imports.cue` is a module registry name. Configure the module registry in the cluster before you install the addon.

Both kinds can live in the same OCI registry under different prefixes, such as `oci://registry.example.com/addons` and `oci://registry.example.com/modules`. Each addon and each module is a repository named after it, so use separate prefixes to keep an addon and a module of the same name apart.

Deleting a registry does not remove anything that was installed from it.

## Use it next to `vela addon enable`

`vela addon enable` reads `modules/_imports.cue` but does not install the imports. It installs the addon without its modules. A `type: addon` component cannot take over an addon installed that way, and fails with `Application vela-system/addon-<addon> exists but not managed by any application now`. Run `vela addon disable <addon>` first, then apply the component.


## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| The addon's resources install, but the module component fails with `module registry "<name>" not found`, or the module or version is not found | The import names a registry, module or version that the module registry does not have. Fix `_imports.cue` and publish a new addon version. Nothing from the module is installed. |
| The `type: addon` component fails with `must declare exactly one sources[] entry` or `import missing required field "module"` | `_imports.cue` is invalid. Nothing from the addon is installed. |
| The `type: addon` component fails with `reference "parameter" not found` | `_imports.cue` refers to `parameter`. Use literal values. |
| `module-as-component is disabled` | The addon imports a module, so the `EnableModuleComponent` gate must also be on. |
| `several module registries are configured and none is named "catalog"` | The import has no `registry`. Name one in `_imports.cue`, or name one registry `catalog`. |
| `existing object Application vela-system/module-<module> is managed by other application ...` | Another addon or Application already installs the module. See [Ownership](#ownership). |
| The module stays at an old version | See [Upgrade](#upgrade). The module is fetched again only when the `addon-<addon>` workflow runs. |
