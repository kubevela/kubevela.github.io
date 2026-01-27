---
title: Application Health & Status Metrics
---

# Application Health & Status Metrics

KubeVela provides comprehensive metrics and structured logging for monitoring application health and status. This feature enables observability platforms to track application lifecycle, health state changes, and detailed service status through Prometheus metrics and structured logs.

## Overview

When enabled, the application controller exports three key metrics and generates structured logs for every application status update:

1. **Health Status Metric** - Binary indicator of application health
2. **Application Phase Metric** - Numeric representation of application lifecycle phase
3. **Workflow Phase Metric** - Numeric representation of workflow execution phase
4. **Structured Logs** - Detailed JSON logs of application state changes

## Enabling the Feature

### Feature Gate

The application status metrics feature is controlled by the `EnableApplicationStatusMetrics` feature gate, which is **disabled by default** (alpha stage).

### Enable via Helm

When installing or upgrading KubeVela using Helm:

```bash
helm install kubevela kubevela/vela-core \
  --set featureGates.enableApplicationStatusMetrics=true \
  --namespace vela-system --create-namespace
```

Or add to your values.yaml:
```yaml
featureGates:
  enableApplicationStatusMetrics: true
```

### Enable via Controller Arguments

For manual installations, add the feature gate to the controller arguments:

```yaml
args:
  - "--feature-gates=EnableApplicationStatusMetrics=true"
```

## Metrics Reference

### 1. Application Health Status

**Metric Name**: `kubevela_application_health_status`

**Type**: Gauge

**Description**: Binary indicator of application health status

**Labels**:
- `app_name`: Name of the application
- `namespace`: Namespace of the application

**Values**:
- `1`: Application is healthy (all services are healthy)
- `0`: Application is unhealthy (one or more services are unhealthy)

**Example**:
```promql
# Query unhealthy applications
kubevela_application_health_status == 0

# Count healthy applications per namespace
sum by (namespace) (kubevela_application_health_status)
```

### 2. Application Phase

**Metric Name**: `kubevela_application_phase`

**Type**: Gauge

**Description**: Numeric representation of the current application phase

**Labels**:
- `app_name`: Name of the application
- `namespace`: Namespace of the application

**Phase Mappings**:

| Phase | Numeric Value | Description |
|-------|---------------|-------------|
| `starting` | 0 | Application is initializing |
| `running` | 1 | Application is running normally |
| `rendering` | 2 | Application is rendering components |
| `policy_generating` | 3 | Application is generating policies |
| `running_workflow` | 4 | Application workflow is executing |
| `workflow_suspending` | 5 | Application workflow is suspended |
| `workflow_terminated` | 6 | Application workflow was terminated |
| `workflow_failed` | 7 | Application workflow failed |
| `unhealthy` | 8 | Application is unhealthy |
| `deleting` | 9 | Application is being deleted |
| unknown/other | -1 | Unknown or undefined phase |

**Example**:
```promql
# Find applications in unhealthy phase
kubevela_application_phase == 8

# Count applications by phase
count by (namespace) (kubevela_application_phase == 1)
```

### 3. Workflow Phase

**Metric Name**: `kubevela_application_workflow_phase`

**Type**: Gauge

**Description**: Numeric representation of the current workflow phase

**Labels**:
- `app_name`: Name of the application
- `namespace`: Namespace of the application

**Phase Mappings**:

| Phase          | Numeric Value | Description                     |
|----------------|---------------|---------------------------------|
| `initializing` | 0             | Workflow is initializing        |
| `succeeded`    | 1             | Workflow completed successfully |
| `executing`    | 2             | Workflow is executing           |
| `suspending`   | 3             | Workflow is suspended           |
| `terminated`   | 4             | Workflow was terminated         |
| `failed`       | 5             | Workflow failed                 |
| `skipped`      | 6             | Workflow was skipped            |
| `unknown`      | -1            | Unknown or undefined phase      |

> **NOTE**: Unknown phase values (-1) indicate an issue - please file a bug report if encountered.

**Example**:
```promql
# Find applications with failed workflows
kubevela_application_workflow_phase == 5

# Success rate of workflows
sum(kubevela_application_workflow_phase == 1) / count(kubevela_application_workflow_phase)
```

## Structured Logging

When the feature is enabled, KubeVela emits structured logs for every application status update. These logs provide comprehensive details about the application state.

### Log Format

Each log entry contains:

**Standard Fields**:
- `app_uid`: Unique identifier of the application
- `app_name`: Name of the application
- `namespace`: Namespace of the application
- `phase`: Current application phase
- `healthy`: Overall health status (boolean)

**Detailed Data Structure** (in `data` field):
```json
{
  "app_uid": "550e8400-e29b-41d4-a716-446655440000",
  "app_name": "my-app",
  "version": "12345",
  "namespace": "default",
  "labels": {
    "app": "my-app",
    "env": "production"
  },
  "status": {
    "phase": "running",
    "healthy": true,
    "healthy_services_count": 3,
    "unhealthy_services_count": 0,
    "services": [
      {
        "name": "frontend",
        "type": "webservice",
        "namespace": "default",
        "cluster": "local",
        "healthy": true,
        "message": "Ready: 3/3",
        "details": {
          "readyReplicas": "3",
          "totalReplicas": "3"
        },
        "traits": [
          {
            "type": "ingress",
            "healthy": true,
            "message": "Ingress configured",
            "details": {
              "host": "example.com"
            }
          },
          {
            "type": "autoscaler",
            "healthy": true
          }
        ]
      }
    ],
    "workflow": {
      "app_revision": "my-app-v1",
      "finished": true,
      "phase": "succeeded",
      "message": "Workflow completed successfully"
    }
  }
}
```

### Log Fields Reference

**Application Level**:
- `app_uid`: Kubernetes UID of the application
- `app_name`: Application name
- `namespace`: Application namespace
- `version`: Resource version
- `labels`: Application labels

**Status Fields**:
- `phase`: Current application phase (string)
- `healthy`: Overall health status
- `healthy_services_count`: Number of healthy services
- `unhealthy_services_count`: Number of unhealthy services

**Service Details** (for each service):
- `name`: Service/component name
- `type`: Component type (e.g., webservice, worker, task)
- `namespace`: Service namespace (may differ in multi-cluster)
- `cluster`: Target cluster name
- `healthy`: Service health status
- `message`: Human-readable status message
- `details`: Additional status details (if configured)
- `traits`: Array of trait statuses (if traits are attached)

**Trait Status** (for each trait in a service):
- `type`: Trait type (e.g., ingress, autoscaler, sidecar)
- `healthy`: Trait health status
- `message`: Human-readable trait status message (if available)
- `details`: Additional trait status details (if configured)

**Workflow Status**:
- `app_revision`: Application revision
- `finished`: Whether workflow is complete
- `phase`: Workflow execution phase
- `message`: Workflow status message

## Performance Considerations

- **Metric Cardinality**: Each application creates metrics with app_name and namespace labels. In large clusters, consider the total cardinality.
- **Log Volume**: Every reconciliation that changes status generates a log entry. Configure appropriate log retention.
- **Update Frequency**: Metrics and logs are updated during each reconciliation cycle when status changes.

### Implementing Status & Health Fields

For documentation on implementing component & trait health and status evaluation logic, see [Definition Health & Status](definition_health_status.md)