---
title: Cluster Placement
---

This page covers how to define multi-cluster placement constraints using the `placement` sub-package.

:::tip
Before reading this section, make sure you've read [Getting Started with defkit](./overview.md). Placement constraints determine which clusters a definition can run on.
:::

## Why Cluster Placement?

In multi-cluster environments, not all definitions make sense on every cluster. For example:

- An **AWS Load Balancer** component should only deploy to AWS EKS clusters, not GCP or Azure
- A **GPU workload** trait should only apply on clusters with GPU nodes
- A **persistent storage** component should not run on ephemeral virtual clusters
- A **production ingress** should only deploy to production clusters, not development environments

Placement constraints let you encode these rules directly in your definition. When you run `vela def apply-module`, the CLI evaluates each definition's constraints against the target cluster's labels and skips definitions that don't match — preventing misconfiguration before it happens. Without placement constraints, users might apply an AWS-specific definition to a GCP cluster and only discover the error at runtime.

The `placement` sub-package provides a type-safe Go API for expressing label-based conditions, logical combinators (`All`, `Any`, `Not`), and evaluation logic.

## Label Conditions

The `placement.Label()` builder creates conditions based on cluster labels:

```go title="placement.go"
import "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"

// Exact match
placement.Label("provider").Eq("aws")

// Not equal
placement.Label("provider").Ne("aws")

// In a set of values
placement.Label("cluster-type").In("eks", "self-managed")

// Not in a set
placement.Label("env").NotIn("development", "staging")

// Label exists (any value)
placement.Label("gpu").Exists()

// Label does not exist
placement.Label("deprecated").NotExists()
```

## Logical Combinators

Combine conditions with logical operators:

```go title="logical.go"
// All conditions must match
placement.All(
    placement.Label("provider").Eq("aws"),
    placement.Label("env").Eq("production"),
)

// At least one condition must match
placement.Any(
    placement.Label("provider").Eq("aws"),
    placement.Label("provider").Eq("gcp"),
)

// Negate a condition
placement.Not(
    placement.Label("cluster-type").Eq("vcluster"),
)
```

### Complex Nested Logic

```go title="complex.go"
placement.All(
    placement.Any(
        placement.All(
            placement.Label("provider").Eq("aws"),
            placement.Label("cluster-type").Eq("eks"),
        ),
        placement.All(
            placement.Label("provider").Eq("gcp"),
            placement.Label("cluster-type").Eq("gke"),
        ),
    ),
    placement.Label("environment").Eq("production"),
)
```

## RunOn / NotRunOn

Wire placement constraints into any definition type:

### Component

```go title="component.go"
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
    Params(defkit.String("image").Required())
```

<details>
<summary>Generated CUE output</summary>

```cue title="aws_load_balancer.cue"
"aws-load-balancer": {
	type: "component"
	annotations: {}
	labels: {}
	description: "AWS Application Load Balancer"
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

</details>

:::note
Placement constraints are evaluated at **apply time** by `vela def apply-module`, not by the KubeVela controller. When you run `apply-module`, the CLI reads cluster labels from the `vela-cluster-identity` ConfigMap in the `vela-system` namespace and evaluates each definition's placement constraints against them. Definitions that don't match are **skipped** and never applied to the cluster. Placement constraints do not appear in the generated CUE or YAML output.
:::

### Trait

```go title="trait.go"
trait := defkit.NewTrait("eks-scaler").
    RunOn(placement.Label("provider").Eq("aws")).
    AppliesTo("deployments.apps")
```

<details>
<summary>Generated CUE output</summary>

```cue title="eks_scaler.cue"
"eks-scaler": {
	type: "trait"
	annotations: {}
	description: ""
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: parameter: {}
```

</details>

### Multiple Calls Accumulate

```go title="accumulate.go"
comp := defkit.NewComponent("multi-constraint").
    RunOn(placement.Label("provider").Eq("aws")).
    RunOn(placement.Label("env").In("prod", "staging"))
// Both conditions must match (AND semantics)
```

## Evaluating Placement

Programmatically check if cluster labels satisfy placement constraints:

```go title="evaluate.go"
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
```

### Evaluation Logic

1. If no constraints are defined, the definition is eligible everywhere
2. All `RunOn` conditions must match
3. None of the `NotRunOn` conditions must match
4. Final: (matches RunOn OR RunOn is empty) AND (does not match NotRunOn)

## Validation

`ValidatePlacement` detects conflicting constraints that would prevent a definition from running anywhere:

```go title="validate.go"
err := placement.ValidatePlacement(spec)
// Returns error if RunOn and NotRunOn contradict each other
```

Conflict detection covers:
- Identical conditions in RunOn and NotRunOn
- Label conditions that logically conflict (e.g., `Eq` vs `Exists` on the same key)
- Composite conditions with conflicting inner conditions

## Real-World Examples

### AWS-Only Component

```go title="aws_only.go"
comp := defkit.NewComponent("aws-load-balancer").
    RunOn(placement.Label("provider").Eq("aws"))
```

### Exclude Virtual Clusters

```go title="no_vcluster.go"
comp := defkit.NewComponent("persistent-storage").
    NotRunOn(placement.Label("cluster-type").Eq("vcluster"))
```

### Production Multi-Cloud

```go title="multi_cloud.go"
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
    Params(defkit.String("image").Required())
```

<details>
<summary>Generated CUE output</summary>

```cue title="enterprise_ingress.cue"
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

</details>

## Applying Placement-Constrained Definitions

```bash
# Validate all definitions in your module
vela def validate-module ./my-platform

# Apply all definitions (placement constraints are included automatically)
vela def apply-module ./my-platform

# Apply only component definitions
vela def apply-module ./my-platform --types component

# List applied definitions
vela def list -t component

# Check a specific definition
vela def get aws-load-balancer
```

For the full CLI reference, see [Applying Definitions](./overview.md#applying-definitions-with-the-vela-cli).

## What's Next

- [Testing Definitions](./testing.md) -- Testing placement constraints in unit tests
