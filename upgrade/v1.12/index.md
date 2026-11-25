---
title: Upgrade from v1.11 to v1.12
sidebar_label: v1.11 to v1.12
---

:::caution Unreleased
v1.12.0 is not released yet. This guide tracks the `release-1.12` branch and may change before
the GA release. The commands use the latest pre-release, `1.12.0-alpha.2`; use `1.12.0` once it is
released.
:::

Read the [v1.12.0 release notes](/release-notes/v1.12/v1.12.0/) before you upgrade. They
list the CRD, controller, chart and admission changes in this release, including the
[breaking changes](/release-notes/v1.12/v1.12.0/#breaking-changes).

## Config templates and configs

v1.12 turns config templates and configs into Kubernetes resources, `ConfigTemplate` and `Config`,
reconciled by the controller; see [Config Template](/docs/next/reference/config-template/). Your v1.11
templates and configs keep working without changes.

1. Upgrade the CRDs first. v1.12 adds the `ConfigTemplate`, `Config` and `SourceDefinition` CRDs
   and changes several others, and Helm does not upgrade the CRDs in a chart's `crds/` directory:

   ```shell
   helm repo add kubevela https://kubevela.github.io/charts
   helm repo update
   helm pull kubevela/vela-core --version 1.12.0-alpha.2 --untar
   kubectl apply --server-side --force-conflicts -f vela-core/crds/
   ```

2. Upgrade your kubevela chart:

   ```shell
   helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.12.0-alpha.2 --wait
   ```

   :::caution
   Don't add `--reuse-values`. With the values of v1.11.0 or v1.11.1 the chart fails to render.
   With the values of v1.11.2 it renders but keeps the v1.11.2 image values, so the controller is
   not upgraded. Pass your own values file, or use `--reset-then-reuse-values` (Helm 3.14 and
   later), and make sure your values don't pin `image.tag`.
   :::

   Afterwards, check the image the controller runs:

   ```shell
   kubectl -n vela-system get deployment kubevela-vela-core \
     -o jsonpath='{.spec.template.spec.containers[0].image}'
   ```

3. Upgrade the `vela` CLI and VelaUX with the controller. Older clients drop fields new in v1.12
   when they write, and cannot edit a migrated config.

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
  [Scope](/docs/next/reference/config-template/#scope-who-may-use-a-template).
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
  Secret. See [Sensitive templates](/docs/next/reference/config-template/#sensitive-templates).

## Trait conflicts

Admission now rejects an Application when an attached trait conflicts with another trait through
`TraitDefinition.spec.conflictsWith`. KubeVela 1.11.0 accepted these Applications. An existing
Application with conflicting traits keeps working, and an update that leaves its spec alone is
admitted with a warning. The next change to its spec is refused until one of the conflicting traits
is removed. Find and fix such Applications before you upgrade.

This change was also backported to v1.11.1 ([#7303](https://github.com/kubevela/kubevela/pull/7303)).
On v1.11.1 and v1.11.2 every update of such an Application is refused, including label and
annotation changes.

## Runtime certificates

vela-core now manages the serving certificates for admission webhooks and cluster-gateway. At
startup, it:

- creates or reuses the certificate Secrets (`<fullname>-admission` and
  `<fullname>-cluster-gateway-tls-v2`);
- sets the `caBundle` on webhook configurations and the cluster-gateway `APIService`;
- checks the certificates every minute and renews them when needed.

The old `kube-webhook-certgen` Jobs are no longer used. Existing Secrets from those Jobs are reused
during an upgrade, so the CA does not change. This also prevents a deadlock with
`helm install --wait` on Kubernetes 1.36, where vela-core could wait for the `APIService` while Helm
waited to run the Job that set its `caBundle`.

vela-core manages each certificate when these chart values are set:

- admission webhook: `admissionWebhooks.enabled=true`, `admissionWebhooks.patch.enabled=true`, and
  `admissionWebhooks.certManager.enabled=false`;
- cluster-gateway: `multicluster.enabled=true`,
  `multicluster.clusterGateway.secureTLS.enabled=true`, and
  `multicluster.clusterGateway.secureTLS.certManager.enabled=false`.

If `admissionWebhooks.patch.enabled=false` and `admissionWebhooks.certManager.enabled=false`,
provide the `<fullname>-admission` Secret and the webhook `caBundle` yourself. Other
`admissionWebhooks.patch.*` settings only remain for compatibility with existing values files.

Tools that render without cluster access, such as Argo CD, render the webhook `failurePolicy` as
`Ignore`. vela-core sets the configured policy at runtime. Add `ignoreDifferences` entries in Argo CD
so it does not report drift:

```yaml
ignoreDifferences:
  - group: admissionregistration.k8s.io
    kind: MutatingWebhookConfiguration
    jqPathExpressions:
      - .webhooks[].failurePolicy
  - group: admissionregistration.k8s.io
    kind: ValidatingWebhookConfiguration
    jqPathExpressions:
      - .webhooks[].failurePolicy
```

This change was also backported to v1.11.1 ([#7477](https://github.com/kubevela/kubevela/pull/7477), backported
as [#7478](https://github.com/kubevela/kubevela/pull/7478)).

## Built-in definitions

Helm no longer owns the built-in definitions directly. Hook Jobs now manage them:

- A pre-upgrade Job adds `helm.sh/resource-policy=keep` to existing definitions. This keeps the
  definitions and their `DefinitionRevision` objects during the change in ownership.
- A post-install, post-upgrade, and post-rollback Job waits for the new controller, then applies
  the definitions with server-side apply.
- A pre-delete Job removes the definitions during `helm uninstall`.

For an air-gapped cluster, mirror these images by digest, along with vela-core and vela-cli:

- `alpine/k8s:1.34.13`, the Job image (`builtinDefinitions.job.image.*`);
- `oamdev/cluster-gateway:v1.10.0-alpha.1` (`multicluster.clusterGateway.image.*`);
- `ghcr.io/osscontainertools/kaniko:v1.29.1`, the default of the `build-push-image` step.

`oamdev/kube-webhook-certgen` is no longer pulled. These tags are the `release-1.12` values and
can change before the GA release.

The Job's chart values are listed under
[Helm chart changes](/release-notes/v1.12/v1.12.0/#helm-chart-changes) in the release notes. This
change was also backported to v1.11.1 ([#7436](https://github.com/kubevela/kubevela/pull/7436)).

Some built-in definitions render a different Pod template in v1.12, so Pods of the affected
Applications restart. Test them before you upgrade; each definition's parameters are in the
[Reference](/docs/next/end-user/components/references/) pages.

## Downgrading to v1.11

Do not use `helm rollback`: the v1.12 release no longer contains the built-in definitions (a hook
Job applies them), so the rollback fails on definitions the v1.11 release no longer owns. Do not
delete the admission webhook configuration by hand either.

Remove Applications that use v1.12-only features first, such as a definition that `extends`
another, `sources` or `forEach` steps.

Then use `hack/downgrade-from-1.12.sh` from the
[kubevela repository](https://github.com/kubevela/kubevela), at the tag you are running. It
downgrades the release to the v1.11 chart (1.11.2 unless you pass `--version`) with your values and
the v1.11 controller image, removes the admission webhooks only v1.12 serves (for
`SourceDefinition`, `Config`, `ConfigTemplate` and config Secrets), and checks the result:

```shell
# see what it would change
hack/downgrade-from-1.12.sh --dry-run
# downgrade the release "kubevela" in vela-system to the 1.11.2 chart
hack/downgrade-from-1.12.sh --version 1.11.2
```

It takes `--release`, `--namespace`, `--chart` (a chart reference or a local path) and
`--image-repository` (for a mirror), and needs `helm` and `kubectl` pointed at the cluster.

Without the script, upgrade to the 1.11.2 chart with your values file. Its hook Job puts back the
v1.11 built-in definitions, and Helm removes the webhooks only v1.12 serves:

```shell
helm upgrade kubevela kubevela/vela-core --version 1.11.2 -n vela-system -f <your values file> --wait
```

The CRDs and the `ConfigTemplate` and `Config` resources stay, but nothing reconciles them until
you upgrade again. For what happens to configs, see
[Rolling back to v1.11](config-migration.md#rolling-back-to-v111).
