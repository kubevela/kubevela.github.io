---
title: Upgrading to v1.12
---

This page covers moving a KubeVela installation from v1.11.x to v1.12.x, and back again if you need to. Read it through before you start: a few steps have to happen **before** `helm upgrade`, and some changes only show up on the first edit of each Application afterwards.

As with any upgrade, rehearse it on a copy of your cluster first.

## Before you upgrade

Do these in order.

### 1. Apply the v1.12 CRDs, server side

Helm never installs or upgrades CRDs, and v1.12 adds three (`SourceDefinition`, `Config` and `ConfigTemplate`) and changes others. Without them the new controller crash-loops while the v1.11 pods keep serving.

```bash
helm pull kubevela/vela-core --version 1.12.0 --untar --untardir /tmp/vela-1.12
kubectl apply --server-side --force-conflicts -f /tmp/vela-1.12/vela-core/crds/
```

Every line should say `serverside-applied`. The apply has to be server side: the `applicationrevisions` CRD is close to the size limit of the annotation a client-side apply writes.

If you already upgraded without this step, apply the CRDs now and run the same `helm upgrade` again.

### 2. Check Applications and step definitions against the new admission rules

v1.12 validates more on admission. An update that leaves an object's spec as it is (a label, `publishVersion`, an identical `kubectl apply`, a GitOps sync of an unchanged manifest) is not refused for problems the stored object already had, so objects v1.11 accepted do not wedge; they come back as admission warnings instead. A **change to the spec** has to pass the new rules, so fix these before your next spec change:

- Applications with two traits that conflict (one lists the other in `conflictsWith`, directly or through `extends`): remove one of the pair.
- Custom WorkflowStepDefinitions: run `vela def vet` with the v1.12 CLI and fix any that do not compile. v1.11 marked such a step `Succeeded` **without running it**; v1.12 refuses it at admission and fails it at run time. Re-run the workflows that use them on a staging cluster.

### 3. Upgrade with your values on the v1.12 chart defaults

```bash
helm upgrade kubevela kubevela/vela-core --version 1.12.0 -n vela-system \
  --reset-then-reuse-values --wait --timeout 10m
```

- Use `--reset-then-reuse-values`, not `--reuse-values`: the latter fails on v1.11 values, and patching around it renders empty feature gates.
- If your values pin `image.tag` or `image.repository`, the pin survives the upgrade and the controller stays on v1.11. Pass `--set image.tag=v1.12.0` or drop the pin, then check:

  ```bash
  kubectl -n vela-system get deploy kubevela-vela-core \
    -o jsonpath='{.spec.template.spec.containers[0].image}'
  ```

### 4. Upgrade every client

Upgrade the `vela` CLI and VelaUX alongside the controller. A v1.11 CLI silently drops fields that are new in v1.12 when it writes (for example, `vela workflow rollback` from a v1.11 CLI removes `spec.sources`), and older clients are refused when they write a migrated config (see [Configs](#configs)).

### 5. Do not edit builtin definitions in place

The upgrade replaces the builtin definitions in `vela-system`. An in-place edit to one is reverted without a warning: an added parameter disappears and is ignored from then on. Customise a builtin with your own definition, or with `extends`.

## Right after the upgrade

- **Every workload is applied once.** The v1.12 controller adds `owner.oam.dev/*` labels and a new render hash to every workload it manages, on managed clusters too. Each workload's `generation` goes up by one with an identical pod template, so nothing restarts, but it is an apply wave the size of your fleet, and drift tools watching `generation` will report a change everywhere.
- **Helm components on managed clusters move themselves.** v1.11 installed a `helmchart` component placed on a managed cluster on the hub as well, and dispatched its objects to the managed cluster without Helm's ownership metadata. On the first workflow run after the upgrade, v1.12 adopts those objects into the release on the managed cluster, removes the placeholder release Secrets v1.11 copied there, and then uninstalls the copy left on the hub. An Application that is not edited keeps its hub copy until its next run; to move it now, run `vela workflow restart <app> -n <namespace>`. With authentication enabled, the uninstall runs as the Application's user, who needs the rights to remove the chart's objects on the hub.
- **ApplicationRevisions** snapshot trait and step definitions only when the Application's spec changes, so each Application's latest revision renders with the **current** definitions, including on a rollback to it.
- **Webhook certificates:** an upgraded certificate Secret has no `ca.key`, so the first renewal rotates the CA. Natural rotation has no gap; do not replace the webhook certificate Secret by hand, which leaves admission failing closed for several seconds.

## Changes to builtin definitions

These take effect on each Application's **first edit** after the upgrade, not at upgrade time. Check a particular Application with `vela dry-run` from the v1.12 CLI against the v1.11 output.

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

Each of these rolls the workload on its first successful edit; a `task` Job with probes instead fails with the immutable-template error until the Job is deleted. Several traits that failed to render in v1.11 for some inputs (`container-ports`, `init-container`, `k8s-update-strategy`, `securitycontext`, `startup-probe`) now render.

## Helm components

- A `helmchart` release belongs to one Application. Installing a release another Application already owns, in the same namespace with the same `release.name` (which defaults to the component name), now fails with a message naming the owner, rather than taking over its workload. Give each release a unique name per namespace.
- A component placed by a topology policy into a namespace other than the Application's own now works, which is VelaUX's default environment layout. Definitions that need the Application's own namespace there can read the new `context.appNamespace`.
- `release.namespace` without `release.name` now names the release after the component.
- With authentication enabled, releases are installed as the Application's user, who needs rights to the chart's objects on every cluster the topology places it on.
- **Chart credentials and values are read from the Application's own namespace.** The Secret `chart.auth.secretRef` names, and every `valuesFrom` Secret and ConfigMap, must be in the Application's namespace, which is also the default when none is named. One in the release namespace, or anywhere else, is refused. Move them into the Application's namespace before the upgrade.
- `oci://` charts are pulled through the same outbound address checks as other chart sources.
- **Chart cache:** each Application caches its charts separately by default, so many Applications on one chart hold one copy each on every vela-core pod, and a new leader fetches them all again. Set `options.cache.key` to a shared value for widely used charts. A version-pinned chart stays cached for 24 hours even if it is re-pushed, and an OCI chart with the default `version: latest` needs a real `latest` tag.

## Workflow

- **HTTP requests are bounded.** A workflow HTTP request with a timeout of `0`, a negative timeout, or one over the maximum is refused and the step fails; a response body over the maximum is refused rather than truncated. The maximum timeout is 60 seconds and the maximum body 1 MiB, set with the chart values `workflow.http.maxTimeout` and `workflow.http.maxResponseBytes`. The `request`, `notification` and `webhook` steps no longer accept a timeout of `"0"`. `vela/http` calls inside component, trait and policy definitions, which have no timeout parameter, time out at the maximum.
- **Completed steps with side effects run once in normal operation.** v1.11 could run a completed `webhook`, `notification` or `request` step again on a rollout, on any concurrent write to a running Application or WorkflowRun, or on resume. v1.12 no longer does. Delivery is still at least once across a controller crash or a restore from backup, so receivers should still de-duplicate, keying on the Application UID, revision and step name.
- **The `request` step** accepts any reply. The body is available as `responseBody`, and parsed as `response` only when it is JSON, so an empty or plain-text reply no longer fails the step. A status of 400 now fails the step, as other 4xx statuses already did.
- **A `$( )` step condition that cannot be evaluated fails the step**, with the evaluation error in its message, rather than skipping it. A CUE `if` that errors still skips the step, as in v1.11.
- A `dependsOn` cycle is admitted, and the Application waits without a message. Check your DAGs before applying them.
- An HTTP step's TLS Secret (`tls_config.secret`) is read from the Application's own namespace. A Secret in another namespace needs the `AuthenticateApplication` feature gate and RBAC for the Application's user to read it. A TLS setup error now fails the step instead of being ignored.
- **The controller never fetches from itself.** Workflow HTTP requests, `ref-objects` URLs and chart sources are refused for loopback, the unspecified address (`0.0.0.0`) and NAT64 prefixes, whatever the deny list says. A controller run outside the cluster, as in local development, can no longer fetch from `localhost`.
- **The `vela-cli` step's Job runs in the Application's namespace,** as the service account the step names there, `default` unless set. It no longer runs as vela-core's own account in `vela-system`. A platform Application in `vela-system` can still name `kubevela-vela-core`. The chart restricts `vela-cli` to `vela-system` (`definitionRestrictions.overrides.vela-cli`); give a tenant namespace a service account with the RBAC its commands need before allowing it there.
- **Shared Workflows.** `workflow.ref` finds a Workflow in the Application's namespace first, then in the system definition namespace (`vela-system` unless the controller sets `--system-definition-namespace`). Where definition permissions (`ValidateDefinitionPermissions`) or the `AuthenticateApplication` feature gate are on, the Application's author needs `get` on the Workflow it resolves to: admission refuses the Application otherwise, and with `AuthenticateApplication` it stops rendering. `status.workflow.ref` shows which Workflow an Application ran.
- Steps and views that collect Secrets from an Application's resource tree get each Secret's name and metadata, never its data.

## Configs

v1.12 moves configs from Secrets and template ConfigMaps to the `Config` and `ConfigTemplate` CRDs. Existing configs keep working as they are until you migrate them with `vela config-template migrate`, `vela config migrate`, or the `AutoMigrateLegacyConfigs` feature gate (off by default). If a GitOps tool applies your configs, commit the migrated `ConfigTemplate` and `Config` resources to its repository, or it may revert the migration; see [GitOps](./config-migration.md#gitops).

- **Editing a legacy config migrates it.** `vela config create` on the name of an existing legacy config adopts it into a `Config` first, then applies your change. If it cannot be adopted (a `Config` of that name exists that migration did not create, or the config opted out of migration), the command fails and says why.
- **Older clients cannot write a migrated config.** A v1.11 CLI or VelaUX 1.9 editing a migrated config is refused with a message naming the `Config`. Upgrade the client, or edit the `Config`.
- **Addon config templates and VelaUX projects.** Migrating a template that lives in `vela-system`, which includes every addon's templates (`image-registry`, `helm-repository` and others), makes it a system-scope `ConfigTemplate`. Configs can still use it from any namespace, but VelaUX's project config pages list only namespace-scoped templates, so it no longer appears there. If your projects create configs from addon templates in VelaUX, leave those templates unmigrated; configs on an unmigrated template can still be edited in VelaUX.
- **Which configs a workflow can reach.** The config workflow steps (`read-config`, `list-config`, `create-config`, `delete-config`) and the `vela-config` source work on configs in the Application's own namespace, and can read shared system configs (in `vela-system`, or on a system-scope template) from anywhere. Anything else needs the `AuthenticateApplication` feature gate and RBAC for the Application's user.
- After enabling `AutoMigrateLegacyConfigs`, check for Warning events with reason `MigrationFailed` or `MigrationConflict` on legacy config Secrets: the sweep reports problems only there and in the controller log. Its `kubevela_config_migration_total{result="adopted"}` metric can read 0 after successful adoptions. Malformed legacy configs are not shown by `vela config list`.
- Delete sensitive configs with `vela config delete`. Deleting the `Config` any other way (VelaUX, `kubectl`, a GitOps prune) leaves its `<name>-properties` Secret, with the values in it.
- Deleting a config template that configs still use is not refused; those configs go to `Error` and can only be deleted.
- A distributed config is a copy taken when it is distributed. Changes reach the target clusters only when you distribute it again. Deleting a config in VelaUX leaves its distribution and the copies; delete the distribution first.
- **Nacos:** deleting a `Config` does not remove its Nacos entry. A Nacos outage shows only in the `Config`'s `NacosSynced` condition, after the next write, not in its phase or in `vela config list`; monitor that condition.

## Definitions, modules and addons

- **Definition permission validation** (`authorization.definitionValidationEnabled`) now also covers what an Application reaches through references: the steps of the Workflow `workflow.ref` names, the Policy objects a `deploy` step loads, and the types and traits override policies set. Writing a Workflow or Policy object is checked the same way, so a user needs read access to every definition it names.
- **Definition restrictions and quotas** (new in v1.12) also apply to component types and traits that override policies bring in, to steps from a referenced Workflow (`workflow.ref`), and to module types. An update that breaks a restriction is refused. An Application that already breaks one keeps running, and shows a `RestrictionViolation` condition and a Warning event until it is fixed. A use through an override policy counts against a quota as well, as one more use of that type.
- **Definition revisions:** a revision is cut only when a definition's content changes, and revisions an Application pins with `type@vN` are never garbage-collected, whatever `definitionRevisionLimit` says.
- Deleting a definition that Applications use is not refused. They can no longer be updated, and their pinned revisions are deleted with it. A definition created again under the same name never reuses a number for different content: its revision numbers are kept in the `definition-revision-numbers` ConfigMap in its namespace. Re-created with content it had (a GitOps replace, for example), it takes that content's number back, so pins on it keep working; a pin on content it no longer has fails as not found rather than binding to the new content. A definition edited back to earlier content still gets a new number. Remove consumers before deleting or re-creating a definition, including in GitOps prune and re-sync flows.
- `vela addon disable` checks only inline consumers, and `kubectl delete application addon-<name>` checks nothing. Either way the addon's definitions and their revisions are removed. Check for consumers first.
- Uninstalling a module does not check for Applications using its definitions. They keep running, but cannot be updated until it is installed again.
- `vela delete --orphan` of an addon still deletes its definitions, through their owner references.
- Two hubs running the same addon with `clusterLabelSelector: {}` on a shared managed cluster adopt each other's workloads there, and disabling it on one hub removes the other's. Do not share managed clusters between hubs for all-cluster addons.
- Upgrading an addon from a local directory needs the directory named exactly as the addon (`velaux`, not `velaux-addon`).
- **Addon components** (alpha, `EnableAddonComponent`) need their author to be able to create Applications in `vela-system`, as installing an addon does. The chart also restricts the `addon` type to `vela-system` (`definitionRestrictions.overrides.addon`).
- Definitions and config templates whose CUE nests deeper than 1,000 levels are refused at admission. Shipped definitions nest about 20 deep.
- **Remote Terraform modules** (`schematic.terraform.type: remote`) are read from Git without being checked out. A module's `gitCredentialsSecretReference` must be in the definition's own namespace, and the Secret's `known_hosts` must be valid.

## Sources and expressions

Sources and `$( )` expressions are alpha, behind the `EnableCelExpressions` feature gate.

- Do not set `requireCelExpressionOptIn=false` on a fleet that uses Kubernetes `$(VAR)` syntax.
- Turning the gate off later refuses every update to Applications that use it. Before disabling it, replace every `$(source.…)` and `$(component.…)` reference; removing `spec.sources` alone ships the literal expression text.
- A source change reaches Applications on their next reconcile (every 5 minutes by default), not when the source's TTL expires. Use the `app.oam.dev/reconcile-interval` annotation where faster pickup matters.
- A short source outage while a revision is being created can terminate the workflow, and it does not recover when the source does. Restart the workflow after an outage.
- The `use-stale` fallback expires about three TTLs into an outage, and the source then shows `Unused`.
- A missing step output renders as `NULL_VALUE` inside a string; validate outputs before using them.
- An expression's evaluation is limited to a cost of 1,000,000 (roughly one unit per operation, the per-expression limit Kubernetes sets for CRD validation rules). One that exceeds it fails with "expression exceeds the evaluation cost limit".
- Restrictions and quotas on a parent definition do not apply to definitions that `extends` it; use `abstract`. A `@vN` pin on an extending definition pins only its own template; its ancestors resolve live.
- **Sensitive source values stay in a Secret.** The `+sensitive` fields of a source a workflow step reads are pinned for the run in the Secret `workflow-<app>-sources`, which the Application owns. The workflow context ConfigMap holds a pointer to each instead, and ApplicationRevisions no longer keep a run's pinned sources.
- A `+sensitive` mark inside a `for` or `if` comprehension is now honoured, so `status.sources` masks that field too.

## VelaUX

- **With Dex login, VelaUX gives the Dex client its own secret.** Installs created before carry a secret shared by every install; VelaUX replaces it on its first start after the upgrade and restarts Dex once. A secret you set yourself is kept.
- **Everyone signs in again after the upgrade.** VelaUX now keeps its token signing key in the Secret `vela-system/velaux-token-signing-key`, created on first start, so existing sessions end.
- **An application or environment is created only in the project the request was authorized for.** A request whose body names another project is refused (403, code 30011).
- **Sessions end when they should.** Disabling a user, deleting them, or changing their password or roles ends all of their sessions, and **Log out** now ends them on the server too. A disabled user can no longer sign in with a password. Each token refresh issues a new refresh token.
- **Configs are created from templates in `vela-system` or the project's own namespace.** These are the only templates VelaUX lists; an API request naming a template anywhere else is refused.
- **Permission migrations.** Upgrading VelaUX runs three one-time permission migrations:
  - Each project's `project-view` is reset to a narrower template, and its reads move to new per-feature `*-view` permissions. Every role that held `project-view` gets them, so no read access is lost, but manual edits to `project-view` are overwritten.
  - `workflow-management` and `definition-management` go only to the built-in `project-admin` and `app-developer` roles. Custom roles keep what they had, but need these added to use shared workflows and project definitions.
  - The migrations run once per datastore (recorded in `vela_migration`) and log nothing.
- Definitions installed by modules (alpha) are not listed in VelaUX, and their component types cannot be used from it yet.
- The resource tree reads as the project's group. Resources in namespaces no target covers show as an empty tree, with no error.
- New environments default to the project's namespace. Deleting such an environment removes the project's own permissions there; restore the project's RoleBinding afterwards.
- With the `AuthenticateApplication` feature gate on, VelaUX's own health collection is refused, so VelaUX as shipped does not work with authentication on.

## Operations

- **Backup and restore:** do not restore `ResourceTracker`s, `ApplicationRevision`s or `DefinitionRevision`s. A restored ResourceTracker still names the Application's old uid, so creating the Application is refused until the tracker is either taken over (remove its `app.oam.dev/uid` label) or removed; the refusal gives both commands. Restore definitions **before** Applications: Velero's default order drops every Application with a custom type. Restored Applications run completed workflow steps again.
- Admission work can continue after the API server's webhook timeout, so very large or abusive Application writes can saturate the webhook for minutes. Size the webhook's CPU for your largest Applications.
- **cert-manager webhook mode fails closed.** With `admissionWebhooks.certManager.enabled`, the webhooks are now rendered with `admissionWebhooks.failurePolicy` (`Fail` by default) instead of `Ignore`. Writes to Applications and definitions are refused until cert-manager has injected the CA, and whenever no vela-core pod is ready, so run two or more replicas. Check after upgrading:

  ```bash
  kubectl get validatingwebhookconfiguration kubevela-vela-core-admission \
    -o jsonpath='{.webhooks[*].failurePolicy}'
  ```
- **`authentication.withUser: false` runs Applications as the default user,** with the requester's groups, as documented. A username an Application's author wrote is removed when it is written, and one already stored is ignored, so an Application that ran as such a username now runs as the default user.
- **Sharing a cluster between tenants needs the `AuthenticateApplication` feature gate.** Without it, the controller writes whatever an Application's components describe, wherever they place it, with its own rights. See [Authentication and authorization](../auth/advance.md).

## Downgrading to v1.11

**Do not use `helm rollback`.** It fails part-way (`no ComponentDefinition "cron-task" found`), leaving the v1.11 controller running while Helm reports `failed`. v1.12 applies the builtin definitions from a hook rather than as part of the release, so the v1.11 release finds definitions it no longer owns.

Use `hack/downgrade-from-1.12.sh` from the [kubevela repository](https://github.com/kubevela/kubevela) at the `v1.12.0` tag. It puts the v1.11 builtin definitions back under Helm's ownership, downgrades the release to the v1.11 chart with your values and the v1.11 controller image, removes the admission webhooks only v1.12 serves (for `SourceDefinition`, `Config`, `ConfigTemplate` and config Secrets), and checks all three. A run that stops part-way can be run again.

```bash
# see what it would change
hack/downgrade-from-1.12.sh --dry-run
# downgrade the release "kubevela" in vela-system to the 1.11.2 chart
hack/downgrade-from-1.12.sh --version 1.11.2
```

It takes `--release`, `--namespace`, `--chart` (a chart reference or a local path) and `--image-repository` (for a mirror), and needs `helm` and `kubectl` pointed at the cluster.

- **Pinned definition revisions:** v1.11.0 and v1.11.1 garbage-collect revisions over `definitionRevisionLimit`, pinned ones included. Downgrade to v1.11.2 or later, which keeps pinned revisions, or raise `definitionRevisionLimit` above your largest revision count before downgrading.
- **Configs:** v1.11 reads and writes configs as Secrets, and migration kept each config's Secret, so migrated configs keep working after the downgrade. The `Config` and `ConfigTemplate` resources stay in the cluster and v1.11 ignores them; do not delete a `Config` while it still owns its Secret, or the Secret is deleted with it.
