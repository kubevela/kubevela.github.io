---
title: Health and Status
---

This page covers how to define health checks and custom status messages using the composable expression builders.

:::tip
Before reading this section, make sure you've read [Getting Started with defkit](./overview.md). For the CUE-based approach, see [Definition Health Status (CUE)](../status/definition_health_status.md).
:::

## Health Expressions

The `Health()` builder creates composable health check expressions that generate CUE `isHealth` policies.

### Condition Checks

Check Kubernetes status conditions:

```go title="health.go"
h := defkit.Health()

// Check if Ready condition is true
h.Condition("Ready").IsTrue()

// Check if condition is false
h.Condition("Stalled").IsFalse()

// Check if condition exists (regardless of status)
h.Condition("Initialized").Exists()

// Check condition reason
h.Condition("Ready").ReasonIs("Available")
```

### Multiple Condition Checks

```go title="multi_condition.go"
h := defkit.Health()

// All conditions must be True
h.AllTrue("Ready", "Synced")

// At least one condition must be True
h.AnyTrue("Ready", "Available")
```

### Phase Checks

Check the resource's phase field:

```go title="phase.go"
h := defkit.Health()

// Standard phase field (status.phase)
h.Phase("Running", "Succeeded")
```

<details>
<summary>Generated CUE output</summary>

```cue title="phase.cue"
isHealth: context.output.status.phase == "Running" || context.output.status.phase == "Succeeded"
```

</details>

```go
// Custom phase field path
h.PhaseField("status.currentPhase", "Active")
```

### Field Expressions

Check arbitrary fields in the resource:

```go title="field.go"
h := defkit.Health()

// Equality
h.Field("status.state").Eq("active")

// Numeric comparisons
h.Field("status.replicas").Gt(0)
h.Field("status.availableReplicas").Gte(1)
h.Field("status.failedReplicas").Lt(5)

// Set membership
h.Field("status.phase").In("Running", "Succeeded", "Complete")

// String contains
h.Field("status.message").Contains("ready")

// Compare to another field
h.Field("status.readyReplicas").Eq(h.FieldRef("spec.replicas"))

// Existence checks
h.Exists("status.loadBalancer.ingress")
h.NotExists("status.error")
```

### Composite Expressions

Combine multiple expressions with logical operators:

```go title="composite.go"
h := defkit.Health()

// Complex composition
h.And(
    h.Condition("Ready").IsTrue(),
    h.Not(h.Condition("Stalled").IsTrue()),
    h.Or(
        h.Field("status.replicas").Gte(1),
        h.Exists("status.endpoint"),
    ),
)
```

<details>
<summary>Generated CUE output</summary>

```cue title="composite.cue"
_readyCond: [ for c in context.output.status.conditions if c.type == "Ready" { c } ]
_stalledCond: [ for c in context.output.status.conditions if c.type == "Stalled" { c } ]
isHealth: (len(_readyCond) > 0 && _readyCond[0].status == "True") && (!(len(_stalledCond) > 0 && _stalledCond[0].status == "True")) && ((context.output.status.replicas >= 1) || (context.output.status.endpoint != _|_))
```

</details>

### Generating Health Policy

Use `defkit.HealthPolicy()` to generate the CUE health policy string:

```go title="policy.go"
h := defkit.Health()
policy := defkit.HealthPolicy(h.Condition("Ready").IsTrue())
```

<details>
<summary>Generated CUE output</summary>

```cue title="health_policy.cue"
_readyCond: [ for c in context.output.status.conditions if c.type == "Ready" { c } ]
isHealth: len(_readyCond) > 0 && _readyCond[0].status == "True"
```

</details>

### Wiring Health into Definitions

```go title="component.go"
h := defkit.Health()

comp := defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").
    HealthPolicyExpr(h.Condition("Ready").IsTrue())

// Or use a string directly
comp2 := defkit.NewComponent("test").
    HealthPolicy("isHealth: true")
```

<details>
<summary>Generated CUE output</summary>

```cue title="health_component.cue"
webservice: {
	type: "component"
	annotations: {}
	labels: {}
	description: ""
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
		status: {
			healthPolicy: #"""
				_readyCond: [ for c in context.output.status.conditions if c.type == "Ready" { c } ]
				isHealth: len(_readyCond) > 0 && _readyCond[0].status == "True"
				"""#
		}
	}
}
template: {
	parameter: {
	}
}
```

</details>

### Built-in Workload Health Helpers

Pre-built health expressions for common Kubernetes workloads:

```go title="builtin.go"
defkit.DeploymentHealth().Build()    // Ready condition + replicas
defkit.StatefulSetHealth().Build()   // Ready condition
defkit.DaemonSetHealth().Build()     // Ready condition
defkit.JobHealth().Build()           // Complete/Failed phase
defkit.CronJobHealth().Build()       // Schedule check
```

## Status Expressions

The `Status()` builder creates composable status message expressions that generate CUE `message` for custom status display.

### Field Extraction

Extract values from the resource for status messages:

```go title="status.go"
s := defkit.Status()

// Extract a status field with a default
readyReplicas := s.Field("status.readyReplicas").Default(0)
phase := s.Field("status.phase")

// Extract a spec field
desiredReplicas := s.SpecField("spec.replicas")
```

### Condition Access

Access condition values for status display:

```go title="condition_status.go"
s := defkit.Status()

s.Condition("Ready").Message()      // The condition's message
s.Condition("Ready").StatusValue()  // The condition's status (True/False/Unknown)
s.Condition("Ready").Reason()       // The condition's reason
```

### Literal Messages

```go title="literal.go"
s := defkit.Status()
s.Literal("Service is running")
```

### String Building

```go title="concat.go"
s := defkit.Status()
ready := s.Field("status.readyReplicas").Default(0)
total := s.SpecField("spec.replicas")

// Format string
s.Format("Ready: %v/%v", ready, total)
```

<details>
<summary>Generated CUE output</summary>

```cue title="format.cue"
_readyReplicas: *0 | int
if context.output.status.readyReplicas != _|_ {
	_readyReplicas: context.output.status.readyReplicas
}
message: "Ready: \(_readyReplicas)/\(context.output.spec.replicas)"
```

</details>

### Switch/Case

Build conditional status messages:

```go title="switch.go"
s := defkit.Status()

s.Switch(
    s.Case(s.Field("status.phase").Eq("Running"), "Service is running"),
    s.Case(s.Field("status.phase").Eq("Pending"), "Service is starting..."),
    s.Default("Unknown status"),
)
```

### Wiring Status into Definitions

```go title="component.go"
comp := defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").
    CustomStatus("message: \"Running\"")
```

### Built-in Workload Status Helpers

```go title="builtin.go"
defkit.DeploymentStatus().Build()     // Ready replicas message
defkit.StatefulSetStatus().Build()    // Ready replicas message
defkit.DaemonSetStatus().Build()      // Desired/Ready message
```

## Raw CUE

For health or status logic that cannot be expressed with the builder API, use `.RawCUE()` on either builder:

### Health RawCUE

```go title="raw_health.go"
h := defkit.Health()
h.RawCUE(`isHealth: context.output.status.phase == "Running"`)

comp := defkit.NewComponent("custom").
    Workload("apps/v1", "Deployment").
    HealthPolicy(h.Build())
```

### Status RawCUE

```go title="raw_status.go"
s := defkit.Status()
s.RawCUE(`message: "Custom CUE"`)

comp := defkit.NewComponent("custom").
    Workload("apps/v1", "Deployment").
    CustomStatus(s.Build())
```

:::caution
When `.RawCUE()` is set on a builder, it overrides any expressions added via the builder methods. The raw string is used as-is.
:::

## Complete Example

A component with both health and status expressions:

```go title="database.go"
h := defkit.Health()
s := defkit.Status()

comp := defkit.NewComponent("database").
    Workload("apps/v1", "StatefulSet").
    Params(
        defkit.String("image").Required(),
        defkit.Int("replicas").Default(3),
    ).
    HealthPolicyExpr(h.And(
        h.Condition("Ready").IsTrue(),
        h.Field("status.readyReplicas").Eq(h.FieldRef("spec.replicas")),
    )).
    CustomStatus(defkit.StatusPolicy(
        s.Format("Ready: %v/%v",
            s.Field("status.readyReplicas").Default(0),
            s.SpecField("spec.replicas"),
        ),
    ))
```

<details>
<summary>Generated CUE output</summary>

```cue title="database.cue"
database: {
	type: "component"
	annotations: {}
	labels: {}
	description: ""
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "StatefulSet"
			}
			type: "statefulsets.apps"
		}
		status: {
			customStatus: #"""
				_readyReplicas: *0 | int
				if context.output.status.readyReplicas != _|_ {
					_readyReplicas: context.output.status.readyReplicas
				}
				message: "Ready: \(_readyReplicas)/\(context.output.spec.replicas)"
				"""#
			healthPolicy: #"""
				_readyCond: [ for c in context.output.status.conditions if c.type == "Ready" { c } ]
				isHealth: (len(_readyCond) > 0 && _readyCond[0].status == "True") && (context.output.status.readyReplicas == context.output.spec.replicas)
				"""#
		}
	}
}
template: {
	parameter: {
		image: string
		replicas: *3 | int
	}
}
```

</details>

## Applying Definitions

```bash
# Validate all definitions in your module
vela def validate-module ./my-platform

# Apply all definitions (or just components with health checks)
vela def apply-module ./my-platform
vela def apply-module ./my-platform --types component

# List applied component definitions
vela def list -t component
```

For the full CLI reference, see [Applying Definitions](./overview.md#applying-definitions-with-the-vela-cli).

## What's Next

- [Cluster Placement](./placement.md) -- Multi-cluster placement constraints
- [Testing Definitions](./testing.md) -- Testing health and status expressions
