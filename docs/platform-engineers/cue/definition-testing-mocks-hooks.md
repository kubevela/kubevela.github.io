---
title: Mocks, Context and Hooks
---

What a case runs against: the `context` it sees, mocks for provider calls, the calls it records,
and hooks that set up the test cluster.

## Context

A case's `context` sets fields of the `context` the definition sees. Fields a case leaves out take
these defaults, which match those of defkit's `TestContext`, so a CUE test and a defkit test of the
same definition agree:

| Field | Default |
| --- | --- |
| `name` | `test-component`; `test-policy` for a policy; for a source, the binding is `test` |
| `appName` | `test-app` |
| `namespace` | `default` for renders; the case's own namespace for workflow steps and sources |
| `appRevision` | `<appName>-v1`, so `test-app-v1` |
| `cluster` | the local cluster |
| `clusterVersion` | `{major: "1", minor: 28}` |
| `stepName` | `test-step`, for a workflow step |
| `componentType` | `cuetest-workload`, the type of the workload a trait patches |

A case may also set `appLabels`, `appAnnotations`, `publishVersion`, `workflowName`, `revision`,
`replicaKey`, `custom`, and for an Application-scoped policy `policyName` and its revision fields, as
the definition's kind offers them. A field the kind is not offered, or one the case determines itself,
is a load error that says why:

| Field | Determined by |
| --- | --- |
| `componentName` | `context.name` |
| `componentType` for a component, `traitType`, `policyType` | the definition's type; a trait case sets `componentType` to choose the workload it patches |
| `policyName` | `context.name`, for a policy |
| `appRevisionNum` | the number in `context.appRevision`, so `"shop-v3"` gives `3` |
| `cluster` | always local for a policy, whose objects are dispatched to the hub |
| `name` in a workflow step | the Application; set `appName` instead |
| `stepSessionID` | the workflow engine |

## Mocks

`mocks` answer the calls templates make to side-effecting providers, by import path then function.
Each is one mock or a list of them, tried in order, each `{$params?, $returns?}`:

```cue
mocks: "vela/kube": "#Get": [
	{$params: cluster: "prod", $returns: value: data: tier: "gold"},
	{$returns: value: data: tier: "silver"},
]
```

A mock without `$params` answers every call to the function; with it, calls whose `$params` include
those fields. A legacy `vela/op` function takes its parameters and gives its results beside them, so its
mock matches and fills those fields instead.

What an unmatched call does depends on the function. A render, status, policy or addon case fails it
rather than reach a cluster or the network. `#WorkflowStepExec` and `#SourceExec` run it for real
against the local test server, unless it reaches outside or needs an Application. `vela/base64` and
`vela/cue`, and in a step `vela/builtin`, cannot be mocked and always run for real.

## Calls

`expect.calls` holds the provider calls a case made, by import path then function, each a list in the
order they ran of `{$params, $returns?}`. A list fixes which calls ran and their order; add `...` to
allow more, or `@contains()` for any order. `"#Apply"?: _|_` asserts none were made:

```cue
expect: calls: {
	"vela/kube": "#Read": [{$returns: value: data: message: "deployed"}]
	"vela/http": "#HTTPDo": [{$params: {method: "POST", request: body: "deployed"}}]
}
```

## Hooks

A hook is a top-level field holding a provider call, or structs of calls at any depth, marked to run
around the file's cases:

```cue
settings: test.#Seed & {$params: objects: [{
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: name: "settings"
	data: message: "deployed"
}]} @beforeEach()
```

| Attribute | Runs |
| --- | --- |
| `@before()` | Once, before the file's first case. A failure fails every case. |
| `@beforeEach()` | Before each case. A failure fails the case without running it. |
| `@afterEach()` | After each case, whether it passed or not. |
| `@after()` | Once, after the file's last case. |

The calls in a hook run in order, so one can use an earlier one's `$returns`. They run for real,
unmocked, and are not among a case's calls. An object a hook or check names without a namespace is in
its scope's: the case's around a case, `default` around the file. When no case runs, no hook does. A
hook in a file with no step or source case, a hook mark on a nested field, or two marks on one field,
is a load error.

What hooks create is deleted, newest first, when their scope ends, pass or fail: after the case for
`@beforeEach` and `@afterEach`, after the file for `@before` and `@after`. So is what a case's own
`resources` create, and what its step creates, after the case. A call creates the objects its value
names, or, for `config.#CreateConfig`, the Secret holding the Config; anything else a provider makes,
such as the objects a Config's template outputs, is for an `@after` hook to delete. Objects that already
existed are left, as are namespaces, since the test server cannot finish deleting one.

### test.#Seed

Creates objects on the test server, then sets any `status` they carry, as a controller would have.
`kube.#Apply` cannot do that, since the API server drops `status` on a create or apply. A namespace an
object names that does not exist is created. Unlike `kube.#Apply`, an object that already exists is an
error. `test.#Seed` and `test.#InstallCRDs` run only in a hook or a check, never as a case.

### test.#InstallCRDs

Installs CRD files or directories, relative to the test file, in a hook:

```cue
crds: test.#InstallCRDs & {$params: paths: ["./crds"]} @before()
```
