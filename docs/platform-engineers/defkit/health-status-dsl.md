---
title: Health & Status DSL
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Builder DSL for defining health checks and custom status messages on component and trait definitions. Generates the `status.healthPolicy` and `status.customStatus` CUE blocks consumed by the KubeVela controller. Both blocks are optional; if omitted the controller uses built-in defaults based on the workload type.

## Preset Builders

Fastest path for the three common Kubernetes workload types. Each preset calls the low-level builder methods internally and can be passed directly to `.HealthPolicy(preset.Build())` or `.CustomStatus(preset.Build())`.

| Preset | Type | Description |
|---|---|---|
| `DeploymentHealth()` | Health | Checks `readyReplicas == updatedReplicas == replicas == spec.replicas`, with the `_isHealth` intermediate default and an annotation-based opt-out via `app.oam.dev/disable-health-check`. |
| `DeploymentStatus()` | Status | Emits `"Ready: X/Y"` where X is `status.readyReplicas` and Y is `spec.replicas`. |
| `StatefulSetHealth()` | Health | Checks `readyReplicas == updatedReplicas == spec.replicas` plus `observedGeneration`. |
| `StatefulSetStatus()` | Status | Shows `"Ready: X/Y"` (readyReplicas vs spec.replicas). |
| `DaemonSetHealth()` | Health | Checks `numberReady == desiredNumberScheduled == currentNumberScheduled == updatedNumberScheduled` plus `observedGeneration`. |
| `DaemonSetStatus()` | Status | Shows `"Ready: X/Y"` (numberReady vs desiredNumberScheduled). |
| `JobHealth()` | Health | Checks `status.succeeded == spec.parallelism`. |
| `CronJobHealth()` | Health | Always healthy if the CronJob resource exists (`isHealth: true`). |

## Health DSL — `defkit.Health()`

`defkit.Health()` returns a `*HealthBuilder` with two complementary APIs: the low-level field extraction API and the higher-level composable expression API. Use `.Build()` to compile either into a CUE string for `.HealthPolicy()`, or wire a composable expression directly with `.HealthPolicyExpr()`.

### Health Builder Methods

| Method | Description |
|---|---|
| `.IntField(name, sourcePath, defaultVal)` | Extracts an integer field from the output resource's status and stores it as a CUE variable for use in health conditions. `name` uses dot notation to group fields under a parent struct (`"ready.replicas"` lands under `ready: {}`). `sourcePath` is relative to `context.output`. |
| `.StringField(name, sourcePath, defaultVal)` | Same as `IntField` but for string values. |
| `.MetadataField(name, sourcePath)` | Extracts a field from `context.output` directly (no default value, no guard). Use for metadata fields like `metadata.generation` that are always present. |
| `.HealthyWhen(conditions ...string)` | Adds raw CUE condition strings to the `isHealth` expression. Each condition is ANDed together. Combine with `StatusEq()`, `StatusGte()`, `StatusOr()`, `StatusAnd()`. |
| `.HealthyWhenExpr(expr HealthExpression)` | Equivalent to `.HealthyWhen` but accepts a composable `HealthExpression` from the DSL below instead of a raw CUE string. |
| `.WithDefault()` | Enables the `_isHealth` intermediate pattern: generates `_isHealth: (expr)` followed by `isHealth: *_isHealth \| bool`, allowing the health result to be overridden via CUE unification. Used by `DeploymentHealth()`. |
| `.WithDisableAnnotation(annotation)` | Adds an annotation-based override: if the given annotation key is present on the workload's `metadata.annotations`, forces `isHealth: true`. |
| `.Build() string` | Compiles the health builder into the CUE string for the `status: healthPolicy:` block. |
| `.Policy(expr HealthExpression) string` | Generates a complete health policy CUE string directly from a `HealthExpression` without using the builder's field state. Equivalent to the package-level `defkit.HealthPolicy(expr)`. |
| `.RawCUE(cue)` | Escape hatch: replaces the entire health policy with raw CUE, bypassing all builder state. |

### String Condition Helpers

| Helper | Description |
|---|---|
| `defkit.StatusEq(left, right string)` | Produces `left == right` for use in `.HealthyWhen()`. |
| `defkit.StatusGte(left, right string)` | Produces `left >= right`. |
| `defkit.StatusOr(conditions ...string)` | Wraps multiple conditions with `\|\|`: `(a \|\| b \|\| c)`. |
| `defkit.StatusAnd(conditions ...string)` | Wraps multiple conditions with `&&`: `(a && b && c)`. |

## Composable Health API — `HealthExpression`

All methods below are on `*HealthBuilder` and return a `HealthExpression` that can be composed with `.And()`, `.Or()`, `.Not()`, or passed directly to `.HealthPolicyExpr()` or `defkit.HealthPolicy()`.

### HealthExpression Methods

| Method | Description |
|---|---|
| `.Condition(type string) *ConditionExpr` | Checks a Kubernetes status condition by type name (e.g. `"Ready"`). Returns a `*ConditionExpr` for chaining. Generates a list comprehension over `context.output.status.conditions`. Use for CRDs that have a `status.conditions` array; plain Deployment/StatefulSet replicas checks should use `.Field()` instead. |
| `.Field(path) *HealthFieldExpr` | Checks a field value on the output resource. Path is relative to `context.output`. Returns a `*HealthFieldExpr` for comparison chains. |
| `.FieldRef(path) *HealthFieldRefExpr` | Creates a reference to another field for field-to-field comparisons, e.g. `h.Field("status.readyReplicas").Eq(h.FieldRef("spec.replicas"))`. |
| `.Phase(phases ...string)` | Checks if `context.output.status.phase` matches any of the listed values. Generates `phase == "A" \|\| phase == "B"`. |
| `.PhaseField(path, phases ...string)` | Like `.Phase()` but checks a custom field path instead of the default `status.phase`. |
| `.Exists(path)` / `.NotExists(path)` | Checks whether a path exists (or doesn't) on the output resource. Generates `path != _\|_` or `path == _\|_`. |
| `.And(exprs...)` / `.Or(exprs...)` / `.Not(expr)` | Logical combinators. `.And()` wraps each sub-expression in parentheses and joins with `&&`. `.Or()` joins with `\|\|`. `.Not()` prefixes with `!`. |
| `.Always()` | Returns a `HealthExpression` that always evaluates to `true`. Use when resource existence is the only health criterion. |
| `.AllTrue(condTypes ...string)` | Shorthand for `And(Condition("A").IsTrue(), Condition("B").IsTrue(), ...)`. |
| `.AnyTrue(condTypes ...string)` | Shorthand for `Or(Condition("A").IsTrue(), Condition("B").IsTrue(), ...)`. |
| `.At(ref *ContextRef) *HealthScope` | Roots the expressions that follow at another output, such as `vela.Outputs("securityGroup")`, instead of the primary output. The returned scope has the same `.Condition()`, `.Field()`, `.FieldRef()`, `.Exists()`, `.NotExists()`, `.Phase()` and `.PhaseField()` methods. |
| `.Every(coll, fn) *EveryExpr` | Healthy when every output in `coll` satisfies the expression `fn` builds for one item. Select the outputs with `defkit.OutputsWithPrefix("name")`. No matching outputs counts as unhealthy unless you chain `.AllowEmpty()`. |

### ConditionExpr

| Method | Description |
|---|---|
| `.IsTrue()` | Status field is `"True"`. |
| `.IsFalse()` | Status field is `"False"`. |
| `.Is(status)` | Exact match against any status string. |
| `.Exists()` | Condition type exists (regardless of status value). |
| `.ReasonIs(reason)` | Reason field matches the given string. |

### HealthFieldExpr

| Method | Description |
|---|---|
| `.Eq(val)` / `.Ne(val)` / `.Gt(val)` / `.Gte(val)` / `.Lt(val)` / `.Lte(val)` | Numeric or string comparison operators. `val` may be a literal or a `*HealthFieldRefExpr` from `.FieldRef()`. |
| `.In(values...)` | Field value matches any of the listed values. Generates `field == "A" \|\| field == "B"`. |
| `.Contains(substr)` | String field contains the given substring. Generates `strings.Contains(field, "substr")`. |

### Package-level Functions

| Function | Description |
|---|---|
| `defkit.HealthPolicy(expr HealthExpression) string` | Wraps a composed `HealthExpression` into the complete `healthPolicy` CUE block (preamble + `isHealth:` line). Equivalent to `Health().Policy(expr)`. Pass the result to `.HealthPolicy()`. |
| `defkit.StatusPolicy(expr StatusExpression) string` | Wraps a composed `StatusExpression` into the complete `customStatus` CUE block. Pass the result to `.CustomStatus()`. |

### Check other outputs

A component that creates more than its primary output can make its health depend on them too. Use `.At()` for one named output and `.Every()` for a group of outputs that share a name prefix, such as `accessPoint-0`, `accessPoint-1` and so on:

```go
h := defkit.Health()
vela := defkit.VelaCtx()

health := defkit.HealthPolicy(h.And(
    h.Condition("Ready").IsTrue(),
    h.At(vela.Outputs("securityGroup")).Condition("Ready").IsTrue(),
    h.Every(defkit.OutputsWithPrefix("accessPoint"), func(item *defkit.HealthScope) defkit.HealthExpression {
        return item.Field("status.state").Eq("available")
    }).AllowEmpty(),
))
```

The component is healthy when its primary output and the `securityGroup` output both have a `Ready` condition of `"True"`, and every `accessPoint` output has `status.state: available`. `.AllowEmpty()` keeps it healthy when the user asked for no access points. The generated CUE:

```cue
_readyCond: [ for c in *context.output.status.conditions | [] if c.type != _|_ if c.type == "Ready" { c } ]
_securityGroupReadyCond: [ for c in *context.outputs.securityGroup.status.conditions | [] if c.type != _|_ if c.type == "Ready" { c } ]
_accessPointItems: [ for k, v in (*context.outputs | {}) if k =~ "^accessPoint" { v } ]
isHealth: (len([ for c in _readyCond if c.status != _|_ if c.status == "True" { c } ]) > 0) && (len([ for c in _securityGroupReadyCond if c.status != _|_ if c.status == "True" { c } ]) > 0) && (len([ for _accessPointItem in _accessPointItems if _accessPointItem.status.state == "available" { _accessPointItem } ]) == len(_accessPointItems))
```

## Status DSL — `defkit.Status()`

`defkit.Status()` returns a `*StatusBuilder` for building the `customStatus` block. As with the health builder, two APIs are available: low-level field extraction with `.IntField`/`.Message`, or the higher-level `StatusExpression` DSL.

### Status Builder Methods

| Method | Description |
|---|---|
| `.IntField(name, sourcePath, defaultVal)` | Extracts an integer from the output resource and stores it as a CUE variable for the status message template. Follows the same dot-notation grouping as `Health().IntField`. |
| `.StringField(name, sourcePath, defaultVal)` | Extracts a string value for the status message template. |
| `.Message(msg)` | Sets the status message template string. Use CUE interpolation syntax (`\(fieldName)`) to reference variables declared by `.IntField` / `.StringField`. |
| `.Build() string` | Compiles into the CUE string for the `status: customStatus:` block. |
| `.RawCUE(cue)` | Escape hatch: replaces the customStatus with raw CUE. |

### StatusExpression DSL

| Method | Description |
|---|---|
| `.Field(path) *StatusFieldExpr` | References a field relative to `context.output`. Returns a `*StatusFieldExpr`; chain `.Default(val)` to add a CUE default with a guarded override, or comparison methods (`.Eq`, `.Gt`, etc.) for `Switch` cases. |
| `.SpecField(path) *StatusFieldExpr` | Functionally identical to `.Field()`. Conventionally used for `spec.*` fields to document intent. |
| `.Condition(type) *StatusConditionAccessor` | Accesses a Kubernetes status condition by type name. Chain `.StatusValue()`, `.Message()`, `.Reason()` to get a `*StatusConditionFieldExpr` for interpolation, or `.Is(status)` to get a `StatusCondition` for `Switch`. |
| `.Exists(path)` / `.NotExists(path)` | Checks whether a path exists. Returns a `StatusCondition` for use in `Switch` cases. |
| `.Literal(value string)` | Creates a static string expression. |
| `.Concat(parts ...any)` | Concatenates strings, `*StatusFieldExpr`, `*StatusConditionFieldExpr`, and other expressions into one status message string. |
| `.Format(template, args ...StatusExpression)` | Printf-style formatting using `%v` placeholders. Each `arg` is a `StatusExpression`; its CUE interpolation replaces the corresponding `%v`. |
| `.Case(condition, message)` | Creates a case for `Switch`. `condition` is a `StatusCondition` (from `.Field().Eq()`, `.Condition().Is()`, `.Exists()`, etc.). `message` is a string literal or `StatusExpression`. |
| `.Default(message)` | Creates the fallback message for a `Switch`. |
| `.Switch(casesAndDefault ...any)` | Evaluates cases in order. Generates a CUE default value followed by one `if cond { message: ... }` block per case. Later cases win on overlap. |
| `.HealthAware(healthyMsg, unhealthyMsg)` | Creates a status message that varies based on `context.status.healthy`. Generates `message: *unhealthyMsg \| string` with an `if context.status.healthy` override. |
| `.Detail(key, value)` | Creates a key-value detail entry for structured status. `value` is a `StatusExpression`. |
| `.WithDetails(message, details...)` | Creates a status expression that bundles a primary message with structured key-value details. |

### StatusFieldExpr

| Method | Description |
|---|---|
| `.Default(val)` | Adds a CUE default: generates `_varName: *val \| type` with a guarded `if path != _\|_ { _varName: path }` override. |
| `.Eq(val)` / `.Ne(val)` / `.Gt(val)` / `.Gte(val)` / `.Lt(val)` / `.Lte(val)` | Comparison operators that return a `StatusCondition` for use in `Switch.Case()`. |

### StatusConditionAccessor

| Method | Description |
|---|---|
| `.StatusValue()` | Returns a `*StatusConditionFieldExpr` for the condition's `.status` field. |
| `.Message()` | Returns a `*StatusConditionFieldExpr` for the condition's `.message` field. |
| `.Reason()` | Returns a `*StatusConditionFieldExpr` for the condition's `.reason` field. |
| `.Is(status)` | Returns a `StatusCondition` (for `Switch`) checking that the condition's status field equals the given value. |

## Example

Let's build a `health-aware-service` component — a `Deployment` whose `healthPolicy` and `customStatus` blocks together exercise every DSL layer documented above: `Health().And()` / `.Or()` / `.Not()` compositors, `.Field()` with both `.Gte()` and the field-reference form `.Eq(h.FieldRef(...))`, `.Phase()` / `.PhaseField()`, `.Exists()` / `.NotExists()`, `.Condition()` with `.IsTrue()` / `.IsFalse()` / `.Is()` / `.Exists()` / `.ReasonIs()`, `.AllTrue()` / `.AnyTrue()`, `.Always()`, `defkit.HealthPolicy(expr)` and `defkit.StatusPolicy(expr)`, the low-level `IntField` / `HealthyWhen` / `WithDefault` / `WithDisableAnnotation` path, and the status side: `Status().Field().Default()`, `.SpecField()`, `.Format()`, `.Concat()`, `.Literal()`, `.Switch()` / `.Case()` / `.Default()`, `.HealthAware()`, `.Condition().StatusValue()` / `.Message()`, `.Exists()` / `.NotExists()`, `.WithDetails()` / `.Detail()`. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func HealthAwareService() *defkit.ComponentDefinition {
	image    := defkit.String("image").Description("Container image")
	replicas := defkit.Int("replicas").Default(1).Description("Desired replica count")
	port     := defkit.Int("port").Default(8080).Description("Container port")

	return defkit.NewComponent("health-aware-service").
		Description("Deployment with health policy and custom status driven by the Health & Status DSL").
		Workload("apps/v1", "Deployment").
		PodSpecPath("spec.template.spec").
		Params(image, replicas, port).
		HealthPolicyExpr(healthAwareServiceHealth()).
		CustomStatus(defkit.StatusPolicy(healthAwareServiceStatus())).
		Template(healthAwareServiceTemplate)
}

// healthAwareServiceHealth demonstrates the composable HealthExpression DSL.
//
// For plain Deployments, use field-based checks (Field, FieldRef, Exists, Or)
// rather than Condition-based checks — Deployments do not emit status.conditions
// of type "Ready". Condition().IsTrue() is the right choice for CRDs that set
// status.conditions (e.g. cert-manager Certificate, Crossplane claims).
//
// The full suite of expression types is shown below for reference; wire any
// subset into h.And/Or/Not to match your workload's health model.
func healthAwareServiceHealth() defkit.HealthExpression {
	h := defkit.Health()

	// --- HealthExpression primitives (all types shown) ---

	// Field-based: Field().Gte, Field().Eq with FieldRef for field-to-field.
	replicasReady := h.Field("status.readyReplicas").Gte(1)
	replicasMatch := h.Field("status.readyReplicas").Eq(h.FieldRef("spec.replicas"))

	// Phase check — use only for workloads that set status.phase (e.g. Pods, custom CRDs).
	// Accessing an undefined field like status.phase on a Deployment causes a CUE
	// evaluation error. Use Field-based checks for Deployments instead.
	//   h.Phase("Running", "Succeeded")              // status.phase == "A" || "B"
	//   h.PhaseField("status.currentPhase", "Active") // custom path variant
	//
	// For Deployments, use Field-based presence checks:
	observedGen := h.Or(
		h.Field("status.observedGeneration").Gte(1),
		h.Exists("status.availableReplicas"),
	)

	// Condition-based (for CRDs with status.conditions):
	//   h.Condition("Ready").IsTrue()
	//   h.Condition("Stalled").IsFalse()
	//   h.Condition("Initialized").Exists()
	//   h.Condition("Ready").Is("Unknown")
	//   h.Condition("Ready").ReasonIs("Available")
	//   h.AllTrue("Ready", "Synced")
	//   h.AnyTrue("Ready", "Available")
	//   h.Always()  — resource existence is the only criterion

	// Logical combinators: And / Or / Not.
	return h.And(
		replicasReady,
		replicasMatch,
		h.Not(h.NotExists("status.availableReplicas")),
		observedGen,
	)
}

// healthAwareServiceStatus demonstrates the composable StatusExpression DSL.
func healthAwareServiceStatus() defkit.StatusExpression {
	s := defkit.Status()

	// Format: %v placeholders replaced by StatusExpression interpolations.
	// Field().Default(0) generates a guarded CUE variable with a numeric default.
	// SpecField is identical to Field — use it conventionally for spec.* paths.
	return s.Format("Ready: %v/%v",
		s.Field("status.readyReplicas").Default(0),
		s.SpecField("spec.replicas"),
	)

	// Other StatusExpression types shown for reference:
	//
	// Literal:
	//   s.Literal("Service is starting")
	//
	// Concat:
	//   s.Concat("Ready: ", s.Field("status.readyReplicas").Default(0), "/", s.SpecField("spec.replicas"))
	//
	// Switch / Case / Default:
	//   s.Switch(
	//       s.Case(s.Field("status.phase").Eq("Running"), "Running"),
	//       s.Case(s.Field("status.phase").Eq("Pending"), "Starting..."),
	//       s.Default("Unknown"),
	//   )
	//
	// HealthAware:
	//   s.HealthAware("All systems operational", "Service degraded")
	//
	// Condition accessor — for CRDs with status.conditions:
	//   s.Condition("Ready").StatusValue()  -> *StatusConditionFieldExpr (interpolation)
	//   s.Condition("Ready").Message()
	//   s.Condition("Ready").Reason()
	//   s.Condition("Ready").Is("True")     -> StatusCondition (for Switch)
	//
	// Exists / NotExists (as StatusCondition for Switch):
	//   s.Case(s.Exists("status.loadBalancer.ingress"), "LoadBalancer ready")
	//   s.Case(s.NotExists("status.error"), "No errors")
	//
	// WithDetails / Detail:
	//   s.WithDetails(
	//       s.Format("Ready: %v/%v", s.Field("status.readyReplicas").Default(0), s.SpecField("spec.replicas")),
	//       s.Detail("endpoint", s.Field("status.endpoint")),
	//   )
}

func healthAwareServiceTemplate(tpl *defkit.Template) {
	vela     := defkit.VelaCtx()
	image    := defkit.String("image")
	replicas := defkit.Int("replicas")
	port     := defkit.Int("port")

	dep := defkit.NewResource("apps/v1", "Deployment").
		Set("metadata.name", vela.Name()).
		Set("spec.replicas", replicas).
		Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
		Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
		Set("spec.template.spec.containers[0].name", vela.Name()).
		Set("spec.template.spec.containers[0].image", image).
		Set("spec.template.spec.containers[0].ports[0].containerPort", port)

	tpl.Output(dep)
}

// Low-level builder path — shown as an alternative to the composable API above.
// Wire the result into .HealthPolicy(lowLevelHealth().Build()) on the definition.
//
//nolint:unused
func lowLevelHealth() *defkit.HealthBuilder {
	return defkit.Health().
		IntField("ready.readyReplicas",     "status.readyReplicas",     0).
		IntField("ready.updatedReplicas",   "status.updatedReplicas",   0).
		IntField("ready.replicas",          "status.replicas",          0).
		IntField("ready.observedGeneration","status.observedGeneration", 0).
		HealthyWhen(
			defkit.StatusEq("context.output.spec.replicas", "ready.readyReplicas"),
			defkit.StatusEq("context.output.spec.replicas", "ready.updatedReplicas"),
			defkit.StatusEq("context.output.spec.replicas", "ready.replicas"),
			defkit.StatusOr(
				defkit.StatusEq("ready.observedGeneration", "context.output.metadata.generation"),
				"ready.observedGeneration > context.output.metadata.generation",
			),
		).
		WithDefault().
		WithDisableAnnotation("app.oam.dev/disable-health-check")
}

// Low-level status builder — shown as an alternative to Format/Switch/HealthAware.
// Wire the result into .CustomStatus(lowLevelStatus().Build()) on the definition.
//
//nolint:unused
func lowLevelStatus() *defkit.StatusBuilder {
	return defkit.Status().
		StringField("phase", "status.phase", "").
		IntField("ready.readyReplicas", "status.readyReplicas", 0).
		Message(`\(phase) — Ready:\(ready.readyReplicas)/\(context.output.spec.replicas)`)
}

func init() { defkit.Register(HealthAwareService()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
"health-aware-service": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Deployment with health policy and custom status driven by the Health & Status DSL"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
      }
      type: "deployments.apps"
    }
    status: {
      customStatus: #"""
        _readyReplicas: *0 | int
        if context.output.status.readyReplicas != _|_ {
            _readyReplicas: context.output.status.readyReplicas
        }
        message: "Ready: \(_readyReplicas)/\(context.output.spec.replicas)"
        """#
      healthPolicy: #"""
        isHealth: (context.output.status.readyReplicas >= 1) && (context.output.status.readyReplicas == context.output.spec.replicas) && (!(context.output.status.availableReplicas == _|_)) && ((context.output.status.observedGeneration >= 1) || (context.output.status.availableReplicas != _|_))
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
      selector: matchLabels: "app.oam.dev/component": context.name
      template: {
        metadata: labels: "app.oam.dev/component": context.name
        spec: containers: [{
          name:  context.name
          image: parameter.image
          ports: [{containerPort: parameter.port}]
        }]
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: string
    // +usage=Desired replica count
    replicas: *1 | int
    // +usage=Container port
    port: *8080 | int
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="health-aware-demo-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: health-aware-demo
  namespace: default
spec:
  components:
    - name: health-demo
      type: health-aware-service
      properties:
        image: nginx:stable
        replicas: 1
        port: 8080
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

## Apply and verify

Apply the generated CUE definition and the Application YAML above:

```shell
vela def apply ./generated-cue/component/health-aware-service.cue
vela up -f health-aware-demo-app.yaml
```

```
NAME                COMPONENT     TYPE                   PHASE     HEALTHY   STATUS       AGE
health-aware-demo   health-demo   health-aware-service   running   true      Ready: 1/1   74s
```

Once the Deployment reaches 1/1 ready, `vela status health-aware-demo` renders the health policy verdict and the custom status message from the DSL:

```
About:

  Name:      	health-aware-demo
  Namespace: 	default
  Created at:	2026-05-17 16:43:27 +0000 UTC
  Healthy:   	✅
  Details:   	running

Workflow:

  mode: DAG-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: pna7iono4p
    name: health-demo
    type: apply-component
    phase: succeeded

Services:

  - Name: health-demo
    Cluster: local
    Namespace: default
    Type: health-aware-service
    Health: ✅
      Message: Ready: 1/1
    No trait applied
```

Read the verdict and message directly from the Application object:

```shell
$ kubectl get app health-aware-demo -o jsonpath='{.status.services[*].healthy}'
true

$ kubectl get app health-aware-demo -o jsonpath='{.status.services[*].message}'
Ready: 1/1
```

Clean up:

```shell
vela delete health-aware-demo
kubectl delete componentdefinition health-aware-service -n vela-system
```

## Related

- [ComponentDefinition](./definition-component.md) — `HealthPolicyExpr`, `CustomStatus`, `HealthPolicy` chain methods
- [Resource Builder](./resource-builder.md) — building the `output` workload resource
- [ForEachWith / ItemBuilder](./collections-api.md#per-item-builder-foreachwith): per-element builder pattern
