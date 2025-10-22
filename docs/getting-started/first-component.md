---
title: Creating Your First Component
---

Learn how to create custom KubeVela components to package and reuse your application configurations.

## Prerequisites

Before starting, make sure you have:
- ✅ Completed [Deploy Your First Application](first-application)
- ✅ Basic understanding of YAML and Kubernetes concepts
- ✅ KubeVela installed and running

## What Are Components?

Components in KubeVela are reusable building blocks that define your application workloads. While KubeVela provides built-in components like `webservice` and `worker`, you can create custom components for specific needs.

## Step 1: Understanding Component Definitions

In KubeVela, components are defined using CUE templates that can generate any type of Kubernetes resource. This flexibility allows you to capture a wide range of infrastructure and application needs:

### Standard Kubernetes Workloads
- **Deployments** - Stateless applications (web APIs, microservices)
- **StatefulSets** - Stateful applications (databases, message queues)  
- **DaemonSets** - Node-level services (logging agents, monitoring)
- **Jobs/CronJobs** - Batch processing and scheduled tasks

### Cloud Resources
- **Managed Databases** - RDS, CloudSQL, Azure Database
- **Storage** - S3 buckets, blob storage, persistent volumes
- **Networking** - Load balancers, VPCs, security groups
- **Compute** - Virtual machines, serverless functions

### Observability & Operations
- **ServiceMonitor** - Prometheus monitoring configuration
- **HorizontalPodAutoscaler** - Auto-scaling policies
- **NetworkPolicy** - Security and traffic rules
- **PodDisruptionBudget** - Availability guarantees

### Custom Resources
- **Istio Resources** - VirtualServices, DestinationRules
- **Cert-Manager** - Certificate management
- **FluxCD/ArgoCD** - GitOps resources
- **Application-specific CRDs** - Your custom operators

The CUE template defines a user-friendly schema (what parameters they configure) and generates the complex underlying Kubernetes manifests automatically.

## Step 2: Create a Simple Custom Component

Before starting, make sure you are using the default environment:
```bash
vela env set default
```

Let's create a super simple component that demonstrates the power of abstraction. We'll make a `my-simple-deployment` component that only requires an image and replicas - but generates all the Kubernetes YAML automatically.

### Define the Component

Create a file called `simple-deployment.cue`:

```cue
"my-simple-deployment": {
	annotations: {}
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
	}
	description: "Simple deployment with configurable image and replicas"
	labels: {}
	type: "component"
}

template: {
	parameter: {
		// Simple parameters - that's it!
		image: string
		replicas: *1 | int
	}
	
	// Generate the complex Deployment automatically
	output: {
		apiVersion: "apps/v1"
		kind: "Deployment"
		metadata: {
			name: context.name
		}
		spec: {
			replicas: parameter.replicas
			selector: matchLabels: {
				app: context.name
			}
			template: {
				metadata: labels: {
					app: context.name
				}
				spec: containers: [{
					name: "main"
					image: parameter.image
					ports: [{
						containerPort: 8080
					}]
				}]
			}
		}
	}
}
```

**What's powerful here:**
- Users only need to specify `image` and `replicas` 
- KubeVela automatically generates labels, selectors, metadata, and container specs
- The abstraction hides Kubernetes complexity while providing flexibility

### Apply the Component Definition

```bash
vela def apply simple-deployment.cue
```

Verify it was created:

```bash
vela def list --type component
```

You should see `my-simple-deployment` in the list.

## Step 3: Use Your Custom Component

Now create an application using your custom component. Look how simple this is!

Create `my-app.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
spec:
  components:
    - name: my-simple-deployment-app
      type: my-simple-deployment  # Your custom component!
      properties:
        image: nginx:alpine
        replicas: 3
```

**That's it!** Just 2 parameters, but it creates a complete Deployment with proper labels, selectors, and all the Kubernetes boilerplate.

Deploy it:

```bash
vela up -f my-app.yaml
```

Check what was actually created:

```bash
vela status my-app --tree
```

You'll see KubeVela generated a full Deployment resource from your simple configuration!

## Advanced: Enhancing Your Component with Status Evaluation

Now let's enhance our `my-simple-deployment` component with advanced status evaluation features. This will give operators better visibility into the health of their deployments.

Update your `simple-deployment.cue` file to include status evaluation:

```cue
"my-simple-deployment": {
	annotations: {}
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
				isHealth: (context.output.status.readyReplicas > 0) && (context.output.status.readyReplicas == context.output.status.replicas)
				"""#
			customStatus: #"""
				message: "Ready: \(context.output.status.readyReplicas)/\(context.output.status.replicas)"
			"""#
			details: #"""
                desiredReplicas: *context.output.status.replicas | 0
                readyReplicas: *context.output.status.readyReplicas | 0
                availableReplicas: *context.output.status.availableReplicas | 0
                unavailableReplicas: *context.output.status.unavailableReplicas | 0
            """#    
		}
	}
	description: "Simple deployment with configurable image and replicas"
	labels: {}
	type: "component"
}

template: {
	parameter: {
		// Simple parameters - that's it!
		image: string
		replicas: *1 | int
	}
	
	// Generate the complex Deployment automatically
	output: {
		apiVersion: "apps/v1"
		kind: "Deployment"
		metadata: {
			name: context.name
		}
		spec: {
			replicas: parameter.replicas
			selector: matchLabels: {
				app: context.name
			}
			template: {
				metadata: labels: {
					app: context.name
				}
				spec: containers: [{
					name: "main"
					image: parameter.image
					ports: [{
						containerPort: 8080
					}]
				}]
			}
		}
	}
}
```

**What's new in the enhanced component:**
- **`healthPolicy`**: Defines when the component is considered healthy (all replicas are ready)
- **`customStatus`**: Provides a custom status message showing ready vs total replicas  
- **`details`**: Exposes structured status information including conditions and replica counts

### Apply the Enhanced Component

Update your component definition:

```bash
vela def apply simple-deployment.cue
```

This will create a second revision of the component. You can view the revisions with:
```bash
kubectl get definitionrevision --all-namespaces | grep my-simple-deployment
```

Now redeploy your application to see the enhanced status features:

```bash
vela up -f my-app.yaml
```

Check the enhanced status information:

```bash
vela status my-app
```

Instead of needing multiple kubectl commands, they see:
```
About:

  Name:         my-simple-app                
  Namespace:    default                      
  Created at:   2025-10-22 11:41:17 +0100 IST
  Healthy:      ✅                           
  Details:      running                      

...

Services:
  - Name: my-simple-deployment  
    Cluster: local
    Namespace: default
    Type: my-simple-deployment
    Health: ✅ 
      Message: Ready: 3/3
      Status Details: 
        availableReplicas: 3
        desiredReplicas: 3
        readyReplicas: 3
        unavailableReplicas: 0
    No trait applied
```

**Key Benefits:**
- **No Kubernetes expertise required** - Operators see application health, not infrastructure details
- **Contextual information** - Only relevant status is surfaced
- **Consistent interface** - Same `vela status` command works for any component type
- **Actionable insights** - Clear messages about what's working or what needs attention

## Troubleshooting

<details>
<summary>Component definition not found</summary>

Check if the component is registered:
```bash
vela def list --type component
vela def get <component-name> -t component
```

Re-apply if needed:
```bash
vela def apply your-component.cue
```
</details>

<details>
<summary>CUE syntax errors</summary>

Validate your CUE template:
```bash
vela def vet your-component.cue
```

Check the rendered output:
```bash
vela dry-run -f your-app.yaml
```
</details>

<details>
<summary>Component not working with traits</summary>

Ensure your component outputs the correct workload type:
- Deployment for scaler, rollout traits
- Service for ingress trait
- Check trait requirements with `vela traits`
</details>

## What You've Learned

In this tutorial, you:
- ✅ Created custom component definitions
- ✅ Used CUE templates to define component schemas
- ✅ Deployed applications with custom components
- ✅ Combined components with traits
- ✅ Learned to package and share components

## Next Steps

This has given a brief introduction to writing custom definitions through CUE. For detailed information see:

### CUE Fundamentals
- **[CUE Basics](../../platform-engineers/cue/basic)** - Learn CUE language fundamentals
- **[Definition Editing](../../platform-engineers/cue/definition-edit)** - CUE definition overview

### Creating Custom Definitions
- **[Custom Components](../../platform-engineers/components/custom-component)** - Build reusable component definitions
- **[Custom Traits](../../platform-engineers/traits/customize-trait)** - Create operational behaviors
- **[Custom Policies](../../platform-engineers/policy/custom-policy)** - Define deployment policies
- **[Custom Workflows](../../platform-engineers/workflow/workflow)** - Build deployment pipelines

### Advanced Features
- **[External Packages](../../platform-engineers/cue/external-packages)** - Using external CUE packages
- **[Component Health Status](../../platform-engineers/status/definition_health_status)** - Advanced status evaluation

