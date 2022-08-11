---
title:  Patch strategy
---

By default, KubeVela will merge patched values with CUE's merge. However, CUE cannot handle conflicting fields currently.

KubeVela provides a series of patching strategies to help resolve conflicting issues. When writing patch traits and workflow steps, you can use these patch strategies to solve conflicting values. Note that the patch strategy is not an official capability provided by CUE, but an extension developed by KubeVela.

> For more information about how to patch definitions, please refer to [Patch in the Definitions](../traits/patch-trait).

Let's write an env-patch trait to show how to use these patch strategies.

## patchKey

If you want to add multiple environment variables for a specific container, you can use the `+patchKey=name` annotation to find the container. In this case, KubeVela will merge these environment variables by default. This means that `patchKey` cannot handle duplicate fields.

> After KubeVela version 1.4, you can use `,` to split multiple patchKeys, such as `patchKey=name,image`.

Apply the following definition to your cluster:

```cue
myenv: {
	type: "trait"
	annotations: {}
	labels: {
		"ui-hidden": "true"
	}
	description: "Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'"
	attributes: appliesToWorkloads: ["*"]
}
template: {
	patch: {
			spec: template: spec: {
					// +patchKey=name
					containers: [{
							name: context.name
							env: [
									for k, v in parameter.env {
											name:  k
											value: v
									},
							]
					}]
			}
	}

	parameter: {
			env: [string]: string
	}
}
```

Use the above `myenv` trait in your application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        env:
          - name: OLD
            value: old
      traits:
        - type: myenv
          properties:
            env:
              NEW: new
```

Before using the `myenv` patch trait, the `env` in the application is like:

```yaml
spec:
  containers:
  - env:
    - name: OLD
      value: old
```

After using the `myenv` patch trait, the `env` in the application is like:

```yaml
spec:
  containers:
  - env:
    - name: OLD
      value: old
    - name: NEW
      value: new
```

Finally, we can see that the application's `env` contains two environment variables: `OLD=old` and `NEW=new`.

## retainKeys

You can use the `+patchStrategy=retainKeys` annotation if you want to be able to override duplicate values while merging variables.

The strategy of this annotation is similar to the Kubernetes official [retainKeys](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/update-api-object-kubectl-patch/#use-strategic-merge-patch- to-update-a-deployment-using-the-retainkeys-strategy) strategy.

> In the following example, `+patchKey=name` specifies which container the patch should be applied to, while `+patchStrategy=retainKeys` specifies that when merge environment variables, if a duplicate environment variable name is specified, the environment variable value will be overwritten.

```cue
myenv: {
	type: "trait"
	annotations: {}
	labels: {
		"ui-hidden": "true"
	}
	description: "Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'"
	attributes: appliesToWorkloads: ["*"]
}
template: {
	patch: {
			spec: template: spec: {
					// +patchKey=name
					containers: [{
							name: context.name
							// +patchStrategy=retainKeys
							env: [
									for k, v in parameter.env {
											name:  k
											value: v
									},
							]
					}]
			}
	}

	parameter: {
			env: [string]: string
	}
}
```

Use the above `myenv` trait in your application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        env:
          - name: OLD
            value: old
          - name: OLD2
            value: old2
      traits:
        - type: myenv
          properties:
            env:
              NEW: new
              OLD2: override
```

Before using the `myenv` patch trait, the `env` in the application is like:

```
spec:
  containers:
  - env:
    - name: OLD
      value: old
    - name: OLD2
      value: old2
```

After using the `myenv` patch trait, the `env` in the application is like:

```
spec:
  containers:
  - env:
    - name: OLD
      value: old
    - name: OLD2
      value: override
    - name: NEW
      value: new
```

Finally, we can see that the application's `env` contains three environment variables: `OLD=old`, `OLD2=override` and `NEW=new`.

## replace

If you wish to replace the entire env array directly, you can use the `+patchStrategy=replace` annotation.

> In the following example, `+patchKey=name` specifies which container the patch should be applied to, while `+patchStrategy=replace` specifies that when merge the arrays, the entire array of environment variables will be replaced directly.

```cue
myenv: {
	type: "trait"
	annotations: {}
	labels: {
		"ui-hidden": "true"
	}
	description: "Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'"
	attributes: appliesToWorkloads: ["*"]
}
template: {
	patch: {
			spec: template: spec: {
					// +patchKey=name
					containers: [{
							name: context.name
							// +patchStrategy=replace
							env: [
									for k, v in parameter.env {
											name:  k
											value: v
									},
							]
					}]
			}
	}

	parameter: {
			env: [string]: string
	}
}
```

Use the above `myenv` trait in your application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        env:
          - name: OLD
            value: old
          - name: OLD2
            value: old2
      traits:
        - type: myenv
          properties:
            env:
              NEW: replace
```

Before using the `myenv` patch trait, the `env` in the application is like:

```yaml
spec:
  containers:
  - env:
    - name: OLD
      value: old
    - name: OLD2
      value: old2
```

After using the `myenv` patch trait, the `env` in the application is like:

```yaml
spec:
  containers:
  - env:
    - name: NEW
      value: replace
```

Finally, we can see that the application's `env` contains one environment variable: `NEW=replace`.