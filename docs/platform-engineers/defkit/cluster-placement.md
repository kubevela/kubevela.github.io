---
title: Cluster Placement
---

The `placement` sub-package provides a type-safe Go API for expressing label-based conditions, logical combinators (`All`, `Any`, `Not`), and evaluation logic. Constraints are evaluated at `vela def apply-module` time against cluster labels — definitions that don't match are skipped and never applied.

## Why Cluster Placement?

In multi-cluster environments, not all definitions make sense on every cluster. For example:

- An **AWS Load Balancer** component should only deploy to AWS EKS clusters, not GCP or Azure
- A **GPU workload** trait should only apply on clusters with GPU nodes
- A **persistent storage** component should not run on ephemeral virtual clusters
- A **production ingress** should only deploy to production clusters, not development environments

Placement constraints let you encode these rules directly in your definition. When you run `vela def apply-module`, the CLI evaluates each definition's constraints against the target cluster's labels and skips definitions that don't match — preventing misconfiguration before it happens.

## Label Conditions

`placement.Label(key)` creates a builder that supports equality, set membership, and existence checks against the target cluster's labels.

Import: `"github.com/oam-dev/kubevela/pkg/definition/defkit/placement"`

Applies to: **All Definition Types**

```go title="Go — defkit"
import "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"

placement.Label("provider").Eq("aws")
placement.Label("provider").Ne("aws")
placement.Label("cluster-type").In("eks", "self-managed")
placement.Label("env").NotIn("development", "staging")
placement.Label("gpu").Exists()
placement.Label("deprecated").NotExists()
```

```cue title="Evaluated at apply time"
// Placement constraints are evaluated by the CLI
// before applying definitions to the cluster.
// They do NOT appear in generated CUE or YAML output.
```

## Logical Combinators

Combine conditions with logical operators. `All` requires every condition to match. `Any` requires at least one. `Not` negates a condition. Combinators can be nested to express complex placement rules.

Applies to: **All Definition Types**

```go title="Go — defkit"
// All conditions must match
placement.All(
    placement.Label("provider").Eq("aws"),
    placement.Label("env").Eq("production"),
)

// At least one must match
placement.Any(
    placement.Label("provider").Eq("aws"),
    placement.Label("provider").Eq("gcp"),
)

// Negate
placement.Not(placement.Label("cluster-type").Eq("vcluster"))

// Nested
placement.All(
    placement.Any(
        placement.Label("provider").In("aws", "gcp"),
    ),
    placement.Label("env").Eq("production"),
)
```

```cue title="Evaluation logic"
// Evaluation rules (applied by CLI):
// 1. No constraints → eligible everywhere
// 2. All RunOn conditions must match
// 3. No NotRunOn conditions may match
// 4. Eligible = (RunOn matches || empty) &&
//              NOT (NotRunOn matches)
```

## `.RunOn()` / `.NotRunOn()`

Wire placement constraints into any definition type. `.RunOn()` specifies conditions that must ALL match for the definition to be applied. `.NotRunOn()` specifies conditions that must NOT match. Multiple calls accumulate (AND semantics).

Applies to: **All Definition Types**

```go title="Go — defkit"
// AWS-only component
comp := defkit.NewComponent("aws-load-balancer").
    Description("AWS Application Load Balancer").
    RunOn(
        placement.Label("provider").Eq("aws"),
        placement.Label("cluster-type").In("eks", "self-managed"),
    ).
    NotRunOn(
        placement.Label("cluster-type").Eq("vcluster"),
    ).
    Workload("apps/v1", "Deployment").
    Params(defkit.String("image"))

// Exclude virtual clusters only
comp2 := defkit.NewComponent("persistent-storage").
    NotRunOn(placement.Label("cluster-type").Eq("vcluster"))

// GPU trait
trait := defkit.NewTrait("gpu-resource").
    RunOn(placement.Label("gpu").Exists()).
    AppliesTo("deployments.apps")
```

```cue title="CUE output (unchanged)"
"aws-load-balancer": {
    type: "component"
    description: "AWS Application Load Balancer"
    attributes: workload: definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
    }
}
// Placement constraints are NOT
// visible in the generated CUE/YAML
```

## `placement.Evaluate()` / `placement.ValidatePlacement()`

`placement.Evaluate(spec, labels)` programmatically checks whether a cluster (given its label map) satisfies a `PlacementSpec`. Returns a result with `.Eligible` bool and `.Reason` string. `placement.ValidatePlacement(spec)` detects logically conflicting constraints (e.g., same label in RunOn and NotRunOn) at definition-build time.

Applies to: **All Definition Types**

```go title="Go — defkit"
spec := placement.PlacementSpec{
    RunOn: []placement.Condition{
        placement.Label("provider").Eq("aws"),
    },
    NotRunOn: []placement.Condition{
        placement.Label("cluster-type").Eq("vcluster"),
    },
}

labels := map[string]string{
    "provider":     "aws",
    "cluster-type": "eks",
}

result := placement.Evaluate(spec, labels)
// result.Eligible == true
// result.Reason describes why

// Validate for logical conflicts
err := placement.ValidatePlacement(spec)
```

```go title="Go — unit test"
It("should be eligible on AWS EKS clusters", func() {
    comp := defkit.NewComponent("aws-only").
        RunOn(placement.Label("provider").Eq("aws"))

    spec := comp.GetPlacement()
    result := placement.Evaluate(spec, map[string]string{
        "provider": "aws",
    })
    Expect(result.Eligible).To(BeTrue())
})

It("should be ineligible on GCP clusters", func() {
    comp := defkit.NewComponent("aws-only").
        RunOn(placement.Label("provider").Eq("aws"))

    spec := comp.GetPlacement()
    result := placement.Evaluate(spec, map[string]string{
        "provider": "gcp",
    })
    Expect(result.Eligible).To(BeFalse())
})
```

:::info
Placement constraints are evaluated by `vela def apply-module` by reading cluster labels from the `vela-cluster-identity` ConfigMap in the `vela-system` namespace. Definitions that do not match are **skipped** silently — no error is reported, and the definition is not applied.
:::

## Real-World Examples

### AWS-Only Component

```go title="Go — defkit"
comp := defkit.NewComponent("aws-load-balancer").
    RunOn(placement.Label("provider").Eq("aws"))
```

```cue title="Evaluated at apply time"
// Placement constraints do not appear in the generated CUE.
// The CLI skips this definition on clusters where
// the "provider" label is not "aws".
```

### Exclude Virtual Clusters

```go title="Go — defkit"
comp := defkit.NewComponent("persistent-storage").
    NotRunOn(placement.Label("cluster-type").Eq("vcluster"))
```

```cue title="Evaluated at apply time"
// Placement constraints do not appear in the generated CUE.
// The CLI skips this definition on clusters where
// the "cluster-type" label equals "vcluster".
```

### Production Multi-Cloud

Combine `placement.All()` and `placement.Any()` to express complex constraints: run only on production clusters that are hosted on a major cloud provider.

```go title="Go — defkit"
comp := defkit.NewComponent("enterprise-ingress").
    Description("Enterprise ingress controller").
    RunOn(
        placement.All(
            placement.Any(
                placement.Label("provider").In("aws", "gcp", "azure"),
            ),
            placement.Label("env").Eq("production"),
        ),
    ).
    Workload("apps/v1", "Deployment").
    Params(defkit.String("image"))
```

```cue title="CUE — generated"
"enterprise-ingress": {
    type: "component"
    annotations: {}
    labels: {}
    description: "Enterprise ingress controller"
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
    parameter: {
        image: string
    }
}
```
