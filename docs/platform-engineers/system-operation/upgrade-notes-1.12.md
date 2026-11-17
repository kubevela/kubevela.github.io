---
title: KubeVela 1.12 upgrade notes
---

Read these notes before upgrading from KubeVela 1.11 or earlier.

## Runtime certificates

vela-core now manages the serving certificates for admission webhooks and
cluster-gateway. At startup, it:

- creates or reuses the certificate Secrets;
- sets the `caBundle` on webhook configurations and the cluster-gateway
  `APIService`;
- checks the certificates every minute and renews them when needed.

The old `kube-webhook-certgen` Jobs are no longer used. Existing Secrets from
those Jobs are reused during an upgrade, so the CA does not change.

This change prevents a deadlock with `helm install --wait` on Kubernetes 1.36.
Previously, vela-core could wait for the `APIService` while Helm waited to run
the Job that set its `caBundle`.

vela-core manages certificates when cert-manager is off and these values are
enabled:

- admission webhook: `admissionWebhooks.enabled` and
  `admissionWebhooks.patch.enabled`;
- cluster-gateway: `multicluster.enabled` and
  `multicluster.clusterGateway.secureTLS.enabled`.

If `admissionWebhooks.patch.enabled=false` and cert-manager is off, provide the
Secret and `caBundle` yourself. Other `admissionWebhooks.patch.*` settings only
remain for compatibility with existing values files.

Argo CD renders the webhook `failurePolicy` as `Ignore`. vela-core sets the
configured value at runtime. Add this rule to Argo CD:

```yaml
jqPathExpressions:
  - .webhooks[].failurePolicy
```

## Built-in definitions

Helm no longer owns the built-in definitions directly. Hook Jobs now manage
them:

- A pre-upgrade Job adds `helm.sh/resource-policy=keep` to existing
  definitions. This keeps the definitions and their `DefinitionRevision`
  objects during the change in ownership.
- A post-install, post-upgrade, and post-rollback Job waits for the new
  controller, then applies the definitions with server-side apply.
- A pre-delete Job removes the definitions during `helm uninstall`.

The Jobs use these chart values:

| Value | Default | Purpose |
| ----- | ------- | ------- |
| `builtinDefinitions.job.image.repository` | `alpine/k8s` | Image that provides a shell and `kubectl` |
| `builtinDefinitions.job.image.tag` | `1.31.13` | Image tag |
| `builtinDefinitions.job.image.pullPolicy` | `IfNotPresent` | Image pull policy |
| `builtinDefinitions.job.rolloutTimeoutSeconds` | `300` | Controller rollout timeout; with cert-manager, also the webhook `caBundle` timeout |
| `builtinDefinitions.job.applyRetries` | `6` | Maximum definition apply attempts |

For an air-gapped cluster, mirror the Job image and set
`builtinDefinitions.job.image.repository`.

## Trait conflicts

Admission now rejects an Application when an attached trait conflicts with
another trait through `TraitDefinition.spec.conflictsWith`.

KubeVela 1.11 accepted these Applications. Check existing Applications before
upgrading. An existing Application with conflicting traits is denied the next
time it is updated.

## Built-in definition changes

Some built-in definitions render different resources in 1.12. Test affected
Applications before upgrading. A changed pod template can restart Pods.

Components:

- `task` and `cron-task` render their probes.
- `daemon` renders hostPath `readOnly` and `mountPropagation`.

Traits:

- `storage` renders the PVC `selector`, skips the mount for a block PVC, and
  marks ConfigMap and Secret volumes as `readOnly`.
- `hostalias` combines hostnames that use the same IP.
- `resource` can render CPU or memory by itself.
- `k8s-update-strategy` and `securitycontext` apply their defaults when no
  parameters are set.
- `startup-probe` reads `containerName` from its `probes` form.
- `container-ports` keeps a port without a protocol or name.
- `init-container` keeps the Pod volumes.
- `expose`, `pure-ingress`, and `gateway` can evaluate status before a load
  balancer exists.

Workflow steps:

- `notification` passes the email password.
- `clean-jobs` defaults to the step namespace.
- `check-metrics` applies its documented defaults.
- `vela-cli` renders a hostPath mount as hostPath.
- `request` sets its wait message.
- `apply-terraform-provider` accepts `azure`.
- `webhook` without `url` and `apply-terraform-config` without `source` fail
  before making a call.
- `apply-deployment` and `depends-on-app` wait when status has not been
  reported.

## Application status

The Application `Ready` condition is now `False` after a reconcile failure.
It no longer keeps the `True` value from the previous successful reconcile.
