---
title: Install an Addon as a Component
---

:::caution
Addon as a component is an alpha feature. It is disabled by default and must be turned on with the `EnableAddonComponent` feature gate, see [Enable the feature](#enable-the-feature).
:::

Addons are normally installed with `vela addon enable`, from the VelaUX console, or from a WorkflowRun. All of these run outside an Application, so an addon cannot be described in Git next to the applications that depend on it.

The `addon` component type removes that gap. You declare the addon as a component of an ordinary Application, and the Application controller resolves it from an addon registry and installs it. There is no new CRD and no extra controller to run. Everything the addon installs is tracked by the Application that declares it.

This helps when you want to:

- Manage addons declaratively and reconcile them with GitOps tools such as Flux or Argo CD.
- Install, upgrade and clean up an addon by changing or deleting one Application.
- Keep the same addon set and versions across environments.
- Test an application together with the addons it needs in a CI/CD pipeline.

The existing `vela addon` commands and the VelaUX console keep working. See [Use it next to `vela addon enable`](#use-it-next-to-vela-addon-enable).

## Enable the feature

The `addon` ComponentDefinition and its `vela/addon` CUE package ship with the `vela-core` chart, but the render service is only active when the `EnableAddonComponent` feature gate is on. Set it through the chart:

```shell
helm upgrade --install vela-core kubevela/vela-core \
  -n vela-system --create-namespace \
  --set featureGates.enableAddonComponent=true
```

Or pass `--feature-gates=EnableAddonComponent=true` to the controller, see [Feature Gates](../system-operation/bootstrap-parameters.md#feature-gates).

With the gate off, applying an Application that has a `type: addon` component is refused at admission:

```text
admission webhook "validating.core.oam.dev.v1beta1.applications" denied the request:
  1) "schematic": addon-as-component is disabled; enable the
     EnableAddonComponent feature gate to use type: addon components.
```

## Quick start

The smallest form uses the component name as the addon name. The registry is searched for the addon and the latest stable version is installed.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: kubevela-io-addon
  namespace: vela-system
spec:
  components:
    - name: kubevela-io
      type: addon
```

For anything that has to be reproducible, give the version and the registry explicitly:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: fluxcd-addon
  namespace: vela-system
spec:
  components:
    - name: fluxcd
      type: addon
      properties:
        addon: fluxcd
        version: "3.0.2"
        registry: KubeVela
        properties: {}
```

Apply it and check the result:

```shell
kubectl apply -f fluxcd-addon.yaml
```

```shell
$ kubectl -n vela-system get applications
NAME               COMPONENT   TYPE          PHASE     HEALTHY   STATUS
addon-fluxcd       fluxcd-ns   k8s-objects   running   true      Ready:1/1
fluxcd-addon       fluxcd      addon         running   true
```

You get two Applications: the one you applied (`fluxcd-addon`), and an inner Application named `addon-fluxcd` that the first one owns.

To remove the addon, delete the Application that declares it:

```shell
kubectl -n vela-system delete application fluxcd-addon
```

## Parameters

| Field | Default | Description |
| --- | --- | --- |
| `addon` | the component name | Name of the addon to install. |
| `version` | empty | An exact addon version. Empty resolves to the latest stable version, which is not reproducible. Version ranges such as `>=2.0.0` are not supported. |
| `registry` | empty | Name of the addon registry to resolve the addon from. Empty searches the configured registries. |
| `properties` | `{}` | The addon's own parameters. They are passed to the addon's templates, so the keys are whatever the addon's `parameter.cue` declares. |
| `skipVersionValidation` | `false` | Skip the check of the addon's `vela` and `kubernetes` system requirements. |

Here is an example that passes parameters to the addon:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: velaux-addon
  namespace: vela-system
spec:
  components:
    - name: velaux
      type: addon
      properties:
        addon: velaux
        version: "v1.9.5"
        registry: KubeVela
        properties:
          serviceType: NodePort
          nodePort: 30080
          replicas: 1
```

## How it works

When the Application controller renders an `addon` component, the `addon` ComponentDefinition calls the `vela/addon` CUE provider. The provider resolves the addon from the registry, renders it, and returns the addon's own Application as the component output. The component therefore owns an inner Application, named `addon-<addon name>`.

The inner Application holds the addon's `resources/` components, plus one `k8s-objects` component for each category of auxiliary content the addon ships:

| Component | Content |
| --- | --- |
| `addon-definitions` | The addon's X-Definitions. |
| `addon-config-templates` | Config templates. |
| `addon-schemas` | UI schemas. |
| `addon-views` | VelaQL views. |
| `addon-secret` | The Secret that holds the addon's arguments. It is only rendered when `properties` is not empty. |
| `addon-auxiliaries` | Other objects the addon template outputs. |

A category that the addon has no content for is left out.

```shell
$ kubectl -n vela-system get app addon-fluxcd \
    -o jsonpath='{range .spec.components[*]}{.name}{"\t"}{.type}{"\n"}{end}'
fluxcd-ns                            k8s-objects
fluxcd-rbac                          k8s-objects
fluxcd-CRD                           k8s-objects
fluxcd-helm-controller               webservice
fluxcd-source-controller             webservice
addon-definitions                    k8s-objects
addon-config-templates               k8s-objects
addon-schemas                        k8s-objects
```

Because the definitions are components of the inner Application, they carry its tracking label and are restored if something removes them. This is different from `vela addon enable`, where definitions are applied outside of the Application and are not reconciled.

```shell
$ kubectl get componentdefinition,traitdefinition -A -l app.oam.dev/name=addon-fluxcd
$ kubectl -n flux-system delete traitdefinition kustomize-patch
# The definition reappears within one --application-re-sync-period.
```

Other behavior of the component:

- The `addon` component is only as healthy as the inner Application. It reports `Ready:<healthy>/<total>` for the inner Application's components and names the first unhealthy one.
- An addon version can change in the registry while your Application stays the same, for example when a tag is pushed again. For this reason every workflow run applies the rendered addon again.
- An addon that declares no `apply-once` policy of its own gets an implicit `addon-component-state-keep` policy that turns apply-once off, so its resources stay drift corrected. An addon that declares its own policy keeps it.
- The inner Application is labeled `addons.oam.dev/registry` with the registry the addon was resolved from.
- Rendered results for an addon with an exact `version` are cached in the controller process, and concurrent renders of the same addon are collapsed into one. Rendering with an empty `version` is never cached, so a newly published version is picked up.

## Version and compatibility

Pin `version` to an exact value. The controller resolves exactly that version from the registry, without relying on the latest release.

Before rendering, the addon's `system requirements` (the `vela` and `kubernetes` versions declared in its `metadata.yaml`) are checked against the cluster. The same check also runs when the Application is admitted, so an incompatible addon is rejected when you apply it instead of failing later in the controller. The admission check passes when it cannot decide, for example when the registry is unreachable. Only a real compatibility mismatch is rejected.

Set `skipVersionValidation: true` to bypass the check. Use it only when a declared requirement is wrong for your cluster.

## Install modules with an addon

An addon can import [modules](../module/intro.md) with a `modules/_imports.cue` file. When the addon is rendered through the `addon` component, each enabled import is added to the inner `addon-<name>` Application as a `type: module` component that depends on the addon's own `resources/` components. The module's CRDs and definitions are therefore applied only after those components are healthy. This also needs the `EnableModuleComponent` feature gate.

See [Use Modules in an Addon](../module/addon-with-modules.md).

## Use it next to `vela addon enable`

Both ways to install an addon can live in the same cluster, as long as they manage different addons. An addon can only have one installer. `vela addon enable` and a `type: addon` component both create the `addon-<name>` Application, so the one applied second fails the pre-dispatch dry run with an error like this:

```text
existing object Application vela-system/addon-<name> is managed by other application ...
```

Disable the imperative install with `vela addon disable <name>` before you convert an addon to a component.

Addon packaging and the registry layout do not change. An addon published for `vela addon enable` can be installed as a component without modification.

## Use an addon from an OCI registry

Registries of type `oci` can serve addons to the `addon` component, see [Use an OCI Registry for Addons](./addon-oci-registry.md).

## Limitations

The following are not supported in the current implementation:

- Version ranges such as `>=2.0.0` or `~8.0` are not resolved. `version` is an exact version.
- You cannot install part of an addon. There is no `include` parameter to select only its definitions or only its resources.
- Dependencies between addons are not resolved. If an addon needs another addon, declare both as components of your Application and order them yourself, for example with `dependsOn`.
- You cannot override the namespaces an addon installs into. Its resources go to the namespaces the addon defines.
- There is no Addon CRD or addon controller. Drift correction is the regular Application behavior.
- The name `addon-<name>` is not reserved. Nothing stops a regular Application with that name from colliding with the inner Application of an addon.
- There is no addon specific way to place the addon's resources on different clusters. See [Deploy components to different clusters](../../end-user/workflow/built-in-workflow-defs.md#deploy-components) for the `deploy-components` workflow step, which targets individual components with topology policies.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| The Application is rejected with `addon-as-component is disabled` | Enable the `EnableAddonComponent` feature gate, see [Enable the feature](#enable-the-feature). |
| The Application is rejected because the addon is incompatible | The cluster does not meet the addon's `vela` or `kubernetes` requirements. Choose another addon version, or set `skipVersionValidation: true` if the requirement is wrong for your cluster. |
| `existing object Application vela-system/addon-<name> is managed by other application` | The addon is already installed with `vela addon enable`, or by another Application. Disable it first. |
| `addon "<name>" not found in registries [...]` | The addon is not in the registry that was named, or in any configured registry when `registry` is empty. Check it with `vela addon list`. |
| The component stays unhealthy | Look at the inner Application: `kubectl -n vela-system get app addon-<name>`. The component status names the first unhealthy component. |
