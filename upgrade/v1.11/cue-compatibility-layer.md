---
title: CUE 0.14 Compatibility Layer
---

Starting with v1.11.0, KubeVela upgrades its underlying CUE engine from v0.9.2 to v0.14.1. CUE v0.14 turns two previously-tolerated patterns into hard errors and enables two new experimental evaluator behaviors by default. Any ComponentDefinition, TraitDefinition, PolicyDefinition, or WorkflowStepDefinition written against the old rules can fail to render after the upgrade.

To keep existing definitions working without requiring every operator to hand-edit CUE templates, KubeVela ships a compatibility layer that automatically rewrites legacy syntax at render time, plus CLI tooling to find and permanently fix affected definitions.

## What changed in CUE v0.14

- **List arithmetic** (`+`, `*` on lists) is now a hard error.
- **Unquoted `error` field labels** (e.g. `error: "message"` instead of `"error": "message"`) are now a hard error.
- **`evalv3`** (stricter cycle detection) and **`keepvalidators`** (concretization of validators) are enabled by default. Both can silently break definitions that conditionally refine `bool | *false` fields from optional parameters, or that rely on custom error messages surviving cycle detection.

If your definitions were written before v1.11.0, assume at least one of these affects you until you've scanned them (see below).

## The auto-remediation layer

`pkg/cue/upgrade` (wired in via [#7199](https://github.com/kubevela/kubevela/pull/7199) and [#7215](https://github.com/kubevela/kubevela/pull/7215)) intercepts CUE templates at render time, detects legacy syntax, and rewrites it in memory before compilation. The definition stored in Kubernetes is never modified — only the copy used for rendering.

The master switch and cache size were introduced first; the six per-pass toggles below were added afterward in [#7229](https://github.com/kubevela/kubevela/pull/7229), which split the engine into independently controllable passes. All are flags on the `kubevela-controller`:

| Flag | Default | Purpose |
|---|---|---|
| `--enable-cue-version-compatibility` | `true` | Master switch for the whole layer. Set to `false` to render templates exactly as written (fails hard on legacy syntax). |
| `--cue-compatibility-cache-size` | `2000` | Max number of rewritten templates cached (1h TTL). Set to `0` to disable caching. |
| `--cue-upgrade-list-concat-enabled` | `true` | Rewrite pass for list-arithmetic syntax. |
| `--cue-upgrade-error-field-label-enabled` | `true` | Rewrite pass for unquoted error field labels. |
| `--cue-upgrade-bool-default-guard-enabled` | `false` | Rewrite pass for the `bool \| *false` default-guard hazard under `evalv3`/`keepvalidators`. |
| `--cue-upgrade-generic-default-guard-enabled` | `false` | Same as above, generalized to non-bool default guards. |
| `--cue-upgrade-keepvalidators-singleton-enabled` | `false` | Rewrite pass for `keepvalidators` singleton concretization issues. |
| `--cue-upgrade-evalv3-selfref-guard-enabled` | `false` | Rewrite pass for `evalv3` self-reference default-guard issues. |

The two enabled-by-default passes (list concat, error field label) cover the syntax that is now a **hard error**. The four disabled-by-default passes address **behavioral** differences under `evalv3`/`keepvalidators` — turn them on only if you've confirmed you're hitting the specific hazard, since they change evaluation semantics rather than just syntax.

These flags apply to both the main controller (`github.com/oam-dev/kubevela/pkg/cue/upgrade`) and the workflow engine (`github.com/kubevela/workflow` v0.7.0+, `pkg/cue/upgrade`) — WorkflowStepDefinitions are covered by the same switches, not just Component/Trait/Policy definitions.

:::note Why these flags matter even though `evalv3`/`keepvalidators` are off by default
The chart ships with `CUE_EXPERIMENT=evalv3=0,keepvalidators=0` (see below) purely to keep v1.11.0 compatible with definitions written against the older CUE v0.9.2 behavior — it is a temporary bridge for the v0.14.x window, not a permanent setting. If you want to start benefiting from `evalv3`'s stricter, more correct cycle detection now, you can flip `featureGates.enableCueExpVariable` to `false` (or clear `CUE_EXPERIMENT`) to turn it on ahead of time, and use the `--cue-upgrade-bool-default-guard-enabled`, `--cue-upgrade-generic-default-guard-enabled`, `--cue-upgrade-keepvalidators-singleton-enabled`, and `--cue-upgrade-evalv3-selfref-guard-enabled` passes to keep any legacy definitions that hit those specific hazards working while you do.

In a future CUE release, `evalv3` (and `keepvalidators`) will no longer be gated behind an experiment at all — they'll simply be **on by default** with no `CUE_EXPERIMENT` opt-out. At that point `CUE_EXPERIMENT=evalv3=0,keepvalidators=0` stops having any effect, and these render-time rewrite passes become the only remaining mitigation for definitions that haven't been permanently fixed with `vela def upgrade`.
:::

## Disabling the breaking CUE experiments via Helm

As a coarser alternative (or complement) to the render-time rewrite layer, the `vela-core` Helm chart can inject `CUE_EXPERIMENT` directly into the controller to turn off `evalv3` and `keepvalidators` at the CUE runtime level ([#7225](https://github.com/kubevela/kubevela/pull/7225)):

```yaml
featureGates:
  # Injects CUE_EXPERIMENT=evalv3=0,keepvalidators=0 into the controller container.
  # Default: true for the v1.11.x series, to keep the upgrade non-breaking out of the box.
  enableCueExpVariable: true
```

For any other environment variable, use the general-purpose escape hatch:

```yaml
extraEnvs:
  - name: SOME_OTHER_VAR
    value: "some-value"
```

`extraEnvs` and `featureGates.enableCueExpVariable` are independent — if you need a different `CUE_EXPERIMENT` value than the chart default, set `featureGates.enableCueExpVariable: false` and provide your own `CUE_EXPERIMENT` entry under `extraEnvs` instead of setting both (the controller container would otherwise receive two `CUE_EXPERIMENT` env entries).

```
helm upgrade -n vela-system --install kubevela kubevela/vela-core \
  --version 1.11.0 \
  --set featureGates.enableCueExpVariable=false \
  --set-json 'extraEnvs=[{"name":"CUE_EXPERIMENT","value":"evalv3=0,keepvalidators=0,otherflag=1"}]' \
  --wait
```

## Finding affected definitions

Scan every definition (and its revision history) across all namespaces for legacy syntax:

```
vela def compatibility-check definitions
# alias: vela def compat definitions

# only the current live definition, skip revision history
vela def compatibility-check definitions --latest-revision-only

# narrow by namespace / labels / annotations, or change output format
vela def compatibility-check definitions -n my-namespace -o yaml
```

Scan active `ApplicationRevisions` to see which running applications are relying on the compatibility layer right now:

```
vela def compatibility-check applications
# alias: vela def compat applications
```

Both commands report, per definition or application, which specific incompatibility was found, the CUE version that introduced it, and the affected revisions — so you know exactly what to fix and where.

## Permanently fixing a definition

Once you know a definition needs updating, rewrite it on disk rather than relying on the render-time layer indefinitely:

```
# check if a file needs upgrading (exit code 1 if so), without modifying it
vela def upgrade my-definition.cue --validate

# rewrite in place
vela def upgrade my-definition.cue

# write the rewritten version to a new file
vela def upgrade my-definition.cue -o my-definition.upgraded.cue

# target a specific KubeVela version's compatibility rules
vela def upgrade my-definition.cue --target-version=v1.11
```

`vela def apply` also warns at apply time when the definition being applied contains syntax the compatibility layer would otherwise need to rewrite.

## Recommended upgrade path

1. Upgrade the `vela-core` chart to v1.11.0. `featureGates.enableCueExpVariable` defaults to `true` and `--enable-cue-version-compatibility` defaults to `true` on the controller, so existing applications keep working immediately.
2. Run `vela def compatibility-check definitions` and `vela def compatibility-check applications` to see what's relying on the compatibility layer.
3. Run `vela def upgrade` against each affected definition file and re-apply it, so the stored definition itself is CUE v0.14-native.
4. Once nothing is flagged by `vela def compatibility-check`, you can leave the compatibility layer enabled (it's a no-op for compliant definitions) or disable it with `--enable-cue-version-compatibility=false` for stricter enforcement going forward.

## Known limitation

Workflow step templates evaluated at execution time by the `kubevela/workflow` engine were not covered by the compatibility layer prior to `kubevela/workflow` v0.7.0. KubeVela v1.11.0 bundles v0.7.0 or later, which wires in the same rewrite passes — if you're consuming `kubevela/workflow` independently of the `vela-core` chart, confirm you're on v0.7.0+.
