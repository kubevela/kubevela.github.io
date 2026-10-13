---
title: Modules
---

:::caution
Modules are an alpha feature. The `vela module` commands work without a feature gate, but installing a module into a cluster needs the `EnableModuleComponent` feature gate, see [Install a Module as a Component](./module-as-component.md#enable-the-feature).
:::

A module is a versioned package of X-Definitions, together with the Kubernetes objects those definitions need in the cluster, such as CRDs, Crossplane compositions or RBAC. It is published to an OCI registry and installed with the `module` component type.

## Modules and addons

An addon and a module can both ship definitions, but they are built for different jobs.

| | Addon | Module |
| --- | --- | --- |
| Purpose | Installs a system capability: operators, controllers, the UI, and the definitions that go with them. | Ships a set of definitions as a versioned contract that applications consume. |
| Content | `resources/`, `definitions/`, `schemas/`, `views/`, `config-templates/`, a `template.cue` and `parameter.cue`. | Definitions grouped by API line (`v1/`, `v2/`, ...), plus auxiliary objects. No parameters. |
| Definition names | The name the author gives them. | `<module>-<apiVersion>-<name>`, for example `demo-store-v1-bucket`. |
| Versions side by side | One version of each definition per cluster. | Several API lines of the same definition can be installed at once. |
| Registries | Git, Helm, object storage, OCI. | OCI only. |
| Installed with | `vela addon enable`, VelaUX, or a [`type: addon` component](../addon/addon-as-component.md). | `vela module deploy`, or a [`type: module` component](./module-as-component.md). |

The two work together. An addon can install the operators a module's definitions rely on, and import the module so it is applied after the addon's own resources. See [Use Modules in an Addon](./addon-with-modules.md).

## API lines

The definitions of a module are grouped into API lines, such as `v1`, `v1beta1` or `v2`. An API line is a parameter contract. A breaking change to a definition goes into a new line instead of replacing the old one, so `demo-store-v1-bucket` and `demo-store-v2-bucket` can be installed together and each application moves to `v2` on its own schedule.

The module version (`1.0.0`, `1.1.0`, ...) and the API line are independent. A new module version can add a definition to `v1`, change auxiliary objects, or turn a line off. It does not change the meaning of `v1`.

## Package layout

A module is a directory. Here is a module named `demo-store` with two enabled API lines and one disabled line:

```text
demo-store/
├── _module.cue
├── auxiliary/
│   └── 00-shared-config.yaml
├── v1/
│   ├── _version.cue
│   ├── auxiliary/
│   │   └── 10-rbac.yaml
│   └── definitions/
│       ├── bucket.cue
│       ├── labeler.cue
│       └── raw-config.yaml
├── v1alpha1/
│   ├── _version.cue
│   └── definitions/
│       └── preview.cue
└── v2/
    ├── _version.cue
    └── definitions/
        └── bucket.cue
```

### `_module.cue`

`_module.cue` sits at the module root and names the module. Two fields are read:

```cue
module:  "demo-store"
version: "1.0.0"
```

| Field | Required | Description |
| --- | --- | --- |
| `module` | Yes | The module name. It must be a DNS-1123 label. It becomes the OCI repository name, the first segment of every installed definition name, and the name of the module's Application, `module-<module>`. |
| `version` | Yes | The module version, in strict semver: `major.minor.patch`, with no leading `v`. It is the tag the module is published under. |

Other fields, such as the `description` and `owners` that `vela module init` writes, are ignored.

### API line directories

Each directory at the module root whose name starts with `v` is an API line. It must contain a `_version.cue` file:

```cue
apiVersion: "v1alpha1"
enabled:    false
```

| Field | Required | Description |
| --- | --- | --- |
| `apiVersion` | Yes | The API line. It must match `^v\d+(alpha\d+|beta\d+)?$`, for example `v1`, `v1alpha1` or `v2beta2`. Two directories cannot declare the same `apiVersion`. |
| `enabled` | No | Defaults to `true`. A disabled line is published with the module but nothing from it is installed. |

### Definitions

Each API line has a `definitions/` directory with at least one definition. Definitions of every kind (component, trait, policy, workflow step) can sit side by side. A file can be:

- A `.cue` file in the same format as `vela def` uses: a quoted name key with the definition's attributes, and a `template` block.
- A `.yaml` or `.yml` file holding a complete definition object.

```cue title="v1/definitions/bucket.cue"
"bucket": {
	type: "component"
	attributes: workload: type: "autodetects.core.oam.dev"
	description: "v1 of the bucket capability."
}

template: {
	output: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: name: context.name
		data: bucket: parameter.bucketName
	}

	parameter: {
		bucketName: string
		tier: *"standard" | "premium"
	}
}
```

Give a definition its short name, `bucket` here. When the module is installed, the definition is renamed to `<module>-<apiVersion>-<name>` (`demo-store-v1-bucket`). The short name must be a valid DNS-1123 subdomain of at most 63 characters, because it is also stored in a label.

### Auxiliary objects

The optional `auxiliary/` directory at the module root holds objects for every line, such as shared CRDs. The optional `auxiliary/` directory inside a line holds objects for that line only, such as a Crossplane composition that backs a `v1` definition.

- A `.yaml` or `.yml` file can hold several objects separated by `---`.
- A `.cue` file holds exactly one Kubernetes object at its root.

Files are read in file name order, and their objects keep that order. All auxiliary objects of one directory are applied together, so do not rely on the order between files. What is guaranteed is the order between directories: the root `auxiliary/` objects are applied before a line's `auxiliary/` objects, and those before the line's definitions, see [How it works](./module-as-component.md#how-it-works).

Every definition, and every namespaced object without `metadata.namespace`, is installed into the namespace of the Application that installs the module, see [Choose the install namespace](./module-as-component.md#choose-the-install-namespace). An object that sets its own `metadata.namespace` keeps it.

### Validation

A module is checked when it is published and again when it is fetched. Subdirectories inside `definitions/` and `auxiliary/` are ignored. Any other file type is rejected. Common errors:

| Error | Cause |
| --- | --- |
| `module declares no API lines` | No directory at the module root starts with `v`. |
| `parse line v1: read apiVersion: open v1/_version.cue: ...` | A line directory has no `_version.cue`. |
| `module name "Bad_Name" in _module.cue is invalid` | `module` is not a DNS-1123 label. |
| `version "1.0" in _module.cue is not a valid semver` | `version` is not `major.minor.patch`. |
| `apiVersion "version-one" in v1/_version.cue is invalid` | `apiVersion` does not match `v<N>`, `v<N>alpha<N>` or `v<N>beta<N>`. |
| `duplicate line "v1" (from directory v1-copy)` | Two directories declare the same `apiVersion`. |
| `v1/definitions: no such file or directory` | A line has no `definitions/` directory. |
| `unsupported definition file type: README.md` | A file in `definitions/` is not `.cue`, `.yaml` or `.yml`. |
| `unsupported auxiliary file type: notes.txt` | A file in `auxiliary/` is not `.cue`, `.yaml` or `.yml`. |
| `definition rendered from v1/definitions/noname.yaml has an empty metadata.name` | A YAML definition has no name. |

## Create a module

`vela module init` scaffolds a module with one `v1` line:

```shell
vela module init demo-store --path ./modules
```

It creates `_module.cue` (version `0.1.0`), a `README.md`, `v1/_version.cue`, a placeholder `v1/definitions/example.cue`, and empty `auxiliary/` and `v1/auxiliary/` directories. Rename `example.cue` to your capability and fill in the template.

## Add a module registry

Modules are stored in OCI registries, such as Amazon ECR, GitHub Container Registry or a self-hosted `registry:2`. Each module is its own repository, `<registry prefix>/<module>`, and each module version is a tag.

Module registries are configured separately from addon registries:

```shell
vela module registry add catalog oci://ghcr.io/my-org/modules
```

For a registry that needs credentials, read the password from stdin:

```shell
printf '%s' "$PASSWORD" | vela module registry add ghcr oci://ghcr.io/my-org/modules \
  --username robot --password-stdin
```

For Amazon ECR, the username is `AWS` and the password is the output of `aws ecr get-login-password`.

The URL must use `oci://`. `http://` is accepted for a registry served without TLS, but it cannot carry credentials. `https://` URLs, Helm chart repositories and Git repositories are rejected.

Manage the registries with:

```shell
vela module registry list
vela module registry get catalog
vela module registry update catalog oci://ghcr.io/my-org/modules-fork
vela module registry delete catalog
```

The registries are stored in the `vela-module-registry` ConfigMap in `vela-system`, and the token of each registry in a Secret named `module-registry-<name>`.

### The default registry

Where a registry name is optional, the default is chosen like this:

1. If only one module registry is configured, it is used.
2. Otherwise the registry named `catalog` is used.
3. Otherwise the command or component fails and asks you to name a registry.

No module registry is configured when KubeVela is installed. Add one before you publish or install a module.

## Publish a module

`vela module publish` validates the module, packages it, and pushes it under the `version` from `_module.cue`:

```shell
vela module publish ./modules/demo-store --registry catalog
```

Check the target and the annotations without pushing:

```shell
$ vela module publish ./modules/demo-store oci://registry.example.com/modules --dry-run
Would publish registry.example.com/modules/demo-store:1.0.0
  modules.oam.dev/enabled-lines: v1,v2
  modules.oam.dev/lines: v1,v1alpha1,v2
  modules.oam.dev/module: demo-store
```

You can also push straight to an OCI reference instead of a configured registry, for example an ECR repository prefix:

```shell
vela module publish ./modules/demo-store 123456789012.dkr.ecr.us-west-2.amazonaws.com/modules
```

| Flag | Description |
| --- | --- |
| `--registry` | The configured module registry to publish to. Empty uses the default registry. Cannot be combined with a positional OCI reference. |
| `--version` | Push under a different tag. It must be semver. The `version` inside `_module.cue` is not changed. |
| `--force` | Overwrite a version that is already published. |
| `--dry-run` | Print the target, the tag and the annotations without pushing. |
| `--username`, `--password`, `--password-stdin` | Registry credentials. Empty uses the docker credential chain. |

A published version is immutable. Publishing it again fails with `is already published; bump version in .../_module.cue and publish again, or pass --force to overwrite`. With ECR, create the repository first, because ECR does not create repositories on push.

The module is stored as a Helm chart artifact. Its annotations list every API line and the enabled ones, as the dry run above shows.

## Next steps

- [Install a Module as a Component](./module-as-component.md)
- [Use Modules in an Addon](./addon-with-modules.md)
