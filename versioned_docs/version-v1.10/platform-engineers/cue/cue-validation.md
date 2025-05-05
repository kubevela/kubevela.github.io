---
title: Cue Validation
---

# CUE Validation in KubeVela

## Overview

KubeVela leverages CUE's powerful type system to validate component parameters before deployment, ensuring application reliability through early error detection. This validation occurs at the admission control stage when creating or updating Applications via `vela up` or `kubectl apply`.

## Key Characteristics

- **Pre-Runtime Checking**: Catches configuration errors during application deployment rather than during rollout
- **Comprehensive Coverage**: Validates both parameter presence and value constraints
- **Multi-Source Aware**: Checks parameters from direct component properties, workflow step inputs, and override policies
- **Deep Validation**: Supports nested parameter structures using dot notation

## Enabling Validation

```bash
# Enable feature gate
vela install --set features.EnableCueValidation=true

# Verify
kubectl -n vela-system get deploy kubevela-controller \
  -o jsonpath='{.spec.template.spec.containers[0].args}' | grep EnableCueValidation
```

> **Note**: Requires KubeVela v1.5+ for full nested parameter support

## Example Walkthrough

### Component Definition

```cue
"configmap-component": {
  template: {
    parameter: {
      firstkey:  string & !="" & !~".*-$"
      secondkey: {
        value1: string
        value2: {
          value3: {
            value4: *"default-value-2" | string // Default field
            value5: string  // Required field (no default)
          }
        }
      }
      thirdkey?: string  // Optional field
    }
    output: {
      apiVersion: "v1"
      kind:       "ConfigMap"
      metadata: { name: context.name }
      data: {
        one:   parameter.firstkey
        two:   parameter.secondkey.value2.value3.value5
        three: parameter.secondkey.value1
        four:  parameter.secondkey.value2.value3.value4
      }
    }
  }
}
```

### Application with Valid Parameters

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: dynamic-configmap-example
spec:
  components:
    - name: express-cm
      type: configmap-component
      properties:
        secondkey:
          value1: "1" # Directly provided
  workflow:
    steps:
      - name: read-network-properties
        type: read-object
        outputs:
          - valueFrom: output.value.data["firstkey"]
            name: output1
          - valueFrom: output.value.data["secondkey"]
            name: output2
      - name: apply
        type: apply-component
        inputs:
          - parameterKey: firstkey
            from: output1  # Provided via workflow
          - parameterKey: secondkey.value2.value3.value5
            from: output2  # Provided via workflow
```

**Validation Passes Because:**

1. `value1` is provided directly in properties
2. `value5` is provided via workflow input
3. `firstkey` is provided via workflow input
4. `thirdkey` is explicitly marked optional (`?`)

### Failed Validation Scenario

**Invalid Application:**

```yaml
components:
  - name: express-cm
    type: configmap-component
    properties:
      secondkey:
        value2:
          value3:
            value4: "1"  # Missing value5
```

**Error Message:**

```bash
Error from server: error when creating "app.yaml":
admission webhook "validating.core.oam.dev.v1beta1.applications" denied the request:
component "express-cm": missing parameters: firstkey,secondkey.value1,secondkey.value2.value3.value5
```

## Dynamic Field Validation

KubeVela's CUE validation system provides comprehensive support for dynamic fields in both workflow inputs and policy overrides, ensuring consistent validation regardless of how parameters are provided.

### Workflow Inputs with Dynamic Fields

The validation system handles parameter paths in workflow inputs through dot notation:

```yaml
workflow:
  steps:
    - name: apply-config
      type: apply-component
      inputs:
        - parameterKey: "secondkey.value2.value3.value5" # Dynamic nested path
          from: workflow-output
```

**Validation Behavior**:

1. Path resolution follows the exact structure defined in the ComponentDefinition
2. Each segment (`secondkey` → `value2` → `value3` → `value5`) is validated for existence
3. The final value is checked against the template's type constraints

### Policy Overrides with Dynamic Fields

Override policies can satisfy dynamic field requirements through nested property definitions:

```yaml
policies:
  - name: override-nginx-legacy-image
    type: override
    properties:
      components:
        - name: express-server
          properties:
            firstkey: nginx:1.20
            secondkey:
              value1: "abc"
              value2:
                value3:
                  value5: "1"
            thirdkey: "123"
```

## Key Takeaways

1. **Deep Validation** works with nested structures:
   ```yaml
   # Valid path format:
   parameterKey: parent.child[2].grandchild
   ```

2. **Multiple Sources** are checked:
    - Direct properties
    - Workflow inputs
    - Policy overrides

3. **Clear Errors** show exact missing path:
   ```
   missing parameters: a.b.c, x.y.z
   ```

4. **Default Values** skip validation:
   ```cue
   value4: *"default" | string  # Not required
   ```

To test validation without deployment:
```bash
vela dry-run -f app.yaml --validate
```

## Troubleshooting Guide

| Symptom | Solution |
|---------|----------|
| Missing parameters | Check workflow inputs & override policies |
| Type mismatch | Verify CUE template constraints |
| Regex failure | Use `vela def vet` to test patterns |
| Nested field errors | Use dot-notation in parameterKey |

**Debug Command**:
```bash
vela live-diff -f app.yaml --detail
```

For complex cases, export validation context:
```bash
kubectl get application <app-name> -o jsonpath='{.status.validationContext}' > debug.cue
```