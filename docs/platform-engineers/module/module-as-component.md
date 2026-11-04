---
title: Install a Module as a Component
---

:::caution
Module as a component is an alpha feature. It is disabled by default and must be turned on with the `EnableModuleComponent` feature gate, see [Enable the feature](#enable-the-feature).
:::

A [module](./intro.md) is installed with the `module` component type. You declare it as a component of an ordinary Application, and the Application controller fetches it from a module registry and installs its definitions and auxiliary objects. Everything the module installs is tracked by that Application.

The module package itself is always fetched from an OCI registry; Git is not supported as a module source. What you can keep in Git is the Application that installs it, with the module name, registry and version. GitOps tools such as Flux or Argo CD then reconcile that Application, and the controller pulls the module from the registry.

`vela module deploy` is a shortcut that writes and applies such an Application for you.

## Enable the feature

The `module` ComponentDefinition and its `vela/module` CUE package ship with the `vela-core` chart, but the render service is only active when the `EnableModuleComponent` feature gate is on. Set it through the chart:

```shell
helm upgrade --install vela-core kubevela/vela-core \
  -n vela-system --create-namespace \
  --set featureGates.enableModuleComponent=true
```

Or pass `--feature-gates=EnableModuleComponent=true` to the controller, see [Feature Gates](../system-operation/bootstrap-parameters.md#feature-gates).

With the gate off, a `type: module` component fails with:

```text
module-as-component is disabled; enable the EnableModuleComponent feature gate to use type: module components
```

Turning the gate off does not remove modules that are already installed.

## Quick start

Before you start, [add a module registry](./intro.md#add-a-module-registry) and [publish a module](./intro.md#publish-a-module) to it. The examples use a module named `demo-store`.

The smallest form uses the component name as the module name. The default registry is used and the highest published version is installed.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: demo-store-module
  namespace: vela-system
spec:
  components:
    - name: demo-store
      type: module
```

For anything that has to be reproducible, give the version and the registry explicitly:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: demo-store-module
  namespace: vela-system
spec:
  components:
    - name: demo-store
      type: module
      properties:
        module: demo-store
        registry: catalog
        version: "1.0.0"
```

Apply it and check the result:

```shell
kubectl apply -f demo-store-module.yaml
```

```shell
$ kubectl -n vela-system get applications
NAME                 COMPONENT          TYPE          PHASE     HEALTHY   STATUS
demo-store-module    demo-store         module        running   true      Ready:4/4
module-demo-store    demo-store-aux     k8s-objects   running   true
```

You get two Applications: the one you applied, and an Application named `module-demo-store` that the first one owns. The definitions are installed under their full names:

```shell
$ kubectl -n vela-system get componentdefinition,traitdefinition \
    -l definition.oam.dev/module=demo-store -o name
componentdefinition.core.oam.dev/demo-store-v1-bucket
componentdefinition.core.oam.dev/demo-store-v1-raw-config
componentdefinition.core.oam.dev/demo-store-v2-bucket
traitdefinition.core.oam.dev/demo-store-v1-labeler
```

Nothing is installed from the disabled `v1alpha1` line.

To remove the module, delete the Application that declares it:

```shell
kubectl -n vela-system delete application demo-store-module
```

## Parameters

| Field | Default | Description |
| --- | --- | --- |
| `module` | the component name | Name of the module to install. |
| `registry` | empty | Name of the module registry to fetch from. Empty uses the [default registry](./intro.md#the-default-registry). |
| `version` | empty | The module version, that is the tag it was published under. Empty resolves to the highest semver tag, which is not reproducible. Version ranges are not supported. This is not the API line: every enabled line of the version is installed. |

There is no `namespace` parameter. Where the module installs is decided by the Application, see [Choose the install namespace](#choose-the-install-namespace). A component that sets `namespace`, even to an empty value, is rejected at admission:

```text
spec.components[0].properties.namespace: Forbidden: namespace is no longer accepted:
  a module's definitions install into the namespace of the Application that installs it
```

## Choose the install namespace

A module's definitions, and its namespaced auxiliary objects that do not set their own namespace, are installed into the namespace of the Application that declares the `type: module` component:

| Application namespace | Definitions installed into | Usable by |
| --- | --- | --- |
| `vela-system` | `vela-system` | Applications in every namespace. |
| Any other, for example `team-a` | `team-a` | Applications in `team-a` only. |

Install a module from `vela-system` to share it with the whole cluster, or from a team's namespace to keep it to that team. Cluster-scoped objects, such as CRDs, are not affected. The `module-<module>` Application that holds the tiers always lives in `vela-system`, whichever namespace the module installs into.

## Install with `vela module deploy`

`vela module deploy` fetches and validates the module on the client, applies an Application named `module-<module>-deploy` with a single `type: module` component, and waits until every tier is healthy:

```shell
vela module deploy demo-store --registry catalog --version 1.0.0
```

| Flag | Description |
| --- | --- |
| `--registry` | The module registry. Empty uses the default registry. |
| `--version` | The module version to install. Empty installs the highest published version. |
| `-n`, `--namespace` | Namespace of the `module-<module>-deploy` Application, and therefore the namespace the module installs into. Defaults to `vela-system`. |
| `--dry-run` | Print the Application without applying it. |
| `--timeout` | How long to wait for the module to become healthy. Defaults to `5m`. |

While it waits, the command prints each tier of the module with its status, then `Module "demo-store" (version 1.0.0) is installed in namespace "vela-system"`.

To keep the install in Git, capture the Application manifest instead of applying it. The module is still fetched from the registry when the manifest is applied:

```shell
vela module deploy demo-store --registry catalog --dry-run > demo-store-module.yaml
```

## How it works

When the Application controller renders a `module` component, the `module` ComponentDefinition calls the `vela/module` CUE provider. The provider fetches the module from the registry, validates it, and returns an Application named `module-<module>` in `vela-system` as the component output.

That Application holds one `k8s-objects` component, a tier, per group of objects:

| Tier | Content | Depends on |
| --- | --- | --- |
| `<module>-aux` | The module's root `auxiliary/` objects. | |
| `<module>-<apiVersion>-aux` | The line's `auxiliary/` objects. | `<module>-aux` |
| `<module>-<apiVersion>-defs` | The line's definitions. | `<module>-<apiVersion>-aux`, or `<module>-aux` |

A tier is left out when it has no content, and a disabled line gets no tiers at all. The lines do not depend on each other, so `v2` never waits for `v1`.

```shell
$ kubectl -n vela-system get app module-demo-store \
    -o jsonpath='{range .spec.components[*]}{.name}{"\t"}{.dependsOn}{"\n"}{end}'
demo-store-aux
demo-store-v1-aux      ["demo-store-aux"]
demo-store-v1-defs     ["demo-store-v1-aux"]
demo-store-v2-defs     ["demo-store-aux"]
```

Each definition is installed as `<module>-<apiVersion>-<name>` and labeled with its identity:

| Label or annotation | Value |
| --- | --- |
| `definition.oam.dev/module` | The module name. |
| `definition.oam.dev/module-api-version` | The API line. |
| `definition.oam.dev/name` | The short name, as written in the module. |
| `definition.oam.dev/module-full-name` (annotation) | The full name, `<module>-<apiVersion>-<name>`. |

A name longer than 253 characters is shortened and given a hash suffix.

Other behavior of the component:

- The `module` component is only as healthy as the `module-<module>` Application. It reports `Ready:<healthy>/<total>` for its tiers and names the first unhealthy one.
- The `module-<module>` Application carries the `definition.oam.dev/module-version` annotation with the installed module version.
- It has a `module-state-keep` policy that turns apply-once off, so the definitions and auxiliary objects stay drift corrected. A definition that someone deletes is created again.
- A module is installed once per cluster. A second Application that installs the same module, also from another namespace, fails because `module-<module>` is already owned by the first one.

## Use the definitions of a module

Applications in any namespace use the definitions of a module installed into `vela-system`. A module installed from another namespace is only usable in that namespace. There are three ways to refer to a definition:

| Reference | Example | Resolves to |
| --- | --- | --- |
| `<module>/<apiVersion>/<name>` | `demo-store/v2/bucket` | Always that definition. Use this form. |
| The installed name | `demo-store-v2-bucket` | The same definition. |
| The short name | `bucket` | A definition with exactly that name if one exists outside any module. Otherwise the module definition whose short name it is, if exactly one matches. |

A short name stops working as soon as a second line or a second module installs a definition with the same short name. Write `<module>/<apiVersion>/<name>` in anything you keep.

The forms can be mixed, for example a `v2` component with a `v1` trait:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: photos
  namespace: default
spec:
  components:
    - name: photos
      type: demo-store/v2/bucket
      properties:
        bucketName: photos
        region: us-west-2
        class: premium
      traits:
        - type: demo-store/v1/labeler
          properties:
            labels:
              team: platform
```

These references are rejected:

| Reference | Error |
| --- | --- |
| A short name that matches more than one module definition, such as `bucket` | `type "bucket" is ambiguous: definitions from modules [...] all match; use {module}/{apiVersion}/{name} (Form 3) to disambiguate` |
| Two segments, such as `v1/bucket` | `two-segment references are not supported; expected either 1 segment (name, Form 1) or 3 segments (module/v<N>/name, Form 3)` |
| An API line that is not a version, such as `demo-store/1/bucket` | `"1" is not a valid API version; expected v<N>, v<N>alpha<N>, or v<N>beta<N> (e.g. v1, v1alpha1, v2beta2)` |
| A line that is disabled or not installed, such as `demo-store/v1alpha1/preview` | The definition `demo-store-v1alpha1-preview` is not found. |

The reference is resolved against the cluster on every render. A short name that was unique when you applied the Application can become ambiguous later, when another module is installed.

## Upgrade a module

Change `version` in the component. The new version replaces the old one in `module-<module>`:

- New definitions and new or changed auxiliary objects are applied.
- Definitions, tiers and auxiliary objects that the new version no longer has, for example the whole `v2` line after it is disabled, are garbage-collected. Objects that applications already created from those definitions are left alone, unless their CRD was removed with the module.
- Going back to the earlier version restores what it had.

When `version` is empty, the highest tag is resolved when the module is first installed. Publishing a newer version does not upgrade it: the module is fetched again only when the workflow of the Application that holds the `module` component runs again. To follow the registry, restart that workflow, or pin `version` and change it.

For `oci://` registries, the fetched module is cached in the controller by the digest of its tag. Pushing a tag again with `vela module publish --force` is picked up the next time the workflow runs.


## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `module-as-component is disabled` | Enable the `EnableModuleComponent` feature gate, see [Enable the feature](#enable-the-feature). |
| `no module registry is configured; add one with "vela module registry add"` | Add a registry, see [Add a module registry](./intro.md#add-a-module-registry). |
| `several module registries are configured and none is named "catalog"` | Set `registry` in the component, or name one registry `catalog`. |
| `module registry "<name>" not found` | The registry in `registry` is not configured. Check `vela module registry list`. |
| `module "<name>" is not published to this registry` | The module is not in the registry. Check the registry prefix and the module name. |
| `no semver tags found for OCI repository ...` | The repository has no version tags. Publish a version, or pin `version`. |
| `existing object Application vela-system/module-<name> is managed by other application ...` | The module is already installed by another Application. Remove that install first. |
| `type "<name>" is ambiguous` | Use `<module>/<apiVersion>/<name>`. |
| The component stays unhealthy | Look at the owned Application: `kubectl -n vela-system get app module-<name>`. The component status names the first unhealthy tier. |
