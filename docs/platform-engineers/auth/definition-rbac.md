---
title: X-Definition Permission Validation
---

## Overview

Definition Permission Validation ensures users can only reference X-Definitions (ComponentDefinitions, TraitDefinitions, PolicyDefinitions, and WorkflowStepDefinitions) they have RBAC permissions to access. This enables:

- **Multi-tenancy** - Teams can only use definitions they're authorized for
- **Compliance** - Enforce organizational policies on which components can be used
- **Access control** - Prevent unauthorized use of privileged or sensitive definitions
- **Namespace isolation** - Users with broad namespace permissions cannot bypass isolation to access system definitions without explicit authorization

## Enabling the Feature

The feature requires the `authorization.definitionValidationEnabled` flag to be enabled when installing or upgrading KubeVela:

```bash
helm upgrade --install kubevela kubevela/vela-core \
  --namespace vela-system \
  --set authorization.definitionValidationEnabled=true \
  --wait
```

> **Note:** This feature is disabled by default. Before enabling, ensure your users have appropriate RBAC permissions to access the definitions they need.

## How It Works

When a user creates or updates an Application, the validating webhook checks if they have `get` permission for each referenced definition. The validation occurs before the Application is stored, providing immediate feedback.

### Permission Requirements

| Definition Type | Required Permission |
|----------------|-------------------|
| ComponentDefinition | `get componentdefinitions.core.oam.dev` |
| TraitDefinition | `get traitdefinitions.core.oam.dev` |
| PolicyDefinition | `get policydefinitions.core.oam.dev` |
| WorkflowStepDefinition | `get workflowstepdefinitions.core.oam.dev` |

> **Note:** Only `get` permission is required for validation. The `list` verb in examples below is for user convenience when checking available definitions.

### Two-Namespace Lookup

KubeVela checks for definitions in two locations:

1. **Application namespace** - Checked first for custom or team-specific definitions
2. **System namespace** (`vela-system`) - Checked second for standard definitions

**Important:** Permission to access a definition requires both:
- RBAC permission (via `get` verb) for the definition type
- The definition must actually exist in the namespace where you have permissions

This prevents users with broad namespace permissions (e.g., wildcard RBAC) from accessing system definitions without explicit authorization.

### Namespace Isolation

The validation enforces strict namespace isolation:

- **Existence Check**: Having RBAC permissions alone is not sufficient. The definition must actually exist in the namespace where you have permissions.
- **Wildcard Protection**: Users with wildcard permissions (e.g., `apiGroups: ["*"]`, `resources: ["*"]`, `verbs: ["*"]`) in their namespace cannot automatically access definitions in `vela-system`. They need explicit permissions to `vela-system`.
- **Precedence**: If a definition exists in both the application namespace and `vela-system`, the application namespace takes precedence.


### Multi-Cluster Considerations

In multi-cluster deployments:
- Validation occurs only on the **hub cluster** where the Application is created
- The user's identity is propagated to spoke clusters during deployment
- Each spoke cluster enforces its own RBAC for resource creation

This means a user might pass definition validation on the hub but fail resource creation on a spoke if they lack permissions there.

## Common RBAC Patterns

These examples demonstrate typical permission configurations for KubeVela definitions.

### Example: Access to All Built-in Definitions

For users who need access to all standard KubeVela definitions:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: vela-definition-reader
rules:
  - apiGroups: ["core.oam.dev"]
    resources: 
      - componentdefinitions
      - traitdefinitions
      - policydefinitions
      - workflowstepdefinitions
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: alice-can-read-definitions
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: vela-definition-reader
subjects:
  - kind: User
    name: alice
    apiGroup: rbac.authorization.k8s.io
```

### Example: Restricted Definition Access

For limiting users to specific definitions:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: webservice-user
rules:
  - apiGroups: ["core.oam.dev"]
    resources: ["componentdefinitions"]
    resourceNames: ["webservice", "worker"]  # Only these components
    verbs: ["get"]
  - apiGroups: ["core.oam.dev"]
    resources: ["traitdefinitions"]
    resourceNames: ["scaler", "expose"]      # Only these traits
    verbs: ["get"]
```

### Example: Namespace-Scoped Custom Definitions

For teams with custom definitions in their namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: custom-definition-reader
  namespace: my-namespace
rules:
  - apiGroups: ["core.oam.dev"]
    resources: ["componentdefinitions"]
    resourceNames: ["my-custom-component"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: alice-can-read-custom-definitions
  namespace: my-namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: custom-definition-reader
subjects:
  - kind: User
    name: alice
    apiGroup: rbac.authorization.k8s.io
```

## Troubleshooting

### Permission Denied Errors

When validation fails, users receive clear error messages:

```bash
$ kubectl apply -f app.yaml
error validating data: ValidationError(Application): 
  spec.components[0].type: Forbidden: user "alice" cannot get ComponentDefinition "admin-component" in namespace "my-namespace" or "vela-system"
  spec.components[0].traits[0].type: Forbidden: user "alice" cannot get TraitDefinition "privileged-trait" in namespace "my-namespace" or "vela-system"
```

**Common Cause:** Having namespace-level wildcard permissions does not grant access to `vela-system` definitions. You need explicit ClusterRole or ClusterRoleBinding to access system definitions.

### Verifying Permissions

Users can check their access:

```bash
# Check specific definition access
kubectl auth can-i get componentdefinitions.core.oam.dev/webservice -n vela-system

# List accessible definitions
kubectl get componentdefinitions.core.oam.dev -n vela-system

# Check custom definitions in app namespace
kubectl auth can-i get componentdefinitions.core.oam.dev/custom-component -n my-namespace

# Verify a definition exists in a specific namespace
kubectl get componentdefinition webservice -n vela-system
kubectl get componentdefinition webservice -n my-namespace
```

## Configuration Reference

### Helm Values

```yaml
authorization:
  definitionValidationEnabled: true
```

### Controller Flags

For non-Helm deployments:

```bash
--feature-gates=ValidateDefinitionPermissions=true
```

## Related Documentation

- [Kubernetes RBAC](./basic.md)
- [Authentication Mechanism](./advance.md)
- [Managing Applications](../../how-to/dashboard/application/create-application.md)
- [X-Definitions](../oam/x-definition.md)