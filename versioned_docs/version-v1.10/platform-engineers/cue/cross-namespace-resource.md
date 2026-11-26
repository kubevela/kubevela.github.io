---
title:  Render Resource to Other Namespaces
---

By default, KubeVela puts every resource a template outputs into the Application's namespace. Set `metadata.namespace` on an output to create it in another namespace. KubeVela tracks it with the Application's ResourceTracker and deletes it with the Application.

## Usage

This ComponentDefinition takes the namespace as a parameter:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: worker-in-namespace
  namespace: vela-system
spec:
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
  schematic:
    cue:
      template: |
        parameter: {
        	image: string
        	// +usage=The namespace to create the Deployment in
        	namespace: string
        }
        output: {
        	apiVersion: "apps/v1"
        	kind:       "Deployment"
        	metadata: {
        		name:      context.name
        		namespace: parameter.namespace
        	}
        	spec: {
        		selector: matchLabels: "app.oam.dev/component": context.name
        		template: {
        			metadata: labels: "app.oam.dev/component": context.name
        			spec: containers: [{
        				name:  context.name
        				image: parameter.image
        			}]
        		}
        	}
        }
```

An Application in `default` that creates its Deployment in `shared`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: shared-worker
  namespace: default
spec:
  components:
    - name: worker
      type: worker-in-namespace
      properties:
        image: oamdev/hello-world
        namespace: shared
```

The target namespace must already exist.

## Keep Applications in their own namespace

The controller flag `--allow-cross-namespace-resource` (default `true`) allows this. Set it to `false` and an Application can only create resources in its own namespace. The Helm chart has no value for it, so add it to the `kubevela-vela-core` Deployment's container args.
