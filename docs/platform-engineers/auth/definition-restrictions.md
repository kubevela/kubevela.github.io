---
title: Restricting Definitions by Namespace
---

A definition installed in `vela-system` can be used by every Application in the cluster. That keeps the built-in definitions convenient, but it gives you no way to say "this component type is for the platform team" or "this trait is for tenant namespaces only".

`spec.restrictions` lets a definition author state two constraints on the definition itself, once, without maintaining a matching RoleBinding for each tenant:

- Where it may be used: which namespaces' Applications may use the definition at all (`namespaces`, `namespaceSelector`).
- How much it may be used: how many components or traits of that type one namespace may hold (`quota`).

Restrictions are available on `ComponentDefinition`, `TraitDefinition`, `PolicyDefinition`, `WorkflowStepDefinition` and `SourceDefinition`. A quota applies to `ComponentDefinition` and `TraitDefinition` only.

:::note
Restrictions gate on where an Application lives. To gate on who submits it, see [X-Definition Permission Validation](./definition-rbac.md). The two work together.
:::

## Restricting Which Namespaces May Use a Definition

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: internal-db
  namespace: vela-system
spec:
  restrictions:
    namespaces: ["vela-system", "tenant-*"]   # names or globs
    namespaceSelector:                         # or by namespace label
      matchLabels:
        tenant: "true"
  # ...
```

| Field | Description |
|-------|-------------|
| `namespaces` | Namespace names or globs, matched with Go's [`path.Match`](https://pkg.go.dev/path#Match) (for example `tenant-*`). |
| `namespaceSelector` | A standard Kubernetes label selector, matched against the Application's namespace labels. An empty selector matches every namespace; leave the field unset to express no opinion. |

A namespace is allowed if either field matches, so "these labelled namespaces, and also `vela-system`" is expressible. When `restrictions` is absent or empty, the definition is unrestricted, so existing definitions are unaffected.

:::tip
A selector matches on labels, so anyone who can label a namespace can bring it into scope. A name glob needs the right to create a namespace with that name. Pick the one that fits who you trust to manage namespaces.
:::

### Three Ways to Declare a Restriction

The right channel depends on who owns the definition.

| Definition | Channel |
|------------|---------|
| One you own | `spec.restrictions`, or `attributes.restrictions` in CUE |
| One you do not own | The `definition.oam.dev/restrict-namespaces` annotation (names only) |
| A built-in that the Helm chart ships | `definitionRestrictions` in the chart values |

#### In the definition spec or CUE

In a CUE definition, put the block under `attributes`:

```cue
"internal-db": {
	attributes: {
		restrictions: {
			namespaces: ["vela-system", "tenant-*"]
			namespaceSelector: matchLabels: tenant: "true"
		}
	}
	description: "A database only tenants may use"
	type: "component"
}
```

Apply it with `vela def apply` as usual. Use a v1.12 or later `vela` CLI. Older CLIs reject the field with `unknown field "restrictions"`.

#### With an annotation

When you cannot edit the spec, annotate the definition with a comma-separated list of names or globs:

```bash
kubectl annotate componentdefinition internal-db -n vela-system \
  definition.oam.dev/restrict-namespaces="vela-system,tenant-*"
```

The annotation accepts names and globs only. Restricting by namespace label is `spec.restrictions.namespaceSelector` and nothing else. If both channels name namespaces, the spec wins.

#### For built-in definitions

The built-in definitions are regenerated on every upgrade, so annotating or editing `webservice` in the cluster does not survive an upgrade. Only the chart values form persists. Declare the restriction in the Helm values instead:

```yaml
definitionRestrictions:
  default:                                 # applied to every built-in
    namespaces: ["vela-system", "tenant-*"]
  overrides:                               # per definition name, replaces the default
    k8s-objects:
      namespaces: ["vela-system"]
    webservice:
      namespaceSelector:
        matchLabels:
          tenant: "true"
```

`default` applies to every built-in definition. An entry under `overrides` replaces the default for the definition it names. Both take the same shape as `spec.restrictions`.

:::warning
A `default` that excludes `vela-system` breaks addon installation. Addons install their own Applications into `vela-system` using the built-in definitions, so keep `vela-system` in any `default` you set.
:::

### What Users See

An Application that uses a restricted definition from a namespace that does not match is rejected when it is created or updated:

```text
"spec.components[0].type": ComponentDefinition "webservice" is restricted and
cannot be used from namespace "default".
```

The message does not say which namespaces or labels the restriction allows. Someone who cannot use the definition has no need to learn how the cluster is organized. An operator can find the detail in the controller log, for example `allowed for namespaces [tenant-bronze]`.

### Behavior to Know About

- Restrictions are checked at admission, not at render time. An Application admitted before a restriction existed keeps reconciling and keeps its workloads, because breaking a running Application over a policy change its author did not make would be the worse failure. Restrictions are also checked on update, so such an Application is frozen: the next edit to it is rejected.
- The restriction is always read from the live definition, never from a `DefinitionRevision`. A pinned `webservice@v1` still renders from its frozen revision, but adding a restriction to `webservice` applies to it immediately, and removing one lifts it immediately.
- Invalid restrictions are rejected when the definition is written. A glob that `path.Match` rejects or a selector that does not compile fails at write time rather than silently matching nothing.

## Limiting How Much a Definition May Be Used

`spec.restrictions.quota` caps how many components of a type, or traits of a type, one namespace may contain. The cap can differ by namespace class.

```yaml
spec:
  restrictions:
    namespaces: ["tenant-*"]          # who may use it at all
    quota:                            # how much they may use it
      - namespaceSelector:
          matchLabels:
            tier: gold
        warn: 16
        limit: 20
      - namespaceSelector:
          matchLabels:
            tier: bronze
        warn: 2
        limit: 3
      - warn: 5                       # no matcher and no limit: advisory everywhere else
```

### Thresholds

Each entry has two optional thresholds, and at least one must be set:

| Field | Behavior |
|-------|----------|
| `warn` | At or above this count, the Application is admitted with an admission warning. |
| `limit` | Above this count, the Application is refused. `0` forbids the type outright. |

| Set | Behavior |
|-----|----------|
| `limit` only | Silent until refusal. |
| `warn` only | Never refuses. Use it to roll out a quota before enforcing it. |
| both | Warns approaching the limit, refuses past it. |
| neither | Invalid, rejected when the definition is written. |

A `limit` lower than `warn` is also rejected, since it would refuse before it ever warned.

### Choosing the Entry for a Namespace

Each entry takes the same matchers as the parent block, `namespaces` (names or globs) and `namespaceSelector`, and either one matching selects the entry. The first matching entry applies, and an entry with no matcher matches every namespace. Put that default entry last. An entry placed after it is unreachable, and the definition is rejected.

A namespace that matches no entry has no quota.

### What Is Counted

- Components are counted per definition type. A namespace's count is the number of uses of that definition across all Applications in the namespace.
- A trait counts once for each component it is attached to. One trait on two components counts twice, and so do two components of the same type in one Application.
- A pinned version counts against its definition. `webservice@v1` counts as a use of `webservice`.
- Updating an Application does not count its stored copy alongside the new one, so an Application at the limit can still be edited.
- Only `ComponentDefinition` and `TraitDefinition` are counted. A quota on a policy, workflow step or source definition is rejected when the definition is written, because a quota that silently does nothing is worse than one that will not apply.
- The system namespace (`vela-system`) is never subject to a quota. Addons install their own Applications there using these definitions.

### What Users See

An Application that would take the namespace over `limit` is refused. The error lists each component of that type in the Application, not only the one that crossed the limit:

```text
"spec.components[2].type": this would exceed the quota for component type
"webservice" in namespace "tenant-a".
```

An Application at or above `warn` but within `limit` is admitted, and `kubectl` prints a warning. The warning names the type and labels each number:

| Case | Warning |
|------|---------|
| Below the limit | `component type "webservice" in namespace "tenant-a" is near its quota: used 3, warn 3, limit 5` |
| At the limit | `component type "webservice" in namespace "tenant-a" is at its quota: used 5, limit 5; more uses will be refused` |
| `warn` only | `component type "webservice" in namespace "tenant-a" is over its warn level: used 5, warn 3, no limit` |
| Edit of an Application in a namespace already over the limit | `component type "webservice" in namespace "tenant-a" is over its quota: used 4, limit 2; edit allowed, adds no uses` |

A trait quota reads the same with `trait type`. Editing an Application that already sits over a lowered limit is admitted as long as the edit adds no uses.

:::note
Counting is not transactional. Admission counts the Applications it can see, so two Applications admitted at the same moment can each see the same count and together pass the limit. Treat a quota as a guard rail, not a hard guarantee under concurrent writes. An unsharded controller counts from its cache. A sharded controller counts with a live read, because the webhook runs on the master and a shard's cache holds only part of the namespace.
:::

### Lifting Quotas for a Namespace

During an incident, you can lift every quota for one namespace by annotating it:

```bash
kubectl annotate namespace tenant-a definition.oam.dev/quota-exempt="true"
```

Only the exact value `true` counts, so a typo leaves the quota in force. Namespaces are cluster scoped, so setting this needs cluster-level RBAC. Each use is logged. It is meant for getting out of the way of an incident rather than carving out a permanent exception, and it lifts quotas only: a namespace cannot change which definitions it may use.

### Quotas for Built-in Definitions

The Helm `definitionRestrictions` value carries a quota the same way:

```yaml
definitionRestrictions:
  overrides:
    webservice:
      namespaceSelector:
        matchLabels:
          tenant: "true"
      quota:
        - namespaceSelector:
            matchLabels:
              tier: gold
          warn: 16
          limit: 20
        - warn: 5          # default entry, last
```

The built-ins include policies, workflow steps and sources, which reject a quota. A quota therefore belongs under `overrides` and must name a component or a trait. Naming anything else, or putting a quota in `default` where it would reach every built-in, fails the install at template time rather than partway through applying definitions.

## Enabling and Disabling

Enforcement is controlled by the `RestrictDefinitionNamespaces` feature gate. It is Beta and on by default, and does nothing until a definition declares a restriction, so upgrading changes nothing for existing clusters. The gate exists to switch enforcement off:

```bash
helm upgrade --install kubevela kubevela/vela-core \
  --namespace vela-system \
  --set featureGates.restrictDefinitionNamespaces=false \
  --wait
```

For non-Helm deployments:

```bash
--feature-gates=RestrictDefinitionNamespaces=false
```

## Effect on CLI Listings

`vela def list`, `vela components` and `vela traits` leave out definitions that the namespace you are working in cannot use. There is no flag to show them. This reduces noise and is not a secrecy boundary: definitions and their restrictions remain readable with `kubectl` for anyone with the RBAC. `vela def get <name>` is unchanged, since hiding something asked for by name reads as a bug rather than a policy.

`vela def list` also looks in a different place by default. With no `--namespace`, it used to list the system namespace. It now looks where a definition is resolved from at render time: the namespace you are working in (`default` if none is set), then the system namespace. `--type`, `--from` and `--namespace` are unchanged, and `--namespace` still scopes the listing to one namespace. To keep the previous behavior in a script, pin it with `-n vela-system`.

## Related Documentation

- [X-Definition Permission Validation](./definition-rbac.md)
- [X-Definitions](../oam/x-definition.md)
- [Bootstrap Parameters](../system-operation/bootstrap-parameters.md)
- [`vela def list`](../../cli/vela_def_list.md)
