---
title: Controller Flags and Feature Gates
sidebar_label: Controller Flags and Feature Gates
---

This page lists the flags and feature gates of the KubeVela controller (`vela-core`) in this version of KubeVela. Use the version selector to see another version. What changed in each release is in the [release notes](../../release-notes/overview.md).

Most flags and feature gates are set through the `vela-core` Helm chart values, for example `--set featureGates.enableCelExpressions=true`. The chart's defaults can differ from the controller's own defaults; both are shown below.

The flags of Cluster Gateway itself, which the chart runs beside vela-core, are in [Configure Cluster Gateway](/cluster-gateway/configuration).

## Flags

The generic Kubernetes logging flags (`-v`, `--vmodule`, `--log_dir` and the other `klog` flags) are not listed.

| Flag | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `--allow-cross-namespace-resource` | bool | `true` | If set to false, application can only apply resources within its namespace. Default to be true. |
| `--allow-namespace-global-policies` | bool | `false` | Whether global Application-scoped PolicyDefinitions outside vela-system apply to the applications in their namespace. When false, global policies are platform-wide only: they must be in vela-system, the webhook rejects them elsewhere, and any that exist are ignored. |
| `--allow-resource-types` | string |  | If not empty, application can only apply resources with specified types. For example, --allow-resource-types=whitelist:Deployment.v1.apps,Job.v1.batch |
| `--allow-skip-global-policies` | bool | `false` | Whether an application may opt out of global policies with the policy.oam.dev/skip-global annotation. When false, global policies are mandatory: the webhook rejects the annotation and the controller ignores it. |
| `--application-default-apply-data-changes` | bool | `false` | Default for a policy's applyDataChanges setting, used when the application has no valid policy.oam.dev/apply-data-changes annotation and the policy template sets no config.applyDataChanges. When true, applications take changed output from an unchanged Application-scoped policy version. |
| `--application-default-apply-policy-updates` | bool | `false` | Default for a policy's applyPolicyUpdates setting, used when the application has no valid policy.oam.dev/apply-policy-updates annotation and the policy template sets no config.applyPolicyUpdates. When true, applications adopt new versions of the Application-scoped policies they run. |
| `--application-default-auto-revision` | bool | `false` | Default for a policy's autoRevision setting, used when the application has no valid policy.oam.dev/auto-revision annotation and the policy template sets no config.autoRevision. When true, Application-scoped policy changes to an application's spec cut a new ApplicationRevision; an application can opt out with the annotation set to "false". |
| `--application-re-sync-period` | duration | `5m0s` | Re-sync period for application to re-sync, also known as the state-keep interval. |
| `--application-revision-definition-storage-prune-duration` | duration | `1h0m0s` | the duration for running application revision storage pruning |
| `--application-revision-limit` | int | `10` | application-revision-limit is the maximum number of application useless revisions that will be maintained, if the useless revisions exceed this number, older ones will be GCed first.The default value is 10. |
| `--authentication-default-user` | string | `"kubevela:vela-core"` | The User to impersonate when the User of application is not set. |
| `--authentication-group-pattern` | string | `"kubevela:*"` | During authentication, only groups with specified pattern will be carried on application. Resource requests will be impersonated as these selected groups. |
| `--authentication-with-user` | bool | `false` | If set to true, User will be carried on application. Resource requests will be impersonated as the User. |
| `--autogen-workload-definition` | bool | `true` | Automatic generated workloadDefinition which componentDefinition refers to. |
| `--cluster-gateway-ca-file` | string |  | Specify the CA file path for cluster-gateway. |
| `--cluster-gateway-service` | string |  | The &lt;namespace&gt;/&lt;name&gt; of the cluster-gateway Service that the serving cert is for. Use with --cluster-gateway-tls-secret. vela-core sets the APIService caBundle only when the APIService points at this Service. If it is empty, vela-core uses the Service of the APIService. |
| `--cluster-gateway-tls-secret` | string |  | The &lt;namespace&gt;/&lt;name&gt; of the Secret that holds the cluster-gateway serving cert. Requires --enable-cluster-gateway. If you set it, vela-core creates or renews the cert at startup and sets the caBundle of the cluster-gateway APIService when the APIService points at --cluster-gateway-service. If it is empty (the default), cert-manager or another tool must supply the cert. |
| `--cluster-gateway-url` | string |  | Specify the redirect cluster-gateway url for multi-cluster requests. If empty, it uses the Kubernetes aggregated api to access. |
| `--cluster-metrics-interval` | duration | `15s` | The interval that ClusterMetricsMgr will collect metrics from clusters, default value is 15 seconds. |
| `--concurrent-reconciles` | int | `4` | concurrent-reconciles is the concurrent reconcile number of the controller. The default value is 4 |
| `--controller-client-long-running-request-timeout` | duration | `30s` | The timeout value for controller client long-running (list) requests. |
| `--controller-client-mutating-request-timeout` | duration | `15s` | The timeout value for controller client mutating (update, patch, delete) requests. |
| `--controller-client-request-timeout` | duration | `10s` | The timeout value for controller client requests. |
| `--cue-compatibility-cache-size` | int | `2000` | Maximum number of CUE templates to cache after version compatibility rewriting. Set to 0 to disable caching. |
| `--cue-upgrade-bool-default-guard-enabled` | bool | `false` | Enable bool default-guard hazard compatibility rewrite pass. |
| `--cue-upgrade-error-field-label-enabled` | bool | `true` | Enable error field-label compatibility rewrite pass. |
| `--cue-upgrade-evalv3-selfref-guard-enabled` | bool | `false` | Enable evalv3 self-reference default-guard compatibility rewrite pass. |
| `--cue-upgrade-generic-default-guard-enabled` | bool | `false` | Enable generic default-guard hazard compatibility rewrite pass. |
| `--cue-upgrade-keepvalidators-singleton-enabled` | bool | `false` | Enable keepvalidators singleton concretization compatibility pass. |
| `--cue-upgrade-list-concat-enabled` | bool | `true` | Enable list concat compatibility rewrite pass. |
| `--definition-revision-limit` | int | `20` | definition-revision-limit is the maximum number of component/trait definition useless revisions that will be maintained, if the useless revisions exceed this number, older ones will be GCed first.The default value is 20. |
| `--dev-logs` | bool | `false` | Enable ANSI color formatting for console logs (ignored when log-file-path is set) |
| `--disable-remote-cluster-client` | bool | `false` | disable RemoteClusterClient for default multicluster client |
| `--enable-cluster-gateway` | bool | `false` | Enable cluster-gateway to use multicluster, disabled by default. |
| `--enable-cluster-metrics` | bool | `false` | Enable cluster-metrics-management to collect metrics from clusters with cluster-gateway, disabled by default. When this param is enabled, enable-cluster-gateway should be enabled |
| `--enable-cue-version-compatibility` | bool | `true` | Automatically rewrite legacy CUE syntax in stored definitions at render time. |
| `--enable-external-package-for-default-compiler` | bool | `true` | Enable loading third-party CUE packages into the default CUE compiler. When enabled, external CUE packages can be imported and used in CUE templates. |
| `--enable-external-package-watch-for-default-compiler` | bool | `false` | Enable watching for changes in external CUE packages and automatically reload them when modified. Requires enable-external-package-for-default-compiler to be enabled. |
| `--enable-leader-election` | bool | `false` | Enable leader election for controller manager. Enabling this will ensure there is only one active controller manager. |
| `--enable-sharding` | bool | `false` | When sharding enabled, the controller will run as master (shard-id=master) or slave mode (shard-id is any non-empty string except master). Refer to https://github.com/kubevela/kubevela/blob/master/design/vela-core/sharding.md for details. |
| `--health-addr` | string | `":9440"` | The address the health endpoint binds to. |
| `--helm-cache-immutable-ttl` | duration | `24h0m0s` | Default cache TTL for immutable (semver) chart versions, used when a component does not set options.cache.immutableTTL. Set to 0 to use the default. |
| `--helm-cache-max-bytes` | int | `268435456` | Maximum number of bytes to keep in the Helm chart cache. Set to 0 to use the default. |
| `--helm-cache-mutable-ttl` | duration | `5m0s` | Default cache TTL for mutable chart tags, used when a component does not set options.cache.mutableTTL. Set to 0 to use the default. |
| `--helm-cache-sweep-interval` | duration | `1m0s` | How often the Helm chart cache sweeps expired entries. Set to 0 to use the default. |
| `--ignore-app-without-controller-version` | bool | `false` | If true, application controller will not process the app without 'app.oam.dev/controller-version-require' annotation |
| `--ignore-definition-without-controller-version` | bool | `false` | If true, trait/component/workflowstep definition controller will not process the definition without 'definition.oam.dev/controller-version-require' annotation |
| `--informer-sync-period` | duration | `10h0m0s` | The re-sync period for informer in controller-runtime. This is a system-level configuration. |
| `--kube-api-burst` | int | `100` | the burst for reconcile clients. Recommend setting it qps*2. |
| `--kube-api-qps` | float | `50` | the qps for reconcile clients. Low qps may lead to low throughput. High qps may give stress to api-server. Raise this value if concurrent-reconciles is set to be high. |
| `--leader-election-lease-duration` | duration | `15s` | The duration that non-leader candidates will wait to force acquire leadership |
| `--leader-election-namespace` | string |  | Determines the namespace in which the leader election configmap will be created. |
| `--leader-election-renew-deadline` | duration | `10s` | The duration that the acting controlplane will retry refreshing leadership before giving up |
| `--leader-election-retry-period` | duration | `2s` | The duration the LeaderElector clients should wait between tries of actions |
| `--log-debug` | bool | `false` | Enable debug logs for development purpose |
| `--log-file-max-size` | uint | `1024` | Defines the maximum size a log file can grow to, Unit is megabytes. |
| `--log-file-path` | string |  | The file to write logs to. |
| `--max-dispatch-concurrent` | int | `10` | Set the max dispatch concurrent number, default is 10 |
| `--max-for-each-items` | int | `50` | Set the max number of items a forEach step may iterate, each of which is recorded in the Application's status, default is 50 |
| `--max-workflow-failed-backoff-time` | int | `300` | Set the max workflow failed backoff time, default is 300 |
| `--max-workflow-http-response-bytes` | int | `1048576` | Set the largest response body, in bytes, a workflow or definition HTTP request may read. A larger response fails the step or the render; it is not truncated. See [Request limits](/workflow/next/operate/http-protection#request-limits) |
| `--max-workflow-http-timeout` | duration | `1m0s` | Set the longest timeout a workflow or definition HTTP request may set; a request holds a reconcile worker for its duration. See [Request limits](/workflow/next/operate/http-protection#request-limits) |
| `--max-workflow-step-error-retry-times` | int | `10` | Set the max workflow step error retry times, default is 10 |
| `--max-workflow-wait-backoff-time` | int | `60` | Set the max workflow wait backoff time, default is 60 |
| `--metrics-addr` | string | `":8080"` | The address the metric endpoint binds to. |
| `--optimize-cached-gvks` | string |  | Types of resources to be cached. For example, --optimize-cached-gvks=Deployment.v1.apps,Job.v1.batch . If you have dedicated resources to be managed in your system, you can turn it on to improve performance. NOTE: this optimization only works for single-cluster. |
| `--optimize-disable-application-revision` | bool | `false` | Optimize ApplicationRevision by disabling the creation and gc. Side effect: application cannot rollback. If you don't need to rollback applications, you can switch it on to reduce the storage and improve performance. |
| `--optimize-disable-component-revision` | bool | `false` | Optimize ComponentRevision by disabling the creation and gc. Side effect: rollout cannot be used. If you don't use rollout trait, you can switch it on to reduce the storage and improve performance. |
| `--optimize-disable-resource-apply-double-check` | bool | `false` | Optimize workflow by ignoring resource double check after apply. Side effect: controller will not wait for resource creation. If you want to use KubeVela to dispatch tons of resources and do not need to double check the creation result, you can enable this optimization. |
| `--optimize-enable-in-memory-workflow-context` | bool | `false` | Optimize workflow by use in-memory context. Side effect: controller crash will lead to workflow run again from scratch and possible to cause mistakes in workflow inputs/outputs. You can use this optimization when you don't use input/output feature of workflow. |
| `--optimize-enable-resource-tracker-delete-only-trigger` | bool | `true` | Optimize resourcetracker by only trigger reconcile when resourcetracker is deleted. It is enabled by default. If you want to integrate KubeVela with your own operator or allow ResourceTracker manual edit, you can turn it off. |
| `--optimize-list-op` | bool | `true` | Optimize ResourceTracker & ApplicationRevision list op by adding index. This will increase the use of memory and accelerate the list operation of ResourceTracker. Default to enable it. If you want to reduce the memory use of KubeVela, you can switch it off. |
| `--optimize-mark-with-prob` | float | `0.1` | Optimize ResourceTracker GC by only run mark with probability. Side effect: outdated ResourceTracker might not be able to be removed immediately. Default to 0.1. If you want to cleanup outdated resource for keepLegacyResource mode immediately, set it to 1.0 to disable this optimization. |
| `--perf-enabled` | bool | `false` | Enable performance logging for controllers, disabled by default. |
| `--profiling-addr` | string |  | if not empty, start the profiling server at the given address |
| `--reconcile-termination-graceful-period` | duration | `5s` | graceful period for terminating reconcile |
| `--reconcile-timeout` | duration | `3m0s` | the timeout for controller reconcile |
| `--ref-objects-available-scope` | string | `"global"` | The available scope for ref-objects component to refer objects. Should be one of namespace, `cluster`, `global` |
| `--remote-cluster-client-cache-prune-probability` | float | `0.01` | the cache prune probability of remote clusters' RESTMapper |
| `--remote-cluster-client-cache-timeout` | duration | `30m0s` | the timeout of remote cluster's RESTMapper cache |
| `--revision-limit` | int | `50` | RevisionLimit is the maximum number of revisions that will be maintained. The default value is 50. |
| `--schedulable-shards` | []string |  | The shard ids that are available for scheduling. If empty, dynamic discovery will be used. |
| `--shard-id` | string | `"master"` | The id for sharding. |
| `--sharding-slave-discovery-resync-period` | duration | `5m0s` | The resync period for default dynamic discovery scheduler. |
| `--storage-driver` | string | `"Local"` | Application storage driver. |
| `--system-definition-namespace` | string | `"vela-system"` | Define the namespace of the system-level definition |
| `--use-webhook` | bool | `false` | Enable Admission Webhook |
| `--webhook-cert-dir` | string | `"/k8s-webhook-server/serving-certs"` | Admission webhook cert/key dir. |
| `--webhook-configuration` | string |  | The name of the MutatingWebhookConfiguration and the ValidatingWebhookConfiguration. vela-core sets their caBundle. Use with --webhook-tls-secret. |
| `--webhook-conversion-crds` | []string |  | The CRDs whose conversion webhook vela-core points at its webhook Service. Use with --webhook-tls-secret. |
| `--webhook-failure-policy` | string |  | The failurePolicy (Fail or Ignore) that vela-core sets on every webhook when its webhook server serves requests. Use with --webhook-tls-secret. If it is empty, vela-core does not change the failurePolicy. |
| `--webhook-port` | int | `9443` | admission webhook listen address |
| `--webhook-tls-secret` | string |  | The &lt;namespace&gt;/&lt;name&gt; of the Secret that holds the webhook serving cert. Requires --use-webhook. If you set it, vela-core creates or renews the cert at startup. vela-core writes the cert to --webhook-cert-dir and sets the caBundle of --webhook-configuration. If it is empty (the default), cert-manager or another tool must supply the cert. |
| `--workflow-http-deny-config-template-name` | string | `"vela-core-http-deny"` | Discover and merge ConfigMaps produced by this ConfigTemplate in the controller namespace |

The limits on HTTP requests from workflow steps and definitions are set by `--max-workflow-http-timeout` (default `60s`) and `--max-workflow-http-response-bytes` (default `1048576`), and the `BlockPrivateHTTPAddresses` feature gate blocks private addresses. See [HTTP limits](/workflow/next/guides/authoring/step-definition#http-limits).

## Key Parameters

- **application-re-sync-period**: The resync time of applications when no changes were made. A short time may cause controller to reconcile frequently but uselessly. The regular reconciles of applications can help ensure that application and its components keep up-to-date in case some unexpected differences. To override this interval for a single Application, use the [`app.oam.dev/reconcile-interval`](../../end-user/workflow/suspending-application-reconciliation.md#per-application-reconcile-interval) annotation (v1.11+).
- **concurrent-reconciles**: The number of threads to use for controller to handle requests. When rich CPU resources are available, a small number of working threads may lead to insufficient usage of CPU resources.
- **kube-api-qps / kube-api-burst**: The rate limit for KubeVela controller to access apiserver. When managed applications are complex (containing multiple components and resources), if the access rate of apiserver is limited, it will be hard to increase the concurrency of KubeVela controller. However, high access rate may cause huge burden to apiserver. It is critical to keep a balance when handling massive applications.
- **profiling-addr**: The pprof address to enable controller performance debugging. Named `pprof-addr` before v1.9.
- **perf-enabled**: Use this flag if you would like to check time costs for different stages when reconciling applications. Switch it off to simplify loggings.

> Several sets of recommended parameter configurations are enclosed in section [Performance Fine-tuning](./performance-finetuning.md).

## Feature Gates

You can use `--feature-gates=XXX=true` to enable feature `XXX`, or set the chart value in the table. Alpha gates may change or be removed in a later release.

| Feature gate | Stage | Controller default | Chart value | Chart default | Description |
| ------------ | ----- | ------------------ | ----------- | ------------- | ----------- |
| `AuthenticateApplication` | Alpha | `false` | `authentication.enabled` | `false` | Carry the requesting user on the Application and impersonate it when dispatching resources. See [Authentication](../auth/basic.md). |
| `ValidateDefinitionPermissions` | Alpha | `false` | `authorization.definitionValidationEnabled` | `false` | Check that the user who writes an Application has RBAC access to the definitions it uses. |
| `RestrictDefinitionNamespaces` | Beta | `true` | `featureGates.restrictDefinitionNamespaces` | `true` | Enforce a definition's `spec.restrictions` or `definition.oam.dev/restrict-namespaces` annotation, including per-namespace quotas, when an Application, or a Workflow or Policy it references, is created or updated. Does nothing until a definition declares a restriction, apart from the two the chart ships: `addon` and `vela-cli` are restricted to `vela-system`. See [Restricting Definitions by Namespace](../auth/definition-restrictions.md). |
| `ZstdResourceTracker` | Alpha | `false` | `featureGates.zstdResourceTracker` | `true` | Compress ResourceTrackers with zstd. Useful for large Applications; faster and smaller than gzip. |
| `GzipResourceTracker` | Alpha | `false` | `featureGates.gzipResourceTracker` | `false` | Compress ResourceTrackers with gzip. |
| `ZstdApplicationRevision` | Alpha | `false` | `featureGates.zstdApplicationRevision` | `true` | Compress ApplicationRevisions with zstd. |
| `GzipApplicationRevision` | Alpha | `false` | `featureGates.gzipApplicationRevision` | `false` | Compress ApplicationRevisions with gzip. |
| `ApplyOnce` | Alpha | `false` | `featureGates.applyOnce` | `false` | Apply-once for all Applications: no state keeping, and ResourceTrackers keep only metadata. |
| `MultiStageComponentApply` | Alpha | `true` | `featureGates.multiStageComponentApply` | `true` | Dispatch a component's manifests in batches by stage. Default `true` since v1.11. |
| `PreDispatchDryRun` | Alpha | `true` | `featureGates.preDispatchDryRun` | `true` | Dry-run resources before dispatching them, so failed resources don't enter the ResourceTracker. |
| `ApplyResourceByReplace` | Alpha | `false` |  |  | Modify resources with PUT instead of a three-way merge patch, so only KubeVela keeps the source of truth. Named `ApplyResourceByUpdate` before v1.9. |
| `ValidateComponentWhenSharding` | Alpha | `false` | `featureGates.validateComponentWhenSharding` | `false` | Validate components in the webhook when sharding is on, at the cost of extra API server calls. |
| `DisableWebhookAutoSchedule` | Alpha | `false` | `featureGates.disableWebhookAutoSchedule` | `false` | With sharding, stop the mutating webhook from assigning shards to Applications. |
| `DisableBootstrapClusterInfo` | Alpha | `false` | `featureGates.disableBootstrapClusterInfo` | `false` | Skip the cluster info bootstrap when the controller starts. |
| `InformerCacheFilterUnnecessaryFields` | Alpha | `true` | `featureGates.informerCacheFilterUnnecessaryFields` | `true` | Drop unneeded fields from the informer cache. |
| `SharedDefinitionStorageForApplicationRevision` | Alpha | `true` | `featureGates.sharedDefinitionStorageForApplicationRevision` | `true` | Share definition storage between ApplicationRevisions. Needs `InformerCacheFilterUnnecessaryFields`. |
| `DisableWorkflowContextConfigMapCache` | Alpha | `true` | `featureGates.disableWorkflowContextConfigMapCache` | `true` | Don't cache workflow context ConfigMaps in an informer. |
| `EnableCueValidation` | Beta | `false` | `featureGates.enableCueValidation` | `false` | Strict validation of CUE required parameter fields. |
| `ValidateUndeclaredParameters` | Alpha | `false` | `featureGates.validateUndeclaredParameters` | `false` | Reject parameters that the definition's `parameter` schema doesn't declare. |
| `ValidateResourcesExist` | Alpha | `false` | `featureGates.validateResourcesExist` | `false` | At admission, check that the resource types a definition template references exist in the cluster. |
| `EnableApplicationStatusMetrics` | Alpha | `false` | `featureGates.enableApplicationStatusMetrics` | `false` | Export Application status metrics and structured logs. |
| `EnableApplicationScopedPolicies` | Alpha | `false` | `featureGates.enableApplicationScopedPolicies` | `false` | Run Application-scoped PolicyDefinitions, which transform an Application before rendering. |
| `EnableGlobalPolicies` | Alpha | `false` | `featureGates.enableGlobalPolicies` | `false` | Discover and apply global PolicyDefinitions (`global: true`) to all Applications. |
| `EnableCelExpressions` | Alpha | `false` | `featureGates.enableCelExpressions` | `false` | Read `$( )` property expressions, and with them [SourceDefinition](../source/intro.md). Off by default because `$(VAR_NAME)` is also Kubernetes' syntax for dependent environment variables. |
| `RequireCelExpressionOptIn` | Alpha | `true` | `featureGates.requireCelExpressionOptIn` | `true` | While `EnableCelExpressions` is on, read expressions only in Applications annotated `app.oam.dev/cel-expressions: "true"`. Set it to `false` to read expressions in every Application. |
| `EnableSourceAutoUpdate` | Alpha | `false` | `featureGates.enableSourceAutoUpdate` | `false` | Default for `spec.sources[].autoUpdate`: re-dispatch a component when a value it read from a SourceDefinition changes. A binding's own `autoUpdate` overrides it, and an `app.oam.dev/publishVersion` pin suppresses this default unless the binding sets `autoUpdate: true`. |
| `EnableDefinitionInheritance` | Alpha | `false` | `featureGates.enableDefinitionInheritance` | `false` | Allow `spec.extends` on ComponentDefinitions and TraitDefinitions. |
| `EnableCrateComponent` | Alpha | `false` | `featureGates.enableCrateComponent` | `false` | Install a crate as an Application component (`type: crate`). With the gate off, an Application that uses `type: crate` is rejected. See [Crate Registries](../crate/crate-registry.md#turn-the-feature-on). |
| `EnableAddonComponent` | Alpha | `false` | `featureGates.enableAddonComponent` | `false` | Install an addon as an Application component (`type: addon`). |
| `AutoMigrateLegacyConfigs` | Alpha | `false` | `featureGates.autoMigrateLegacyConfigs` | `false` | Adopt v1.11 config templates and configs into `ConfigTemplate` and `Config` resources once, at startup. See [Migrate Configs to ConfigTemplate and Config](../../upgrade-guides/v1.12/config-migration.md#migrate-automatically-at-startup). |
| `DisableWorkflowHTTP` | Alpha | `false` | `featureGates.disableWorkflowHTTP` | `false` | Disable outbound HTTP from workflow `request` and `webhook` steps. |
| `BlockPrivateHTTPAddresses` | Alpha | `false` | `featureGates.blockPrivateHTTPAddresses` | `false` | Block workflow outbound HTTP to RFC 1918 and ULA addresses. |
| `EnableSuspendOnFailure` | Alpha | `false` | `workflow.enableSuspendOnFailure` | `false` | Suspend a workflow when a step fails, instead of retrying. |
| `DeprecatedPolicySpec` | Alpha | `false` |  |  | Allow the deprecated policy spec. |
| `LegacyObjectTypeIdentifier` | Alpha | `false` |  |  | Allow the legacy object type identifier in `ref-objects`. |
| `DeprecatedObjectLabelSelector` | Alpha | `false` |  |  | Allow the deprecated object label selector in `ref-objects`. |
| `LegacyResourceTrackerGC` | Beta | `false` |  |  | Garbage-collect legacy ResourceTrackers in managed clusters. |
| `LegacyResourceOwnerValidation` | Alpha | `false` |  |  | Let an Application take over an existing resource that has no owner Application. |
| `DisableReferObjectsFromURL` | Alpha | `false` |  |  | Disallow `ref-objects` that load objects from a URL. |

When the controller starts, it writes its feature gates to the `kubevela-feature-gates` ConfigMap; see [Feature gates ConfigMap](../advanced-install.mdx#feature-gates-configmap).
