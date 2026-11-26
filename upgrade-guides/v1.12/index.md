---
title: Upgrade from v1.11 to v1.12
sidebar_label: v1.11 to v1.12
---

:::caution Unreleased
v1.12.0 is not released yet. This guide tracks the `release-1.12` branch and may change before
the GA release. The commands use the latest pre-release, `1.12.0-alpha.2`; use `1.12.0` once it is
released.
:::

Read the [v1.12.0 release notes](../../release-notes/v1.12/v1.12.0.md) before you upgrade. They
list the CRD, controller, chart and admission changes in this release, including the
[breaking changes](../../release-notes/v1.12/v1.12.0.md#breaking-changes). If you run a v1.12
pre-release, read the release notes of each later release as well: this page does not list what
changed between pre-releases.

Read this page through before you start: a few steps have to happen **before** `helm upgrade`, and
some changes only show up on the first edit of each Application afterwards. As with any upgrade,
rehearse it on a copy of your cluster first.

## Check your cluster first

`hack/preupgrade-check-1.12.sh`, in the [kubevela repository](https://github.com/kubevela/kubevela),
reads your v1.11 cluster and lists what v1.12 would refuse or treat differently, each with the
object, the problem, the fix and the section of this page that covers it. It only reads: `kubectl get`
and `list`, `helm get values` and `helm list`. Run it before you upgrade, and again after you fix what
it finds:

```shell
curl -fsSLO https://raw.githubusercontent.com/kubevela/kubevela/master/hack/preupgrade-check-1.12.sh
bash preupgrade-check-1.12.sh
```

It needs `kubectl` pointed at the cluster and `jq`. With `helm` installed it also reads the release's
values, and judges what v1.12 will do with them: the feature gates, `controllerArgs`,
`workflow.http.maxTimeout`, `workflow.httpDeny` and `definitionRestrictions`, each falling back to the
v1.12 default. Upgrade with that same values file. Without `helm` it uses the gates the controller runs
with now. It takes `--release` and `--namespace` (default `kubevela` in `vela-system`), `--json` for
machine-readable output, `-q` for the summary line alone and `-v` to list every check. It exits `0`
when it finds no errors, `1` when it does, and `2` when it cannot run.

The HTTP check reads the deny list ConfigMaps the controller reads, and the host of a `webhook` or
`notification` URL kept in a Secret (only the host, never the rest of the value; a Secret it may not
read is listed as unchecked). `--resolve` also looks hostnames up and checks their addresses. It
resolves them from your machine, not from the cluster, so a name that only the cluster's DNS knows is
not resolved.

| Level | What it finds |
| --- | --- |
| error | Applications whose traits [conflict](#trait-conflicts), including through a pinned `type@vN` revision |
| error | Release values that pin `image.tag` or the cluster-gateway image tag |
| error | `helmchart` `valuesFrom` and chart credentials, config steps and Terraform module SSH keys outside the namespace v1.12 reads them from |
| error | `request`, `webhook` and `notification` steps calling addresses the HTTP guard refuses, or with a timeout it refuses |
| error | `vela-cli` steps outside the namespaces `definitionRestrictions` allows (`vela-system` by default) |
| error | Global policies outside `vela-system`, and `policy.oam.dev/skip-global`, with `enableGlobalPolicies` and `enableApplicationScopedPolicies` on |
| warn | `resource` traits that set only `cpu` or only `memory`, which v1.11 ignored and v1.12 applies |
| warn | v1.11 [configs and templates](#config-templates-and-configs) that need RBAC, a new home or a Nacos mark |
| warn | Applications using a definition whose `definition.oam.dev/restrict-namespaces` annotation or `definitionRestrictions` entry leaves out their namespace, and definitions whose annotation is not a valid pattern |
| warn | Anything above that your v1.11 release already refuses, because the change was backported to it (v1.11.1 or v1.11.2) |
| info | The CRDs to apply, `--reuse-values`, cert-manager, Argo CD, the images to mirror, and the custom step definitions to [vet](#2-check-applications-and-step-definitions-against-the-new-admission-rules) |

An error is something that breaks on v1.12: an update it refuses, a step that fails, a policy that
stops applying. A warning keeps working but behaves differently, or is already broken on the version
you run, with the same fix. Info is worth knowing on any cluster.

The check reads what it can see statically. It does not compile definitions, render Applications or
read Secret values, so it cannot tell you which built-in definition changes restart a workload, or
what a step returns when it runs. Work through the rest of this page as well.

## Before you upgrade

Do these in order.

### 1. Apply the v1.12 CRDs, server side

v1.12 adds the `ConfigTemplate`, `Config` and `SourceDefinition` CRDs and changes several others,
and Helm does not upgrade the CRDs in a chart's `crds/` directory. Without them the new controller
crash-loops while the v1.11 pods keep serving.

```shell
helm repo remove kubevela 2>/dev/null || true
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm pull kubevela/vela-core --version 1.12.0-alpha.2 --untar
kubectl apply --server-side --force-conflicts -f vela-core/crds/
```

Every line should say `serverside-applied`. Helm owns the fields of the CRDs it installed, so a
server-side apply without `--force-conflicts` reports conflicts instead of applying.

If you already upgraded without this step, apply the CRDs now and run the same `helm upgrade` again.

### 2. Check Applications and step definitions against the new admission rules

v1.12 validates more on admission. An update that leaves an object's spec as it is (a label,
`publishVersion`, an identical `kubectl apply`, a GitOps sync of an unchanged manifest) is not
refused for problems the stored object already had, so objects v1.11 accepted do not wedge; they
come back as admission warnings instead. A **change to the spec** has to pass the new rules, so fix
these before your next spec change:

- Applications with two traits that conflict (one lists the other in `conflictsWith`, directly or
  through `extends`): remove one of the pair. See [Trait conflicts](#trait-conflicts).
- Custom WorkflowStepDefinitions: run `vela def vet` with the v1.12 CLI and fix any that do not
  compile. v1.11 marked such a step `Succeeded` **without running it**; v1.12 refuses it at
  admission and fails it at run time. Re-run the workflows that use them on a staging cluster.

### 3. Upgrade the chart

```shell
helm upgrade -n vela-system --install kubevela kubevela/vela-core --version 1.12.0-alpha.2 --wait
```

:::caution
Don't add `--reuse-values`. With the values of v1.11.0 or v1.11.1 the chart fails to render.
With the values of v1.11.2 it renders but keeps the v1.11.2 image values, so the controller is
not upgraded. Pass your own values file, or use `--reset-then-reuse-values` (Helm 3.14 and
later), and make sure your values don't pin `image.tag`.
:::

If your values pin `image.tag` or `image.repository`, the pin survives the upgrade and the
controller stays on v1.11. Drop the pin, or pass `--set image.tag=v1.12.0-alpha.2`. Afterwards,
check the image the controller runs:

```shell
kubectl -n vela-system get deployment kubevela-vela-core \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
```

Two chart defaults are stricter in v1.12:

- **Global policies (alpha).** `controllerArgs.allowNamespaceGlobalPolicies` and
  `controllerArgs.allowSkipGlobalPolicies` default to `false` in v1.12, where v1.11.x defaulted
  them to `true`. If you never set them, the upgrade takes the new defaults: global policies apply
  only from `vela-system`, and the `policy.oam.dev/skip-global` annotation is refused. Each flag
  keeps one of those: set `allowNamespaceGlobalPolicies: true` to keep global policies from other
  namespaces, and `allowSkipGlobalPolicies: true` to keep the skip annotation. Set both for the
  full v1.11 behaviour.
- **`addon` and `vela-cli` are restricted to `vela-system`.** The chart's `definitionRestrictions`
  lets only Applications in `vela-system` use the `addon` component type and the `vela-cli`
  workflow step. To allow other namespaces, list them, keeping `vela-system`:

  ```shell
  --set 'definitionRestrictions.overrides.vela-cli.namespaces={vela-system,platform}'
  ```

For an air-gapped cluster, mirror the new images first; they are listed under
[Built-in definitions](#built-in-definitions).

### 4. Upgrade every client

Upgrade the `vela` CLI and VelaUX with the controller. Older clients drop fields new in v1.12 when
they write (for example, `vela workflow rollback` from a v1.11 CLI removes `spec.sources`), and
are refused when they write a migrated config (see
[Config templates and configs](#config-templates-and-configs)).

### 5. Do not edit built-in definitions in place

The upgrade replaces the built-in definitions in `vela-system`. An in-place edit to one is reverted
without a warning: an added parameter disappears and is ignored from then on. Customise a built-in
with your own definition, or with `extends`.

## Right after the upgrade

- **Every workload is applied once.** The v1.12 controller adds `owner.oam.dev/*` labels and a new
  render hash to every workload it manages, on managed clusters too. Each workload's `generation`
  goes up by one with an identical pod template, so nothing restarts, but it is an apply wave the
  size of your fleet, and drift tools watching `generation` will report a change everywhere.
- **Helm components on managed clusters move themselves.** v1.11 installed a `helmchart` component
  placed on a managed cluster on the hub as well, and dispatched its objects to the managed cluster
  without Helm's ownership metadata. On the first workflow run after the upgrade, v1.12 adopts those
  objects into the release on the managed cluster, removes the placeholder release Secrets v1.11
  copied there, and then uninstalls the copy left on the hub. An Application that is not edited
  keeps its hub copy until its next run; to move it now, run
  `vela workflow restart <app> -n <namespace>`. With authentication enabled, the uninstall runs as
  the Application's user, who needs the rights to remove the chart's objects on the hub.
- **ApplicationRevisions** snapshot trait and step definitions only when the Application's spec
  changes, so each Application's latest revision renders with the **current** definitions,
  including on a rollback to it.
- **Webhook certificates:** an upgraded certificate Secret has no `ca.key`, so the first renewal
  rotates the CA. Natural rotation has no gap; do not replace the webhook certificate Secret by
  hand, which leaves admission failing closed for several seconds.

## Config templates and configs

v1.12 turns config templates and configs into Kubernetes resources, `ConfigTemplate` and `Config`,
reconciled by the controller; see [Config Template](/docs/next/reference/config-template/). Your v1.11
templates and configs keep working without changes.

(Optional) Move your v1.11 templates and configs to the new resources with
`vela config-template migrate`, or once at controller startup with the
`AutoMigrateLegacyConfigs` feature gate. See
[Migrate Configs to ConfigTemplate and Config](config-migration.md), which also covers rolling
back. If a GitOps tool applies your configs, commit the migrated `ConfigTemplate` and `Config`
resources to its repository, or it may revert the migration; see
[GitOps](config-migration.md#gitops).

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
  with reason `PublishFailed`. A Nacos outage shows only there, after the next write, not in the
  Config's phase or in `vela config list`, so monitor that condition. Deleting a Config does not
  delete its Nacos entry.
- **Sensitive Nacos endpoints need a mark.** If the config that holds a Nacos server's address and
  credentials is sensitive, its owner must annotate it `config.oam.dev/nacos-endpoint: "true"`
  (the Config, or the v1.11 Secret if it was not migrated) before Configs can publish through it.
- **Sensitive rules are enforced.** A template's `sensitive` can be turned on, but not back off. A
  sensitive template takes properties only from a Secret (`propertiesFrom`); `vela config create`
  does this for you. A Config that reads its properties from a Secret is always sensitive, whatever
  its template says. A sensitive config's properties are never returned by `vela config` reads,
  the `read-config` and `list-config` workflow steps, or CueX; Applications can still mount its
  Secret. See [Sensitive templates](/docs/next/reference/config-template/#sensitive-templates).
- **Editing a legacy config migrates it.** `vela config create` on the name of an existing legacy
  config adopts it into a `Config` first, then applies your change. If it cannot be adopted (a
  `Config` of that name exists that migration did not create, or the config opted out of
  migration), the command fails and says why.
- **Older clients cannot write a migrated config.** A v1.11 CLI or VelaUX 1.9 editing a migrated
  config is refused with a message naming the `Config`. Upgrade the client, or edit the `Config`.
- **Addon config templates and VelaUX projects.** Migrating a template that lives in `vela-system`,
  which includes every addon's templates (`image-registry`, `helm-repository` and others), makes it
  a system-scope `ConfigTemplate`. Configs can still use it from any namespace, but VelaUX's project
  config pages list only namespace-scoped templates, so it no longer appears there. If your projects
  create configs from addon templates in VelaUX, leave those templates unmigrated; configs on an
  unmigrated template can still be edited in VelaUX.
- **Which configs a workflow can reach.** The config workflow steps (`read-config`, `list-config`,
  `create-config`, `delete-config`) and the `vela-config` source work on configs in the
  Application's own namespace, and can read shared system configs (in `vela-system`, or on a
  system-scope template) from anywhere. Anything else needs the `AuthenticateApplication` feature
  gate and RBAC for the Application's user.
- After enabling `AutoMigrateLegacyConfigs`, check for Warning events with reason `MigrationFailed`
  or `MigrationConflict` on legacy config Secrets: the sweep reports problems only there and in the
  controller log. Its `kubevela_config_migration_total{result="adopted"}` metric can read 0 after
  successful adoptions. Malformed legacy configs are not shown by `vela config list`.
- Delete sensitive configs with `vela config delete`. Deleting the `Config` any other way (VelaUX,
  `kubectl`, a GitOps prune) leaves its `<name>-properties` Secret, with the values in it.
- Deleting a config template that configs still use is not refused; those configs go to `Error` and
  can only be deleted.
- A distributed config is a copy taken when it is distributed. Changes reach the target clusters
  only when you distribute it again. Deleting a config in VelaUX leaves its distribution and the
  copies; delete the distribution first.

## Trait conflicts

Admission now rejects an Application when an attached trait conflicts with another trait through
`TraitDefinition.spec.conflictsWith`. KubeVela 1.11.0 and earlier accepted these Applications. An existing
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
during an upgrade, so the CA does not change.

vela-core manages each certificate when these chart values are set:

- admission webhook: `admissionWebhooks.enabled=true`, `admissionWebhooks.patch.enabled=true`, and
  `admissionWebhooks.certManager.enabled=false`;
- cluster-gateway: `multicluster.enabled=true`,
  `multicluster.clusterGateway.secureTLS.enabled=true`, and
  `multicluster.clusterGateway.secureTLS.certManager.enabled=false`.

If `admissionWebhooks.patch.enabled=false` and `admissionWebhooks.certManager.enabled=false`,
provide the `<fullname>-admission` Secret and the webhook `caBundle` yourself. Other
`admissionWebhooks.patch.*` settings only remain for compatibility with existing values files.

Tools that render the chart without cluster access, such as `helm template` or a GitOps tool that
applies rendered manifests, render the webhook `failurePolicy` as `Ignore`. vela-core sets the
configured policy at runtime, so such a tool can report drift on that field. Tell it to ignore
`.webhooks[].failurePolicy`. For Argo CD, add these `ignoreDifferences` entries:

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

This change was also backported to v1.11.1, v1.10.10 and v1.9.15
([#7477](https://github.com/kubevela/kubevela/pull/7477), backported as
[#7478](https://github.com/kubevela/kubevela/pull/7478),
[#7479](https://github.com/kubevela/kubevela/pull/7479) and
[#7480](https://github.com/kubevela/kubevela/pull/7480)). If you upgrade from one of those releases,
nothing changes here.

## Built-in definitions

Helm no longer owns the built-in definitions directly. Hook Jobs now manage them:

- A pre-upgrade Job adds `helm.sh/resource-policy=keep` to existing definitions. This keeps the
  definitions and their `DefinitionRevision` objects during the change in ownership.
- A post-install, post-upgrade, and post-rollback Job waits for the new controller, then applies
  the definitions with server-side apply.
- A pre-delete Job removes the definitions during `helm uninstall`.

For an air-gapped cluster, mirror these images, along with vela-core and vela-cli:

- `alpine/k8s:1.34.13`, the Job image (`builtinDefinitions.job.image.*`);
- `oamdev/cluster-gateway:v1.10.0-alpha.1` (`multicluster.clusterGateway.image.*`);
- `ghcr.io/osscontainertools/kaniko:v1.29.1`, the default of the `build-push-image` step.

`oamdev/kube-webhook-certgen` is no longer pulled. These tags are the `release-1.12` values and
can change before the GA release.

The Job's chart values are listed under
[Helm chart changes](../../release-notes/v1.12/v1.12.0.md#helm-chart-changes) in the release notes. This
change was also backported to v1.11.1 ([#7436](https://github.com/kubevela/kubevela/pull/7436)).

### Changes to built-in definitions

Some built-in definitions render a different Pod template in v1.12, so Pods of the affected
Applications restart. Test them before you upgrade; each definition's parameters are in the
[Reference](/docs/next/end-user/components/references/) pages.

These take effect on each Application's **first edit** after the upgrade, not at upgrade time.
Check a particular Application with `vela dry-run` from the v1.12 CLI against the v1.11 output.

| Definition | What changes |
| --- | --- |
| `resource` trait, `cpu` or `memory` alone | v1.11 ignored a single value and set no resources. v1.12 sets that value as both request and limit, and leaves the other resource as the workload already has it. |
| `task` component with probes | v1.12 renders `livenessProbe` and `readinessProbe` into the Job's pod template. A Job's pod template is immutable, so the update fails with "field is immutable" until the Job is deleted. Remove the probes first, or plan to delete the Job. |
| `cron-task` component with probes | The probes are now rendered into the CronJob's pod template. |
| `daemon` component, `hostPath` volumes | `readOnly` and `mountPropagation` are now applied. |
| `storage` trait | ConfigMap and Secret volumes marked `readOnly` are mounted read-only; block-mode PVCs are attached as devices and no longer mounted; a PVC `selector` is now written as `selector` (v1.11 wrote it as `dataSource`). |
| `hostalias` trait | Entries for the same IP are merged into one, and a hostname the IP already has is listed once. |
| `sidecar` trait | The sidecar's `ports` are now rendered. |
| `affinity` trait | `nodeSelector` is now applied to the pod spec. A pod that ran anywhere may become unschedulable if no node matches. |
| `pure-ingress` trait | The Ingress is `networking.k8s.io/v1` (was `v1beta1`), with `pathType: ImplementationSpecific`. |

Each of these rolls the workload on its first successful edit; a `task` Job with probes instead
fails with the immutable-template error until the Job is deleted. Several traits that failed to
render in v1.11 for some inputs (`container-ports`, `init-container`, `k8s-update-strategy`,
`securitycontext`, `startup-probe`) now render.

## Helm components

- A `helmchart` release belongs to one Application. Installing a release another Application
  already owns, in the same namespace with the same `release.name` (which defaults to the component
  name), now fails with a message naming the owner, rather than taking over its workload. Give each
  release a unique name per namespace.
- A component placed by a topology policy into a namespace other than the Application's own now
  works, which is VelaUX's default environment layout. Definitions that need the Application's own
  namespace there can read the new `context.appNamespace`.
- `release.namespace` without `release.name` now names the release after the component.
- With authentication enabled, releases are installed as the Application's user, who needs rights
  to the chart's objects on every cluster the topology places it on.
- **Chart credentials and values are read from the Application's own namespace.** The Secret
  `chart.auth.secretRef` names, and every `valuesFrom` Secret and ConfigMap, must be in the
  Application's namespace, which is also the default when none is named. One in the release
  namespace, or anywhere else, is refused. Move them into the Application's namespace before the
  upgrade.
- `oci://` charts are pulled through the same outbound address checks as other chart sources.
- **Chart cache:** each Application caches its charts separately by default, so many Applications
  on one chart hold one copy each on every vela-core pod, and a new leader fetches them all again.
  Set `options.cache.key` to a shared value for widely used charts. A version-pinned chart stays
  cached for 24 hours even if it is re-pushed, and an OCI chart with the default `version: latest`
  needs a real `latest` tag.

## Workflow

- **HTTP requests are bounded.** A workflow HTTP request with a timeout of `0`, a negative timeout,
  or one over the maximum is refused and the step fails; a response body over the maximum is
  refused rather than truncated. The maximum timeout is 60 seconds and the maximum body 1 MiB, set
  with the chart values `workflow.http.maxTimeout` and `workflow.http.maxResponseBytes`. The
  `request`, `notification` and `webhook` steps no longer accept a timeout of `"0"`. `vela/http`
  calls inside component, trait and policy definitions, which have no timeout parameter, time out
  at the maximum.
- **Completed steps with side effects run once in normal operation.** v1.11 could run a completed
  `webhook`, `notification` or `request` step again on a rollout, on any concurrent write to a
  running Application or WorkflowRun, or on resume. v1.12 no longer does. Delivery is still at
  least once across a controller crash or a restore from backup, so receivers should still
  de-duplicate, keying on the Application UID, revision and step name.
- **The `request` step** accepts any reply. The body is available as `responseBody`, and parsed as
  `response` only when it is JSON, so an empty or plain-text reply no longer fails the step. A
  status of 400 now fails the step, as other 4xx statuses already did.
- **A `$( )` step condition that cannot be evaluated fails the step**, with the evaluation error in
  its message, rather than skipping it. A CUE `if` that errors still skips the step, as in v1.11.
- A `dependsOn` cycle is admitted, and the Application waits without a message. Check your DAGs
  before applying them.
- An HTTP step's TLS Secret (`tls_config.secret`) is read from the Application's own namespace. A
  Secret in another namespace needs the `AuthenticateApplication` feature gate and RBAC for the
  Application's user to read it. A TLS setup error now fails the step instead of being ignored.
- **Behind a proxy, guarded HTTP goes direct.** The controller's guarded HTTP client ignores
  `HTTP_PROXY` and `HTTPS_PROXY`, so it checks the address it actually connects to. That covers
  workflow HTTP steps (`webhook`, `notification`, `request`), `vela/http` calls in definitions,
  Helm chart fetches (`oci://`, repository and URL sources), addon registries over HTTP and
  `ref-objects` URLs. Where the only way out of the cluster is the proxy, these requests now fail.
  v1.11.1 and later, and v1.10.10, behave the same.
- **The controller never fetches from itself.** Workflow HTTP requests, `ref-objects` URLs and
  chart sources are refused for loopback, the unspecified address (`0.0.0.0`) and NAT64 prefixes,
  whatever the deny list says. A controller run outside the cluster, as in local development, can
  no longer fetch from `localhost`.
- **The `vela-cli` step's Job runs in the Application's namespace,** as the service account the
  step names there, `default` unless set. It no longer runs as vela-core's own account in
  `vela-system`. A platform Application in `vela-system` can still name `kubevela-vela-core`. The
  chart restricts `vela-cli` to `vela-system`
  (`definitionRestrictions.overrides.vela-cli.namespaces`); give a tenant namespace a service
  account with the RBAC its commands need before allowing it there.
- **Shared Workflows.** `workflow.ref` finds a Workflow in the Application's namespace first, then
  in the system definition namespace (`vela-system` unless the controller sets
  `--system-definition-namespace`). Where definition permissions (`ValidateDefinitionPermissions`)
  or the `AuthenticateApplication` feature gate are on, the Application's author needs `get` on the
  Workflow it resolves to: admission refuses the Application otherwise, and with
  `AuthenticateApplication` it stops rendering. `status.workflow.ref` shows which Workflow an
  Application ran.
- Steps and views that collect Secrets from an Application's resource tree get each Secret's name
  and metadata, never its data.

## Definitions, crates and addons

- **Definition permission validation** (`authorization.definitionValidationEnabled`) now also
  covers what an Application reaches through references: the steps of the Workflow `workflow.ref`
  names, the Policy objects a `deploy` step loads, and the types and traits override policies set.
  Writing a Workflow or Policy object is checked the same way, so a user needs read access to every
  definition it names.
- **Definition restrictions and quotas** (new in v1.12) also apply to component types and traits
  that override policies bring in, to steps from a referenced Workflow (`workflow.ref`), and to
  [crate](/docs/next/platform-engineers/crate/intro/) types. An update that breaks a restriction is refused. An Application that already breaks
  one keeps running, and shows a `RestrictionViolation` condition and a Warning event until it is
  fixed. A use through an override policy counts against a quota as well, as one more use of that
  type.
- **Definition revisions:** a revision is cut only when a definition's content changes, and
  revisions an Application pins with `type@vN` are never garbage-collected, whatever
  `definitionRevisionLimit` says.
- Deleting a definition that Applications use is not refused. They can no longer be updated, and
  their pinned revisions are deleted with it. A definition created again under the same name never
  reuses a number for different content: its revision numbers are kept in the
  `definition-revision-numbers` ConfigMap in its namespace. Re-created with content it had (a
  GitOps replace, for example), it takes that content's number back, so pins on it keep working; a
  pin on content it no longer has fails as not found rather than binding to the new content. A
  definition edited back to earlier content still gets a new number. Remove consumers before
  deleting or re-creating a definition, including in GitOps prune and re-sync flows.
- `vela addon disable` checks only inline consumers, and `kubectl delete application addon-<name>`
  checks nothing. Either way the addon's definitions and their revisions are removed. Check for
  consumers first.
- [Uninstalling a crate](/docs/next/platform-engineers/crate/crate-install/#uninstall-a-crate) does
  not check for Applications using its definitions. They keep running, but cannot be updated until
  it is installed again.
- `vela delete --orphan` of an addon still deletes its definitions, through their owner references.
- Two hubs running the same addon with `clusterLabelSelector: {}` on a shared managed cluster adopt
  each other's workloads there, and disabling it on one hub removes the other's. Do not share
  managed clusters between hubs for all-cluster addons.
- Upgrading an addon from a local directory needs the directory named exactly as the addon
  (`velaux`, not `velaux-addon`).
- **Addon components** (alpha, `EnableAddonComponent`) need their author to be able to create
  Applications in `vela-system`, as installing an addon does. The chart also restricts the `addon`
  type to `vela-system` (`definitionRestrictions.overrides.addon.namespaces`).
- Definitions and config templates whose CUE nests deeper than 1,000 levels are refused at
  admission. Shipped definitions nest about 20 deep.
- **Remote Terraform modules** (`schematic.terraform.type: remote`) are read from Git without being
  checked out. A module's `gitCredentialsSecretReference` must be in the definition's own
  namespace, and the Secret's `known_hosts` must be valid.

## Sources and expressions

Sources and `$( )` expressions are alpha, behind the `EnableCelExpressions` feature gate.

- Do not set `requireCelExpressionOptIn=false` on a fleet that uses Kubernetes `$(VAR)` syntax.
- Turning the gate off later refuses every update to Applications that use it. Before disabling it,
  replace every `$(source.…)` and `$(component.…)` reference; removing `spec.sources` alone ships
  the literal expression text.
- A source change reaches Applications on their next reconcile (every 5 minutes by default), not
  when the source's TTL expires. Use the `app.oam.dev/reconcile-interval` annotation where faster
  pickup matters.
- A short source outage while a revision is being created can terminate the workflow, and it does
  not recover when the source does. Restart the workflow after an outage.
- The `use-stale` fallback expires about three TTLs into an outage, and the source then shows
  `Unused`.
- A missing step output renders as `NULL_VALUE` inside a string; validate outputs before using them.
- An expression's evaluation is limited to a cost of 1,000,000 (roughly one unit per operation, the
  per-expression limit Kubernetes sets for CRD validation rules). One that exceeds it fails with
  "expression exceeds the evaluation cost limit".
- Restrictions and quotas on a parent definition do not apply to definitions that `extends` it; use
  `abstract`. A `@vN` pin on an extending definition pins only its own template; its ancestors
  resolve live.
- **Sensitive source values stay in a Secret.** The `+sensitive` fields of a source a workflow step
  reads are pinned for the run in the Secret `workflow-<app>-sources`, which the Application owns.
  The workflow context ConfigMap holds a pointer to each instead, and ApplicationRevisions no longer
  keep a run's pinned sources.
- A `+sensitive` mark inside a `for` or `if` comprehension is now honoured, so `status.sources`
  masks that field too.

## VelaUX

- **With Dex login, VelaUX gives the Dex client its own secret.** Installs created before carry a
  secret shared by every install; VelaUX replaces it on its first start after the upgrade and
  restarts Dex once. A secret you set yourself is kept.
- **Everyone signs in again after the upgrade.** VelaUX now keeps its token signing key in the
  Secret `vela-system/velaux-token-signing-key`, created on first start, so existing sessions end.
- **An application or environment is created only in the project the request was authorized for.**
  A request whose body names another project is refused (403, code 30011).
- **Sessions end when they should.** Disabling a user, deleting them, or changing their password or
  roles ends all of their sessions, and **Log out** now ends them on the server too. A disabled user
  can no longer sign in with a password. Each token refresh issues a new refresh token.
- **Configs are created from templates in `vela-system` or the project's own namespace.** These are
  the only templates VelaUX lists; an API request naming a template anywhere else is refused.
- **Permission migrations.** Upgrading VelaUX runs three one-time permission migrations:
  - Each project's `project-view` is reset to a narrower template, and its reads move to new
    per-feature `*-view` permissions. Every role that held `project-view` gets them, so no read
    access is lost, but manual edits to `project-view` are overwritten.
  - `workflow-management` and `definition-management` go only to the built-in `project-admin` and
    `app-developer` roles. Custom roles keep what they had, but need these added to use shared
    workflows and project definitions.
  - The migrations run once per datastore (recorded in `vela_migration`) and log nothing.
- Definitions installed by crates (alpha) are not listed in VelaUX, and their component types
  cannot be used from it yet.
- The resource tree reads as the project's group. Resources in namespaces no target covers show as
  an empty tree, with no error.
- New environments default to the project's namespace. Deleting such an environment removes the
  project's own permissions there; restore the project's RoleBinding afterwards.
- With the `AuthenticateApplication` feature gate on, VelaUX's own health collection is refused, so
  VelaUX as shipped does not work with authentication on.

## Operations

- **Backup and restore:** do not restore `ResourceTracker`s, `ApplicationRevision`s or
  `DefinitionRevision`s. A restored ResourceTracker still names the Application's old uid, so
  creating the Application is refused until the tracker is either taken over (remove its
  `app.oam.dev/uid` label) or removed; the refusal gives both commands. Restore definitions
  **before** Applications: Velero's default order drops every Application with a custom type.
  Restored Applications run completed workflow steps again.
- Admission work can continue after the API server's webhook timeout, so very large or abusive
  Application writes can saturate the webhook for minutes. Size the webhook's CPU for your largest
  Applications.
- **cert-manager webhook mode fails closed.** With `admissionWebhooks.certManager.enabled`, the
  webhooks are now rendered with `admissionWebhooks.failurePolicy` (`Fail` by default) instead of
  `Ignore`. Writes to Applications and definitions are refused until cert-manager has injected the
  CA, and whenever no vela-core pod is ready, so run two or more replicas. Check after upgrading:

  ```shell
  kubectl get validatingwebhookconfiguration kubevela-vela-core-admission \
    -o jsonpath='{.webhooks[*].failurePolicy}'
  ```

- **`authentication.withUser: false` runs Applications as the default user,** with the requester's
  groups, as documented. A username an Application's author wrote is removed when it is written,
  and one already stored is ignored, so an Application that ran as such a username now runs as the
  default user.
- **Cluster metrics:** with `multicluster.metrics.enabled`, control-plane and worker node counts
  change on Kubernetes 1.24 and later: control-plane nodes were counted as workers before.
- **Sharing a cluster between tenants needs the `AuthenticateApplication` feature gate.** Without
  it, the controller writes whatever an Application's components describe, wherever they place it,
  with its own rights. See
  [Authentication and authorization](/docs/next/platform-engineers/auth/advance/).

## Downgrading to v1.11

Do not use `helm rollback`: the v1.12 release no longer contains the built-in definitions (a hook
Job applies them), so the rollback fails on definitions the v1.11 release no longer owns. Going
back to v1.11.0 it fails part-way (`no ComponentDefinition "cron-task" found`), leaving the v1.11
controller running while Helm reports `failed`. Do not delete the admission webhook configuration
by hand either.

Remove Applications that use v1.12-only features first, such as a definition that `extends`
another, `sources` or `forEach` steps.

Then use `hack/downgrade-from-1.12.sh` from the
[kubevela repository](https://github.com/kubevela/kubevela), at the tag you are running, from
`v1.12.0` on. It downgrades the release to the v1.11 chart (1.11.2 unless you pass `--version`)
with your values and the v1.11 controller image, removes the admission webhooks only v1.12 serves
(for `SourceDefinition`, `Config`, `ConfigTemplate` and config Secrets), and checks the result. For
v1.11.1 and later, the v1.11 chart's own hook Job puts the v1.11 built-in definitions back. For
v1.11.0, whose chart owns the built-in definitions as part of the release, the script first puts
them back under Helm's ownership. A run that stops part-way can be run again.

```shell
# see what it would change
hack/downgrade-from-1.12.sh --dry-run
# downgrade the release "kubevela" in vela-system to the 1.11.2 chart
hack/downgrade-from-1.12.sh --version 1.11.2
```

It takes `--release`, `--namespace`, `--chart` (a chart reference or a local path) and
`--image-repository` (for a mirror), and needs `helm` and `kubectl` pointed at the cluster.

On `v1.12.0-alpha.2` the script handles only v1.11.0. To go back to v1.11.1 or v1.11.2 from it,
upgrade the release to that chart with your values file. Its hook Job puts back the v1.11 built-in
definitions, and Helm removes the webhooks only v1.12 serves. This works for v1.11.1 and v1.11.2
only: going back to v1.11.0 needs the script.

```shell
helm upgrade kubevela kubevela/vela-core --version 1.11.2 -n vela-system -f <your values file> --wait
```

Use a values file, not `--reuse-values`, which would keep the v1.12 images. Then check that the
controller runs `v1.11.2`.

- **Pinned definition revisions:** v1.11.0 and v1.11.1 garbage-collect revisions over
  `definitionRevisionLimit`, pinned ones included. Downgrade to v1.11.2 or later, which keeps
  pinned revisions, or raise `definitionRevisionLimit` above your largest revision count before
  downgrading.
- **Configs:** v1.11 reads and writes configs as Secrets, and migration kept each config's Secret,
  so migrated configs keep working after the downgrade. The CRDs and the `ConfigTemplate` and
  `Config` resources stay, but nothing reconciles them until you upgrade again; do not delete a
  `Config` while it still owns its Secret, or the Secret is deleted with it. See
  [Rolling back to v1.11](config-migration.md#rolling-back-to-v111).
