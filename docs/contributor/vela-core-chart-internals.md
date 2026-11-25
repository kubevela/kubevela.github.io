---
title: vela-core Chart Internals
---

This page explains how the `vela-core` Helm chart installs certificates and the built-in definitions in KubeVela 1.12. Read it before you change `charts/vela-core` or debug an install or upgrade. For the operator view, see the [KubeVela v1.12.0 release notes](/release-notes/v1.12/v1.12.0/) and the [v1.11 to v1.12 upgrade guide](/upgrade-guides/v1.12/).

## Runtime serving certificates

Before 1.12, `kube-webhook-certgen` Jobs created the webhook certificate and patched the `caBundle` after the release was installed. Since Kubernetes 1.36, the API aggregator verifies the `APIService` `caBundle` when it checks availability. The chart rendered the cluster-gateway `APIService` with a `Cg==` placeholder and relied on a post-install Job. A fresh `helm install --wait` therefore deadlocked: vela-core waited for the `APIService`, and Helm waited for vela-core before it ran the Job.

vela-core now does this work itself. Two flags turn it on, and the chart sets them only when cert-manager is off:

| Flag | Set by the chart when | What vela-core does |
| ---- | --------------------- | ------------------- |
| `--webhook-tls-secret=<namespace>/<fullname>-admission` | `admissionWebhooks.enabled` and `admissionWebhooks.patch.enabled` are on | Creates or reuses the serving certificate Secret, writes the certificate to its cert directory, sets the `caBundle` of the webhook configurations, and sets `failurePolicy` once its webhook server is serving. |
| `--cluster-gateway-tls-secret=<namespace>/<fullname>-cluster-gateway-tls-v2` | `multicluster.enabled` and `multicluster.clusterGateway.secureTLS.enabled` are on | Creates or reuses the cluster-gateway serving certificate Secret and sets the `caBundle` of the `v1alpha1.cluster.core.oam.dev` `APIService` before it waits for the `APIService`. |
| `--cluster-gateway-service=<namespace>/<release>-cluster-gateway-service` | with the flag above | Sets the `APIService` `caBundle` only when the `APIService` points at this Service, so an `APIService` that another controller owns is left alone. |

Behavior to keep in mind:

- A resync every minute renews certificates and repairs a `caBundle` or `failurePolicy` that something reset.
- The CA keeps its key in the Secret, so renewing a serving certificate does not change the `caBundle`. A replaced CA stays trusted for an overlap period.
- Secrets that the old Jobs created are reused, so upgrades keep the same CA.
- Tools that render without cluster access (`helm template`, Argo CD) render `failurePolicy: Ignore`. vela-core sets the real value at runtime.
- With `admissionWebhooks.patch.enabled=false` and no cert-manager, the operator supplies the Secret and `caBundle`.

When you run the controller from your IDE, follow [Debugging KubeVela webhooks](../platform-engineers/debug/debugging-kubevela-with-webhook.md) and [Multicluster Debugging](../platform-engineers/debug/multicluster-debugging.md). They explain which of these flags to pass and which to leave out.

## Built-in definitions as hook Jobs

The built-in definitions are no longer templates in the release. The chart ships them as ConfigMaps and applies them from three hook Jobs. The Jobs run `files/builtin-definitions/<action>.sh` with `kubectl`. They use the controller's ServiceAccount, which exists in every phase these hooks run in.

| Job | Helm hook | Weight | Script | Purpose |
| --- | --------- | ------ | ------ | ------- |
| `<fullname>-builtin-definitions-keep` | `pre-upgrade` | 0 | `keep.sh` | Annotates the built-in definitions that this release owns with `helm.sh/resource-policy=keep`, so Helm does not delete them, or their `DefinitionRevision`s, while ownership moves to the hook. |
| `<fullname>-builtin-definitions-apply` | `post-install`, `post-upgrade`, `post-rollback` | 10 | `apply.sh` | Waits for the controller rollout, then runs `kubectl apply --server-side --force-conflicts --field-manager=vela-core-builtin-definitions`. It retries a failed apply. With cert-manager on, it first waits until every webhook has a `caBundle`, because the cert-manager CA injector sets it on its own schedule. |
| `<fullname>-builtin-definitions-delete` | `pre-delete` | 0 | `delete.sh` | Deletes the definitions on `helm uninstall`. It does nothing when no Helm uninstall of the release is in progress, so it cannot remove definitions when the chart is applied from `helm template` output. |

All three use the hook delete policy `before-hook-creation,hook-succeeded`. The apply Job waits for the rollout so the new webhook, not the pod being replaced, validates the definitions. Job and label names are cut to 63 characters.

The Jobs read `builtinDefinitions.job.*` from the values: `image`, `rolloutTimeoutSeconds` (default 300) and `applyRetries` (default 6). The `kubevela.builtinDefinitionsJobValues` helper fills in defaults, so an upgrade with `--reuse-values`, which renders without this chart's defaults, still works for a release that predates these values.

When you add a built-in definition, add its YAML under `charts/vela-core/definitions`. The Jobs pick it up from the mounted ConfigMaps.

## Feature gates ConfigMap

At startup the controller publishes its KubeVela feature gates to the `kubevela-feature-gates` ConfigMap in its namespace (`FeatureGatesConfigMapName` in `pkg/features/publish.go`). Each gate is a key with the value `true` or `false`, and the annotation `core.oam.dev/kubevela-version` records the version that wrote it. Other processes that run KubeVela code, such as VelaUX, read it to behave as the controller does. If you add a feature gate, it is published without extra code.

## Test your change

1. Run the unit tests: `make unit-test-core`.
2. Run the shipped definition tests: `make test-definitions`. It runs `vela def test vela-templates/definitions/internal --check-pending`, which fails a `@pending` case that now passes, and then checks that every definition and parameter is covered.
3. Render the chart and look at the hooks: `helm template kubevela ./charts/vela-core --namespace vela-system | grep -B2 -A6 'helm.sh/hook'`.
4. Install on a cluster with `--wait`, which used to deadlock on Kubernetes 1.36: `helm install kubevela ./charts/vela-core -n vela-system --create-namespace --wait`.
5. Upgrade from 1.11: install the 1.11 chart, then run `helm upgrade` with your chart. Check that the apply Job succeeds, that `kubectl get componentdefinition -n vela-system` still lists the definitions, and that the Secrets and `caBundle` values did not change.
6. Uninstall and check that the built-in definitions are gone.
