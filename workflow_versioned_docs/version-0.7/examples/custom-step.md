---
title: "Write a Step Type: Wait for a Release Gate"
description: "A WorkflowStepDefinition in CUE that reads a ConfigMap and waits until a key holds the value you expect, then a WorkflowRun that uses it as a release gate."
---

The built-in `suspend` step waits for a person. Sometimes the signal comes from somewhere else: a change freeze lifting, another team's pipeline finishing. This example writes a step type, `wait-for-flag`, that waits until a key in a ConfigMap holds the value you expect, and uses it to gate a release.

**Needs:** the `vela-workflow` controller ([Install](../getting-started/install.md)), and the `vela` CLI to vet and apply the definition. `kubectl apply` works too, once the CUE is wrapped in a `WorkflowStepDefinition`.

## The step type

```cue title="wait-for-flag.cue"
import (
	"vela/builtin"
	"vela/kube"
)

"wait-for-flag": {
	alias: ""
	annotations: {}
	attributes: {}
	description: "Wait until a key in a ConfigMap holds the value you expect"
	labels: {}
	type: "workflow-step"
}

template: {
	read: kube.#Read & {
		$params: value: {
			apiVersion: "v1"
			kind:       "ConfigMap"
			metadata: {
				name:      parameter.configMap
				namespace: context.namespace
			}
		}
	}

	// A missing ConfigMap or key reads as "".
	let current = [
		if read.$returns.value.data != _|_ if read.$returns.value.data[parameter.key] != _|_ {read.$returns.value.data[parameter.key]},
		"",
	][0]

	wait: builtin.#ConditionalWait & {
		$params: {
			continue: current == parameter.value
			message:  "waiting for \(parameter.key)=\(parameter.value) in ConfigMap \(parameter.configMap), found \"\(current)\""
		}
	}

	parameter: {
		// +usage=The ConfigMap to watch, in the run's namespace
		configMap: string
		// +usage=The key to read
		key: string
		// +usage=The value that lets the step finish
		value: *"true" | string
	}
}
```

- **`kube.#Read`** reads the ConfigMap. Its result is under `$returns`; a ConfigMap that doesn't exist yet leaves `$returns.value` without `data` rather than failing the step.
- **`builtin.#ConditionalWait`** holds the step while `continue` is false, with `message` shown in the step's status. The engine evaluates the template again after a backoff, so the read runs again each time.
- **`parameter`** is the step's properties.

Vet it, then install it into `vela-system`, where every namespace can use it:

```shell
vela def vet wait-for-flag.cue
vela def apply wait-for-flag.cue
```

```console
Validation wait-for-flag.cue succeed.
WorkflowStepDefinition wait-for-flag created in namespace vela-system.
```

## Use it

```yaml title="gated-release.yaml"
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: gated-release
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: wait-for-freeze-to-lift
        type: wait-for-flag
        timeout: 1h
        properties:
          configMap: release-gates
          key: open
      - name: release
        type: print-message-in-status
        properties:
          message: released
```

The `timeout` fails the gate if nothing opens it within the hour. A real pipeline would put its release steps after it; `print-message-in-status` stands in for them here.

```shell
kubectl apply -f gated-release.yaml
kubectl get workflowrun gated-release \
  -o jsonpath='{range .status.steps[*]}{.name}{"\t"}{.phase}{"\t"}{.message}{"\n"}{end}'
```

There is no ConfigMap yet, so the step waits:

```console
wait-for-freeze-to-lift	running	waiting for open=true in ConfigMap release-gates, found ""
```

Create it closed, and the message follows:

```shell
kubectl create configmap release-gates --from-literal=open=false
```

```console
wait-for-freeze-to-lift	running	waiting for open=true in ConfigMap release-gates, found "false"
```

Open the gate:

```shell
kubectl patch configmap release-gates --type merge -p '{"data":{"open":"true"}}'
```

Within a few seconds, on the step's next try, the run carries on and finishes:

```console
NAME            PHASE       AGE
gated-release   succeeded   21s
```

```console
wait-for-freeze-to-lift	succeeded
release	succeeded	released
```

The wait between tries grows the longer a step waits, up to 60 seconds by default: see [Workflow Working Mechanism](../operate/working-mechanism.md). A gate that stays shut for a long time is noticed up to a minute late.

## Clean up

```shell
kubectl delete workflowrun gated-release
kubectl delete configmap release-gates
kubectl delete workflowstepdefinition wait-for-flag -n vela-system
```

## Read more

- [Workflow Step Definition](../guides/authoring/step-definition.md): how a step's template is evaluated, and the context it reads.
- [Built-in Workflow Operations](../guides/authoring/cue-actions.md): every action a step can import.
