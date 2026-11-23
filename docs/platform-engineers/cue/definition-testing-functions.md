---
title: Test Functions
---

The functions of the `vela/test` package, one per kind of test. For a walk-through, read
[Testing CUE Definitions](./definition-testing.md) first.

:::note
Definition tests are available from KubeVela v1.12.
:::

## At a glance

| Function | Tests | Needs a cluster |
| --- | --- | --- |
| [`#ComponentRender`](#componentrender) | what a component renders, with traits attached | no |
| [`#TraitRender`](#traitrender) | how a trait patches a workload, and its outputs | no |
| [`#ComponentStatus`](#componentstatus) | a component's health, message and details | no |
| [`#TraitStatus`](#traitstatus) | a trait's health, message and details | no |
| [`#WorkflowStepExec`](#workflowstepexec) | what a workflow step does, run through the workflow engine | local test server |
| [`#SourceExec`](#sourceexec) | what a source resolves to, and how it is cached | local test server |
| [`#PolicyRender`](#policyrender) | the objects a policy renders beside the Application's components | no |
| [`#ApplicationPolicyRender`](#applicationpolicyrender) | how an Application-scoped policy changes the Application | no |
| [`#AddonRender`](#addonrender) | what enabling an addon installs | no |

The "local test server" is an API server with no controllers, which `vela def test` starts and stops
itself; see [vela def test](./definition-testing-cli.md#vela-def-test).

## Test files

A test file is named `*_test.cue`, imports `"vela/test"`, and declares each case as a top-level field
whose name is the case's description:

```cue
import "vela/test"

"runs one replica by default": test.#ComponentRender & {
	definition: "web"
	parameter: image: "nginx:1.25"
	expect: output: spec: replicas: 1
}
```

- Case names must be unique within a file. CUE merges two fields with the same name, so two cases
  that share a name silently become one.
- Hidden fields (`_shared: {...}`) hold inputs that several cases unify in; they are not cases.
- A test file may also import provider packages such as `vela/kube`, for [hooks](./definition-testing-mocks-hooks.md#hooks) and checks.
- `*_test.cue` files are skipped wherever definitions are read, so they can live beside the
  definitions they test.

## Fields every case takes

All functions except `#AddonRender` take these:

| Field | Type | Description |
| --- | --- | --- |
| `definition` | string | Path of the definition's `.cue` file, relative to the test file; `.cue` may be omitted, and the path may lead elsewhere, such as `"../steps/publish"`. |
| `context` | struct | Fields of the `context` the definition sees. See [Context](./definition-testing-mocks-hooks.md#context). |
| `parameter` | struct | The definition's parameters. |
| `mocks` | struct | Answers to provider calls. See [Mocks](./definition-testing-mocks-hooks.md#mocks). |
| `expect` | struct | What the case expects. Its fields depend on the function. |

## Functions

### #ComponentRender

Renders a component definition, with any traits attached, as the controller would.

```cue
"a scaler trait sets the replicas": test.#ComponentRender & {
	definition: "web"
	parameter: image: "nginx:1.25"
	traits: [{definition: "scaler", parameter: replicas: 4}]
	expect: {
		output: spec: replicas: 4
		traits: scaler: outputs: hpa: kind: "HorizontalPodAutoscaler"
	}
}
```

| Field | Description |
| --- | --- |
| `traits` | Traits to attach, in order, each `{definition, parameter}`. Each patches the workload the one before it left. |
| `expect.output` | The rendered workload, after every trait's patch. |
| `expect.outputs` | The component's own outputs, by name. |
| `expect.traits.<type>.outputs` | Each attached trait's outputs, by trait type then name. |
| `expect.context` | The `context` templates see once everything has rendered: `context.output` after the traits' patches, `context.outputs` with every output by name, and the rest. It is before the controller adds its labels. |
| `expect.calls` | Provider calls the render made. See [Calls](./definition-testing-mocks-hooks.md#calls). |
| `expect.error` | The render error. See [Errors](./definition-testing-expectations.md#errors). |

See also [`#ComponentStatus`](#componentstatus) for the same component's health.

### #TraitRender

Renders a trait against a workload it patches. The workload is a component of type
`context.componentType`, which defaults to `cuetest-workload`.

```cue
"patches the workload's replicas": test.#TraitRender & {
	definition: "scaler"
	workload: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: name: "shop"
		spec: template: spec: containers: [{name: "shop", image: "nginx:1.25"}]
	}
	parameter: replicas: 3
	expect: {
		output: spec: replicas: 3
		outputs: hpa: kind: "HorizontalPodAutoscaler"
	}
}
```

| Field | Description |
| --- | --- |
| `workload` | The object the trait patches. Required. |
| `expect.output` | The workload after the patch. |
| `expect.outputs` | The trait's outputs, by name. |
| `expect.context`, `expect.calls`, `expect.error` | As for [`#ComponentRender`](#componentrender). |

To test a trait together with a component, attach it to a [`#ComponentRender`](#componentrender) case
instead.

### #ComponentStatus

Renders a component, then evaluates its health policy, custom status message and details against the
rendered objects as the cluster reports them.

```cue
"healthy once every replica is ready": test.#ComponentStatus & {
	definition: "web"
	parameter: {image: "nginx:1.25", replicas: 2}
	observed: output: status: readyReplicas: 2
	expect: {
		healthy: true
		message: "Ready:2/2"
		details: image: "nginx:1.25"
	}
}
```

| Field | Description |
| --- | --- |
| `traits` | As for [`#ComponentRender`](#componentrender). |
| `observed.output` | Merged over the rendered workload, as the cluster would report it: typically `status`, plus fields the API server defaults. A built-in kind keeps only the fields its type has, so `status` on a ConfigMap is dropped. |
| `observed.outputs` | Merged over the component's outputs, by name. |
| `observed.traits.<type>.outputs` | Merged over each attached trait's outputs. |
| `expect.healthy` | Whether the health policy passes. |
| `expect.message` | The custom status message. |
| `expect.details` | The status details, by key. |
| `expect.traits.<type>` | Each attached trait's `healthy`, `message` and `details`. |
| `expect.error` | A render or status evaluation error. |

### #TraitStatus

Renders a trait, then evaluates its health and status against its own outputs as the cluster reports
them. A trait's status never sees the workload.

```cue
"healthy once the autoscaler reaches the replicas": test.#TraitStatus & {
	definition: "scaler"
	workload: {apiVersion: "apps/v1", kind: "Deployment", metadata: name: "shop"}
	parameter: replicas: 3
	observed: outputs: hpa: status: currentReplicas: 3
	expect: healthy: true
}
```

| Field | Description |
| --- | --- |
| `workload` | The object the trait patches. Required. |
| `observed.outputs` | Merged over the trait's outputs, by name. |
| `expect.healthy`, `expect.message`, `expect.details`, `expect.error` | As for [`#ComponentStatus`](#componentstatus). |

### #WorkflowStepExec

Runs a workflow step through the workflow engine, as the controller does, against the local test
server. Providers run for real unless mocked. Calls that reach outside the cluster (`vela/http`,
`vela/email`, `vela/metrics`, `vela/helm`, `vela/registry`, `vela/addon`) or need an Application
(`vela/oam`, multicluster deploy) must be mocked. Each case gets a namespace of its own unless its
`context` names one.

```cue
"posts the ConfigMap's message": test.#WorkflowStepExec & {
	definition: "notify"
	parameter: {config: "settings", webhook: "https://hooks.example.com/deploy"}
	resources: [{apiVersion: "v1", kind: "ConfigMap", metadata: name: "settings", data: message: "deployed"}]
	mocks: "vela/http": "#HTTPDo": $returns: {statusCode: 202, body: "ok"}
	expect: {
		phase: "succeeded"
		calls: "vela/http": "#HTTPDo": [{$params: {method: "POST", request: body: "deployed"}}]
	}
}
```

| Field | Description |
| --- | --- |
| `resources` | Objects created before the step runs, with any `status` set as a controller would have. Nothing reconciles, so nothing becomes ready unless a case says it is. |
| `crds` | CRD files or directories to install, relative to the test file. |
| `expect.phase` | The step's phase: `succeeded`, `failed`, `running` (waiting), `suspending`, `skipped` or `pending`. |
| `expect.message`, `expect.reason` | The step's message and reason. |
| `expect.calls` | Every provider call, real or mocked, with its `$params` and what it returned. |
| `expect.resources` | Objects read back after the step, each named by `apiVersion`, `kind` and `metadata.name`; the namespace defaults to the case's. One that does not exist reads as empty. |
| `expect.checks.<name>` | `{call, returns}`: after the step, `call` runs a provider function for real and `returns` is matched against what it returns. Checks run in order, so one can use an earlier one's `call.$returns`. `kube.#Read` of a missing object returns `err` rather than failing, so `returns: err: =~"not found"` expects an absent object. |
| `expect.error` | An error running the step. |

See also [Hooks](./definition-testing-mocks-hooks.md#hooks), to set up objects for several cases at once.

### #SourceExec

Resolves a source definition through the controller's own source engine, against the local test server,
as an Application reading it would. `vela/kube` and `vela/velaconfig` read that cluster for real unless
mocked; `vela/http` and `vela/registry` must be mocked. Nothing is cached, so every case fetches.

```cue
"reads the tier from the ConfigMap": test.#SourceExec & {
	definition: "settings"
	parameter: name: "shop-config"
	resources: [{apiVersion: "v1", kind: "ConfigMap", metadata: name: "shop-config", data: tier: "gold"}]
	expect: {
		output: tier: "gold"
		calls: "vela/kube": "#Get": [{$params: resource: metadata: name: "shop-config"}]
	}
}

"caches for five minutes and serves stale on failure": test.#SourceExec & {
	definition: "settings"
	parameter: name: "shop-config"
	resources: [{apiVersion: "v1", kind: "ConfigMap", metadata: name: "shop-config", data: tier: "gold"}]
	expect: storage: {ttl: "300s", onStaleFailure: "use-stale"}
}
```

| Field | Description |
| --- | --- |
| `consumer` | The surface reading the source: `component` (default), `trait`, `workflowstep` or `policy-rendered`. It must be one the definition's `consumableFrom` allows, and it decides which context fields the source can read. |
| `resources`, `crds` | As for [`#WorkflowStepExec`](#workflowstepexec). |
| `expect.output` | The resolved output, after the engine checks it against the definition's schema. |
| `expect.calls` | Every provider call, real or mocked. |
| `expect.storage.ttl` | How long the value is cached, compared as a duration, so `"300s"` matches `"5m"`. |
| `expect.storage.onStaleFailure` | What happens when a refresh fails while a stale value is cached. |
| `expect.storage.keyInputs` | The context fields the cache key varies with, and so which Applications share an entry. |
| `expect.storage.key` | The cache key itself. |
| `expect.error` | A resolution error; an output that does not fit the schema is reported under `schema`. |

### #PolicyRender

Renders a policy whose template produces objects, as the controller does before dispatching them beside
the Application's components: named after the policy, in the Application's namespace unless they say
otherwise, and labelled as the Application's.

```cue
"guards every component": test.#PolicyRender & {
	definition: "network-guard"
	context: name: "guard"
	parameter: allowFrom: "ingress"
	artifacts: {
		web: workload: {apiVersion: "apps/v1", kind: "Deployment", spec: selector: matchLabels: app: "web"}
		api: workload: {apiVersion: "apps/v1", kind: "Deployment", spec: selector: matchLabels: app: "api"}
	}
	expect: outputs: {
		web: spec: podSelector: matchLabels: app: "web"
		api: metadata: name: "api-guard"
	} @exact()
}
```

| Field | Description |
| --- | --- |
| `artifacts.<component>` | The Application's rendered components, as the policy reads them in `context.artifacts`: `workload`, and `traits.<type>.<output>`. |
| `expect.output`, `expect.outputs`, `expect.context`, `expect.calls`, `expect.error` | As for [`#ComponentRender`](#componentrender). |

A policy that renders nothing, one only the controller reads such as `topology` or `override`, cannot
be tested this way.

### #ApplicationPolicyRender

Renders an Application-scoped policy as the controller does before it parses the Application: one
policy, given the Application's spec, with its output applied as the next policy would see it. The
ordering of several policies, and global policies, are the controller's concern.

```cue
"labels the Application with its team": test.#ApplicationPolicyRender & {
	definition: "owner-label"
	parameter: team: "payments"
	spec: components: [{name: "web", type: "webservice", properties: image: "nginx:1.25"}]
	expect: {
		enabled: true
		output: labels: "platform.example.com/owner": "payments"
		application: metadata: labels: "platform.example.com/owner": "payments"
	}
}
```

| Field | Description |
| --- | --- |
| `spec.components`, `spec.workflow`, `spec.policies` | The Application's spec, read as `context.appComponents`, `context.appWorkflow` and `context.appPolicies`. |
| `expect.enabled` | The template's `enabled` (or `config.enabled`); defaults to `true`. |
| `expect.output` | What the template emitted: `components`, `workflow`, `policies`, `labels`, `annotations` and `ctx`. |
| `expect.application` | The Application with the output applied: `metadata` (name, namespace, labels, annotations) and `spec`. Labels and annotations merge; components, workflow and policies replace the Application's own where given. |
| `expect.calls`, `expect.error` | As for [`#ComponentRender`](#componentrender). |

### #AddonRender

Renders a local addon as `vela addon enable` would install it. It stops at the Application: the
components it lists are for their definitions' own tests, which a definition the addon ships can have
beside it. Addon templates compile without providers, so an addon case takes no mocks.

```cue
"parameters reach the components": test.#AddonRender & {
	addon: "."
	parameter: {image: "shop:2.0", serviceType: "NodePort"}
	expect: components: {
		web: properties: image: "shop:2.0"
		svc: properties: spec: type: "NodePort"
	}
}

"rejects a parameter the addon does not allow": test.#AddonRender & {
	addon: "."
	parameter: serviceType: "Nope"
	expect: error: =~"parameter.serviceType"
}
```

| Field | Description |
| --- | --- |
| `addon` | The addon's directory, relative to the test file. Required. |
| `parameter` | The addon's parameters. |
| `expect.application` | The addon's Application. |
| `expect.components.<name>` | Its components, by name. |
| `expect.auxiliaries` | The objects it installs beside the Application. |
| `expect.definitions.<kind>.<name>` | The definitions it ships, by kind then name. |
| `expect.configTemplates`, `expect.schemas`, `expect.views` | What it ships, by name. |
| `expect.error` | An error rendering it. |

The hub an addon case renders against has registered every cluster `parameter.clusters` names.
