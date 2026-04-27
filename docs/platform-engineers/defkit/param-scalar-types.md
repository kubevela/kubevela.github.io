---
title: Scalar Parameter Types
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Scalar parameters define single-value fields in a definition's parameter schema. Each constructor returns a `*Param` that maps directly to a CUE primitive type and can be chained with modifiers like `.Optional()`, `.Default()`, and `.Description()`.

### Scalar Constructors

| Constructor | CUE Type | Notes |
|---|---|---|
| `String(name)` | `string` | |
| `Int(name)` | `int` | |
| `Bool(name)` | `bool` | |
| `Float(name)` | `float` | |
| `Enum(name)` | `"a" \| "b"` | Use `.Values()` |

## `defkit.String()`

A UTF-8 string parameter. Optional by default — the field is emitted as `field?: string`. Use `.Default(v)` to emit a non-optional field with a default (`field: *v | string`), or `.Mandatory()` for a non-optional field without a default (`field: string`).

### Chain Methods

| Method | Description |
|---|---|
| `.Values(values ...string)` | Restricts the parameter to a fixed set of allowed values (closed enum). Generates CUE `"first" \| "second"`. To set a default, chain `.Default()` separately. |
| `.OpenEnum()` | Used after `Values()` to allow any string in addition to the listed values. Generates `*"info" \| "debug" \| string`. |
| `.Pattern(regex)` | Adds a regex constraint the string must match. Use for formats like IP addresses, DNS names, or semantic versions. |
| `.MinLen(n)` / `.MaxLen(n)` | Sets minimum/maximum length constraints on the string value. |
| `.NotEmpty()` | Adds a constraint that the string must not be `""`. Stricter than `Required()` which only ensures the field is present. |
| `.Concat(suffix) Value` | Returns a Value that appends a suffix to this parameter's runtime value. Generates CUE `parameter.name + "suffix"`. |
| `.Prepend(prefix) Value` | Returns a Value that prepends a prefix to this parameter's runtime value. Generates CUE `"prefix" + parameter.name`. |
| `.Contains(substr) Condition` | Returns a condition checking if the value contains the substring. Generates `strings.Contains(parameter.name, "substr")`. |
| `.Matches(pattern) Condition` | Returns a condition checking if the value matches a regex pattern. Generates CUE `parameter.name =~ "pattern"`. |
| `.StartsWith(prefix)` / `.EndsWith(suffix)` | Returns conditions checking if the value starts/ends with the given string. Generates `strings.HasPrefix(...)` / `strings.HasSuffix(...)`. |
| `.In(values ...string) Condition` | Returns a condition checking if the value is one of the listed strings. Unlike `Values()` which constrains the schema, `In()` creates a runtime condition for `If()`/`SetIf()`. |
| `.LenEq(n)` / `.LenGt(n)` / `.LenGte(n)` / `.LenLt(n)` / `.LenLte(n)` | Returns conditions on the string's length. Generates `len(parameter.name) == n`, `> n`, etc. |

## `defkit.Int()`

A 64-bit integer parameter. Supports `.Min(n)` and `.Max(n)` for inclusive range constraints.

### Chain Methods

| Method | Description |
|---|---|
| `.Min(n int)` / `.Max(n int)` | Sets minimum/maximum value constraints. Generates CUE `>=n` / `<=n` bounds. Use for parameters like `replicas` (min 1) or ports (1-65535). |
| `.In(values ...int) Condition` | Returns a condition checking if the parameter equals any of the listed values. Generates an OR chain. Use in conditional logic, not schema constraints. |
| `.Add(val)` / `.Sub(val)` / `.Mul(val)` / `.Div(val)` | Returns a Value performing arithmetic on this parameter's runtime value. Generates CUE `parameter.name + val`, etc. Use in `Set()` calls for computed fields. |

## `defkit.Bool()`

A boolean parameter. `.Default(true)` or `.Default(false)` sets the CUE default value.

### Chain Methods

| Method | Description |
|---|---|
| `.IsTrue() Condition` | Returns a condition that is true when this boolean parameter is `true`. Generates CUE `parameter.name`. The most common way to branch on a boolean flag. |
| `.IsFalse() Condition` | Returns a condition that is true when this boolean parameter is `false`. Generates CUE `!parameter.name`. |

## `defkit.Float()`

A floating-point number parameter. Supports `.Min(f)` and `.Max(f)` for range constraints. Generates the CUE `number` type.

Same chain methods as IntParam: `.Min(n float64)` sets a lower bound, `.Max(n float64)` sets an upper bound, `.In(values ...float64)` creates a membership condition. Use for parameters like ratios, thresholds, or percentages.

## `defkit.Enum()`

A string parameter constrained to a fixed set of allowed values. Use `.Values()` — not `.Enum()` — to specify the allowed set (current convention as of defkit API update).

:::tip
Combine `.Values()` with `.Default()` to pre-select one of the allowed values. The default appears first in the CUE disjunction with the `*` marker.
:::

## Example

The example below exercises every scalar type and most chain methods in a single ComponentDefinition. The sections above describe each method individually; this puts them together to show how the chain combinations interact and what CUE the generator emits.

A few patterns worth noting:

- **`Bool` always uses `Default(true|false)`** (or `Required()`) — never `Optional()`. An optional Bool without a default has no usable value when omitted, and conditions like `IsTrue()`/`IsFalse()` silently degrade to bottom.
- **Non-string params (`Int`, `Bool`, `Float`, and arithmetic results) are wrapped in `defkit.Interpolation(p)`** when written into ConfigMap `data.*`. ConfigMap's `data` schema is `map[string]string`, and `Interpolation` renders as CUE `"\(parameter.p)"` to coerce the value into its string form. `String` and `Enum` params are passed through directly.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import (
	"github.com/oam-dev/kubevela/pkg/definition/defkit"
)

func init() {
	defkit.Register(ScalarShowcase())
}

// ScalarShowcase demonstrates all scalar parameter types and their chain method
// combinations: plain, with defaults, required, constraints, descriptions,
// short aliases, ignore, and conditional usage in the template. Optional() is
// shown on String/Int/Float; Bool uses Default(true|false) instead — an
// optional Bool without a default has no usable value when omitted.
//
// Non-string params (Bool, Int, Float, and Int/Float arithmetic results) are
// written into ConfigMap data.* via defkit.Interpolation(p), which renders as
// `"\(parameter.p)"` — CUE coerces the value into its string form so it
// satisfies ConfigMap's `data: map[string]string` schema. String and Enum
// params can be passed directly since they're already strings.
func ScalarShowcase() *defkit.ComponentDefinition {
	// ── String params ──────────────────────────────────────────────

	// Plain — bare string, no modifiers
	name := defkit.String("name")

	// Default + Description + Short alias
	image := defkit.String("image").
		Default("nginx:latest").
		Description("Container image").
		Short("i")

	// Required + NotEmpty — user must provide a non-empty value
	tag := defkit.String("tag").
		Required().
		Description("Image tag").
		NotEmpty()

	// Optional — explicitly optional
	comment := defkit.String("comment").
		Optional().
		Description("Freeform comment")

	// Pattern + MinLen + MaxLen — regex and length constraints
	hostname := defkit.String("hostname").
		Pattern("^[a-z0-9-]+$").
		MinLen(1).
		MaxLen(63).
		Description("RFC 1123 hostname")

	// Values (closed enum) + Default
	protocol := defkit.String("protocol").
		Values("TCP", "UDP", "SCTP").
		Default("TCP").
		Description("Network protocol")

	// Values + OpenEnum — extensible enum
	logLevel := defkit.String("logLevel").
		Values("debug", "info", "warn", "error").
		OpenEnum().
		Default("info").
		Description("Log level (extensible)")

	// Ignore — hidden from vela show
	internalNote := defkit.String("internalNote").
		Ignore().
		Description("Internal use only")

	// ── Int params ─────────────────────────────────────────────────

	// Plain — bare int
	port := defkit.Int("port")

	// Default + Min + Max + Description + Short
	replicas := defkit.Int("replicas").
		Default(1).
		Min(1).
		Max(100).
		Description("Replica count").
		Short("r")

	// Required
	maxRetries := defkit.Int("maxRetries").
		Required().
		Description("Max retry attempts")

	// Optional
	priority := defkit.Int("priority").
		Optional().
		Description("Scheduling priority")

	// ── Bool params ────────────────────────────────────────────────

	// Plain — bare bool
	enable := defkit.Bool("enable")

	// Default + Description
	debug := defkit.Bool("debug").
		Default(false).
		Description("Enable debug mode")

	// Required
	tls := defkit.Bool("tls").
		Required().
		Description("Force TLS")

	// Default(true) + Description — defaults to verbose mode on
	verbose := defkit.Bool("verbose").
		Default(true).
		Description("Verbose logging")

	// ── Float params ───────────────────────────────────────────────

	// Plain — bare float
	weight := defkit.Float("weight")

	// Default + Min + Max + Description
	ratio := defkit.Float("ratio").
		Default(0.5).
		Min(0.0).
		Max(1.0).
		Description("Traffic ratio")

	// Required
	threshold := defkit.Float("threshold").
		Required().
		Description("Alert threshold")

	// Optional
	cpuLimit := defkit.Float("cpuLimit").
		Optional().
		Description("CPU limit in cores")

	// ── Enum params ────────────────────────────────────────────────

	// Values + Default
	env := defkit.Enum("env").
		Values("dev", "staging", "prod").
		Default("dev").
		Description("Deployment environment")

	// Values + Required
	region := defkit.Enum("region").
		Values("us-east", "us-west", "eu-west").
		Required().
		Description("Cloud region")

	// ── Build the definition ───────────────────────────────────────

	return defkit.NewComponent("scalar-showcase").
		Description("Demonstrates all scalar parameter types and chain method combinations").
		Workload("v1", "ConfigMap").
		OmitWorkloadType().
		Params(
			// Strings
			name, image, tag, comment, hostname, protocol, logLevel, internalNote,
			// Ints
			port, replicas, maxRetries, priority,
			// Bools
			enable, debug, tls, verbose,
			// Floats
			weight, ratio, threshold, cpuLimit,
			// Enums
			env, region,
		).
		Template(func(tpl *defkit.Template) {
			vela := defkit.VelaCtx()

			cm := defkit.NewResource("v1", "ConfigMap").
				Set("metadata.name", vela.Name()).
				Set("metadata.namespace", vela.Namespace()).
				// ── Plain values ──
				Set("data.name", name).
				Set("data.image", image).
				Set("data.tag", tag).
				Set("data.hostname", hostname).
				Set("data.protocol", protocol).
				Set("data.logLevel", logLevel).
				Set("data.internalNote", internalNote).
				// Ints coerced to string via Interpolation — ConfigMap data is map[string]string
				Set("data.port", defkit.Interpolation(port)).
				Set("data.replicas", defkit.Interpolation(replicas)).
				Set("data.maxRetries", defkit.Interpolation(maxRetries)).
				// Bools coerced to string via Interpolation
				Set("data.enable", defkit.Interpolation(enable)).
				Set("data.debug", defkit.Interpolation(debug)).
				Set("data.tls", defkit.Interpolation(tls)).
				Set("data.verbose", defkit.Interpolation(verbose)).
				// Floats coerced to string via Interpolation
				Set("data.weight", defkit.Interpolation(weight)).
				Set("data.ratio", defkit.Interpolation(ratio)).
				Set("data.threshold", defkit.Interpolation(threshold)).
				// Strings (Enum has string base) — passed through directly
				Set("data.env", env).
				Set("data.region", region).
				// ── String expression: Prepend ──
				Set("data.fullImage", image.Prepend("registry.io/")).
				// ── String expression: Concat ──
				Set("data.imageWithTag", image.Concat(":v2")).
				// ── Int arithmetic — wrapped in Interpolation to coerce to string ──
				Set("data.maxReplicas", defkit.Interpolation(replicas.Add(5))).
				Set("data.halfReplicas", defkit.Interpolation(replicas.Div(2))).
				// ── Conditional on Bool.IsTrue ──
				SetIf(debug.IsTrue(), "data.debugEnabled", defkit.Lit("true")).
				// ── Conditional on Bool.IsFalse ──
				SetIf(verbose.IsFalse(), "data.quietMode", defkit.Lit("true")).
				// ── Conditional on String.In (runtime condition) ──
				SetIf(protocol.In("UDP", "SCTP"), "data.nonTcpProtocol", defkit.Lit("true")).
				// ── Conditional on Int.Gt ──
				SetIf(replicas.Gt(1), "data.multiReplica", defkit.Lit("true")).
				// ── Conditional on param IsSet / NotSet ──
				SetIf(comment.IsSet(), "data.comment", comment).
				SetIf(priority.IsSet(), "data.priority", defkit.Interpolation(priority)).
				SetIf(cpuLimit.IsSet(), "data.cpuLimit", defkit.Interpolation(cpuLimit))

			tpl.Output(cm)
		})
}
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
import (
	"strings"
)

"scalar-showcase": {
	type: "component"
	annotations: {}
	labels: {}
	description: "Demonstrates all scalar parameter types and chain method combinations"
	attributes: {
		workload: {
			definition: {
				apiVersion: "v1"
				kind:       "ConfigMap"
			}
		}
	}
}
template: {
	output: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: {
			name: context.name
			namespace: context.namespace
		}
		data: {
			name: parameter.name
			image: parameter.image
			tag: parameter.tag
			hostname: parameter.hostname
			protocol: parameter.protocol
			logLevel: parameter.logLevel
			internalNote: parameter.internalNote
			port: "\(parameter.port)"
			replicas: "\(parameter.replicas)"
			maxRetries: "\(parameter.maxRetries)"
			enable: "\(parameter.enable)"
			debug: "\(parameter.debug)"
			tls: "\(parameter.tls)"
			verbose: "\(parameter.verbose)"
			weight: "\(parameter.weight)"
			ratio: "\(parameter.ratio)"
			threshold: "\(parameter.threshold)"
			env: parameter.env
			region: parameter.region
			fullImage: "registry.io/" + parameter.image
			imageWithTag: parameter.image + ":v2"
			maxReplicas: "\(parameter.replicas + 5)"
			halfReplicas: "\(parameter.replicas / 2)"
			if !parameter.verbose {
				quietMode: "true"
			}
			if parameter.debug {
				debugEnabled: "true"
			}
			if parameter.protocol == "UDP" || parameter.protocol == "SCTP" {
				nonTcpProtocol: "true"
			}
			if parameter.replicas > 1 {
				multiReplica: "true"
			}
			if parameter["comment"] != _|_ {
				comment: parameter.comment
			}
			if parameter["cpuLimit"] != _|_ {
				cpuLimit: "\(parameter.cpuLimit)"
			}
			if parameter["priority"] != _|_ {
				priority: "\(parameter.priority)"
			}
		}
	}
	parameter: {
		name: string
		// +usage=Container image
		// +short=i
		image: *"nginx:latest" | string
		// +usage=Image tag
		tag!: string & !=""
		// +usage=Freeform comment
		comment?: string
		// +usage=RFC 1123 hostname
		hostname: string & =~"^[a-z0-9-]+$" & strings.MinRunes(1) & strings.MaxRunes(63)
		// +usage=Network protocol
		protocol: *"TCP" | "UDP" | "SCTP"
		// +usage=Log level (extensible)
		logLevel: *"info" | "debug" | "warn" | "error" | string
		// +ignore
		// +usage=Internal use only
		internalNote: string
		port: int
		// +usage=Replica count
		// +short=r
		replicas: *1 | int & >=1 & <=100
		// +usage=Max retry attempts
		maxRetries!: int
		// +usage=Scheduling priority
		priority?: int
		enable: bool
		// +usage=Enable debug mode
		debug: *false | bool
		// +usage=Force TLS
		tls!: bool
		// +usage=Verbose logging
		verbose: *true | bool
		weight: float
		// +usage=Traffic ratio
		ratio: *0.5 | number & >=0 & <=1
		// +usage=Alert threshold
		threshold!: float
		// +usage=CPU limit in cores
		cpuLimit?: float
		// +usage=Deployment environment
		env: *"dev" | "staging" | "prod"
		// +usage=Cloud region
		region!: "us-east" | "us-west" | "eu-west"
	}
}
```

</TabItem>
</Tabs>
