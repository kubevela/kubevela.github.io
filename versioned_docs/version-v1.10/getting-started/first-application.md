---
title: Deploy Your First Application
---

In this guide, you'll deploy your first KubeVela application - a simple "Hello World" web service. This will help you understand the basic concepts and workflow.

## Prerequisites

Before starting, make sure you have:
- ✅ [Installed KubeVela](quick-install) 
- ✅ Verified installation with `vela version`

## Step 1: Understanding the Application Model

Before diving into YAML, let's understand the core concepts:

### What is an Application?

An Application in KubeVela is a complete description of your microservice or system. It's the top-level resource that brings together all the pieces needed to run your software.

### What are Components?

Components are the building blocks of your application - they define **what** you want to deploy. A component encapsulates:
- **Workloads**: Your actual running code (containers, functions, etc.)
- **Resources**: Databases, message queues, cloud services
- **Configurations**: Settings, environment variables, secrets

Think of components as _"packaged units"_ of your application. For example:
- A `webservice` component for your REST API
- A `worker` component for background jobs
- A `database` component for PostgreSQL

Components are reusable and composable - you can use the same component type across different applications.

### What are Traits?

Traits are operational capabilities that you attach to components to add behaviors without changing the component itself. Think of them as _"plug-in features"_ that enhance your application:
- **Scaling**: Control the number of replicas
- **Ingress**: Expose your app to the internet
- **Storage**: Attach persistent volumes
- **Monitoring**: Add observability and metrics

Traits are applied TO components. The same trait can work with different component types - for example, the `scaler` trait works with any deployable component.

### How They Work Together

```
Application (online-store)
├── Component: frontend (webservice)
│   ├── Trait: scaler (replicas: 3)
│   └── Trait: ingress (domain: store.example.com)
└── Component: backend (webservice)
    └── Trait: scaler (replicas: 2)
```

This separation of concerns means:
- **Developers** focus on components (what to run)
- **Operators** focus on traits (how to run it)
- **Platform teams** can create reusable components and traits for everyone

## Step 2: Create Your First Application

Let's start with the simplest possible application - a web service:

### Create the Application File

Save the following as `hello-world.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: hello-world
spec:
  components:
    - name: my-web-app
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true
```

### What This Configuration Does

**Application Metadata:**
- **`apiVersion`**: Specifies the KubeVela API version
- **`kind: Application`**: Declares this as a KubeVela Application  
- **`metadata.name`**: Names your application "hello-world"

**Component Definition:**
- **`type: webservice`**: Uses the built-in webservice component type
- **`image`**: The container image to run
- **`ports`**: Exposes port 8000 for access

## Step 3: Deploy the Application

Deploy your application with a single command:

```bash
vela up -f hello-world.yaml
```

You should see output like:
```console
Applying an application in vela K8s object format...
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward hello-world
             SSH: vela exec hello-world
         Logging: vela logs hello-world
      App status: vela status hello-world
        Endpoint: vela status hello-world --endpoint
```

## Step 4: Check Application Status

Verify your application is running:

```bash
vela status hello-world
```

Expected output:
```console
About:

  Name:         hello-world                  
  Namespace:    default                      
  Created at:   2025-10-22 09:00:52 +0100 IST
  Healthy:      ✅                           
  Details:      running                     

...

Services:
  - Name: my-web-app  
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅ 
      Message: Ready:1/1
    No trait applied
```

## Step 5: Access Your Application

Now let's see your app in action!

```bash
vela port-forward hello-world 8000:8000
```

This will:
- Forward port 8000 from your application to your local machine
- Automatically open your browser (on some systems)

Navigate to http://localhost:8000 in your browser. You should see:

```
Hello KubeVela! Make shipping applications more enjoyable.
```

**Congratulations!** You've successfully deployed your first KubeVela application!

## Step 6: Explore Your Application

### View Logs

Check what your application is doing:

```bash
vela logs hello-world
```

### Execute Commands

Run commands inside your container:

```bash
vela exec hello-world -- ls -la
```

### List All Applications

See all deployed applications:

```bash
vela ls
```

## Step 7: Add a Trait (Optional)

Let's enhance your application by adding a scaling trait. Update your `hello-world.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: hello-world
spec:
  components:
    - name: my-web-app
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true
      traits:
        - type: scaler
          properties:
            replicas: 3
```

Apply the changes:

```bash
vela up -f hello-world.yaml
```

Check the status to see 3 replicas running:

```bash
vela status hello-world
```

## Step 8: Access the UI Console (Optional)

If you installed VelaUX, you can manage your application visually:

```bash
# Port forward the UI
vela port-forward addon-velaux -n vela-system 8080:80
```

Open http://localhost:8080 and login:
- Username: `admin`
- Password: `VelaUX12345` (you'll be prompted to change it)

In the UI, you can:
- View your application's topology
- Inspect resources
- Monitor health status
- Make configuration changes

## Clean Up

When you're done experimenting:

```bash
vela delete hello-world
```

Confirm deletion:
```console
Start deleting application default/hello-world
Delete application default/hello-world succeeded
```

## What You've Learned

In this tutorial, you:
- ✅ Created a KubeVela application configuration
- ✅ Deployed a web service component
- ✅ Accessed your running application
- ✅ Added operational traits
- ✅ Explored management commands
- ✅ Used the UI console (optional)

## Common Issues and Solutions

<details>
<summary>Application stuck in "rendering" status</summary>

This usually means there's an issue with your configuration. Check:
- YAML syntax is correct
- Image name and tag exist
- Port configuration is valid

Run `vela status hello-world --tree` for detailed error messages.
</details>

<details>
<summary>Port forwarding doesn't work</summary>

Make sure:
- The application is in "running" status
- The port number matches your configuration
- No other process is using port 8000

Try a different local port: `vela port-forward hello-world 8080:8000`
</details>

<details>
<summary>Can't access VelaUX</summary>

Verify VelaUX is installed:
```bash
vela addon list | grep velaux
```

If not installed:
```bash
vela addon enable velaux
```
</details>

## Next Steps

Now that you've deployed your first application, you're ready to:

- **[Deploy an Advanced Application](../advanced-application)** - Learn about multi-environment deployments
- **[Understand Core Concepts](../core-concept)** - Deep dive into KubeVela's architecture
- **[Explore Examples](https://github.com/kubevela/kubevela/tree/master/docs/examples)** - View the community curated examples