---
title: Caching and Operations
---

This page explains when a source is fetched, what happens when a fetch fails, and how to see and change the state. It is for platform engineers who run sources.

## How a value is resolved

The cache is demand-driven. The controller refreshes a source only when a render needs it and the entry is missing or expired. There is no background refresh loop.

For each source that a render reads, the controller does this:

1. Compute the cache key from the definition's `$internal` block, the binding's properties, and the context.
2. Look in the in-memory cache. On a hit, use the value.
3. Otherwise read the Secret backing the cache `Config`. If its last successful sync has not expired under `storageTTL`, use it and load it into memory.
4. Otherwise run the definition's `template`. On success, write the `Config` and use the value.
5. If the template fails, apply the [stale-data policy](#when-a-refresh-fails).

Two layers hold the data:

| Layer | Lives in | Lifetime |
|---|---|---|
| In-memory | The controller process, shared by every Application that resolves to the same key | 30s, or `storageTTL` if that is shorter, counted from when the value was loaded. Lost on restart |
| `Config` and its Secret | The API server, in the system namespace | Survives restarts. A stale entry that has not been accessed for three times `storageTTL` is garbage-collected |

Entries expire after `storageTTL`, which defaults to `15m`. A shorter value gives fresher data and more external calls. A longer one reduces load but serves older values.

The in-memory layer does not extend `storageTTL`. A freshly written value is held for the shorter of 30 seconds and `storageTTL`; a value loaded from the API server is held for the shorter of 30 seconds and the time remaining before its persistent expiry. An expired value is never copied into memory, so a stale entry always goes through the [stale-data policy](#when-a-refresh-fails).

When several components in one Application read the same source, the first one fetches and the others hit the cache.

## When a refresh fails

`storage.onStaleFailure` in the definition decides what happens when a refresh fails and an older value exists:

| Value | Behavior |
|---|---|
| `use-stale` (default) | Serve the last good value and mark the source `Stale`. Refresh attempts back off from 30 seconds, doubling up to `storageTTL`; the phase returns to `Resolved` once a refresh succeeds |
| `fail` | Treat the failure like a first load: block the render and show the error |

Use `fail` where an out-of-date value is worse than no value, such as a lookup that grants or denies access. The built-in `vela-app`, `vela-component` and `vela-addon` sources use it, so a health check never reports an old state as current.

With `use-stale`, the stale value is served for as long as refreshes keep failing. Nothing evicts it after a time limit. Treat a source that stays `Stale` for long as an alert, because its data source is unreachable.

If the first fetch fails and there is no older value, the render fails and the source is `Failed`.

## Application status

Each Application reports its sources once, in `status.sources[]`:

```yaml
status:
  sources:
    - name: clusterInfo
      type: cluster-lookup
      phase: Resolved
      autoUpdate: true
      resolutions:
        - storageKey: cluster-lookup-local-f80a79e7bb3a213e
          clusters: [local]
          phase: Resolved
          expiresAt: "2026-08-19T16:30:00Z"
      consumedBy:
        - definitionKind: component
          name: api
          type: webservice
          cluster: local
          namespace: default
          values:
            - property: region
              sourceAttr: region
              value: us-east-1
```

| Phase | Meaning |
|---|---|
| `Resolved` | Fetched, and a current value is being served |
| `Stale` | A refresh failed and the previous value is still served |
| `Failed` | Could not be resolved |
| `Unused` | Declared, but nothing reads it |

The phase of a binding is the worst phase among its resolutions. A resolution is keyed by its storage key. A source keyed on `context.cluster` has one resolution per cluster, each with its own expiry.

`consumedBy` lists each reader and the properties it took. A trait appears as `<component>/<trait>`. A `value` is hidden when the field is `+sensitive` or the binding's [`statusPolicy`](./using-sources.md#control-what-status-records) masks it.

## Inspect and change cache state

Cache entries are `Config` objects. Use the `vela config` commands to read them, rather than reading the underlying objects directly:

```bash
# Per-source phase, and who read each value
vela status <app> --sources

# List entries for the current cluster-lookup schema version
vela config list -t source-cluster-lookup-b2d9405c

# Force a refresh after the in-memory copy expires (at most 30s)
vela config delete cluster-lookup-local-f80a79e7bb3a213e
```

Each entry carries labels and annotations that record its identity and inputs, so you can find it with a selector:

```yaml
labels:
  sourcedefinition.oam.dev/name: tenant-lookup
  sourcedefinition.oam.dev/namespace: vela-system
  sourcedefinition.oam.dev/ctx.cluster: local
annotations:
  sourcedefinition.oam.dev/key-inputs: '["cluster","namespace"]'
  sourcedefinition.oam.dev/context: '{"cluster":"local","namespace":"default"}'
  sourcedefinition.oam.dev/properties: '{"fallback":"unknown"}'
  sourcedefinition.oam.dev/template-hash: 4593f50ece3f5c52
```

The resolved output is deliberately not copied into metadata, because encryption at rest covers a Secret's data and not its labels or annotations.

Deleting an entry does not invalidate the controller's in-memory copy, which may continue serving the old value for up to 30 seconds. After that copy expires, the next reconcile runs the template. If the template fails, there is no persistent stale value to fall back on, and renders that read the source fail until it is reachable again.

## Common failures

| Symptom | Likely cause |
|---|---|
| Applying an Application is refused with an `$(...)` error that you did not expect | The Application holds a `$(VAR_NAME)` string meant for Kubernetes, for example in `env` or `args`. Write `$$(VAR_NAME)` to keep it literal |
| Expressions are ignored | `EnableCelExpressions` is off, or the cluster is in opt-in mode and the Application lacks the annotation |
| A source is `Failed` with a message about a missing field | The resolved output does not match `schema`. Check the data the definition reads |
| A source is `Stale` | A refresh is failing. Check the message under `resolutions[]` and whether the data source is reachable |
| `"source" cannot be read here` | The expression is in a built-in policy or an Application-scoped policy, which can read only `context` |
| Components are not updated after a source changes | `autoUpdate` is off for the binding and the gate is off, or `publishVersion` pins a binding that does not explicitly set `autoUpdate: true` |

## Security notes

- When the `ValidateDefinitionPermissions` gate is enabled (chart value `authorization.definitionValidationEnabled=true`), an application author needs `get` on a SourceDefinition to bind it, and admission checks it with a `SubjectAccessReview`. This check is disabled by default.
- Application authors cannot read anything outside a definition's `schema`.
- Treat a definition's reach as part of its grant. A definition that reads another namespace gives every binder that reach, so keep definitions narrow, and note that `configmap-local` reads only the Application's own namespace for this reason.
- Status is not a secret store. Mark secret fields `// +sensitive` in the schema, and use `statusPolicy` for values that only the consuming Application considers secret.
