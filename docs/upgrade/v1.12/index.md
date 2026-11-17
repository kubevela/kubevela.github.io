---
title: Upgrade from v1.11 to v1.12
sidebar_label: v1.11 to v1.12
---

:::caution Unreleased
v1.12.0 is not released yet. This guide tracks the `release-1.12` branch and may change before
the GA release.
:::

Read the [v1.12.0 release notes](../../release-notes/v1.12/v1.12.0.md) before you upgrade. They
list the CRD, controller, chart and admission changes in this release, including the
[breaking changes](../../release-notes/v1.12/v1.12.0.md#breaking-changes).

## Config templates and configs

v1.12 turns config templates and configs into Kubernetes resources, `ConfigTemplate` and `Config`,
reconciled by the controller; see [Config Template](../../reference/config-template.md). Your v1.11
templates and configs keep working without changes.

1. Upgrade the CRDs first. v1.12 adds the `ConfigTemplate`, `Config` and `SourceDefinition` CRDs
   and changes several others, and Helm does not upgrade the CRDs in a chart's `crds/` directory:

```
helm repo update
helm pull kubevela/vela-core --version 1.12.0 --untar
kubectl apply --server-side --force-conflicts -f vela-core/crds/
```

2. Upgrade your kubevela chart:

```
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.12.0 --wait
```

3. Upgrade the `vela` CLI. An older CLI keeps working, but it writes v1.11 objects.

4. (Optional) Move your v1.11 templates and configs to the new resources with
   `vela config-template migrate`, or once at controller startup with the
   `AutoMigrateLegacyConfigs` feature gate. See
   [Migrate Configs to ConfigTemplate and Config](config-migration.md), which also covers rolling
   back.

Check these changes before you upgrade:

- **Users need permissions on the new resources.** The chart grants `config.oam.dev` permissions
  only to the controller, and Kubernetes' built-in `edit` and `admin` roles do not include them.
  Grant the people and service accounts that manage configs (and, with the
  `AuthenticateApplication` feature gate on, the users Applications run as) permissions on
  `configtemplates.config.oam.dev` and `configs.config.oam.dev`. In v1.11 they only needed
  permissions on Secrets and ConfigMaps.
- **`outputs` objects are created in the Config's namespace.** A Config writes its template's
  `outputs` objects into its own namespace, whatever namespace the template gives them. This
  applies to new Configs, including ones made from a v1.11 template that wrote objects into another
  namespace. Existing v1.11 configs are not changed, and migration reports one whose `outputs` are
  in another namespace as `conflict`.
- **New configs and templates are resources.** `vela config create` and
  `vela config-template apply` create `Config` and `ConfigTemplate` resources, and fail if the CRDs
  are not installed. The `create-config` workflow step creates a `Config` owned by the Application,
  waits until it is `Available`, and fails if the Config goes to `Error`.
- **`system` scope only in `vela-system`.** A template with `scope: "system"` can be applied only
  in `vela-system`; `vela config-template apply -f <file> -n <other namespace>` is refused. A v1.11
  template ConfigMap outside `vela-system` is treated as namespace-scoped, whatever its label says.
- **Using a template from another namespace needs permission.** A new Config may use a
  namespace-scoped template from another namespace only if the user creating it can `get` that
  ConfigTemplate. Existing v1.11 configs keep working, and migration records them as allowed. See
  [Scope](../../reference/config-template.md#scope-who-may-use-a-template).
- **The controller publishes to Nacos.** For a template with a `nacos` block, the controller, not
  the CLI, now publishes each Config. The controller's pods must be able to reach the Nacos server
  at the address in the endpoint config; in v1.11 only the machine running the CLI had to. The
  result is in the Config's `NacosSynced` condition: a publish the server refuses shows `False`
  with reason `PublishFailed`. Deleting a Config does not delete its Nacos entry.
- **Sensitive Nacos endpoints need a mark.** If the config that holds a Nacos server's address and
  credentials is sensitive, its owner must annotate it `config.oam.dev/nacos-endpoint: "true"`
  (the Config, or the v1.11 Secret if it was not migrated) before Configs can publish through it.
- **Sensitive rules are enforced.** A template's `sensitive` can be turned on, but not back off. A
  sensitive template takes properties only from a Secret (`propertiesFrom`); `vela config create`
  does this for you. A Config that reads its properties from a Secret is always sensitive, whatever
  its template says. A sensitive config's properties are never returned by `vela config` reads,
  the `read-config` and `list-config` workflow steps, or CueX; Applications can still mount its
  Secret. See [Sensitive templates](../../reference/config-template.md#sensitive-templates).

## Other checks before you upgrade

- **Trait conflicts.** Admission now rejects an Application whose traits conflict through
  `TraitDefinition.spec.conflictsWith`. Find such Applications first; see
  [Trait conflicts](../../release-notes/v1.12/v1.12.0.md#trait-conflicts).
- **Air-gapped clusters.** The chart applies the built-in definitions from hook Jobs. Mirror the Job
  image and set `builtinDefinitions.job.image.repository`; see
  [Built-in definitions](../../release-notes/v1.12/v1.12.0.md#built-in-definitions).
- **Argo CD.** Add `ignoreDifferences` for the webhook `failurePolicy`; see
  [Runtime certificates](../../release-notes/v1.12/v1.12.0.md#runtime-certificates).
- **Built-in definitions.** Some built-in definitions render a different Pod template in v1.12, so
  Pods of the affected Applications restart. Test them before you upgrade; each definition's
  parameters are in the [Reference](../../end-user/components/references.md) pages.
