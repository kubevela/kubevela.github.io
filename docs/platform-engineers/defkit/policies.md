---
title: Policy Definitions
---

In this section, we will introduce how to build PolicyDefinitions using the defkit Go SDK.

:::tip
Before reading this section, make sure you've read [Getting Started with defkit](./overview.md). For the CUE-based approach, see [Policy Definition (CUE)](../policy/custom-policy.md).
:::

## Declare a Policy

Use `NewPolicy` to create a policy definition:

```go title="topology.go"
policy := defkit.NewPolicy("topology").
    Description("Describe the destination where components should be deployed to.").
    Params(
        defkit.StringList("clusters").Description("Specify the names of the clusters to select."),
        defkit.StringKeyMap("clusterLabelSelector").Description("Specify the label selector for clusters"),
        defkit.Bool("allowEmpty").Description("Ignore empty cluster error"),
        defkit.String("namespace").Description("Specify the target namespace"),
    )
```

<details>
<summary>Generated CUE output</summary>

```cue title="topology.cue"
topology: {
	annotations: {}
	description: "Describe the destination where components should be deployed to."
	labels: {}
	attributes: {}
	type: "policy"
}

template: {
	parameter: {
		// +usage=Specify the names of the clusters to select.
		clusters?: [...string]
		// +usage=Specify the label selector for clusters
		// +usage=Specify the label selector for clusters
		clusterLabelSelector?: [string]: string
		// +usage=Ignore empty cluster error
		allowEmpty?: bool
		// +usage=Specify the target namespace
		namespace?: string
	}
}
```

</details>

## Policy Templates

For policies that need computed fields, use a `PolicyTemplate`:

```go title="computed_policy.go"
policy := defkit.NewPolicy("topology").
    Description("Topology policy").
    Params(
        defkit.StringList("clusters"),
    ).
    Template(func(tpl *defkit.PolicyTemplate) {
        tpl.SetField("clusterCount", defkit.ParamRef("clusters"))
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="topology_template.cue"
topology: {
	annotations: {}
	description: "Topology policy"
	labels: {}
	attributes: {}
	type: "policy"
}

template: {
	clusterCount: parameter.clusters
	parameter: {
		clusters?: [...string]
	}
}
```

</details>

## Export as YAML

```go title="export.go"
yamlBytes, err := policy.ToYAML()
```

<details>
<summary>Example YAML output</summary>

```yaml title="topology.yaml"
apiVersion: core.oam.dev/v1beta1
kind: PolicyDefinition
metadata:
  name: topology
  annotations:
    definition.oam.dev/description: "Describe the destination where components should be deployed to."
spec:
  schematic:
    cue:
      template: |
        ...
```

</details>

## Raw CUE

For complex policy logic that cannot be expressed with the Go builder API:

```go title="raw_policy.go"
policy := defkit.NewPolicy("topology").RawCUE(`"topology": {
    type: "policy"
    description: "Raw CUE policy"
}
template: {
    parameter: clusters?: [...string]
}`)
```

## CUE Imports

```go title="imports.go"
policy := defkit.NewPolicy("custom").
    Description("Custom policy.").
    WithImports("strings")
```

## Applying Policy Definitions

```bash
# Validate all definitions in your module
vela def validate-module ./my-platform

# Apply all definitions (or just policies)
vela def apply-module ./my-platform
vela def apply-module ./my-platform --types policy

# List applied policy definitions
vela def list -t policy
```

For the full CLI reference, see [Applying Definitions](./overview.md#applying-definitions-with-the-vela-cli).

## What's Next

- [Workflow Step Definitions](./workflow-steps.md) -- Building workflow step definitions
- [Parameter Types](./parameters.md) -- Complete parameter type reference
