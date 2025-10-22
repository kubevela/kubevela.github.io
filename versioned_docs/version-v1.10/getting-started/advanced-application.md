---
---
title: Deploy an Advanced Application
---

Now that you've deployed your first application, let's explore some of KubeVela's more advanced features: multi-environment deployments, policies, and workflows with manual approval.

## Prerequisites

Before starting, make sure you have:
- ✅ Completed [Deploy Your First Application](./first-application)
- ✅ Basic understanding of KubeVela applications
- ✅ KubeVela installed and running

## Step 1: Understanding Advanced Concepts

Before we begin, let's understand the new concepts we'll use:

### What are Policies?

Policies are rules that affect how and where your application is deployed. Think of them as _"deployment instructions"_, or application level modifiers, that can:
- Control where your app runs (which cluster, namespace, region)
- Modify configurations for different environments
- Apply security or compliance rules
- Set resource constraints

**Common Policy Types:**
- **Topology Policy**: Specifies **where** to deploy - like choosing which Kubernetes cluster and namespace
- **Override Policy**: Modifies **how** components behave between environments - like using more replicas in production than dev
- **Shared Resource Policy**: Allows sharing resources (like ConfigMaps or Secrets) across multiple applications
- **Garbage Collection Policy**: Controls how resources are cleaned up when applications are updated or deleted

> 📖 **Want to explore more?** See the [full list of available policies](https://kubevela.io/docs/end-user/policies/references/) in the reference documentation.

### What are Workflows?

Workflows orchestrate the deployment process through a series of steps. Instead of deploying everything at once, workflows let you:
- Deploy in stages (dev → staging → production)
- Add approval gates between environments
- Run validation checks before proceeding
- Rollback if something goes wrong

**Common Workflow Steps:**
- **Deploy Step**: Executes the actual deployment with selected policies
- **Suspend Step**: Pauses and waits for manual approval  
- **Notification Step**: Sends alerts to Slack, email, webhooks, etc.
- **Step Group**: Groups multiple steps to run in parallel

> 📖 **Want to explore more?** See the [full list of workflow steps](https://kubevela.io/docs/end-user/workflow/built-in-workflow-defs/) in the reference documentation.

### How Everything Works Together

Building on the Components and Traits you learned in the [first application tutorial](./first-application), now we add:

1. **Components** define *what* to deploy (your application) - [see available types](https://kubevela.io/docs/end-user/components/references/)
2. **Traits** add operational *behaviors* to components (scaling, ingress, storage) - [see available traits](https://kubevela.io/docs/end-user/traits/references/)
3. **Policies** define *where* to deploy and *how* to modify configurations per environment
4. **Workflows** orchestrate *when* and *in what order* to deploy

Here's how they work together in practice:

1. You define a **Component** (like a web API) with **Traits** (like scaling to 2 replicas)
2. You create **Policies** that specify different environments and configurations:
   - Topology policy: "deploy to dev namespace" 
   - Override policy: "in production, scale to 5 replicas instead of 2"
3. Your **Workflow** orchestrates the deployment:
   - Step 1: Deploy to dev environment using dev policies
   - Step 2: Wait for manual approval 
   - Step 3: Deploy to production using production policies (which override the scaling)

The result: Same component and traits, but different behavior in each environment thanks to policies and workflows!

## Step 2: Prepare the Environments

First, let's create a production namespace:

```bash
vela env init prod --namespace prod
```

Expected output:
```console
environment prod with namespace prod created
```

Verify both environments exist:

```bash
vela env ls
```

## Step 3: Create the Advanced Application

Save the following as `advanced-app.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: advanced-app
  namespace: default
spec:
  components:
    - name: backend-api
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true
        env:
          - name: APP_ENV
            value: "development"
      traits:
        - type: scaler
          properties:
            replicas: 1
            
  policies:
    # Development environment configuration
    - name: env-development
      type: topology
      properties:
        clusters: ["local"]
        namespace: "default"
    
    # Production environment configuration
    - name: env-production
      type: topology
      properties:
        clusters: ["local"]
        namespace: "prod"
    
    # Production-specific overrides
    - name: production-configs
      type: override
      properties:
        components:
          - name: backend-api
            properties:
              env:
                - name: APP_ENV
                  value: "production"
            traits:
              - type: scaler
                properties:
                  replicas: 3  # Scale up for production
                  
  workflow:
    steps:
      # Step 1: Deploy to development
      - name: deploy-to-dev
        type: deploy
        properties:
          policies: ["env-development"]
          
      # Step 2: Wait for manual approval
      - name: manual-approval
        type: suspend
        properties:
          message: "Please review the development deployment before promoting to production"
          
      # Step 3: Deploy to production
      - name: deploy-to-prod
        type: deploy
        properties:
          policies: ["env-production", "production-configs"]
```

## Step 4: Understanding the Configuration

Let's break down what this configuration does:

### Components Section
- Defines a `backend-api` web service
- Sets initial configuration (1 replica, development environment variable)

### Policies Section
1. **`env-development`**: Deploys to default namespace
2. **`env-production`**: Deploys to prod namespace
3. **`production-configs`**: Overrides settings for production (3 replicas, production env var)

### Workflow Section
1. **`deploy-to-dev`**: First deployment to development
2. **`manual-approval`**: Pauses for human review
3. **`deploy-to-prod`**: Deploys to production with overrides

## Step 5: Deploy the Application

Start the deployment:

```bash
vela up -f advanced-app.yaml
```

Expected output:
```console
Applying an application in vela K8s object format...
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward advanced-app
             SSH: vela exec advanced-app
         Logging: vela logs advanced-app
      App status: vela status advanced-app
        Endpoint: vela status advanced-app --endpoint
```

## Step 6: Check Development Deployment

The application will first deploy to development and then wait for approval:

```bash
vela status advanced-app -n default
```

Expected output:
```console
About:

  Name:         advanced-app                
  Namespace:    default                         
  Created at:   2025-10-22 09:11:31 +0100 IST
  Healthy:      ✅                           
  Details:      workflowSuspending           

Workflow:

  mode: StepByStep-DAG
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id: igp5mle4ze
    name: deploy-to-dev
    type: deploy
    phase: succeeded 
  - id: frqtbqtalg
    name: manual-approval
    type: suspend
    phase: suspending 
    message: Suspended by field suspend

Services:

  - Name: backend-api  
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅ 
      Message: Ready:1/1
    Traits:
      Type: scaler
      Health: ✅ 
```

## Step 7: Test Development Deployment

Access the development deployment:

```bash
vela port-forward advanced-app -n default 8001:8000
```

Visit http://localhost:8001 to verify it's working.

## Step 8: Approve Production Deployment

Once you've verified the development deployment, approve the promotion to production:

```bash
vela workflow resume advanced-app
```

Expected output:
```console
Successfully resume workflow: advanced-app
```

## Step 9: Verify Production Deployment

Check the full deployment status:

```bash
vela status advanced-app -n default
```

You should now see services in both environments:

```console
Services:
  - Name: backend-api  
    Cluster: local
    Namespace: prod
    Type: webservice
    Health: ✅ 
      Message: Ready:3/3
    Traits:
      Type: scaler
      Health: ✅ 

  - Name: backend-api  
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅ 
      Message: Ready:1/1
    Traits:
      Type: scaler
      Health: ✅ 
```

## Step 10: Test Production Deployment

Access the production deployment:

```bash
vela port-forward advanced-app -n prod 8002:8000
```

Visit http://localhost:8002 to verify production is working.

## Step 11: Managing Workflow States

### View Workflow History

```bash
vela workflow logs advanced-app
```

### Restart a Workflow

If needed, you can restart the entire workflow:

```bash
vela workflow restart advanced-app -n default
```

### Rollback a Deployment

To rollback to a previous version:

```bash
vela workflow rollback advanced-app -n default
```

## Clean Up

Delete the application and environments:

```bash
# Delete the application
vela delete advanced-app -n default

# Remove the production environment
vela env delete prod
```

## What You've Learned

In this advanced tutorial, you:
- ✅ Created multi-environment deployments
- ✅ Implemented environment-specific configurations
- ✅ Used workflow steps with manual approval
- ✅ Applied policies for topology and overrides
- ✅ Managed complex application lifecycles

## Troubleshooting

<details>
<summary>Workflow stuck in suspended state</summary>

Check the workflow status:
```bash
vela workflow logs advanced-app -n default
```

Resume if needed:
```bash
vela workflow resume advanced-app -n default
```
</details>

<details>
<summary>Production namespace not found</summary>

Create it manually:
```bash
kubectl create namespace prod
# or
vela env init prod --namespace prod
```
</details>

<details>
<summary>Different replica counts not working</summary>

Verify the override policy is correctly applied:
```bash
vela status advanced-app --tree -n default
kubectl get deploy -n prod
kubectl get deploy -n default
```
</details>

## Next Steps

Now that you've mastered advanced deployments:

- **[Create Your First Component](./first-component)** - Learn how to build custom reusable components
- **[Multi-Cluster Deployments](../../case-studies/multi-cluster)** - Deploy across multiple Kubernetes clusters
- **[GitOps Integration](../../case-studies/gitops)** - Automate with Git workflows
- **[Helm Integration](../../tutorials/helm)** - Deploy Helm charts as components

### Explore Built-in Definitions

- **[Component Types Reference](https://kubevela.io/docs/end-user/components/references/)** - All available component types
- **[Traits Reference](https://kubevela.io/docs/end-user/traits/references/)** - All available traits
- **[Policies Reference](https://kubevela.io/docs/end-user/policies/references/)** - All available policies
- **[Workflow Steps Reference](https://kubevela.io/docs/end-user/workflow/built-in-workflow-defs/)** - All available workflow steps


## Summary

You've successfully deployed an advanced KubeVela application with:
- Multiple environment configurations
- Manual approval workflows
- Environment-specific overrides
- Production-ready patterns

These patterns form the foundation for real-world application deployments with KubeVela.