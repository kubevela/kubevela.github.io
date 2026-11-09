---
title: Definition Inheritance
---

Definition inheritance lets a `ComponentDefinition` or `TraitDefinition` build on another definition of the same kind instead of copying it. The definition that builds on another is the **child**, and the one it builds on is the **parent**. The child names the parent in `spec.extends`, passes it the parameters it should render with, and adds only what is different: a label, an extra resource, a stricter health check.

This is useful when you run a platform for many teams:

- **Paved-road definitions.** Wrap the built-in `webservice` in a `tenant-webservice` that fixes resource requests and limits and stamps tenant labels, without forking the 600-line `webservice` template.
- **One change, many definitions.** When the parent changes, every child picks up the change at its next render. You don't have to apply the same fix to each copy.
- **Abstract bases.** Mark a base definition as `abstract` so Applications can't use it directly, only through the definitions that extend it.

:::caution
Definition inheritance is an **alpha** feature, first available in KubeVela v1.12.0-alpha.1. It is behind the `EnableDefinitionInheritance` feature gate, which is off by default.
:::

## Before you begin

### Enable the feature gate

Enable the gate on the KubeVela controller. With Helm:

```shell
helm upgrade --install kubevela kubevela/vela-core -n vela-system \
  --reuse-values \
  --set featureGates.enableDefinitionInheritance=true
```

This sets `--feature-gates=EnableDefinitionInheritance=true` on the controller. If the gate is off, a definition that sets `spec.extends` is refused rather than ignored:

```
definition tenant-webservice sets spec.extends: webservice, but definition inheritance is disabled;
start the controller with --feature-gates=EnableDefinitionInheritance=true to use it
```

### Know the ground rules

- **Same kind only.** A `ComponentDefinition` can extend a `ComponentDefinition`, and a `TraitDefinition` can extend a `TraitDefinition`. Policies and workflow steps don't support inheritance.
- **CUE only.** Both the parent and the child need a CUE template (`spec.schematic.cue`). A parent that uses Helm, Kube, or Terraform schematics can't be extended.
- **Same namespace.** A child can only extend a parent in its own namespace. To extend a built-in definition such as `webservice`, which lives in `vela-system`, put the child in `vela-system` too. This keeps a definition in a team namespace from rendering a privileged definition it doesn't own.

## Your first child definition

The following child extends the built-in `webservice`. It accepts four parameters, forwards the image, port, and optional image pull policy to `webservice` along with fixed resource requests, adds a tenant label to the Deployment, and renders a ConfigMap of its own.

```cue title="tenant-webservice.cue"
"tenant-webservice": {
	type:        "component"
	extends:     "webservice"
	description: "A webservice for tenant teams, with fixed resources and tenant labels."
	attributes: {}
}

template: {
	// What webservice receives, as if an Application had set these properties.
	$super: properties: {
		image:  parameter.image
		port:   parameter.port
		cpu:    "250m"
		memory: "256Mi"
		imagePullPolicy: parameter.imagePullPolicy
	}

	// Merged onto the Deployment that webservice renders.
	output: metadata: labels: "tenant.example.com/name": parameter.tenant

	// Added next to whatever webservice puts in outputs.
	outputs: "tenant-info": {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: name: context.name + "-tenant"
		data: tenant: parameter.tenant
	}

	parameter: {
		// +usage=Container image to run
		image: string
		// +usage=Port the service listens on
		port: *8080 | int
		// +usage=Image pull policy
		imagePullPolicy?: "Always" | "Never" | "IfNotPresent"
		// +usage=Owning tenant
		tenant: string
	}
}
```

Apply it into the parent's namespace:

```shell
vela def apply tenant-webservice.cue -n vela-system
```

You can write `extends` at the top level, as above, or under `attributes`. Both set `spec.extends`. Writing it in both places is an error. The child declares no workload, so on releases containing [kubevela/kubevela#7510](https://github.com/kubevela/kubevela/pull/7510) it takes the parent's `apps/v1` Deployment; on earlier releases, declare that workload in the child explicitly. See [Workload and other spec fields](#workload-and-other-spec-fields).

The equivalent `ComponentDefinition` YAML:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: tenant-webservice
  namespace: vela-system
spec:
  extends: webservice
  schematic:
    cue:
      template: |
        $super: properties: {
          image:  parameter.image
          port:   parameter.port
          cpu:    "250m"
          memory: "256Mi"
          imagePullPolicy: parameter.imagePullPolicy
        }
        output: metadata: labels: "tenant.example.com/name": parameter.tenant
        outputs: "tenant-info": {
          apiVersion: "v1"
          kind:       "ConfigMap"
          metadata: name: context.name + "-tenant"
          data: tenant: parameter.tenant
        }
        parameter: {
          image:  string
          port:   *8080 | int
          imagePullPolicy?: "Always" | "Never" | "IfNotPresent"
          tenant: string
        }
```

Application developers use the child like any other component type. They only see the four parameters it declares:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: checkout
spec:
  components:
    - name: checkout
      type: tenant-webservice
      properties:
        image: example.com/checkout:1.4.0
        tenant: payments
```

The Application renders a Deployment from `webservice`, with the `tenant.example.com/name: payments` label, 250m CPU and 256Mi memory requests and limits, and port 8080, plus a `checkout-tenant` ConfigMap. Health and status come from `webservice`, because the child doesn't declare its own.

## How a child works with its parent

Rendering happens in two passes. First, properties travel **up** the chain: the child computes `$super.properties`, and the parent renders with them as its `parameter`. Then results travel **down**: the parent's `output` and `outputs` are merged into the child's.

### Pass parameters with `$super.properties`

`$super.properties` is what the parent receives. It is named after an Application's `properties`, because it does the same job: whatever lands there is checked against the parent's `parameter` schema.

```cue
$super: properties: {
	image:           parameter.image           // forward a parameter
	cpu:             "250m"                    // decide a value for your users
	imagePullPolicy: parameter.imagePullPolicy // forward an optional parameter
}
```

A few rules apply:

- **Every child must call its parent.** A child without a `$super` block is refused at admission.
- **Required parameters must be passed.** If the parent has a parameter with no default that isn't optional, the child must pass it. In the example above, `webservice` requires `image`.
- **Optional parameters that nobody set are left out.** If the child forwards an optional parameter that the Application didn't set, the field is dropped and the parent's own default applies.
- **`$super.properties` can't depend on parent results.** It can use `parameter`, `context`, constants, and local helper fields, but it is computed before the parent renders, so it can't read `$super.output` or any other parent result.

### Declare the parameters you publish

A child does **not** inherit its parent's parameter schema. The parameters a child declares in its own `parameter` block are the ones Application developers see in `vela show` and the ones Applications are validated against. Anything you want users to control must be declared and then forwarded.

This lets you narrow a large parent to the handful of knobs your users need. In the example above, users can't set `cpu` on a `tenant-webservice` component even though `webservice` accepts it.

If a child declares a parameter that is neither forwarded in `$super.properties` nor used anywhere in its own template or status, admission accepts the definition with a warning, because setting that parameter would do nothing:

```
component tenant-webservice publishes "replicas", which is neither passed to webservice nor used by
tenant-webservice itself, so setting it on a component will do nothing. ...
```

### Add to what the parent renders

The child's surface fields are merged onto the parent's using CUE unification, so the child only writes what it adds:

| Definition kind | Merged fields |
| --- | --- |
| `ComponentDefinition` | `output`, `outputs` |
| `TraitDefinition` | `patch`, `patchOutputs`, `outputs`, `processing` |

Because the merge is unification, not replacement:

- New keys in `outputs` are added next to the parent's.
- Fields in `output` are overlaid field by field. `output: metadata: labels: {...}` adds labels to the parent's resource and leaves the rest alone.
- A field the parent derived from a **defaulted** parameter can be overridden by the child, because the default is still open when the child sees it.
- A field the parent set to a **concrete** value conflicts if the child sets a different value. The error names the parent and suggests the two ways out: pass a different parameter to the parent, or take the field over with `$inherit`.

### Read what the parent rendered

The parent's results are readable in the child as `$super.output` and `$super.outputs` (and `$super.patch`, `$super.patchOutputs`, and `$super.processing` for traits). For example, a child that renders a Service pointing at the parent's pods:

```cue
outputs: service: {
	apiVersion: "v1"
	kind:       "Service"
	metadata: name: context.name
	spec: {
		selector: $super.output.spec.selector.matchLabels
		ports: [{port: 80, targetPort: parameter.port}]
	}
}
```

### Replace instead of merge with `$inherit`

By default, every surface field is merged. To take a field over, set `$inherit` at the top level of the child's template:

```cue
// Replace everything: the child renders its own output and outputs.
$inherit: false
```

```cue
// Replace only output; outputs is still merged.
$inherit: output: false
```

`$inherit` accepts a boolean or a struct of booleans. Any other value is refused when an Application renders the child. A child that replaces `output` must still call its parent through `$super`, and can still read `$super.output` to build its own resource from the parent's.

## Workload and other spec fields

Only the template is composed by rendering. The rest of a definition's spec describes the workload, and for those fields an empty value in the child means "use the parent's".

:::caution
The output-aware workload rules below require the fix in [kubevela/kubevela#7510](https://github.com/kubevela/kubevela/pull/7510). Until that fix is included in your release, a child stored with `workload.type: autodetects.core.oam.dev` does not inherit the parent's workload metadata; declare the parent's workload explicitly.
:::

For a `ComponentDefinition`:

| Field | Inherited when |
| --- | --- |
| `workload` | The child declares no workload, **and** the child still merges the parent's `output` |
| `podSpecPath` | Empty in the child, **and** the child still merges the parent's `output` |
| `revisionLabel` | Empty in the child, **and** the child still merges the parent's `output` |
| `childResourceKinds` | Empty in the child, **and** the child still merges the parent's `output` |
| `status` | Always composed; see [Health and status](#health-and-status) |

These fields describe the resource in `output`. If the child replaces `output`, the parent's values would describe a resource the child doesn't render, so they aren't inherited.

### Workload inheritance in detail

A child that declares no workload gets its parent's. This is what you want in almost every case, and it's why the `tenant-webservice` example sets `attributes: {}` with no `workload`.

When you apply a `ComponentDefinition` with no workload, the KubeVela mutating webhook stores `spec.workload.type: autodetects.core.oam.dev`. During inheritance, that value counts as "no workload", the same as an empty one. The stored child keeps `autodetects.core.oam.dev`, because inheritance is resolved when the Application renders, not when the definition is written:

```console
$ kubectl get componentdefinition tenant-webservice -n vela-system -o jsonpath='{.spec.workload}'
{"definition":{"apiVersion":"","kind":""},"type":"autodetects.core.oam.dev"}
```

The resolved workload shows up in the Application status:

```console
$ kubectl get app checkout -o jsonpath='{range .status.services[*]}{.name}{"\t"}{.workloadDefinition}{"\n"}{end}'
checkout	{"apiVersion":"apps/v1","kind":"Deployment"}
```

The full rules:

- **A child with no workload takes its parent's.** "No workload" means no `apiVersion` or `kind`, and a `type` that is empty or `autodetects.core.oam.dev`.
- **A child that declares a workload keeps it.** Declare either a workload type or a complete `apiVersion` and `kind`; an incomplete GVK is rejected at admission.
- **A child that replaces `output` doesn't take the parent's workload.** With `$inherit: false` or `$inherit: output: false`, the child renders its own resource, so the parent's workload no longer describes it. If such a child renders something other than the parent's kind, declare its workload explicitly:

  ```cue
  "batch-task": {
  	type:    "component"
  	extends: "base-task"
  	attributes: workload: definition: {
  		apiVersion: "batch/v1"
  		kind:       "Job"
  	}
  }

  template: {
  	$inherit: output: false
  	$super: properties: {image: parameter.image}
  	output: {
  		apiVersion: "batch/v1"
  		kind:       "Job"
  		// ...
  	}
  	parameter: image: string
  }
  ```

- **In a longer chain, the nearest ancestor that declares a workload wins.** A level in the middle that declares nothing passes its parent's workload down. A level in the middle that replaces `output` stops the chain there: neither it nor anything below it takes the workload from further up. If that middle level declares its own workload, children below it take that one.

:::note
The fix for a child stored with the automatic `autodetects.core.oam.dev` workload is tracked by [kubevela/kubevela#7510](https://github.com/kubevela/kubevela/pull/7510). Without that fix, the rendered resources are correct but `status.services[].workloadDefinition` is empty, and anything that reads the child's workload type gets the wrong answer. Definitions written with [Defkit](#write-child-definitions-with-defkit) always hit this when they don't name a workload. Until the fix is included in your KubeVela release, declare the parent's workload in the child explicitly. See [kubevela/kubevela#7508](https://github.com/kubevela/kubevela/issues/7508) for details.
:::

### Trait spec fields

For a `TraitDefinition`, `appliesToWorkloads`, `conflictsWith`, `workloadRefPath`, and `stage` are inherited when empty in the child.

The boolean fields `podDisruptive`, `revisionEnabled`, `manageWorkload`, and `controlPlaneOnly` are combined with OR: the child's value is `true` if it or any ancestor sets `true`. A child therefore **can't** turn off a parent's `podDisruptive`.

## Health and status

Health and status compose along the chain instead of being replaced:

| Field | A child that says nothing | A child that declares it | With `$inherit: false` in that status field |
| --- | --- | --- | --- |
| `healthPolicy` | Uses the parent's policy | Both the parent's and the child's policy must pass | Only the child's policy counts |
| `customStatus` | Uses the parent's message | The child's message replaces the parent's | Same as declaring it |
| `details` | Uses the parent's details | The child's entries are added to the parent's | Only the child's entries |

The parent's verdict and message are readable as `$super.isHealth` and `$super.message`, so a child can build on them. Add a `status` block to the child's attributes; the template stays as before:

The `$inherit` directive in the template does not affect status. Put `$inherit: false` inside the individual `healthPolicy`, `customStatus`, or `details` CUE snippet that should stop inheriting.

```cue
"tenant-webservice": {
	type:    "component"
	extends: "webservice"
	attributes: status: {
		// Added to webservice's own health check: both must hold.
		healthPolicy: #"""
			isHealth: context.output.spec.replicas > 0
			"""#
		// Reuses webservice's status text through $super.message.
		customStatus: #"""
			message: "\($super.message) (tenant: \(parameter.tenant))"
			"""#
	}
}
```

To decide health on its own, put `$inherit: false` in the child's `healthPolicy`. It can still read `$super.isHealth` if it wants to factor in the parent's verdict.

For more on writing these fields, see [Definition Health and Status](../status/definition_health_status.md).

## Abstract definitions

Mark a definition as `abstract` when it exists to be extended, not used directly. A typical case is a base that applies your platform's rules: security context, labels, resource limits. Marking it abstract makes the definitions built on it the only way to use it.

```cue
"acme-base": {
	type:     "component"
	abstract: true
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: name: context.name
		spec: {
			selector: matchLabels: "app.oam.dev/component": context.name
			template: {
				metadata: labels: "app.oam.dev/component": context.name
				spec: containers: [{
					name:  context.name
					image: parameter.image
				}]
			}
		}
	}
	parameter: image: string
}
```

The YAML equivalent is `spec.abstract: true`.

An Application that names an abstract definition directly is refused:

```
component acme-base is abstract and cannot be used directly; name a component that extends it
```

The `abstract` marking is **not** inherited, so a child of `acme-base` is usable unless it marks itself abstract too. Abstract definitions don't need their own feature gate.

`vela def list` hides abstract definitions by default. To include them:

```shell
vela def list --include-abstract
```

## Chains, revisions, and reproducibility

### Multi-level chains

A child can have up to **8 ancestors** (9 definitions total). Each level compiles on its own, with its own imports. A chain that loops back on itself is refused, naming the definitions in the loop.

Spec fields are resolved for the definition being rendered, so the nearest ancestor that sets a field wins. A leaf that declares `Deployment` keeps it, even if its grandparent declares `CronJob`.

### Pin a parent revision

By default, `extends: webservice` tracks whatever `webservice` currently is. To pin a specific [definition revision](../x-def-version.md), add it after `@`:

```cue
"tenant-webservice": {
	type:    "component"
	extends: "webservice@v3"
	attributes: {}
}
```

### Revisions keep Applications stable

When an Application renders a child, KubeVela records every ancestor it resolved in the ApplicationRevision. Replaying that revision, for example through `app.oam.dev/publishVersion`, uses exactly what it recorded even if a parent has changed since. A new revision picks up the current parent (unless the child pins one).

### Who can use a child

When `ValidateDefinitionPermissions` is enabled, the Application permission check covers the definitions an Application names, not the definitions those extend. You can grant a team access to `tenant-webservice` without granting access to `webservice` itself, which is the point of building an abstraction. The gate is disabled by default; the chart value is `authorization.definitionValidationEnabled`.

## Extend a trait

Traits work the same way, with `patch`, `patchOutputs`, `outputs`, and `processing` as the merged fields. The following parent adds a team label to the workload, and the child forwards the team and also adds a cost-center label:

```cue title="team-label.cue"
"team-label": {
	type: "trait"
	attributes: appliesToWorkloads: ["deployments.apps"]
}

template: {
	patch: metadata: labels: "example.com/team": parameter.team
	parameter: team: string
}
```

```cue title="billed-team-label.cue"
"billed-team-label": {
	type:    "trait"
	extends: "team-label"
	attributes: {}
}

template: {
	$super: properties: {team: parameter.team}
	patch: metadata: labels: "example.com/cost-center": parameter.costCenter
	parameter: {
		team:       string
		costCenter: string
	}
}
```

`billed-team-label` inherits `appliesToWorkloads` from `team-label`, and its `patch` is merged with the parent's, so the workload gets both labels.

## Write child definitions with Defkit

If you write definitions in Go with [Defkit](../defkit/overview.md), use `Extends` to name the parent and `Super()` to pass it properties:

```go
baseWeb := defkit.ComponentRef("webservice")

tenantWeb := defkit.NewComponent("tenant-webservice").
	Extends(baseWeb).
	Params(defkit.String("image"), defkit.String("tenant")).
	Template(func(tpl *defkit.Template) {
		tpl.Super().Set("image", defkit.ParamRef("image"))
		tpl.Output(defkit.NewResource("apps/v1", "Deployment").
			Set("metadata.labels[tenant.example.com/name]", defkit.ParamRef("tenant")))
	})
```

- `Extends` takes the parent definition itself, so a component can't extend a trait. For a parent installed elsewhere, such as a built-in, use `defkit.ComponentRef("webservice")` or `defkit.TraitRef(...)`, optionally pinned as `"webservice@v3"`. Pass the parent's CUE with `WithCUE` so the call can be checked and the chain rendered locally.
- `Abstract()` marks a component or trait as abstract.
- `tpl.Inherit(false)` and `tpl.InheritField("output", false)` write `$inherit`.
- `defkit.SuperOutput(path)`, `defkit.SuperOutputs(name, path)`, and `defkit.SuperPatch(path)` read what the parent rendered.
- A child that doesn't name a workload writes none. On releases containing [kubevela/kubevela#7510](https://github.com/kubevela/kubevela/pull/7510), it then takes its parent's workload metadata.

When Defkit has the parent's CUE—because the parent is defined in the same program or a reference uses `WithCUE`—it runs the same call check as admission when you register a child. A child that never calls its parent, or omits a required parameter, then fails at build time with the same message. Otherwise the cluster performs that check when the definition is applied. `vela def apply-module` applies parents before the definitions that extend them.

## Validation and troubleshooting

KubeVela checks a child when you apply it and checks the composed result when an Application renders it. The table lists the errors you're most likely to see at either stage.

| Error contains | Cause | Fix |
| --- | --- | --- |
| `definition inheritance is disabled` | The feature gate is off | [Enable the feature gate](#enable-the-feature-gate) |
| `its template never calls it` | No `$super` block | Add `$super: properties: {...}` |
| `has no CUE template to call it from` | The child sets `extends` but has no CUE schematic | Give the child a CUE template with a `$super` block |
| `calls <parent> without "<field>"` | A required parent parameter isn't passed | Pass it in `$super.properties` |
| `calls <parent> with parameters it will not accept` | A passed value has the wrong type, or the parent's schema is closed to it | Fix the value in `$super.properties` |
| `may only extend one in its own namespace` | The parent is in another namespace | Put the child in the parent's namespace, or copy the parent |
| `only CUE definitions can be extended` | The parent isn't a CUE definition | Extend a CUE definition |
| `deeper than 8` | The chain has more than 8 ancestors | Flatten the chain |
| `already in its own inheritance chain` | The chain loops | Remove the cycle |
| ``its `$super` block depends on what <parent> produced`` | `$super.properties` reads `$super.output` or another parent result | Compute it without parent results |
| `merging its output onto <parent>'s` | The child sets a field the parent set to a concrete value | Pass a different parameter, or use `$inherit: {output: false}` |
| `true or false` | `$inherit` has an invalid value at render time | Use `false`, or a struct such as `{output: false}` |
| `is abstract and cannot be used directly` | An Application names an abstract definition | Use a definition that extends it |

Two problems produce warnings instead of errors:

- **The child passes a field the parent doesn't declare.** This is usually a typo. It's only a warning because a parent with an open schema may accept it.
- **The child publishes a parameter that goes nowhere.** See [Declare the parameters you publish](#declare-the-parameters-you-publish).

Render errors name the route through the chain, leaf first, such as `tenant-webservice:webservice`. A failure inside a parent is often caused by what the child passed it, and the route tells you which definition called the one that failed.

### The child's workload type looks wrong

If `kubectl get componentdefinition` shows `autodetects.core.oam.dev` for a child, that's expected; see [Workload inheritance in detail](#workload-inheritance-in-detail). Check the resolved workload in the Application's `status.services[].workloadDefinition` instead.

If the Application status shows an empty `workloadDefinition` for a child that merges its parent's output, you're on a release without [kubevela/kubevela#7510](https://github.com/kubevela/kubevela/pull/7510). Declare the workload in the child explicitly.

## Limitations

- Definition inheritance is alpha. The API may change in later releases.
- Only `ComponentDefinition` and `TraitDefinition` support `extends`.
- Both the parent and the child must be CUE definitions in the same namespace.
- A child can't turn off a boolean trait field, such as `podDisruptive`, that an ancestor sets to `true`.
- `$super.properties` can't depend on what the parent renders.
