---
title: Testing CUE Definitions
---

A definition is code, and it deserves tests like any other. `vela def test` runs tests written in CUE,
kept in a `*_test.cue` file beside the definition they cover. A test gives the definition its
parameters and context, says what it expects back, and fails when the definition does something else.

Tests can check what a component or trait renders, its health and status messages, what a workflow
step does against a cluster, what a source resolves to, and what a policy or addon produces. Render
and status tests need no cluster at all. Workflow step and source tests run against a local API
server that `vela def test` starts and stops for you.

:::tip
This page assumes you can write a definition in CUE. If not, start with
[Manage Definition](./definition-edit.md) and the [CUE basics](./basic.md). Every function, field and
flag is listed in the reference pages under this one, starting with
[Test Functions](./definition-testing-functions.md).
:::

## Before you start

- **KubeVela v1.12 or later.** `vela def test` ships with the `vela` CLI from v1.12; check with
  `vela version`.
- **For workflow step and source tests only**, the `etcd` and `kube-apiserver` binaries of a local test
  server. Install them once with
  [`setup-envtest`](https://pkg.go.dev/sigs.k8s.io/controller-runtime/tools/setup-envtest) and point
  `KUBEBUILDER_ASSETS` at them:

  ```bash
  go install sigs.k8s.io/controller-runtime/tools/setup-envtest@latest
  export KUBEBUILDER_ASSETS="$(setup-envtest use -p path)"
  ```

Render and status tests, which are most tests, need neither a cluster nor these binaries.

## A first test

Take a small component definition, `web.cue`, which renders a Deployment and an optional Service:

```cue title="web.cue"
web: {
	type: "component"
	attributes: {
		workload: definition: {
			apiVersion: "apps/v1"
			kind:       "Deployment"
		}
		status: {
			healthPolicy: #"""
				isHealth: context.output.status.readyReplicas == context.output.spec.replicas
				"""#
			customStatus: #"""
				message: "Ready:\(context.output.status.readyReplicas)/\(context.output.spec.replicas)"
				"""#
			details: #"""
				image: parameter.image
				"""#
		}
	}
}
template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: name: context.name
		spec: {
			replicas: parameter.replicas
			template: spec: containers: [{image: parameter.image}]
		}
	}
	if parameter.expose {
		outputs: service: {
			apiVersion: "v1"
			kind:       "Service"
			metadata: name: context.name
		}
	}
	parameter: {
		image:    string
		replicas: *1 | int
		expose:   *false | bool
	}
}
```

Its tests go in `web_test.cue`, in the same directory:

```cue title="web_test.cue"
import "vela/test"

// Fields every case below shares.
_web: {
	definition: "web"
	context: name: "shop"
}

"renders a Deployment from its parameters": test.#ComponentRender & _web & {
	parameter: {image: "nginx:1.25", replicas: 3}
	expect: output: {
		kind: "Deployment"
		metadata: name: "shop"
		spec: {
			replicas: 3
			template: spec: containers: [{image: "nginx:1.25"}]
		}
	}
}

"runs one replica by default": test.#ComponentRender & _web & {
	parameter: image: "nginx:1.25"
	expect: output: spec: replicas: 1
}
```

A top-level field built from a `vela/test` function is a **case** (hidden fields such as `_web`, and
[hooks](#setting-up-with-hooks), are not). Its name is the description you will see when it fails, and
its value says three things:

- **which kind of test** it is, by unifying with a function from the `vela/test` package, here
  `test.#ComponentRender`;
- **the inputs**: `definition` is the path of the definition's `.cue` file relative to the test file,
  with `.cue` optional, then `parameter` and `context`;
- **what to expect**, under `expect`.

Shared inputs live in a hidden field such as `_web` and are unified into each case, so a case only
states what makes it different.

Run the tests from the directory, or point `vela def test` at a file or a directory, which is searched
recursively:

```bash
vela def test .
```

```console
2 passed, 0 failed
```

Change the second case to expect `replicas: 2` and run it again. A failing case names its file, line and
description, and says exactly where the result differed:

```console
FAIL web_test.cue:21 web / runs one replica by default
  output.spec.replicas: expected 2, got 1
1 passed, 1 failed
Error: 1 of 2 definition tests failed
```

Add `-v` to list the passing cases as well.

:::note
`*_test.cue` files are skipped wherever definitions are read, so `vela def apply`, `vela def vet`,
`vela def apply-module` and addons never treat a test file as a definition. Keep tests beside the
definitions they cover.
:::

## How expectations match

An expectation does not have to describe the whole result. It passes when it **subsumes** the result:
every field it names must be present and match, and fields it does not name are ignored. That is why
`expect: output: spec: replicas: 1` is a complete test: it checks one field and nothing else.

A few rules give you finer control:

| You write | It means |
| --- | --- |
| `replicas: 3` | the field is present and equal to 3 |
| `image: =~"^nginx"`, `replicas: >2`, `replicas: !=3` | the field matches a CUE constraint |
| `ports?: _\|_` | the field is absent |
| `containers: [{...}, {...}]` | the list has exactly these elements, in order |
| `containers: [{...}, ...]` | the list starts with these elements, and may have more |
| `labels: {...} @exact()` | the struct has no fields beyond those given |
| `outputs: {} @exact()` | nothing at all, here no outputs |
| `env: [...] @contains()` | each element given matches a different element, in any order |
| `field: ... @not()` | passes unless the field is present and matches |

For example, a component that only renders a Service when asked:

```cue
"adds no Service unless asked": test.#ComponentRender & _web & {
	parameter: image: "nginx:1.25"
	expect: outputs: {} @exact()
}

"exposes a Service when asked": test.#ComponentRender & _web & {
	parameter: {image: "nginx:1.25", expose: true}
	expect: outputs: service: {kind: "Service", metadata: name: "shop"}
}
```

And a check that the container gets nothing it was not given:

```cue
"the container gets no name or ports": test.#ComponentRender & _web & {
	parameter: image: "nginx:1.25"
	expect: output: spec: template: spec: containers: [{image: "nginx:1.25", name?: _|_, ports?: _|_}]
}
```

## Expecting an error

A definition that rejects bad input should be tested for it too. `expect: error` matches the error a
case produces, and a case that expects one expects nothing else:

```cue
"an image is required": test.#ComponentRender & _web & {
	expect: error: parameter: [=~"image"]
}
```

`error` is either a constraint matched against the whole message, such as `error: =~"image"`, or a
struct of messages by category, so a test can say which part of the definition objected:

| Category | Holds |
| --- | --- |
| `parameter` | parameter validation errors |
| `user` | what the definition raised itself, through `errs` |
| `template` | the template's other errors, and any other render failure |
| `status` | errors evaluating health, message or details |
| `schema` | how a source's output does not fit its schema |
| `message` | the whole message |

A category is only present when it has messages, so `error: template?: _|_` asserts that the template
itself was fine.

## Testing health and status

`#ComponentStatus` renders the component, then evaluates its health policy, custom status message and
details against the objects as the cluster would report them. `observed` supplies what the cluster
adds, typically `status`, merged over what the template rendered:

```cue
"healthy once every replica is ready": test.#ComponentStatus & _web & {
	parameter: {image: "nginx:1.25", replicas: 2}
	observed: output: status: readyReplicas: 2
	expect: {
		healthy: true
		message: "Ready:2/2"
		details: image: "nginx:1.25"
	}
}

"not healthy while a replica is starting": test.#ComponentStatus & _web & {
	parameter: {image: "nginx:1.25", replicas: 2}
	observed: output: status: readyReplicas: 1
	expect: {healthy: false, message: "Ready:1/2"}
}
```


## Testing traits

Take a `scaler` trait, `scaler.cue`, which sets the workload's replicas and adds an autoscaler:

```cue title="scaler.cue"
scaler: {
	type: "trait"
	attributes: {
		appliesToWorkloads: ["deployments.apps"]
		status: healthPolicy: #"""
			isHealth: context.outputs.hpa.status.currentReplicas == parameter.replicas
			"""#
	}
}
template: {
	patch: spec: replicas: parameter.replicas
	outputs: hpa: {
		apiVersion: "autoscaling/v2"
		kind:       "HorizontalPodAutoscaler"
		metadata: name: context.name
		spec: {
			scaleTargetRef: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
				name:       context.name
			}
			minReplicas: parameter.replicas
			maxReplicas: parameter.replicas
		}
	}
	parameter: replicas: int
}
```

A trait patches a workload, so `#TraitRender` takes the `workload` it patches. `expect: output` is the
workload after the patch, and `expect: outputs` holds the trait's own objects. Its tests go in
`scaler_test.cue`:

```cue title="scaler_test.cue"
import "vela/test"

_scaler: {
	definition: "scaler"
	context: name: "shop"
	workload: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: name: "shop"
		spec: template: spec: containers: [{name: "shop", image: "nginx:1.25"}]
	}
}

"patches the workload's replicas": test.#TraitRender & _scaler & {
	parameter: replicas: 3
	expect: {
		output: spec: {
			replicas: 3
			template: spec: containers: [{name: "shop"}]
		}
		outputs: hpa: {kind: "HorizontalPodAutoscaler", metadata: name: "shop"}
	}
}
```

`#TraitStatus` evaluates a trait's health against its own outputs as the cluster reports them. A
trait's status never sees the workload:

```cue
"healthy once the autoscaler reaches the replicas": test.#TraitStatus & _scaler & {
	parameter: replicas: 3
	observed: outputs: hpa: status: currentReplicas: 3
	expect: healthy: true
}
```

To test a component with traits attached, list them on a `#ComponentRender` or `#ComponentStatus`
case. They apply in order, each patching what the one before it left, and their outputs are reported
by trait type:

```cue
"a scaler trait sets the replicas": test.#ComponentRender & _web & {
	parameter: image: "nginx:1.25"
	traits: [{definition: "scaler", parameter: replicas: 4}]
	expect: {
		output: spec: replicas: 4
		traits: scaler: outputs: hpa: kind: "HorizontalPodAutoscaler"
	}
}
```

:::tip
A trait patch unifies with the workload. If the workload already sets a field to a different value,
the case fails with a conflict, exactly as the trait would fail on that workload in a real
Application. A test like this is a quick way to find out which workloads a trait can patch.
:::

## Testing workflow steps

`#WorkflowStepExec` runs a step through the workflow engine, the way the controller does, against a
local API server with no controllers running. Providers act on that server for real, so a step that
reads or applies objects really does. Here is a step that reads a message from a ConfigMap and posts
it to a webhook:

```cue title="notify.cue"
import (
	"vela/kube"
	"vela/http"
)

notify: {
	type:        "workflow-step"
	description: "Posts a ConfigMap's message to a webhook"
}
template: {
	settings: kube.#Read & {
		$params: value: {
			apiVersion: "v1"
			kind:       "ConfigMap"
			metadata: {name: parameter.config, namespace: context.namespace}
		}
	}
	post: http.#HTTPDo & {
		$params: {
			method: "POST"
			url:    parameter.webhook
			request: body: settings.$returns.value.data.message
		}
	}
	parameter: {
		config:  string
		webhook: string
	}
}
```

And its test:

```cue title="notify_test.cue"
import (
	"vela/kube"
	"vela/test"
)

_settings: {
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: name: "settings"
	data: message: "deployed"
}

_notify: {
	definition: "notify"
	parameter: {config: "settings", webhook: "https://hooks.example.com/deploy"}
}

"posts the ConfigMap's message": test.#WorkflowStepExec & _notify & {
	resources: [_settings]
	mocks: "vela/http": "#HTTPDo": $returns: {statusCode: 202, body: "ok"}
	expect: {
		phase: "succeeded"
		calls: {
			"vela/kube": "#Read": [{$returns: value: data: message: "deployed"}]
			"vela/http": "#HTTPDo": [{$params: {method: "POST", request: body: "deployed"}}]
		}
	}
}

"fails when the ConfigMap is missing": test.#WorkflowStepExec & _notify & {
	mocks: "vela/http": "#HTTPDo": $returns: {statusCode: 202, body: "ok"}
	expect: phase: "failed"
}
```

- `resources` are created before the step runs. Each case gets a namespace of its own, and an object
  without a namespace lands in it.
- `mocks` answer provider calls instead of running them. Calls that would leave the test cluster,
  such as `vela/http`, `vela/email` or `vela/helm`, must be mocked; an unmocked one fails the step
  with a message saying it reaches outside the cluster. A mock without `$params` answers every call to
  that function; with `$params`, only calls whose parameters include those fields.
- `expect: phase` is the step's phase: `succeeded`, `failed`, `running` (waiting), `suspending`,
  `skipped` or `pending`.
- `expect: calls` lists every provider call the step made, real or mocked, with its `$params` and what
  it returned, by import path and then function. A list fixes which calls ran and in what order; add
  `...` to allow more, or `@contains()` for any order.

To check what a step left on the cluster, `expect: resources` reads objects back by `apiVersion`,
`kind` and `metadata.name`. For anything else, `expect: checks` calls a provider for real after the
step and matches what it returns:

```cue
"leaves the ConfigMap as it found it": test.#WorkflowStepExec & _notify & {
	resources: [_settings]
	mocks: "vela/http": "#HTTPDo": $returns: {statusCode: 202, body: "ok"}
	expect: checks: settings: {
		call: kube.#Read & {$params: value: {apiVersion: "v1", kind: "ConfigMap", metadata: name: "settings"}}
		returns: value: data: message: "deployed"
	}
}
```

Nothing reconciles on the test cluster, so a Deployment never becomes ready on its own. To test a
step that waits for readiness, create the object with the status a controller would have set, in
`resources` or with `test.#Seed`.

## Setting up with hooks

When several cases need the same objects, hooks create them. A hook is an ordinary provider call, or a
struct of them, marked with one of four attributes:

| Attribute | Runs |
| --- | --- |
| `@before()` | once, before the file's first case |
| `@beforeEach()` | before each case |
| `@afterEach()` | after each case |
| `@after()` | once, after the file's last case |

```cue title="notify_hooks_test.cue"
import (
	"vela/kube"
	"vela/test"
)

// Every case in this file starts with the settings ConfigMap in place.
settings: test.#Seed & {$params: objects: [{
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: name: "settings"
	data: message: "deployed"
}]} @beforeEach()

// A namespace the cases share, created once for the file.
team: kube.#Apply & {$params: value: {apiVersion: "v1", kind: "Namespace", metadata: name: "team-a"}} @before()

"posts the seeded message": test.#WorkflowStepExec & {
	definition: "notify"
	parameter: {config: "settings", webhook: "https://hooks.example.com/deploy"}
	mocks: "vela/http": "#HTTPDo": $returns: {statusCode: 202, body: "ok"}
	expect: calls: "vela/http": "#HTTPDo": [{$params: request: body: "deployed"}]
}
```

Hook calls run for real and are not counted among a case's calls. What a hook creates is deleted when
its scope ends, newest first, pass or fail; so is what a case's `resources` and its step create.
Objects that already existed are left, and so are namespaces, as the
[hooks reference](./definition-testing-mocks-hooks.md#hooks) explains.
`test.#Seed` differs from `kube.#Apply` in two ways: it sets `status` as a controller would, which an
apply cannot, and it fails if the object already exists. The hooks follow Ginkgo's rules: a failing
`@before` fails every case, a failing `@beforeEach` fails its case without running the step, and the
after hooks always run.

## Testing sources, policies and addons

The same pattern covers the other definition kinds; the [reference](./definition-testing-functions.md)
lists every field.

- **`#SourceExec`** resolves a source (a SourceDefinition) through the controller's own source engine, as
  an Application reading it would. `expect: output` is the resolved value after the engine checks it
  against the definition's schema, and `expect: storage` is how it would be cached: its TTL, what it
  does on a stale failure, and which context fields the cache key varies with.
- **`#PolicyRender`** renders a policy that produces objects beside the Application's components, given
  the components as `artifacts`.
- **`#ApplicationPolicyRender`** renders an Application-scoped policy given the Application's `spec`,
  and expects the result in `application`.
- **`#AddonRender`** renders a local addon as `vela addon enable` would: its Application, the objects it
  installs beside it, and the definitions, config templates, schemas and views it ships.

## Organising tests

- **One test file per definition**, named after it and kept beside it: `web.cue` and `web_test.cue`.
  A test file can reach a definition elsewhere, as `definition: "../components/web"`, but beside it is
  where the next person will look.
- **Name each case after the behaviour it checks**, as a sentence: "runs one replica by default", not
  "test 2". The name is what a failure prints, and it is how `--focus` finds the case.
- **Put shared inputs in a hidden field** and unify it into each case, so a case states only what makes
  it different.
- **Test each branch the template takes**, such as a parameter set and left out, and each error a user
  can cause, with `expect: error`.
- **Test only what the case is about.** An expectation ignores what it does not name, so a case that
  checks `replicas` keeps passing when an unrelated label changes. Reach for `@exact()` only where extra
  fields would be a bug.
- **Park known defects with `@pending(reason)`** rather than deleting the case, and run
  `--check-pending` in CI so the marker comes off when the defect is fixed.

## Choosing which cases run

Label cases with `@label(...)`, after a case, inside one, or at the top of a file for all its cases:

```cue
"a scaler trait sets the replicas": test.#ComponentRender & _web & {
	// ...
} @label(slow)
```

Every case is also labelled with its kind (`component`, `trait`, `policy`, `application-policy`,
`workflow-step`, `source`, `addon`) and what it does (`render`, `status`, `exec`). Select cases with the same flags Ginkgo uses:

```bash
# status tests that are not labelled slow
vela def test --label-filter 'status && !slow'

# cases whose description matches a pattern
vela def test --focus 'replica'

# one case, by line
vela def test --focus-file web_test.cue:21
```

## Parking a known defect

A case that pins a bug you have not fixed yet can be parked with `@pending(reason)`. It still loads,
so its syntax stays checked, but it does not run, and the run reports it as pending:

```cue
"details report the replicas too": test.#ComponentStatus & _web & {
	parameter: {image: "nginx:1.25", replicas: 2}
	observed: output: status: readyReplicas: 2
	expect: details: replicas: "2"
} @pending(details only report the image)
```

```console
9 passed, 0 failed, 1 pending
```

When the bug is fixed, the marker comes off in the same change, and the case starts guarding the fix.
Nothing fails on its own when a parked defect is fixed, so `--check-pending` runs the pending cases
too, and fails any that now pass, with a message saying to remove the marker:

```console
FAIL web_test.cue:70 web / details report the replicas too
  passes, but is marked @pending(details only report the image): the defect is fixed, so remove the marker
9 passed, 0 failed, 1 no longer pending
Error: 1 pending definition test now passes; remove its @pending marker
```

Use `--fail-on-pending` instead to fail a run that has any pending case at all.

## The CUE upgrader

KubeVela rewrites some legacy CUE syntax before rendering, so definitions written for older CUE
versions keep working. Tests run each definition **as written**, so a test tells you whether a
definition still needs that help. `--upgrade` runs every definition through the upgrader first, with
every rewrite on, to see whether it would rescue one that fails.

A case that is known to depend on the upgrader is marked `@upgrade(reason="...")`. If it fails as
written, it is retried upgraded and reported as upgraded rather than failed; once the definition is
fixed and the case passes as written, the marker must come off. `--fail-on-upgrade` treats those cases
as failures instead.

## Running tests in CI

`vela def test` exits non-zero when any case fails or any test file fails to load, so it can gate a
pipeline as it is. For a machine-readable report, `--json` prints an array with one result per case.

Workflow step and source cases need the `etcd` and `kube-apiserver` binaries that
[`setup-envtest`](https://pkg.go.dev/sigs.k8s.io/controller-runtime/tools/setup-envtest) installs. Point
`vela def test` at them with `--envtest-assets` or `KUBEBUILDER_ASSETS`:

```bash
vela def test ./definitions --check-pending \
  --envtest-assets "$(setup-envtest use -p path)"
```

The test cluster installs KubeVela's CRDs from the vela-core chart when it finds one above the test
files; elsewhere, pass them with `--crds`. Render, status, policy and addon cases contact no cluster
and need neither.

To run the same cases from a Go test suite, `pkg/definition/cuetest/ginkgotest` registers them as
Ginkgo specs, one per case, with the case's labels, so Ginkgo's own `--label-filter` and `--focus`
select them. A `@pending` case becomes a pending spec:

```go
package definitions_test

import (
	"testing"

	"github.com/kubevela/pkg/cue/cuex"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/oam-dev/kubevela/pkg/definition/cuetest/ginkgotest"
)

func TestDefinitions(t *testing.T) {
	// Renders must not load external CUE packages from whatever cluster the kubeconfig points at.
	cuex.EnableExternalPackageForDefaultCompiler = false
	RegisterFailHandler(Fail)
	RunSpecs(t, "Definitions")
}

var _ = ginkgotest.DescribeDefinitions("./definitions")
```

## Troubleshooting

| You see | Because | Do |
| --- | --- | --- |
| Two cases run as one, or a case expects things you did not write | Two cases in a file share a name, and CUE merges fields with the same name | Give every case a unique name |
| `... does not exist` | `definition` is a path relative to the test file, and nothing is there | Fix the path; `.cue` may be left off |
| `context.componentName is derived: it is context.name` | The case sets a context field the test determines itself | Set the field it names instead; see [Context](./definition-testing-mocks-hooks.md#context) |
| `it reaches outside the cluster, so a step test must mock it` | A workflow step called a provider such as `vela/http` without a mock | Add a `mocks` entry for the call |
| `"topology" renders nothing: its template has no output` | `#PolicyRender` was given a policy the controller reads rather than renders | Policies like `topology` and `override` cannot be tested this way |
| `step and source tests run against a local API server (envtest), which did not start` | The `etcd` and `kube-apiserver` binaries were not found | Set `KUBEBUILDER_ASSETS` or pass `--envtest-assets`; see [Before you start](#before-you-start) |
| `@beforeEach marks a nested field; mark the top-level field instead` | A hook attribute is on a field inside another | Move the attribute to the top-level field |
| `conflicting values` in a trait case | The patch sets a field the workload already sets differently | Expected if the trait cannot patch that workload; otherwise change the workload or the patch strategy |
| `expected 1 elements, got 4` on an error | One error produced several messages in a category | Allow more with `[=~"...", ...]`, or match the whole message with `error: =~"..."` |
| A step waits forever in a test | Nothing reconciles on the test server, so nothing becomes ready | Create the object with its ready `status`, in `resources` or with `test.#Seed` |
