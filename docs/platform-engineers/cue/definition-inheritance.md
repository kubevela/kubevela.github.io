---
title: Definition Inheritance
---

Definition inheritance lets a `ComponentDefinition` or `TraitDefinition` build on another definition of the same kind instead of copying it. The definition that builds on another is the **child**. The definition it builds on is the **parent**. The child names the parent in `spec.extends`, passes the parent its parameters, and adds what is different, such as a label, an extra resource or a stricter health check.

A child is always its parent with more on it. It cannot remove or change what the parent renders, except that it can leave out single named outputs. This lets a platform team publish a base definition and know that every definition built on it still renders the base.

:::caution
Definition inheritance is an **alpha** feature and is off by default. Its API and behaviour can change in a future release.
:::

## When to use it

Use inheritance when several definitions share one base:

- **Paved-road definitions.** A platform team publishes a base component with the security context, labels, Service and NetworkPolicy that every workload must have. Each team extends it with its own labels and resources and does not copy the base template.
- **One fix, many definitions.** When the parent changes, every child that tracks it renders the change at its next reconcile. You fix the base once.
- **Guard rails.** The parent marks the fields that children must not touch (`// +final`) and the outputs that children must keep (`// +required`). A base marked `abstract` can only be used through the definitions that extend it.

If you need a definition that renders something the parent does not, such as a `StatefulSet` instead of a `Deployment`, write a separate definition. Do not extend the parent.

## Enable the feature

Turn on the `EnableDefinitionInheritance` feature gate in the KubeVela controller. With Helm:

```shell
helm upgrade --install kubevela kubevela/vela-core -n vela-system --create-namespace \
  --set featureGates.enableDefinitionInheritance=true
```

If you start the controller yourself, pass the flag:

```shell
--feature-gates=EnableDefinitionInheritance=true
```

When the gate is off, a definition that sets `spec.extends` cannot render. The error names the flag:

```
definition team-web sets spec.extends: base-web, but definition inheritance is disabled; start the controller with --feature-gates=EnableDefinitionInheritance=true to use it
```

See [Bootstrap Parameters](../system-operation/bootstrap-parameters.md) for the other feature gates.

## Write a child definition

This parent renders a `Deployment`, a `Service` and a `NetworkPolicy`. It takes an `image` (required) and `replicas` (default `1`):

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: base-web
  namespace: vela-system
spec:
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
    type: deployments.apps
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "apps/v1"
        	kind:       "Deployment"
        	metadata: name: context.name
        	spec: {
        		replicas: parameter.replicas
        		selector: matchLabels: "app.oam.dev/component": context.name
        		template: {
        			metadata: labels: "app.oam.dev/component": context.name
        			spec: {
        				securityContext: {runAsNonRoot: true}
        				containers: [{name: context.name, image: parameter.image}]
        			}
        		}
        	}
        }
        outputs: {
        	svc: {
        		apiVersion: "v1"
        		kind:       "Service"
        		metadata: name: context.name
        		spec: {
        			selector: "app.oam.dev/component": context.name
        			ports: [{port: 8080}]
        		}
        	}
        	netpol: {
        		apiVersion: "networking.k8s.io/v1"
        		kind:       "NetworkPolicy"
        		metadata: name: context.name
        		spec: podSelector: matchLabels: "app.oam.dev/component": context.name
        	}
        }
        parameter: {
        	image:    string
        	replicas: *1 | int
        }
```

A child sets `spec.extends` to the parent's name and writes a template with three parts: its own `parameter`, a `$super` block, and the fields it adds.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: team-web
  namespace: vela-system
spec:
  extends: base-web
  schematic:
    cue:
      template: |
        parameter: {
        	image:  *"nginxinc/nginx-unprivileged:stable" | string
        	tenant: string
        }
        $super: properties: {image: parameter.image, replicas: 2}
        output: metadata: labels: team: "payments"
        output: spec: template: metadata: labels: tenant: parameter.tenant
        output: spec: template: spec: containers: [{env: [{name: "TENANT", value: parameter.tenant}]}]
```

The child does not set `spec.workload`. It inherits the parent's workload.

### Pass parameters to the parent with `$super`

`$super: properties` is what the parent receives. It works like the `properties` of a component in an Application:

- KubeVela checks it against the parent's `parameter` schema. A value of the wrong type is refused. A field that the parent does not declare gives a warning, because it is usually a typo.
- You must pass every parameter that the parent requires and that has no default. In the example, `base-web` requires `image`, so `team-web` passes it.
- You can pass fixed values, such as `replicas: 2`, or values from the child's own parameters, such as `image: parameter.image`.
- `$super: properties` can read `parameter` and `context` only. See [Read what the parent rendered](#read-what-the-parent-rendered) for the reason.

Every child must have a `$super` block, even when it passes nothing. Write `$super: properties: {}` for a parent that takes no parameters.

To forward all of the child's parameters unchanged, pass `parameter` itself:

```cue
parameter: {storageClass: string, size: *"1Gi" | string}
$super: properties: parameter
```

### Declare the parameters you publish

A child does not inherit its parent's parameters. The child's own `parameter` block is the complete list of what an Application user can set, and it is what KubeVela validates the Application against. A parent parameter that the child does not expose and does not pass keeps its default.

In the example, `team-web` publishes `image` (now with a default) and `tenant`. An Application user cannot set `replicas`, because `team-web` fixes it to `2`.

### Add to what the parent renders

The child's `output` and `outputs` merge onto the parent's. Write only the fields you add, and they land on the parent's resources:

- `output: metadata: labels: team: "payments"` adds a label to the parent's `Deployment`.
- A new key under `outputs` adds a new resource next to the parent's resources.
- A field under an existing output, such as `outputs: svc: spec: type: "NodePort"`, adds to that output if the parent did not set the field.

Lists merge item by item. `containers: [{env: [...]}]` adds `env` to the first container that the parent rendered. A child cannot append an item to a list that the parent rendered. The lists then have different lengths and do not merge (`incompatible list lengths (1 and 2)`).

### Read what the parent rendered

The parent's results are available on `$super`:

| Field | Contains |
|---|---|
| `$super.output` | the parent's rendered `output` |
| `$super.outputs.<name>` | one of the parent's rendered `outputs` |
| `$super.patch` | the parent trait's rendered `patch` |
| `$super.patchOutputs.<name>` | one of the parent trait's rendered `patchOutputs` |

This child adds a `ConfigMap` that records the image the parent rendered:

```cue
outputs: info: {
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: name: context.name + "-info"
	data: image: $super.output.spec.template.spec.containers[0].image
}
```

There is one constraint. Properties go up the chain before results come back down, so `$super.properties` is read before the parent renders. `$super.properties` cannot use `$super.output`, `$super.outputs` or any other parent result.

## The rules

A child adds to its parent. It never replaces or changes what the parent renders.

| A child can | A child cannot |
|---|---|
| add fields that the parent did not set, or fill a field the parent left open | change a field that the parent set, even one that comes from a defaulted parameter |
| change a parent value through `$super: properties` | replace what the parent renders with `$inherit: false`, `{output: false}`, `{outputs: false}` or `{patch: false}` |
| leave out one named output with `$inherit: {outputs: {<name>: false}}` and write its own | leave out an output that the parent marks `// +required` |
| add outputs of its own | add anything to a field that the parent marks `// +final` |
| leave `spec.workload` unset to inherit it | declare a workload that differs from its parent's |

### A child does not change parent fields

A child cannot change a field that the parent already set. This applies to constants, to fields from a parameter with a default, and to fields from a required parameter. Writing the same value again also counts as a change, except for a constant such as `kind: "Deployment"`.

In this version of `team-web`, the child tries to set `replicas`, which `base-web` sets from its defaulted `replicas` parameter:

```cue
$super: properties: {image: parameter.image}
output: spec: replicas: 5
```

It is refused:

```
component team-web sets output.spec.replicas, which base-web already sets; pass a value to base-web through `$super: properties` instead
```

To change a value that the parent sets from a parameter, pass the value through `$super`:

```cue
$super: properties: {image: parameter.image, replicas: 3}
```

A field that the parent sets to a constant cannot be changed at all. The error tells you to write a separate definition:

```
component team-web sets output.kind, but base-web fixes it to "Deployment" and a child cannot change it; to use another value, write a definition that does not extend base-web
```

A default written directly in the parent, with no parameter behind it, such as `strategy: type: *"RollingUpdate" | string`, is treated the same way. No parameter can change it, so there is nothing to pass through `$super`:

```
component team-web sets output.spec.strategy.type, but base-web sets it to the default "RollingUpdate" and has no parameter for it; to use another value, write a definition that does not extend base-web
```

When the constant is inside one of the parent's `outputs`, there is a smaller step: leave that output out and write your own, starting from the parent's version if you like. The error says so:

```
component team-web sets outputs.svc.spec.ports[0].port, but base-web fixes it to 8080; to write your own svc, leave base-web's out with `$inherit: {outputs: {svc: false}}` and build it from `$super.outputs.svc`
```

If the parent marks that output `// +required`, it cannot be left out, and the error keeps the advice to write a separate definition.

A field that comes from a required parameter, such as the container `image` in `base-web`, is only known when an Application renders. A child that overwrites it is accepted when you apply it. An Application that uses it is refused at render:

```
component checkout (type team-web) sets output.spec.template.spec.containers[0].image, which base-web already sets; pass a value to base-web through `$super: properties` instead
```

Errors at render name the Application's component and its type. Errors when you apply a definition name the definition.

A parent can set a field only under a condition, for example a CPU limit when the Application passes `cpu`:

```cue
containers: [{
	name: context.name
	if parameter.cpu != _|_ {
		resources: limits: cpu: parameter.cpu
	}
}]
```

A child that writes that field would work for some Applications and fail for others, so it is refused when you apply it:

```
component team-web sets output.spec.template.spec.containers[0].resources.limits.cpu, which base-web sets only when `if parameter.cpu != _|_`; an Application that meets that condition would be refused. Pass a value to base-web through `$super: properties` instead
```

To give the field a value of your own, pass a default up:

```cue
parameter: cpu: *"250m" | string
$super: properties: cpu: parameter.cpu
```

A child can still add fields beside the conditional one, such as `resources: limits: memory`. When the conditional field is filled from a map parameter, such as the annotations of `webservice`, a child can add its own keys to it. Only a key that the Application also passes clashes, and that is refused at render.

### Leave out one output with `$inherit`

`$inherit` can leave out one of the parent's named outputs. The child can then write its own output with the same name, or leave it out completely:

```cue
$super: properties: {image: parameter.image}
$inherit: {outputs: {netpol: false}}
outputs: netpol: {
	apiVersion: "networking.k8s.io/v1"
	kind:       "NetworkPolicy"
	metadata: name: context.name
	spec: {
		podSelector: matchLabels: "app.oam.dev/component": context.name
		ingress: [{}]
	}
}
```

For a trait, use `$inherit: {patchOutputs: {<name>: false}}`.

That is all `$inherit` does. These forms are refused:

| Form | Error |
|---|---|
| `$inherit: false` | `` `$inherit: false` is not allowed in <child>: a definition that extends another adds to what its parent renders and cannot replace it `` |
| `$inherit: {output: false}`, `{patch: false}` | `` `$inherit: {output: false}` is not allowed in <child>: a definition that extends another adds to its parent's output and cannot replace it `` |
| `$inherit: {outputs: false}`, `{patchOutputs: false}` | `` `$inherit: {outputs: false}` is not allowed in <child>: leave out one output at a time with `$inherit: {outputs: {<name>: false}}` `` |
| `$inherit: {spec: false}` | `$inherit in <child>: unknown field spec; only outputs and patchOutputs take per-output drops` |
| `$inherit: {outputs: {svc: "no"}}` | `$inherit in <child>: outputs.svc must be true or false` |

### Mark fields `+final` and outputs `+required`

A parent can protect parts of its template with doc comments. The markers apply to every definition below it in the chain, at any depth.

`// +final` on a field means that no child can add anything to that field or below it:

```cue
spec: {
	// +final
	securityContext: {runAsNonRoot: true}
	containers: [{name: context.name, image: parameter.image}]
}
```

A child that adds `fsGroup` to `securityContext`, or writes `runAsNonRoot` again, is refused:

```
component team-web adds to output.spec.template.spec.securityContext, which base-web marks +final
```

The child can still add fields next to the final one, such as a label on `metadata`. A definition in the middle of a chain can also mark its own fields `+final`. In a trait, `+final` works the same way on `patch` fields.

`+final` works on fields reached through structs. It cannot be put on a field inside a list item, such as one container's `securityContext`, because the check cannot enforce it there. A definition that does this is refused when you apply it:

```
component base-web marks output.spec.template.spec.containers[0].securityContext +final, but +final cannot be enforced on a field inside a list item; mark the list field, output.spec.template.spec.containers, instead
```

To lock something inside the containers, mark the `containers` list itself. That locks the whole list, so children can no longer add to any container, for example an environment variable or a memory limit.

`// +required` on an output means that no child can leave it out with `$inherit`:

```cue
outputs: {
	// +required
	svc: {...}
	netpol: {...}
}
```

Put `// +required` on the `outputs` block itself to require every output in it. It also works on a trait's `patchOutputs`. A child that leaves out a required output is refused:

```
component team-web leaves out outputs.svc, which base-web marks +required
```

If a parent adds `+final` after a child already adds to that field, the child stays in the cluster. The next render of an Application that uses the child is refused with the same error.

### Workload

A child's workload is its parent's. Leave `spec.workload` unset in the child and it inherits the parent's `workload` and the other workload attributes.

A child can declare `spec.workload` only if it matches the parent's, fully or in part (for example `type: deployments.apps` only). A different workload is refused:

```
component team-web declares workload apps/v1 StatefulSet, but base-web declares apps/v1 Deployment; leave spec.workload unset to inherit it
```

If no definition above the child declares a workload (the root uses autodetect), KubeVela compares the child's workload with the `apiVersion` and `kind` that the root writes on its `output` as constants. No level can change `output.kind`, so the root's kind is what every level renders. For example, if `base-web` had no `spec.workload`:

```
component team-web declares workload apps/v1 StatefulSet, but base-web renders apps/v1 Deployment; leave spec.workload unset to inherit it
```

If the root takes `kind` or `apiVersion` from a parameter or from `context`, there is nothing to compare, and the child's declaration is kept.

### Health and status

A child inherits the parent's `status` and can add to it.

- **`healthPolicy`**: a child with no `healthPolicy` uses the parent's result. A child that sets `isHealth` adds a check, and both the parent's check and the child's check must pass. To replace the parent's check, put `$inherit: false` in the child's own `healthPolicy`. The child can still read the parent's result as `$super.isHealth`.
- **`customStatus`**: the status message is one line, so a child that sets `message` replaces the parent's message. The parent's message is available as `$super.message`.
- **`details`**: the child's fields join the parent's. Put `$inherit: false` in the child's `details` to start again from the child's fields only.

A child cannot leave out an output that an inherited `healthPolicy`, `customStatus` or `details` reads. The status was written for that output, and without it the status is wrong. For example, this parent's health check reads the `netpol` output:

```yaml
spec:
  status:
    healthPolicy: |
      isHealth: context.output.status.readyReplicas == context.output.spec.replicas && context.outputs.netpol != _|_
```

A child that leaves out `netpol` with `$inherit: {outputs: {netpol: false}}` is refused:

```
component team-web leaves out outputs.netpol, which the healthPolicy it inherits from base-web reads; keep the output, or take the health policy over with `$inherit: false` in its own healthPolicy
```

To leave out the output, take over the status that reads it. For `healthPolicy` and `details`, use `$inherit: false`. For `customStatus`, set the child's own message. This child leaves out `netpol` and replaces the parent's health check:

```yaml
spec:
  extends: base-web
  status:
    healthPolicy: |
      $inherit: false
      isHealth: context.output.status.readyReplicas == context.output.spec.replicas
  schematic:
    cue:
      template: |
        parameter: image: *"nginxinc/nginx-unprivileged:stable" | string
        $super: properties: {image: parameter.image}
        $inherit: {outputs: {netpol: false}}
```

A status that iterates over all of `context.outputs` reads every output, so no output can be left out under it.

### `+immutable` parameters

A parent parameter marked [`// +immutable`](./parameter-markers.md) stays immutable through its children. This is true when the child forwards the parameter under the same name and when it passes one of its own parameters into it. An Application update that changes the value that reaches the parent is refused, even when the field the Application changes has a different name:

```
storage-base's immutable parameter storageClass cannot be changed (current: "fast", new: "slow")
```

A parameter that only had its default can be set one time, as for any `+immutable` parameter.

### When the rules are checked

KubeVela checks every rule when you apply a definition and again when an Application renders it. The render check catches a parent that changed after the child was applied, such as a newly added `+final` marker. An Application that would break a rule is refused by the admission webhook, and an existing Application reports the error in its status.

## Traits that extend traits

A `TraitDefinition` can extend another `TraitDefinition`. The child's `patch`, `patchOutputs`, `outputs` and `processing` merge onto the parent's, with the same rules as for components:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: labels-team
  namespace: vela-system
spec:
  appliesToWorkloads:
    - deployments.apps
  extends: labels-base
  schematic:
    cue:
      template: |
        $super: properties: {}
        patch: metadata: labels: team: "payments"
```

If `labels-base` patches the label `managed: "true"`, a workload with the `labels-team` trait gets both labels.

## Abstract definitions

Set `spec.abstract: true` on a base that is not complete on its own. An Application cannot use an abstract definition directly, only through a definition that extends it:

```yaml
spec:
  abstract: true
```

An Application that names an abstract definition is refused:

```
component base-web is abstract and cannot be used directly; name a component that extends it
```

`abstract` is not inherited. A child of an abstract definition can be used, unless the child also sets `abstract: true`. Both component and trait definitions can be abstract.

## Chains, revisions and namespaces

### Chains and the depth limit

A child can be the parent of another definition. Each level passes properties up through `$super` and adds to what the level above renders. A chain can be at most 8 definitions deep.

A definition cannot extend itself, directly or through other definitions:

```
definition web-b extends web-a, which is already in its own inheritance chain: web-a -> web-b -> web-a
```

### Pin a parent revision

`spec.extends: base-web` tracks the current version of the parent. To stay on one revision, add the revision name:

```yaml
spec:
  extends: base-web@v1
```

The revision must exist as a `DefinitionRevision`. The controller keeps a limited number of definition revisions (the `definition-revision-limit` [bootstrap parameter](../system-operation/bootstrap-parameters.md), default `2`). Pin only a revision that the controller still keeps.

### Application revisions

When an Application renders, KubeVela records the parent definitions it resolved in the ApplicationRevision, next to the child. An Application that is rolled back to that revision renders with the same ancestors, even if a parent has changed since then.

### Namespaces

A definition can only extend a definition in its own namespace. This stops a definition in a team's namespace from rendering a privileged definition from `vela-system`. A child in `default` that extends a parent in `vela-system` is refused:

```
component definition base-web is in namespace vela-system, and a definition may only extend one in its own namespace (default); copy it into default, or put the extending definition alongside it
```

Definitions in `vela-system` are available to Applications in every namespace, as usual.

### Parents must use CUE

Only a definition with a CUE template can be a parent. A parent with another schematic, such as Helm or Kube, is refused.

## Worked example

A platform team publishes `base-web` (from [Write a child definition](#write-a-child-definition)) with a health check and a status message:

```yaml
spec:
  status:
    healthPolicy: |
      isHealth: context.output.status.readyReplicas == context.output.spec.replicas
    customStatus: |
      message: "replicas: \(context.output.spec.replicas)"
```

The payments team publishes `team-web`. It passes `image` and `replicas` up, adds a label and an environment variable, and adds a `ConfigMap` that reads what the parent rendered:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: team-web
  namespace: vela-system
spec:
  extends: base-web
  schematic:
    cue:
      template: |
        parameter: {
        	image:  *"nginxinc/nginx-unprivileged:stable" | string
        	tenant: string
        }
        $super: properties: {image: parameter.image, replicas: 2}
        output: metadata: labels: team: "payments"
        output: spec: template: metadata: labels: tenant: parameter.tenant
        output: spec: template: spec: containers: [{env: [{name: "TENANT", value: parameter.tenant}]}]
        outputs: info: {
        	apiVersion: "v1"
        	kind:       "ConfigMap"
        	metadata: name: context.name + "-info"
        	data: image: $super.output.spec.template.spec.containers[0].image
        }
```

An application developer uses `team-web` and sets only `tenant`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: payments
  namespace: default
spec:
  components:
    - name: checkout
      type: team-web
      properties:
        tenant: acme
```

The Application renders:

- a `Deployment` named `checkout` with 2 replicas, the label `team: payments`, the pod label `tenant: acme`, the env var `TENANT=acme`, and the parent's `securityContext`
- the parent's `Service` and `NetworkPolicy`
- a `ConfigMap` named `checkout-info` with `image: nginxinc/nginx-unprivileged:stable`

The component is healthy when the parent's health check passes, and its status message comes from the parent. Use `vela dry-run` to see the rendered resources before you apply them.

## Write inheritance with DefKit

If you write definitions in Go with [DefKit](../defkit/overview.md), these methods produce the same CUE:

| CUE | DefKit |
|---|---|
| `spec.extends: <parent>` | `Extends(parent)`. For an installed parent, such as a built-in, use `defkit.ComponentRef("webservice")` or `defkit.TraitRef("labels@v2")` |
| `spec.abstract: true` | `Abstract()` |
| `$super: properties: {...}` | `tpl.Super().Set("image", defkit.ParamRef("image"))`. Call `tpl.Super()` with no `Set` to pass nothing |
| `$inherit: {outputs: {netpol: false}}` | `tpl.DropOutput("netpol")` |
| `$inherit: {patchOutputs: {pdb: false}}` | `tpl.DropPatchOutput("pdb")` |
| `// +required` on an output | `tpl.RequireOutput("svc")` |
| `// +final` on a field | `Resource.Final("spec.template.spec.securityContext")` |
| `$super.output.<path>`, `$super.outputs.<name>.<path>`, `$super.patch.<path>` | `defkit.SuperOutput(path)`, `defkit.SuperOutputs(name, path)`, `defkit.SuperPatch(path)` |

```go
func TeamWeb(parent *defkit.ComponentDefinition) *defkit.ComponentDefinition {
	vela := defkit.VelaCtx()
	return defkit.NewComponent("team-web").
		Extends(parent).
		Params(defkit.String("image"), defkit.String("tenant")).
		Template(func(tpl *defkit.Template) {
			tpl.Super().Set("image", defkit.ParamRef("image"))
			tpl.Output(defkit.NewResource("apps/v1", "Deployment").
				Set("metadata.labels[tenant.oam.dev/name]", defkit.ParamRef("tenant")))
			tpl.Outputs("info", defkit.NewResource("v1", "ConfigMap").
				Set("metadata.name", defkit.Interpolation(vela.Name(), defkit.Lit("-info"))).
				Set("data.image", defkit.SuperOutput("spec.template.spec.containers[0].image")))
		})
}
```

## Troubleshooting

The errors below come from the admission webhook when you apply a definition or an Application, or from the Application status at render. Names in the messages are from the examples on this page.

| Error contains | Cause | What to do |
|---|---|---|
| `definition inheritance is disabled` | The feature gate is off. | Enable `EnableDefinitionInheritance`. See [Enable the feature](#enable-the-feature). |
| `extends base-web but its template never calls it`, or at render ``extends base-web but declares no `$super` block`` | The child has no `$super` block. | Add `$super: properties: {...}`, or `$super: properties: {}` when the parent takes no parameters. |
| `calls base-web without "image", which base-web requires and gives no default` | A required parent parameter is not passed. | Pass it in `$super: properties`. |
| `calls base-web with parameters it will not accept` | `$super: properties` does not match the parent's `parameter` schema. | Fix the type of the value. |
| `block depends on what base-web produced` | `$super.properties` reads `$super.output` or another parent result. | Compute the value from `parameter` and `context` only. |
| `sets output.spec.replicas, which base-web already sets` | The child changes a field the parent sets from a parameter. | Pass the value through `$super: properties`. |
| `but base-web fixes it to "Deployment" and a child cannot change it` | The child changes a constant the parent sets. | Write a separate definition that does not extend the parent. |
| `` `$inherit: false` is not allowed ``, `` `$inherit: {output: false}` is not allowed ``, `leave out one output at a time` | The child tries to replace the parent. | Use `$inherit: {outputs: {<name>: false}}` for single outputs, or write a separate definition. |
| `adds to output.spec.template.spec.securityContext, which base-web marks +final` | The child adds to a `+final` field. | Remove the change. If you need it, ask the parent's owner. |
| `which base-web sets only when ...` | The child writes a field the parent sets only under a condition. | Pass a default to the parent through `$super: properties` instead. |
| `+final cannot be enforced on a field inside a list item` | The definition marks a field inside a list item `+final`. | Mark the list field itself. That locks the whole list. |
| `leaves out outputs.svc, which base-web marks +required` | The child drops a `+required` output. | Keep the output. You can add fields to it. |
| `leaves out outputs.netpol, which the healthPolicy it inherits from base-web reads` | An inherited status reads the dropped output. | Keep the output, or take over the status (`$inherit: false` for `healthPolicy` and `details`, your own `message` for `customStatus`). |
| `declares workload apps/v1 StatefulSet, but base-web declares apps/v1 Deployment` (or `renders`) | The child declares a different workload. | Leave `spec.workload` unset. |
| `merging its output onto base-web's: ... incompatible list lengths` | The child appends items to a list that the parent rendered. | Add fields to the existing items only, or pass the value through a parent parameter. |
| `is abstract and cannot be used directly` | An Application names an abstract definition. | Use a definition that extends it. |
| `a definition may only extend one in its own namespace` | Parent and child are in different namespaces. | Put both definitions in the same namespace. |
| `is already in its own inheritance chain` | The chain has a cycle. | Change `spec.extends` so that no definition extends itself. |
| `would make the inheritance chain deeper than 8` | The chain is too long. | Flatten the chain. |
| `which has no CUE template; only CUE definitions can be extended` | The parent is not a CUE definition. | Extend a CUE definition. |
| `immutable parameter storageClass cannot be changed` | An Application update changes a parent `+immutable` parameter through the child. | Keep the value. See [Parameter Markers](./parameter-markers.md#bypassing-immutability). |
| `not found in app revision` | The ApplicationRevision was created before the definition extended a parent, so the ancestors were not recorded. | Update the Application so that a new revision is created. |

