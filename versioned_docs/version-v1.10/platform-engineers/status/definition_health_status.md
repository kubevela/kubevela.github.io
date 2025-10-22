---
title:  Definition Health & Status
---

# Monitoring Health of Components & Traits

Components and traits in KubeVela can report their operational status and health, giving you real-time visibility into your applications. This guide shows you how to configure health checks, status reporting, and custom messages for your definitions (components & traits).

## Why Monitor Health and Status?

When deploying applications, you need to know:
- Are all components running correctly? And their associated traits?
- What's the current state of each resource?
- Are there any issues that need attention?

KubeVela's health and status system helps answer these questions by continuously monitoring your components and providing detailed feedback through the Application status.

## Quick Start

Here's a simple example that monitors a web service deployment:

```cue
"webservice": {
    attributes: {
        status: {
            // Check if all replicas are ready
            healthPolicy: {
                isHealth: context.output.status.readyReplicas == context.output.spec.replicas
            }
            
            // Show a human-readable status
            customStatus: {
                message: "Ready: \(context.output.status.readyReplicas)/\(context.output.spec.replicas)"
            }
        }
    }
}
```

This configuration will:
- Mark the component as healthy when all replicas are ready
- Display _"Ready: 3/3"_ (or similar) as the status message

## The Three Status Mechanisms

KubeVela provides three complementary mechanisms for monitoring your components:

### 1. Status Details - Structured Diagnostic Information

Status details provide a map of key-value pairs with diagnostic information about your component. This is useful for exposing multiple health indicators or metrics.

**Example:**
```cue
attributes: status: details: {
    readyReplicas: context.output.status.readyReplicas
    totalReplicas: context.output.spec.replicas
    readyPercentage: (context.output.status.readyReplicas / context.output.spec.replicas) * 100
    deploymentMode: context.output.spec.strategy.type
}
```

**Result in Application status:**
```yaml
status:
  services:
    - name: my-service
      status:
        readyReplicas: "3"
        totalReplicas: "3"
        readyPercentage: "100"
        deploymentMode: "RollingUpdate"
```

### 2. Health Check - Overall Health Indicator

The health check provides a simple true/false indicator of whether your component is functioning correctly.

**Example:**
```cue
attributes: status: healthPolicy: {
    isHealth: context.output.status.readyReplicas == context.output.spec.replicas
}
```

**Result in Application status:**
```yaml
status:
  services:
    - name: my-service
      healthy: true
```

### 3. Custom Status Message - Human-Readable Summary

Custom status messages provide a friendly, human-readable description of the current state.

**Example:**
```cue
attributes: status: customStatus: {
    message: "Deployment complete - all \(context.output.spec.replicas) replicas are running"
}
```

**Result in Application status:**
```yaml
status:
  services:
    - name: my-service
      message: "Deployment complete - all 3 replicas are running"
```

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
---
## Detailed Status

> **Purpose**: Expose structured diagnostic information about your component's operational state

### Quick Reference

| Property             | Value                                                                                         |
|----------------------|-----------------------------------------------------------------------------------------------|
| **Location**         | `<definition-root>.attributes.status.details`                                                 |
| **Type**             | `[string]: _`                                                                                 |
| **Default Behavior** | Returns an empty map if not defined. If errors occur, fields will populate with value "_ \|_" |
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

  ```cue
  "<root>": attributes: status: details: {
      // Component A health check
      componentAisHealthy: *(context.output.status.isReady == "true") | false

      // Component B health check
      componentBisHealthy: *(context.outputs.frontend.readyReplicas == context.outputs.frontend.replicas) | false

      // Component B readiness ratio
      componentBReadyRatio: *(context.outputs.frontend.readyReplicas / context.outputs.frontend.replicas) | 0.0
  }
  ```

**Definition Format**: Use either native CUE syntax or CUE string expressions under `attributes.status.details`.

### Native CUE Format
Use native CUE to define detailed status as a structured map. Public fields (no prefix) will be exported as strings to the Application’s `.status.services[].details` field in `[string]: string` format.

```cue
"<root>": attributes: status: details: {
    details: {
        readyCount:      *context.output.status.readyReplicas | 0
        readyPct:        *"\($internal.pctRunning)%" | "0%"
        unavailablePct:  *"\($internal.pctUnavailable)%" | "0%"
        degraded:        *$internal.pctRunning < 80 | false    // must be at least 80% of replicas ready
  
        // Private fields are supported with `$` prefix
        $internal: {
          pctRunning: *((context.output.status.readyReplicas / context.output.spec.replicas) * 100) | 0
          pctUnavailable: *((context.output.status.unavailableReplicas / context.output.spec.replicas) * 100) | 0
        }
    }
}
```

## Field Visibility Rules
### Types
- Public fields are standard fields without annotation and without prefixes (e.g. `readyReplicas`)
- Local fields are those prefixed with $ or annotated with @local (e.g. `$tempVal : "abc"`, `anotherTempVal: 1 @local`)
- Private fields are those annotated with @private (e.g. `$privateVal: "abc" @private()`)

### Visibility Rules
| Field Type | Identification                      | Scoped Access | Context Access | Status Export | Supported Types                  |
|------------|-------------------------------------|---------------|----------------|---------------|----------------------------------|
| Public     | No prefix                           | ✓ Yes         | ✓ Yes          | ✓ (as string) | bool, int, string only           |
| Local      | `$` prefix or `@local()` annotation | ✓ Yes         | ✓ Yes          | ✗ No          | Any type including structs/lists |
| Private    | `@private()` annotation             | ✓ Yes         | ✗ No           | ✗ No          | Any type including structs/lists |


### String Expression Format
Alternatively, you can use a CUE string literal to define the details block.

```cue
"<root>": attributes: status: details: {
    details: #"""
        readyCount:      *context.output.status.readyReplicas | 0
        readyPct:        *"\($internal.pctRunning)%" | "0%"
        unavailablePct:  *"\($internal.pctUnavailable)%" | "0%"
        degraded:        *$internal.pctRunning < 80 | false    // must be at least 80% of replicas ready
    
        // Private fields are supported with `$` prefix
        $internal: {
          pctRunning: *((context.output.status.readyReplicas / context.output.spec.replicas) * 100) | 0
          pctUnavailable: *((context.output.status.unavailableReplicas / context.output.spec.replicas) * 100) | 0
        }
    """#
}
```

String expressions behave identically to native CUE structs and support the same rules regarding public/private fields and type restrictions.

### Field Validation
- Public fields (no `$` prefix or `@local/@private` annotation) will permit **only** fields which can be validated to appropriate string values. That is, structs or array values will be rejected within public fields.
- Local and Private fields are permitted to use any type. 

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
Only public fields appear in .status.services[].status:
```yaml
...
status:
  services:
    - name: mycomponent
      healthy: true
      message: "Ready:2/2"
      status:
        readyCount:      "2"
        readyPct:        "100%"
        unavailablePct:  "0%"
        degraded:        "false"
...
```
---
## Health Check

> **Purpose**: Provide a boolean indicator of your component's overall operational health

### Quick Reference

| Property             | Value                                                         |
|----------------------|---------------------------------------------------------------|
| **Location**         | `<definition-root>.attributes.status.healthPolicy`            |
| **Type**             | `{isHealth: bool}`                                            |
| **Default Behavior** | Always returns `true` if not defined, or if errors occur      |
| **Validation**       | See constraints below                                         |
| **Update Frequency** | Evaluated periodically by KubeVela runtime (during reconcile) |
| **Output Location**  | `.status.services[].healthy`                                  |


If not defined, the health result will always be `true`, which means it will be marked as healthy immediately after resources applied to Kubernetes. You can define a CUE expression in it to notify if the component is healthy or not.

The `<definition-root>.attributes.status.healthPolicy` must specify an `isHealth` attribute which evaluates to a boolean. 

The KubeVela runtime will evaluate the Health Checks `isHealth` field cue expression periodically and export it to the `.status.services[].healthy` field of the Application.

Both the standard component/trait context and the outputs of the Status Details check will available in the context. This is refreshed on every evaluation.

### Native CUE Format
Use native CUE to define detailed status as a structured map. The evaluated value of the `isHealth` field will be exported to the Application’s `.status.services[].healthy` field.

**Note:** Native CUE syntax is currently available only on the `attributes.status.details` field and is unsupported for `healthPolicy` and `customStatus`

```cue
"<root>": attributes: status: {
    healthPolicy: {
        isHealth: *(context.output.status.readyReplicas == context.output.status.replicas) | false
    }
}
```

It is also possible to make use of checks already evaluated in the Detailed Status map to reduce repetition in evaluations via `context.status.details.<field>`
```cue
"<root>": attributes: status: {
    healthPolicy: {
        isHealth: *(context.status.details.allReplicasReady) | false
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

### More Examples
> **Components**: Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/component/webservice.cue#L29-L50) for more examples.
> 
> **Traits**: Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/trait/gateway.cue) for a more complete example.

---
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
Use native CUE to define detailed status as a structured map. The evaluated value of the `isHealth` field will be exported to the Application’s `.status.services[].healthy` field.

**Note:** Native CUE syntax is currently available only on the `attributes.status.details` field and is unsupported for `healthPolicy` and `customStatus`

```cue
"<root>": attributes: status: {
    customStatus: {
        message: "\(*context.output.status.readyReplicas | 0) of \(context.output.status.replicas | 0) replicas ready!"
    }
}
```

It is also possible to make use of checks already evaluated in the Detailed Status map and Health Check to reduce repetition in evaluations via `context.status.details.<field>`
```cue
"<root>": attributes: status: {
    customStatus: {
    	if context.status.healthy {
    		message: "Healthy - \(context.status.details.readyReplicaRatio * 100)% of replicas ready!"
    	}
    	
    	if !context.status.healthy {
    		message: "Unhealthy - \(context.status.details.readyReplicaRatio * 100)% of replicas ready!"
    	}
    }
}
```

You can also use the `parameter` defined in the template like:
```cue
"<root>": attributes: status: {
    customStatus: {
        message: "\(*context.output.status.readyReplicas | 0) of \(parameter.replicas | 0) replicas ready!"
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
    customStatus: """
        message: "\(*context.output.status.readyReplicas | 0) of \(parameter.replicas | 0) replicas ready!"
    """
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

## More Examples
> **Components**: Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/component/webservice.cue#L29-L50) for more examples.
>
> **Traits**: Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/trait/gateway.cue) for a more complete example.

## Available Context
For context available within components, see [Component Definition](../components/custom-component.md#full-available-context-in-component)

For traits, see [Trait Definition](../traits/customize-trait.md#full-available-context-in-trait)

## Viewing Application Status
To inspect the Application Status via CLI:
```bash
vela status <app-name> -n <app-namespace>
```

## Exposing Status Details
For details on exposing Health & Status information to external monitoring systems, see [Application Health & Status Metrics](./application_health_status_metrics.md)