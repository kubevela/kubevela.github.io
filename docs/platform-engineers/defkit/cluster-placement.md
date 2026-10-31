---
title: Cluster Placement
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The `placement` sub-package provides a type-safe Go API for expressing cluster-label conditions, logical combinators (`All`, `Any`, `Not`), and the evaluation logic that `vela def apply-module` runs at apply time. Placement constraints do not alter generated CUE or the installed ComponentDefinition/TraitDefinition — they control *whether* a definition is applied at all. Any definition type (component, trait, policy, workflow step) supports `.RunOn()` and `.NotRunOn()`.

## Label & LabelConditionBuilder

`placement.Label(key)` creates a builder that chains into a single `LabelCondition`. Import: `"github.com/oam-dev/kubevela/pkg/definition/defkit/placement"`.

| Function / Method | Description |
|---|---|
| `placement.Label(key string) *LabelConditionBuilder` | Starts a condition on the cluster label with the given key. Chain one comparison method below. |
| `.Eq(value string) *LabelCondition` | Matches when the label equals `value`. |
| `.Ne(value string) *LabelCondition` | Matches when the label does not equal `value` (or when the key is absent). |
| `.In(values ...string) *LabelCondition` | Matches when the label value is any of the listed values. |
| `.NotIn(values ...string) *LabelCondition` | Matches when the label value is none of the listed values, or the key is absent. |
| `.Exists() *LabelCondition` | Matches when the label key is present (any value). |
| `.NotExists() *LabelCondition` | Matches when the label key is absent. |

The `Operator` constants (`Eq`, `Ne`, `In`, `NotIn`, `Exists`, `NotExists`) come from `placement.OperatorEquals` etc. and are also the exact strings used in the `module.yaml` `placement:` block — case-sensitive. `Operator: equals` or `Operator: ==` will fail to parse.

## Logical Combinators

Combine conditions with AND, OR, and NOT. Combinators can be nested to express complex rules.

| Function | Description |
|---|---|
| `placement.All(conditions ...Condition) *AllCondition` | All conditions must match (AND). An empty `All()` always matches. |
| `placement.Any(conditions ...Condition) *AnyCondition` | At least one condition must match (OR). An empty `Any()` never matches. |
| `placement.Not(condition Condition) *NotCondition` | Inverts a condition. A nil inner condition always matches. |

All three return types implement the `placement.Condition` interface, so they can be nested freely and passed to `.RunOn()` / `.NotRunOn()` as arguments.

## `.RunOn()` / `.NotRunOn()` Placement Attachment

Wire placement constraints into any definition type. Both methods are available on `ComponentDefinition`, `TraitDefinition`, `PolicyDefinition`, and `WorkflowStepDefinition`.

| Method | Description |
|---|---|
| `.RunOn(conditions ...placement.Condition) *<DefType>` | Adds conditions that must ALL match for the definition to be applied. Multiple `.RunOn()` calls accumulate (AND semantics). |
| `.NotRunOn(conditions ...placement.Condition) *<DefType>` | Adds conditions that must NOT match. If any single condition matches the cluster, the definition is skipped. Multiple calls accumulate. |

:::tip
Pass multiple conditions in a single `.RunOn()` call and they are ANDed together. To express OR semantics, wrap them in `placement.Any(...)` first.
:::

:::caution
Placement constraints are evaluated against the `vela-cluster-identity` ConfigMap in the `vela-system` namespace — not against Kubernetes Node labels. ConfigMap data keys must be alphanumeric with `-`, `_`, or `.` only (no `/`). Conditions keyed on `topology.kubernetes.io/region` will never match unless you use a key-safe alias in the ConfigMap.
:::

## `placement.Evaluate()` / `placement.ValidatePlacement()` Runtime Helpers

These helpers are for testing and validation, not for production use in definition templates.

| Function | Signature | Description |
|---|---|---|
| `placement.Evaluate` | `func Evaluate(spec PlacementSpec, labels map[string]string) PlacementResult` | Programmatically checks whether a cluster (given its label map) satisfies a `PlacementSpec`. Returns a `PlacementResult` with `.Eligible bool`, `.Reason string`, `.MatchedRunOn []string`, and `.MatchedNotRunOn []string`. |
| `placement.ValidatePlacement` | `func ValidatePlacement(spec PlacementSpec) error` | Detects logically conflicting constraints at definition-build time — e.g. the same label required in both `RunOn` and `NotRunOn`. Returns a `*ValidationError` with the conflicting condition strings. |
| `placement.GetClusterLabels` | `func GetClusterLabels(ctx context.Context, c client.Client) (map[string]string, error)` | Reads the `vela-cluster-identity` ConfigMap. Returns an empty map (not an error) if the ConfigMap is absent. Used internally by `vela def apply-module`. |
| `placement.GetEffectivePlacement` | `func GetEffectivePlacement(module, definition PlacementSpec) PlacementSpec` | Returns the effective placement spec: definition constraints override module defaults; if the definition has no constraints, module defaults are inherited. |

:::info
`vela def apply-module` calls `GetClusterLabels` once per run, logs the labels, and then calls `Evaluate` for each definition. A definition is applied only when `Eligible == true`. Definitions that do not match are skipped silently — no error is raised, and the installed definition is left unchanged.
:::

## `module.yaml` `placement:` Schema

The YAML `placement:` block sets module-wide defaults. Any definition that does not declare its own `.RunOn()` / `.NotRunOn()` inherits this spec; definitions that do declare per-definition placement are not affected by the module block.

| YAML key | Type | Description |
|---|---|---|
| `spec.placement.runOn` | `[]Condition` | Module-level RunOn. All conditions must match for any definition in this module to be applied (unless overridden per-definition). Omit or leave empty to skip the gate. |
| `spec.placement.notRunOn` | `[]Condition` | Module-level NotRunOn. If any condition matches, every definition in the module that has no per-definition placement is skipped. |

Each `Condition` entry under `runOn` / `notRunOn` has this shape:

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Cluster label key to match (ConfigMap-safe: no `/`). |
| `operator` | `string` | One of `Eq`, `Ne`, `In`, `NotIn`, `Exists`, `NotExists` — case-sensitive. |
| `values` | `[]string` | Values to compare. Required for `Eq`, `Ne`, `In`, `NotIn`. Ignored by `Exists`, `NotExists`. |

Module-wide and per-definition placement use **override, not merge** semantics. If a definition has any per-definition placement, the module block is ignored completely for that definition (see `placement.GetEffectivePlacement`). Module hooks (`pre-apply` / `post-apply`) always run regardless of placement results.

When `vela def apply-module` runs it prints the labels it evaluated against — e.g. `Cluster labels: environment=production, provider=aws, region=us-west-2` — so you can confirm what placement sees. A `Cluster labels: (no labels)` line means the ConfigMap is absent or empty: `RunOn` rules will fail (no labels to satisfy them) and `NotRunOn` rules pass trivially.

## Example

Let's build a `placement-demo` component that targets production cloud clusters. Behind the scenes the template exercises every API listed above: `placement.Label(...).Exists()`, `placement.Label(...).In(...)`, `placement.Label(...).Ne(...)`, `placement.Label(...).Eq(...)`, `placement.All(...)`, `placement.Any(...)`, `placement.Not(...)`, `.RunOn(...)`, and `.NotRunOn(...)`. The `module.yaml` tab shows the closest module-scope equivalent — note that `module.yaml`'s `placement` block only accepts flat `LabelCondition` entries (combinators like `All`/`Any`/`Not` are Go-only), so the `Any(In(...), Eq("on-prem"))` branch is flattened into a single `In` and the `Ne("development")` condition is kept as a sibling entry; if you need real OR/NOT semantics at module scope, express them per-definition in Go. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import (
    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"
)

func PlacementDemo() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Container image to run")
    replicas := defkit.Int("replicas").
        Default(1).
        Description("Number of replicas")
    region := defkit.String("region").
        Optional().
        Description("Cloud region label (informational)")

    return defkit.NewComponent("placement-demo").
        Description("Demonstrates cluster placement: RunOn (provider+env) and NotRunOn (vcluster)").
        Workload("apps/v1", "Deployment").
        RunOn(
            placement.Label("region").Exists(),
            placement.All(
                placement.Any(
                    placement.Label("provider").In("aws", "gcp", "azure"),
                    placement.Label("provider").Eq("on-prem"),
                ),
                placement.Label("environment").Ne("development"),
            ),
        ).
        NotRunOn(
            placement.Label("cluster-type").Eq("vcluster"),
        ).
        Params(image, replicas, region).
        Template(placementDemoTemplate)
}

func placementDemoTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    replicas := defkit.Int("replicas")
    region := defkit.String("region")

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.replicas", replicas).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        SetIf(region.IsSet(), "spec.template.metadata.labels[region]", region).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image)

    tpl.Output(dep)
}

func init() { defkit.Register(PlacementDemo()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"placement-demo": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Demonstrates cluster placement: RunOn (provider+env) and NotRunOn (vcluster)"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
      }
      type: "deployments.apps"
    }
  }
}
template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: {
      name: context.name
    }
    spec: {
      replicas: parameter.replicas
      selector: {
        matchLabels: {
          "app.oam.dev/component": context.name
        }
      }
      template: {
        metadata: {
          labels: {
            "app.oam.dev/component": context.name
            if parameter["region"] != _|_ {
              "region": parameter.region
            }
          }
        }
        spec: {
          containers: [{
            name:  context.name
            image: parameter.image
          }]
        }
      }
    }
  }
  parameter: {
    // +usage=Container image to run
    image: string
    // +usage=Number of replicas
    replicas: *1 | int
    // +usage=Cloud region label (informational)
    region?: string
  }
}
```

</TabItem>
<TabItem value="module-yaml" label="module.yaml">

```yaml
apiVersion: core.oam.dev/v1beta1
kind: DefinitionModule
metadata:
  name: my-platform
spec:
  description: Platform definitions — production cloud clusters only.
  maintainers:
    - name: Platform Team
      email: platform@example.com
  placement:
    runOn:
      - key: region
        operator: Exists
      - key: provider
        operator: In
        values: ["aws", "gcp", "azure", "on-prem"]
      - key: environment
        operator: Ne
        values: ["development"]
    notRunOn:
      - key: cluster-type
        operator: Eq
        values: ["vcluster"]
```

</TabItem>
<TabItem value="application" label="Application YAML">

Once `placement-demo` has been admitted by `vela def apply-module` (Case B in [Apply and verify](#apply-and-verify) below), consume it from a regular Application. The component is filtered out of the cluster entirely in cases where placement fails, so this Application can only be deployed when the cluster identity matches.

```yaml title="placement-demo-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: placement-demo-app
  namespace: default
spec:
  components:
    - name: placement-demo
      type: placement-demo
      properties:
        image: nginx:stable
        replicas: 1
        region: us-west-2
```

Live deploy + rendered Deployment fields against the same k3d cluster used in Case B below:

```
NAME                 COMPONENT        TYPE             PHASE     HEALTHY   STATUS   AGE
placement-demo-app   placement-demo   placement-demo   running   true               87s
```

```shell
kubectl get deployment placement-demo -o jsonpath='replicas={.spec.replicas} image={.spec.template.spec.containers[0].image} region-label={.spec.template.metadata.labels.region}'
# replicas=1 image=nginx:stable region-label=us-west-2
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

### Apply and verify

Placement is evaluated at `vela def apply-module` time, not at `Application` deploy time. The cluster's identity is taken from the `vela-cluster-identity` ConfigMap in `vela-system` — each data key becomes a cluster label, and missing keys make `Exists()` / `In()` / `Eq()` checks fail. ConfigMap data keys must be alphanumeric with `-`, `_`, or `.` only — no `/`.

Because placement is driven by a single ConfigMap, you can exercise every branch on a single cluster by editing that ConfigMap and re-running `apply-module`. Below are three cases captured against the same cluster — the only thing that changes between cases is the ConfigMap.

**Case A — `region` label missing (RunOn fails):**

```shell
kubectl create configmap vela-cluster-identity -n vela-system \
  --from-literal=dummy=placeholder
vela def apply-module ./my-platform --conflict=overwrite
```

```
Checking placement constraints...
Cluster labels: dummy=placeholder
  ✗ ComponentDefinition placement-demo: skipped (runOn conditions not satisfied: region exists)
```

```shell
kubectl get componentdefinition placement-demo -n vela-system
# Error from server (NotFound): componentdefinitions.core.oam.dev "placement-demo" not found
```

**Case B — full RunOn match (definition applied):**

```shell
kubectl delete configmap vela-cluster-identity -n vela-system
kubectl create configmap vela-cluster-identity -n vela-system \
  --from-literal=region=us-west-2 \
  --from-literal=provider=aws \
  --from-literal=environment=production
vela def apply-module ./my-platform --conflict=overwrite
```

```
Checking placement constraints...
Cluster labels: environment=production, provider=aws, region=us-west-2
  ✓ ComponentDefinition placement-demo: eligible
ComponentDefinition placement-demo created in namespace vela-system
```

```shell
kubectl get componentdefinition placement-demo -n vela-system
# NAME             WORKLOAD-KIND   DESCRIPTION
# placement-demo   Deployment      Demonstrates cluster placement: RunOn (provider+env) and NotRunOn (vcluster)
```

**Case C — `cluster-type=vcluster` triggers NotRunOn (definition excluded):**

```shell
kubectl delete componentdefinition placement-demo -n vela-system
kubectl delete configmap vela-cluster-identity -n vela-system
kubectl create configmap vela-cluster-identity -n vela-system \
  --from-literal=region=us-west-2 \
  --from-literal=provider=aws \
  --from-literal=environment=production \
  --from-literal=cluster-type=vcluster
vela def apply-module ./my-platform --conflict=overwrite
```

```
Checking placement constraints...
Cluster labels: cluster-type=vcluster, environment=production, provider=aws, region=us-west-2
  ✗ ComponentDefinition placement-demo: skipped (excluded by notRunOn: cluster-type = vcluster)
```

```shell
kubectl get componentdefinition placement-demo -n vela-system
# Error from server (NotFound): componentdefinitions.core.oam.dev "placement-demo" not found
```

Case A demonstrates the RunOn branch failing on a missing label; Case B the success path; Case C the NotRunOn exclusion path — the definition is not applied and any pre-existing installation is left untouched.

Clean up after testing:

```shell
kubectl delete configmap vela-cluster-identity -n vela-system
kubectl delete componentdefinition placement-demo -n vela-system --ignore-not-found
```

## See Also

- [ComponentDefinition](./definition-component.md) — define workload types
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [PolicyDefinition](./definition-policy.md) — define application policies
- [WorkflowStepDefinition](./definition-workflowstep.md) — define workflow steps
- [Quick Start](./quick-start.md) — scaffolding a `my-platform` module
