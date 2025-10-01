---
title: Validate Definition Output Resources
---

# Validate Definition Output Resources

## Overview

KubeVela provides webhook-based validation to ensure that Kubernetes resource types (including CRDs) referenced in the `output` and `outputs` fields of definition CUE templates actually exist in the cluster before the definitions are created or updated. This validation prevents runtime failures caused by missing CRDs or invalid resource types by catching configuration errors during definition creation rather than during application deployment.

## Features

- **Pre-Creation Checking**: Validates resource type existence when creating or updating definitions via `kubectl apply`
- **Comprehensive Coverage**: Validates all resource types referenced in `output` and `outputs` fields of CUE templates
- **Multi-Definition Support**: Works across ComponentDefinition, TraitDefinition, WorkflowStepDefinition, and PolicyDefinition
- **Addon-Aware**: Automatically skips validation for addon-related definitions to avoid circular dependency issues

## Setup

```bash
# Enable feature gate
vela install --set features.ValidateResourcesExist=true

# Verify
kubectl -n vela-system get deploy kubevela-controller \
  -o jsonpath='{.spec.template.spec.containers[0].args}' | grep ValidateResourcesExist
```

## Configuration

```yaml
# Helm values for vela-core
features:
  ValidateResourcesExist: true  # Default: false (Alpha)
```

> 
**Status**: Alpha (v1.10.4)
**Default**: Disabled
**Pre-requisite**: KubeVela webhook must be properly configured

## Examples

### Success Example

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: webservice
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
          apiVersion: "apps/v1"
          kind:       "Deployment"
          metadata: {
            name: context.name
          }
          spec: {
            replicas: parameter.replicas
            template: {
              metadata: labels: {
                "app": context.name
              }
              spec: containers: [{
                name:  context.name
                image: parameter.image
              }]
            }
          }
        }
        parameter: {
          image:    string
          replicas: *1 | int
        }
```

**Validation Passes Because:**
- The resource type `apps/v1/Deployment` exists in the cluster
- The webhook validates the apiVersion and kind before creating the definition

### Failure Example

**Invalid ComponentDefinition:**

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: custom-component
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
          apiVersion: "custom.example.com/v1alpha1"
          kind:       "CustomResource"
          metadata: {
            name: context.name
          }
        }
```

**Error Message:**

```bash
Error from server (Forbidden): error when creating "STDIN": admission webhook "validating.core.oam-dev.v1beta1.componentdefinitions" denied the request: resource type not found on cluster: custom.example.com/v1alpha1/CustomResource (no matches for kind "CustomResource" in version "custom.example.com/v1alpha1") (requestUID=afee0c12-a51f-4b7e-b829-512dc22d3b4c)
```

## Multiple Outputs

The validation system checks all resources defined in the `outputs` field:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: webservice-with-service
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
          apiVersion: "apps/v1"
          kind:       "Deployment"
          // ... deployment spec
        }
        outputs: {
          service: {
            apiVersion: "v1"
            kind:       "Service"
            // ... service spec
          }
          ingress: {
            apiVersion: "networking.k8s.io/v1"
            kind:       "Ingress"
            // ... ingress spec
          }
        }
```

**Validation Passes Because:**
- All resource types (`apps/v1/Deployment`, `v1/Service`, `networking.k8s.io/v1/Ingress`) exist in the cluster
- Each resource in both `output` and `outputs` is validated

### Failure Example

**Invalid ComponentDefinition with Missing CRD:**

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: app-with-istio
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
          apiVersion: "apps/v1"
          kind:       "Deployment"
          metadata: {
            name: context.name
          }
        }
        outputs: {
          service: {
            apiVersion: "v1"
            kind:       "Service"
            metadata: {
              name: context.name
            }
          }
          virtualService: {
            apiVersion: "networking.istio.io/v1beta1"
            kind:       "VirtualService"
            metadata: {
              name: context.name
            }
          }
        }
```

**Error Message:**

```bash
Error from server (Forbidden): error when creating "STDIN": admission webhook "validating.core.oam-dev.v1beta1.componentdefinitions" denied the request: resource type not found on cluster: networking.istio.io/v1beta1/VirtualService (no matches for kind "VirtualService" in version "networking.istio.io/v1beta1") (requestUID=6bcd877d-a824-4a16-aa6c-afbab7e9e5f0)
```

**Why It Failed:**
- The `output` resource (`apps/v1/Deployment`) exists 
- The first resource in `outputs` (`v1/Service`) exists 
- The second resource in `outputs` (`networking.istio.io/v1beta1/VirtualService`) does **NOT** exist 
- Istio CRDs are not installed in the cluster

**Validation Behavior**:
1. Each resource in both `output` and `outputs` is extracted and validated
2. All resource types must exist in the cluster
3. If any single resource type is missing, the entire definition creation fails
4. Validation stops at the first missing resource type

## CRD Installation

When working with Custom Resource Definitions (CRDs), you must ensure the CRD is installed before creating definitions that reference it:

### Installation Steps

```bash
# 1. Install the CRD first
kubectl apply -f my-crd.yaml

# 2. Then create the definition that references it
kubectl apply -f component-definition.yaml
```

### Addon Exemptions

Addon definitions are automatically exempted from resource validation because:
- Addons often bundle CRDs with definitions that reference them
- The CRDs and definitions are typically applied together
- The validation would create circular dependency issues

The system detects addon definitions through:
- Owner references to addon applications (prefixed with `addon-`)
- Labels indicating addon management (`app.oam.dev/name` starting with `addon-`)
- Annotations marking addon resources (`addons.oam.dev/name`)

## Supported Definitions

The validation applies to:

| Definition Type | Validated | Location |
|----------------|-----------|----------|
| ComponentDefinition | Yes | `spec.schematic.cue.template` |
| TraitDefinition | Yes | `spec.schematic.cue.template` |
| WorkflowStepDefinition | Yes | `spec.schematic.cue.template` |
| PolicyDefinition | Yes | `spec.schematic.cue.template` |

## Use Cases

### Preventing Typos

```yaml
# This will be rejected due to typo in apiVersion
output: {
  apiVersion: "apps/v11"  # Should be apps/v1
  kind:       "Deployment"
}
```

### Version Compatibility

```yaml
# This will fail if using Kubernetes < 1.19
output: {
  apiVersion: "networking.k8s.io/v1"  # Available in K8s 1.19+
  kind:       "Ingress"
}
```

### CRD Availability

```yaml
# This will fail if Istio is not installed
output: {
  apiVersion: "networking.istio.io/v1beta1"
  kind:       "VirtualService"
}
```

## Summary

1. **Early Detection**: Catches missing resource types at definition creation time
   ```bash
   # Immediate feedback when applying definition
   kubectl apply -f definition.yaml
   ```

2. **Cluster-Specific**: Validation is based on the actual cluster state
   - Different clusters may have different CRDs installed
   - Validation results may vary between environments

3. **Addon Exemption**: Addon definitions are automatically skipped
   ```yaml
   # This is allowed for addon definitions even if CRD doesn't exist yet
   ownerReferences:
   - apiVersion: core.oam.dev/v1beta1
     kind: Application
     name: addon-istio
   ```

4. **Clear Error Messages**: Shows exact resource type that's missing
   ```
   resource type not found on cluster: custom.io/v1/MyResource
   ```

## Troubleshooting

| Symptom | Solution |
|---------|----------|
| Resource type not found | Verify CRD is installed: `kubectl get crd` |
| Validation for addon fails | Check owner references and labels |
| Old API version rejected | Update to current API version for your K8s version |
| Can't create definition | Install required CRDs before definitions |

**Debug Commands**:

```bash
# Check if CRD exists
kubectl get crd <crd-name>

# List all available API resources
kubectl api-resources

# Check specific API version
kubectl api-versions | grep <group>

# View webhook logs
kubectl -n vela-system logs -l app.kubernetes.io/name=vela-core --tail=100
```


## Related Features

- [CUE Validation](./cue-validation.md): Validates parameter requirements and types
- [Definition Edit](./definition-edit.md): Guidelines for editing definitions safely