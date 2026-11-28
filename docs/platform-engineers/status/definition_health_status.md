---
title: Report health and status from a definition
---

A ComponentDefinition or TraitDefinition can report whether what it deployed is healthy, a short status message, and a map of diagnostic details. This page shows how to write each of them in the definition's `attributes.status` block. Policy, workflow step and source definitions don't report health.

The examples show a definition's `status` block in the CUE format, where it sits under `attributes`; in Kubernetes YAML the same fields sit under `spec.status`. [The Definition File](../oam/definition-file.md) shows the two formats side by side.

Health isn't only for display. KubeVela reads `isHealth` in several places:

- The `deploy` and `apply-component` workflow steps wait until the components they apply are healthy before the workflow moves on.
- [PostDispatch traits](../traits/postdispatch-traits.md) are only applied once their component is healthy.
- The Application's phase stays out of `running` until every component and trait is healthy.
- `vela status` shows each component's and trait's health and message.

## Quick Start

Here's a simple example that monitors a web service Deployment:

```cue
"webservice": {
    attributes: {
        status: {
            // Check if all replicas are ready
            healthPolicy: {
                isHealth: (*context.output.status.readyReplicas | 0) == context.output.spec.replicas
            }

            // Show a human-readable status
            customStatus: {
                message: "Ready: \(*context.output.status.readyReplicas | 0)/\(context.output.spec.replicas)"
            }
        }
    }
}
```

A Deployment that has just been created has no `status.readyReplicas` yet, so each read gives a default of `0`. Without it the expression can't be evaluated and the component is reported unhealthy with an error in the controller log.

This configuration will:
- Mark the component as healthy when all replicas are ready
- Display _"Ready: 3/3"_ (or similar) as the status message

## The Three Status Mechanisms

KubeVela provides three complementary mechanisms for monitoring your components:

### 1. Status Details: Structured Diagnostic Information

Status details provide a map of key-value pairs with diagnostic information about your component. This is useful for exposing multiple health indicators or metrics.

**Example:**
```cue
attributes: status: details: {
    readyReplicas:  *context.output.status.readyReplicas | 0
    totalReplicas:  context.output.spec.replicas
    readyPercentage: *div((*context.output.status.readyReplicas | 0) * 100, context.output.spec.replicas) | 0
    deploymentMode: context.output.spec.strategy.type
}
```

**Result in Application status:**
```yaml
status:
  services:
    - name: my-service
      details:
        readyReplicas: "3"
        totalReplicas: "3"
        readyPercentage: "100"
        deploymentMode: "RollingUpdate"
```

### 2. Health Check: Overall Health Indicator

The health check provides a simple true/false indicator of whether your component is functioning correctly.

**Example:**
```cue
attributes: status: healthPolicy: {
    isHealth: (*context.output.status.readyReplicas | 0) == context.output.spec.replicas
}
```

**Result in Application status:**
```yaml
status:
  services:
    - name: my-service
      healthy: true
```

### 3. Custom Status Message: Human-Readable Summary

Custom status messages provide a friendly, human-readable description of the current state.

**Example:**
```cue
attributes: status: customStatus: {
    message: "Deployment complete, all \(context.output.spec.replicas) replicas are running"
}
```

**Result in Application status:**
```yaml
status:
  services:
    - name: my-service
      message: "Deployment complete, all 3 replicas are running"
```

For a trait, the same three results appear on the trait's entry under `.status.services[].traits[]`.

## How Status Evaluation Works

KubeVela evaluates these three mechanisms in sequence, with each step having access to the results of previous evaluations:

```
┌──────────────────┐
│  Status Details  │
└────────┬─────────┘
         │
         │◀─ ─ ─ Results available as: context.status.details
         ▼
┌──────────────────┐
│   Health Check   │
└────────┬─────────┘
         │
         │◀─ ─ ─ Results available as: context.status.healthy
         ▼
┌──────────────────┐
│   Custom Status  │
└──────────────────┘
```

This incremental approach allows you to:
- Calculate values once in Status Details and reuse them
- Base your health check on detailed calculations
- Create status messages that reflect both health and details

## Detailed Status

> **Purpose**: Expose structured diagnostic information about your component's operational state

### Quick Reference

| Property             | Value                                                                                         |
|----------------------|-----------------------------------------------------------------------------------------------|
| **Location**         | `<definition-root>.attributes.status.details`                                                 |
| **Type**             | `[string]: _`                                                                                 |
| **Default Behavior** | Returns an empty map if not defined. A field that can't be evaluated shows the value `_\|_`  |
| **Validation**       | See constraints below                                                                         |
| **Update Frequency** | Evaluated periodically by KubeVela runtime (during reconcile)                                 |
| **Output Location**  | `.status.services[].details`                                                                  |

### When to Use

The details status map is particularly valuable when:
- Managing multi-resource components
- Tracking granular health metrics
- Debugging operational states
- Providing detailed diagnostics

### Example Implementation

Here the definition renders a main workload (`context.output`) and an auxiliary Deployment under `outputs` named `frontend` (`context.outputs.frontend`):

```cue
"<root>": attributes: status: details: {
    // The main workload has all its replicas ready
    workloadReady: *(context.output.status.readyReplicas == context.output.spec.replicas) | false

    // The frontend Deployment has all its replicas ready
    frontendReady: *(context.outputs.frontend.status.readyReplicas == context.outputs.frontend.spec.replicas) | false

    // Share of the frontend's replicas that are ready
    frontendReadyRatio: *(context.outputs.frontend.status.readyReplicas / context.outputs.frontend.spec.replicas) | 0.0
}
```

**Definition Format**: Use either native CUE syntax or CUE string expressions under `attributes.status.details`.

### Native CUE Format
Use native CUE to define detailed status as a structured map. Public fields (no prefix) will be exported as strings to the Application's `.status.services[].details` field in `[string]: string` format.

```cue
"<root>": attributes: status: details: {
    readyCount:     *context.output.status.readyReplicas | 0
    readyPct:       "\($internal.pctReady)%"
    unavailablePct: "\($internal.pctUnavailable)%"
    degraded:       $internal.pctReady < 80 // fewer than 80% of replicas are ready

    // `$` fields are not exported, but the later checks can read them
    $internal: {
        pctReady:       *div((*context.output.status.readyReplicas | 0) * 100, context.output.spec.replicas) | 0
        pctUnavailable: *div((*context.output.status.unavailableReplicas | 0) * 100, context.output.spec.replicas) | 0
    }
}
```

## Field Visibility Rules

Each field in `details` is one of three kinds:

| Field Type   | Identification                                  | In `context.status.details` | In `.status.services[].details` | Supported Types                  |
|--------------|-------------------------------------------------|-----------------------------|---------------------------------|----------------------------------|
| Public       | No prefix, no attribute (e.g. `readyReplicas`)  | ✓ Yes                       | ✓ Yes (as a string)             | bool, int, string only           |
| `$` prefixed | `$` prefix, whatever its attribute (e.g. `$tempVal`) | ✓ Yes                  | ✗ No                            | Any type including structs/lists |
| Local        | `@local()` or `@private()` attribute, no `$` prefix (e.g. `tempVal: 1 @local()`) | ✗ No | ✗ No                | bool, int, string only           |

Every field can be read by the other fields of the `details` block. Use a `$` field for a value the health check or custom status needs but the Application status shouldn't show; use `@local()` or `@private()` for a value only the `details` block itself needs.

A field whose label is 32 characters or longer is skipped: it appears nowhere, and the only sign is a warning in the controller log.

### String Expression Format
Alternatively, you can use a CUE string literal to define the details block.

```cue
"<root>": attributes: status: details: #"""
    readyCount:     *context.output.status.readyReplicas | 0
    readyPct:       "\($internal.pctReady)%"
    unavailablePct: "\($internal.pctUnavailable)%"
    degraded:       $internal.pctReady < 80 // fewer than 80% of replicas are ready

    // `$` fields are not exported, but the later checks can read them
    $internal: {
        pctReady:       *div((*context.output.status.readyReplicas | 0) * 100, context.output.spec.replicas) | 0
        pctUnavailable: *div((*context.output.status.unavailableReplicas | 0) * 100, context.output.spec.replicas) | 0
    }
    """#
```

String expressions behave identically to native CUE structs and support the same rules regarding public and `$` fields and type restrictions.

### Field Validation
- Fields without a `$` prefix permit **only** values that can be shown as strings: `vela def` rejects a struct or list literal in them.
- `$` fields can use any type.

### Outputs
The results of the evaluation are output to `context.status.details` for use in the Health Check and Custom Status evaluations.

>**IMPORTANT**: Unlike the Application summary which represents the details map as string values, the `context.status.details` map will retain the original types of its attributes.
>
>e.g.
> ```cue
> "<root>": attributes: status: details: {
>   intValue: 1 + 1
>   stringValue: "Hello, World!"
> }
> ```
> will result in:
>```cue
> context: status: details: {
>   intValue: int
>   stringValue: string
> }
>```

### Result in Application Status
Only public fields appear in `.status.services[].details`:
```yaml
...
status:
  services:
    - name: mycomponent
      healthy: true
      message: "Ready:2/2"
      details:
        readyCount:      "2"
        readyPct:        "100%"
        unavailablePct:  "0%"
        degraded:        "false"
...
```

## Health Check

> **Purpose**: Provide a boolean indicator of your component's overall operational health

### Quick Reference

| Property             | Value                                                         |
|----------------------|---------------------------------------------------------------|
| **Location**         | `<definition-root>.attributes.status.healthPolicy`            |
| **Type**             | `{isHealth: bool}`                                            |
| **Default Behavior** | `true` if not defined. If the policy fails to evaluate (for example it reads a status field the resource doesn't have yet), the error is logged and the component or trait is reported unhealthy; reconciliation carries on. |
| **Validation**       | See constraints below                                         |
| **Update Frequency** | Evaluated periodically by KubeVela runtime (during reconcile) |
| **Output Location**  | `.status.services[].healthy`                                  |


If not defined, the health result will always be `true`, which means it will be marked as healthy immediately after resources applied to Kubernetes. You can define a CUE expression in it to notify if the component is healthy or not.

The `<definition-root>.attributes.status.healthPolicy` must specify an `isHealth` attribute which evaluates to a boolean.

The KubeVela runtime will evaluate the Health Checks `isHealth` field cue expression periodically and export it to the `.status.services[].healthy` field of the Application.

Both the standard component/trait context and the outputs of the Status Details check are available in the context. This is refreshed on every evaluation.

### Native CUE Format
Write `healthPolicy` as a CUE struct with an `isHealth` field. The evaluated value of `isHealth` is exported to the Application's `.status.services[].healthy` field.

```cue
"<root>": attributes: status: {
    healthPolicy: {
        isHealth: *(context.output.status.readyReplicas == context.output.status.replicas) | false
    }
}
```

It is also possible to make use of checks already evaluated in the Detailed Status map to reduce repetition in evaluations via `context.status.details.<field>`. This reads `workloadReady` from the [example above](#example-implementation):
```cue
"<root>": attributes: status: {
    healthPolicy: {
        isHealth: *(context.status.details.workloadReady) | false
    }
}
```

You can also use the `parameter` defined in the template like:
```cue
"<root>": attributes: status: {
    healthPolicy: {
        isHealth: *(context.output.status.readyReplicas == parameter.replicas) | false
    }
}

template: parameter: {
	replicas: int
}
```

### String Expression Format
Alternatively, you can use a CUE string literal to define the `healthPolicy` block. All features will work as above.

```cue
"<root>": attributes: status: {
    healthPolicy: """
        isHealth: *(context.output.status.readyReplicas == context.output.status.replicas) | false
    """
}
```

### Field Validation
- The `isHealth` field within `"<root>": attributes: status: healthPolicy` is **required**.
- The `isHealth` field must evaluate to a boolean value.

### Outputs
The results of the evaluation are output to `context.status.healthy` for use in the Custom Status evaluation.

### Result in Application Status
Results will appear within the corresponding component/traits `.status.services[].healthy` field:
```yaml
...
status:
  services:
    - name: mycomponent
      healthy: true/false
      ...
...
```

### Application Health Determination
The overall status of an Application is directly linked to the sum of all component and trait health check evaluations.
- An Application will not enter phase _"running"_ until all definitions evaluate to healthy.
- If any definition enters an unhealthy state, the Application will be updated to phase "unhealthy" until all definitions recover.
- This evaluation is run on each reconcile of the Application.

## Custom Status

> **Purpose**: Provide a human-readable representation of the current status of a definition.

### Quick Reference

| Property             | Value                                                               |
|----------------------|---------------------------------------------------------------------|
| **Location**         | `<definition-root>.attributes.status.customStatus`                  |
| **Type**             | `{message: string}`                                                 |
| **Default Behavior** | Always returns "" (empty string) if not defined, or if errors occur |
| **Validation**       | See constraints below                                               |
| **Update Frequency** | Evaluated periodically by KubeVela runtime (during reconcile)       |
| **Output Location**  | `.status.services[].message`                                        |

### Native CUE Format
Write `customStatus` as a CUE struct with a `message` string; it is shown as `.status.services[].message`.

```cue
"<root>": attributes: status: {
    customStatus: {
        message: "\(*context.output.status.readyReplicas | 0) of \(*context.output.status.replicas | 0) replicas ready!"
    }
}
```

It is also possible to make use of checks already evaluated in the Detailed Status map and Health Check to reduce repetition in evaluations via `context.status.details.<field>`. Here `details` computes `readyReplicaRatio` and `customStatus` reads it:
```cue
"<root>": attributes: status: {
    details: {
        readyReplicaRatio: *(context.output.status.readyReplicas / context.output.spec.replicas) | 0.0
    }

    customStatus: {
    	if context.status.healthy {
    		message: "Healthy, \(context.status.details.readyReplicaRatio * 100)% of replicas ready!"
    	}

    	if !context.status.healthy {
    		message: "Unhealthy, \(context.status.details.readyReplicaRatio * 100)% of replicas ready!"
    	}
    }
}
```

You can also use the `parameter` defined in the template like:
```cue
"<root>": attributes: status: {
    customStatus: {
        message: "\(*context.output.status.readyReplicas | 0) of \(parameter.replicas) replicas ready!"
    }
}

template: parameter: {
    replicas: int
}
```

### String Expression Format
Alternatively, you can use a CUE string literal to define the `customStatus` block. All features will work as above.

```cue
"<root>": attributes: status: {
    customStatus: #"""
        message: "\(*context.output.status.readyReplicas | 0) of \(parameter.replicas) replicas ready!"
    """#
}
```

### Field Validation
- The `message` field within `"<root>": attributes: status: customStatus` is **required**.
- The `message` field must evaluate to a string value.

### Result in Application Status
Results will appear within the corresponding component/traits `.status.services[].message` field:
```yaml
...
status:
  services:
    - name: mycomponent
      message: "my custom message"
      ...
...
```

## Important Considerations
- The runtime handles native CUE syntax through a two-step process: First, it converts your CUE expressions to strings for storage. Then, during evaluation, it converts these strings back into executable CUE expressions.
  When viewing:
  - **ComponentDefinition / TraitDefinition**: Status expressions appear as strings
  - **Application status**: Only the evaluated results are shown (not the expressions)
- Output standardization: `vela def get <component>` always displays status blocks in native CUE format, ensuring consistent readability across all definitions.
- It is recommended to make use of defaults to account for missing or errored values to ensure that statuses are always complete.
  e.g. `*context.output.status.readyReplicas | 0`
- Status expressions only meet real objects at runtime, so [test them](../cue/definition-testing.md#testing-health-and-status):
  `#ComponentStatus` and `#TraitStatus` evaluate health, message and details against an object as the
  cluster would report it, including one whose status is not filled in yet.

## Available Context
For context available within components, see the [Context Reference](../context-reference.md)

For traits, see [Trait Definition](../traits/customize-trait.md#full-available-context-in-trait). In a trait, `context.output` is the component's workload and `context.outputs.<name>` are the trait's own resources.

## Viewing Application Status
To inspect the Application Status via CLI:
```bash
vela status <app-name> -n <app-namespace>
```

## Exposing Status Details
For details on exposing Health & Status information to external monitoring systems, see [Application Health & Status Metrics](./application_health_status_metrics.md)

## More Examples
> **Components**: Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/component/webservice.cue#L19-L58) for more examples.
>
> **Traits**: Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/trait/gateway.cue) for a more complete example.
