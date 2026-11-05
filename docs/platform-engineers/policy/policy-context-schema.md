---
title: Typed Policy Context
---

An [application-scoped policy](./application-scoped-policy.md) can put data in `output.ctx`, which components, traits and workflow steps read as `context.custom.<key>`. A policy can declare the shape of that data in a `schema: ctx` block. KubeVela then checks both ends:

| When | Who checks | Against what |
|---|---|---|
| `kubectl apply` of an Application | the Application webhook | the schemas of the policies that apply. No policy is evaluated, so no provider (`kube.#Get`, `http`) is called during admission |
| every render | the controller | each policy's actual `output.ctx` against its own schema |

Without a schema, a definition that reads a key no policy sets, or uses a key as the wrong type, is admitted and only fails at render.

:::note
Typed policy context is available from v1.12.
:::

## Declaring a schema

This global policy reads the team and cost centre from labels on the Application's namespace, and hands them to every Application in it:

```cue
import (
	"strings"
	"vela/kube"
)

schema: ctx: close({
	team:        =~"^[a-z][a-z0-9-]*$"
	costCentre:  strings.MinRunes(3)
	// Only tenants opted into the mesh have one.
	meshDomain?: string
})

parameter: {}

_ns: kube.#Get & {
	$params: resource: {
		apiVersion: "v1"
		kind:       "Namespace"
		metadata: name: context.namespace
	}
}
_labels: _ns.$returns.metadata.labels

output: ctx: {
	team:       _labels["platform.io/team"]
	costCentre: _labels["platform.io/cost-centre"]
	if _labels["platform.io/mesh-domain"] != _|_ {
		meshDomain: _labels["platform.io/mesh-domain"]
	}
}
```

- **Keys are required unless marked `?`.** Here the policy promises to set `team` and `costCentre`. `meshDomain?` is optional, so a template must not rely on it. If the policy is conditional (its `config.enabled` is anything but the literal `true`), admission treats every key it declares as optional, so each must be guarded.
- **`close({...})` makes the schema the whole contract.** The policy supplies nothing it doesn't declare, so admission can also refuse a template that reads an undeclared key. An open schema still types the keys it declares, but other keys may exist.
- **The schema must stand on its own.** Admission reads it without the rest of the template. The CUE standard library (`strings`, `list`, `net`, ...) is fine; provider packages and references to other fields are not.
- **A default is a fallback the policy gives.** With `team: *"platform" | string`, an output that leaves `team` out passes the check, and components receive `team: "platform"`. A value the output sets wins. A default on an optional key fills nothing.

## Reading the context in a definition

A definition author has two patterns:

```cue
parameter: {
	image: string
	// The policy suggests an owner; an Application may name another.
	owner: *context.custom.team | string
}
output: {
	metadata: {
		labels: {
			// Read directly, so no Application can change them.
			"platform.io/team":        context.custom.team
			"platform.io/cost-centre": context.custom.costCentre
			"platform.io/owner":       parameter.owner
		}
		// Optional: guarded, so tenants without a mesh still validate.
		if context.custom.meshDomain != _|_ {
			annotations: "platform.io/mesh-domain": context.custom.meshDomain
		}
	}
	...
}
```

| Pattern | Use it when | Who decides |
|---|---|---|
| `labels: team: context.custom.team` (direct) | the value is governance: identity, cost, compliance | the policy. The Application has no way to set it |
| `owner: *context.custom.team \| string` (parameter default) | the policy suggests a value | the Application may override it in `properties` |

## Seeing a policy's schema

`vela policy view <app> --details` and `vela policy dry-run --details` print, under each policy, the schema its definition declares next to the context it set:

```
  Context schema:
    import "strings"
    ctx: (close({
    	team!: string & strings.MinRunes(3)
    }))
  Context:
    team: payments
```

The schema is read from the definition revision the policy rendered with. If that revision no longer exists, it is read from the live PolicyDefinition, and the header says so. JSON and YAML output carry it as `ctxSchema`.

## What admission catches

An Application using a definition that reads the context in a way the schema says will fail is refused at `kubectl apply`. `kubectl` prints each message after its usual `admission webhook "validating.core.oam.dev.v1beta1.applications" denied the request:`.

**An optional key read without a guard,** in a component or a trait:

```cue
annotations: "platform.io/mesh-url": "https://\(context.custom.meshDomain)/\(context.name)"
```

```
1) "schematic": component "gateway": context.custom.meshDomain is optional in policy "tenant-identity"'s schema.ctx; guard it (if context.custom.meshDomain != _|_ {...}) or give it a default.
```

**A key no policy supplies.** This check only runs when **every** applicable policy that may set `output.ctx` declares a closed schema without pattern fields, and no applicable policy may set `output.policies`. Otherwise another policy could supply the key, and admission lets the read through. The check is also off when a policy's template can't be read or loaded.

```
1) "schematic": component "regional": reads context.custom.region, but no applicable policy declares it in schema.ctx; guard it (if context.custom.region != _|_ {...}) or give it a default.
```

**A key used against its type:**

```cue
replicas: int & context.custom.costCentre
```

```
1) "schematic": component "sized": uses context.custom.costCentre against its type in policy "tenant-identity"'s schema.ctx: evaluate base template app=payments-sized in namespace=payments: validation failed for workload sized:

Template errors:
  output.spec.replicas: conflicting values int and strings.MinRunes(3) (mismatched types int and string).
```

## What the render catches

Admission trusts the schema; the render checks that the policy keeps it. If a namespace is labelled `platform.io/team=Payments` and `platform.io/cost-centre=cc`, the policy's output breaks its schema and the policy fails to render. A mandatory global then stops the Application before anything is applied, rather than deploying it with bad identity tags. Its failed condition reads:

```
failed to render global policy "tenant-identity", which is mandatory: output.ctx does not match schema.ctx: output.ctx.costCentre: invalid value "cc" (does not satisfy strings.MinRunes(3)); output.ctx.team: invalid value "Payments" (out of bound =~"^[a-z][a-z0-9-]*$")
```

Every mismatch is reported at once, in `output.ctx` terms. The other mismatches read:
- **a required key the output doesn't set:** `output.ctx.costCentre: required by schema.ctx (string), not set`
- **a key a closed schema doesn't declare:** `output.ctx.region: not declared by schema.ctx, which is closed`

## What the PolicyDefinition webhook catches

**A schema leaning on the rest of the template is refused.** For `schema: ctx: close({team: _teamPattern})`, where `_teamPattern` is defined elsewhere in the template:

```
invalid PolicyDefinition: [schema.ctx must stand on its own, using at most the CUE standard library and nothing else of the template, so that admission can read it: schema.ctx: ctx.team: reference "_teamPattern" not found]
```

**Context without a schema is admitted, with a warning:**

```
Warning: output.ctx is set without a schema.ctx declaring it, so Applications cannot be checked against it at admission; declare schema: ctx (and close() it to make it the whole contract)
```

A policy like that works as before. The keys it might supply are unknown to admission: any read of them is let through, and the undeclared-key check is off for every Application it applies to.

## In defkit

```go
defkit.NewPolicy("tenant-identity").ApplicationScoped().Global().Priority(10).
	ClosedCtxSchema(
		defkit.String("team").Pattern("^[a-z][a-z0-9-]*$"),
		defkit.String("costCentre").MinLen(3),
		defkit.String("meshDomain").Optional(),
	).
	Template(func(tpl *defkit.PolicyTemplate) {
		tpl.Output().
			Ctx("team", defkit.Lit("payments")).
			Ctx("costCentre", defkit.Lit("cc-1042"))
	})
```

- **Required by default:** a schema field is required unless it is `Optional()`. `CtxSchema(...)` declares an open schema; `ClosedCtxSchema(...)` a closed one.
- **Imports are added for you:** a field using `MinLen` pulls in `"strings"`.
- **Register catches typos** in a closed schema's outputs:

  ```
  defkit: invalid definition 'tenant-identity-typo': Output().Ctx("teem") is not declared by the closed CtxSchema
  ```

## Rules of thumb

For **policy** authors:
- **Declare `schema: ctx`** for anything you put in `output.ctx`.
- **`close()` it** for identity and governance data. That gives Applications the strongest checking, including the undeclared-key check.
- **Mark a key `?`** only if it really can be absent.
- **Keep the schema self-contained:** the standard library, no references, no providers.
- **Don't default a key that must fail closed** when the policy can't work it out.

For **definition** authors:
- **Read governance values directly** (`labels: team: context.custom.team`), never through a parameter an Application can override.
- **Guard optional keys** with `if context.custom.x != _|_ {...}`, or give them a default.
- **Don't default a governance key in your own template** if it must fail closed. `context: custom: team: *"unknown" | string` means a broken policy quietly tags everything `unknown`.

## Limits

- **Definitions that extend another:** the view of the context is given without types that need an import, and reads in the parent's template are not checked for guards.
- **Dynamic reads:** `context.custom[k]` with a computed `k` is not checked.
- **Disjunction schemas:** a schema that is a disjunction (`close({...}) | close({...})`) is not read at admission. That policy counts as unknown.
- **Spec-rewriting policies:** a plain required parameter that a policy fills by rewriting the Application's spec is not visible to admission.
