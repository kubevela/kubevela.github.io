---
title: PolicyDefinition
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`defkit.NewPolicy(name string) *PolicyDefinition` creates a PolicyDefinition builder. A policy has no workload of its own: users list it in an Application's `spec.policies` (a [global policy](../policy/application-scoped-policy.md#global-policies) applies without being listed), and it changes how that Application is deployed.

:::info How a custom policy takes effect
Only KubeVela's built-in policy names (`garbage-collect`, `apply-once`, `topology`, `override`, `shared-resource` and the rest) are interpreted by the controller. A custom policy takes effect in one of two ways:

- as an [application-scoped policy](../policy/application-scoped-policy.md), which changes the Application (labels, annotations, components, workflow, context) before it is rendered. Build one with `.ApplicationScoped()` and `tpl.Output()`;
- through an `output` in its template, which KubeVela renders and deploys as a resource with the Application.

A custom policy that declares parameters and nothing else applies to the cluster, but an Application that uses it fails to render.
:::

## Chain Methods

### Policy-specific

| Method | Description |
|---|---|
| `.Template(fn func(tpl *PolicyTemplate))` | Provides the policy template closure. A `PolicyTemplate` has no `Patch()`: it sets computed fields with `Set(name, value)` and, on an application-scoped policy, what the policy changes on the Application with `Output()`. |
| `.ManageHealthCheck()` | Declares that this policy manages health checking for the application. When set, KubeVela delegates health evaluation to this policy's health policy expression instead of using the default per-component health checks. |
| `.ApplicationScoped()` | Makes the policy change the Application before it is rendered, through `tpl.Output()`. Writes `scope: "Application"` on the definition. |
| `.Global()` | Applies the policy to every Application without being listed in `spec.policies`, when installed in `vela-system`. Installed in another namespace, it applies to that namespace's Applications only when the controller runs with `--allow-namespace-global-policies`; by default the webhook refuses it there. The template's `config.enabled` still decides per Application. A global policy is always Application-scoped. See [Global Policies](../policy/application-scoped-policy.md#global-policies). |
| `.Priority(p int32)` | Orders the policy among the Application-scoped policies that apply: lower runs first. Explicit policies run at `0`. At equal priority, globals run before explicit policies, globals in name order and explicit ones in `spec.policies` order. |
| `.CtxSchema(fields ...Param)` | Declares an open schema for what the policy puts in `ctx`, read by components and traits as `context.custom`. See [Typed Policy Context](../policy/policy-context-schema.md#in-defkit). |
| `.ClosedCtxSchema(fields ...Param)` | As `CtxSchema`, closed: the policy sets no key it does not declare, and `Register` refuses an `Output().Ctx` it does not declare. |

### Namespace restrictions

| Method | Description |
|---|---|
| `.RestrictNamespaces(namespaces ...string)` | Limits the policy to namespaces matching any of the names or `path.Match` globs. An Application in any other namespace can't use it. |
| `.RestrictNamespaceSelector(selector *metav1.LabelSelector)` | Limits the policy to namespaces whose labels match the selector; `defkit.MatchLabels(map[string]string)` builds a simple one. With `RestrictNamespaces` as well, a namespace that matches either is allowed. |

### Shared base methods

These methods are the same shape as on `ComponentDefinition`. See the [ComponentDefinition page](./definition-component.md) for the longer descriptions.

| Method | Description |
|---|---|
| `.Description(desc string)` | Human-readable description shown in `vela show` and the KubeVela dashboard. |
| `.Annotations(map[string]string)` | Annotations on the PolicyDefinition CR itself. |
| `.Labels(map[string]string)` | Labels on the PolicyDefinition CR. |
| `.Version(v string)` | Definition version string for versioned selection. |
| `.Params(params ...Param)` | Adds parameter definitions that become the `parameter: { ... }` block (insertion order preserved). |
| `.Param(param Param)` | Adds a single parameter — incremental equivalent of `Params()`. |
| `.Helper(name string, param Param)` | Registers a named CUE helper type definition emitted as `#Name: { ... }` before the `parameter` block. Other params reference helpers via `.WithSchemaRef("Name")`. |
| `.CustomStatus(expr string)` | Raw CUE expression for the `status: customStatus:` block. |
| `.HealthPolicy(expr string)` | Raw CUE expression for the `status: healthPolicy:` block. |
| `.HealthPolicyExpr(expr HealthExpression)` | Type-safe `HealthExpression` DSL alternative to `HealthPolicy()`. |
| `.StatusDetails(details string)` | Raw CUE expression for the `status: details:` block. |
| `.RunOn(conditions ...placement.Condition)` | Restricts this policy to clusters whose labels match the given conditions. |
| `.NotRunOn(conditions ...placement.Condition)` | Excludes this policy from clusters whose labels match the given conditions. |
| `.RawCUE(cue string)` | Escape hatch: bypasses the entire builder and emits the raw CUE string as the whole definition. |
| `.WithImports(imports ...string)` | Adds CUE import statements (e.g. `"strings"`, `"strconv"`) to the generated template. |
| `.ToCue() string` | Compiles the policy into a complete CUE string ready to apply as a KubeVela X-Definition. |
| `.ToYAML() ([]byte, error)` | Generates the Kubernetes YAML manifest for the PolicyDefinition CR. |

### PolicyTemplate (closure argument)

`.Template()` passes a `*PolicyTemplate`. It has no `Patch()`:

| Method | Description |
|---|---|
| `.Set(name string, value Value)` | Assigns a value to a named computed field in the policy's template body. |
| `.Enabled(cond Condition)` | Turns an Application-scoped policy on only when the condition holds, written as `config.enabled`. |
| `.Output()` | Returns the builder for what an Application-scoped policy changes on the Application: `.Label(key, v)`, `.Annotation(key, v)`, `.Ctx(path, v)`, `.Components(v)`, `.Workflow(v)` and `.Policies(v)`. See [Typed Policy Context](../policy/policy-context-schema.md#in-defkit). |

`Output()`, `Enabled()`, `Priority()` and `CtxSchema()` only apply to an Application-scoped policy; `Register` refuses a policy that uses them without `.ApplicationScoped()`.

## Example

Let's build a `team-labels` policy: every Application that lists it gets labels naming the team that owns it and the cost center to bill, plus an annotation recording which policy set them. It is application-scoped, so it works with no controller change. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/policies/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package policies

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func TeamLabels() *defkit.PolicyDefinition {
    vela := defkit.VelaCtx()
    return defkit.NewPolicy("team-labels").
        Description("Label an Application with the team that owns it").
        Labels(map[string]string{"tier": "platform"}).
        ApplicationScoped().
        Params(
            defkit.String("team").
                Description("Team that owns the Application"),
            defkit.String("costCenter").
                Description("Cost center to bill the Application to").
                Default("shared"),
        ).
        Template(func(tpl *defkit.PolicyTemplate) {
            tpl.Output().
                Label("example.com/team", defkit.ParamRef("team")).
                Label("example.com/cost-center", defkit.ParamRef("costCenter")).
                Annotation("example.com/labelled-by", vela.PolicyName())
        })
}

func init() { defkit.Register(TeamLabels()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
"team-labels": {
	annotations: {}
	description: "Label an Application with the team that owns it"
	labels: {
		"tier": "platform"
	}
	attributes: {
		scope: "Application"
	}
	type: "policy"
}

template: {
	output: {
		labels: {
			"example.com/team": parameter.team
			"example.com/cost-center": parameter.costCenter
		}
		annotations: {
			"example.com/labelled-by": context.policyName
		}
	}
	parameter: {
		// +usage=Team that owns the Application
		team: string
		// +usage=Cost center to bill the Application to
		costCenter: *"shared" | string
	}
}
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

## Use the policy

Application-scoped policies are alpha and off by default. Turn them on with the `EnableApplicationScopedPolicies` feature gate (see [Application-Scoped Policies](../policy/application-scoped-policy.md)), then apply the module:

```shell
vela def apply-module ./my-platform
```

An Application uses the policy by its name in `spec.policies`:

```yaml title="my-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
  namespace: default
spec:
  components:
    - name: web
      type: webservice
      properties:
        image: nginx:1.27
        ports:
          - port: 80
            expose: true
  policies:
    - name: labels
      type: team-labels
      properties:
        team: payments
        costCenter: cc-1234
```

```shell
vela up -f my-app.yaml
vela policy view my-app
```

```
+---+--------+-------------+-----------+----------+---------+
| # | POLICY |    TYPE     | NAMESPACE |  SOURCE  | ENABLED |
+---+--------+-------------+-----------+----------+---------+
| 1 | labels | team-labels | default   | explicit | Yes     |
+---+--------+-------------+-----------+----------+---------+
```

`vela policy view my-app --details` shows the labels and annotation the policy added.

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Definition Modules](./modules.md): module layout, `module.yaml` and the `vela def` commands
