---
title: PostDispatch Traits
---

A `PostDispatch` trait runs once its component's workload is healthy, and renders against the live workload. Use it when a trait needs something that only exists after the workload is up, such as its ready replicas or an assigned address, or when it should only act on a running workload, such as a smoke test.

The built-in `expose` trait is one: it creates its Service once the Deployment or StatefulSet is healthy.

## Dispatch stages

A TraitDefinition's `stage` decides when its resources are applied relative to the component:

| Stage | Applied |
| --- | --- |
| `PreDispatch` | First. The component's workload and default-stage traits wait until these resources are healthy. |
| `DefaultDispatch` | With the component's workload. This is the default when `stage` is unset. |
| `PostDispatch` | Once the component's workload is healthy, rendered with the live workload in `context.output`. |

## How it works

1. The component's workload and its other traits are applied.
2. KubeVela waits for the workload's health check to pass.
3. It reads the workload back from the cluster and renders the `PostDispatch` traits with that live object as `context.output`.
4. It applies the traits' resources and checks their health like any other trait.

So `context.output.status.readyReplicas` and `context.output.metadata.generation` hold real values. In a default-stage trait, `context.output` is the rendered workload before it is applied, with no `status` at all.

## Write a PostDispatch trait

Set `stage: "PostDispatch"` in the definition's `attributes` (`spec.stage` on the TraitDefinition object). This `replica-report` trait writes a ConfigMap with the workload's live replica counts, for a dashboard or another tool to read:

```cue
"replica-report": {
	type:        "trait"
	description: "Writes the workload's live replica counts to a ConfigMap."
	attributes: {
		stage: "PostDispatch"
		appliesToWorkloads: ["deployments.apps"]
		status: healthPolicy: #"""
			cm: context.outputs.report
			isHealth: cm.data != _|_ && cm.data.readyReplicas != _|_
			"""#
	}
}

template: {
	outputs: report: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: name: context.name + "-replicas"
		data: {
			component:     context.name
			replicas:      "\(context.output.status.replicas)"
			readyReplicas: "\(context.output.status.readyReplicas)"
		}
	}
	parameter: {}
}
```

The health policy can read the trait's own resources (`context.outputs.<name>`) and the live workload (`context.output`).

A trait can also act only once the workload is up. This `smoke-test` trait runs a Job that calls the component's Service once the Deployment is healthy, and reports healthy when the Job succeeds:

```cue
"smoke-test": {
	type:        "trait"
	description: "Runs an HTTP check against the component once its workload is healthy."
	attributes: {
		stage: "PostDispatch"
		appliesToWorkloads: ["deployments.apps"]
		status: healthPolicy: #"""
			job: context.outputs.job
			isHealth: *false | bool
			if job.status.succeeded != _|_ {
				isHealth: job.status.succeeded > 0
			}
			"""#
	}
}

template: {
	parameter: {
		// +usage=Port of the component's Service to call
		port: *80 | int
		// +usage=Path to request
		path: *"/" | string
	}

	outputs: job: {
		apiVersion: "batch/v1"
		kind:       "Job"
		metadata: name: context.name + "-smoke-test"
		spec: {
			backoffLimit: 3
			template: spec: {
				restartPolicy: "Never"
				containers: [{
					name:  "check"
					image: "curlimages/curl:8.10.1"
					args: ["-fsS", "http://\(context.name):\(parameter.port)\(parameter.path)"]
				}]
			}
		}
	}
}
```

A Job's pod template can't be changed once it exists, so this template uses only the trait's parameters, never live values that would change on each render.

## Use them in an Application

Apply both definitions with `vela def apply`, then attach them:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: web
spec:
  components:
    - name: web
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
        - type: replica-report
        - type: smoke-test
          properties:
            port: 8000
EOF
```

Once the three replicas are ready:

- the `web-replicas` ConfigMap holds `replicas: "3"` and `readyReplicas: "3"`;
- the `web-smoke-test` Job calls `http://web:8000/` and the trait turns healthy when it succeeds.

```shell
kubectl get configmap web-replicas -o jsonpath='{.data}'
```

## Watch their status

`vela status` shows a `PostDispatch` trait as soon as it is dispatched, even while other components are still rolling out.

While the workload is unhealthy, for example because its image can't be pulled, its `PostDispatch` traits are held back and listed as pending:

```
Services:
  - Name: web
    Health: ❌
    Traits:
      Type: scaler
      Health: ✅

      Type: replica-report
      Pending: true
      Message: ⏳ Waiting for component to be healthy

      Type: smoke-test
      Pending: true
      Message: ⏳ Waiting for component to be healthy
```

When the workload turns healthy, KubeVela dispatches them and their status moves from pending to the result of their own health policy, with nothing to do by hand.

## Context

A `PostDispatch` trait reads the same context as any trait; only `context.output` differs, being the live workload. See the [Context Reference](../context-reference.md).
