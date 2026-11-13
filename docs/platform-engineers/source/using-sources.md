---
title: Using Sources
---

This page is for application authors. It shows how to bind a [SourceDefinition](./intro.md) to an Application and use its values in properties. Make sure [expressions are enabled](./intro.md#enable-the-feature) and that your Application carries the `app.oam.dev/cel-expressions: "true"` annotation if the cluster runs in opt-in mode.

## Bind a source

Declare each source you need under `spec.sources`:

```yaml
spec:
  sources:
    - name: settings
      type: configmap-local
      properties:
        name: app-settings
```

| Field | Description |
|---|---|
| `name` | Local name. Plain identifiers use `source.<name>`. A name with punctuation uses bracket syntax, for example `source["cluster-info"]`. |
| `type` | Name of the SourceDefinition. Pin a revision with `type: cluster-config-reader@v1`, see [Versioning](./authoring-source-definition.md#versioning). |
| `properties` | Inputs for the definition. They can themselves contain expressions that read earlier sources, see [Chain sources](#chain-sources). |
| `autoUpdate` | Re-dispatch components when the resolved value changes, see [below](#re-dispatch-when-a-value-changes). |
| `statusPolicy` | Hide values from the Application status, see [below](#control-what-status-records). |

Binding a source fetches nothing by itself. A source is only resolved when a component, trait, workflow step or policy reads it, and a source nothing reads is reported as `Unused`.

You never reference the ConfigMap, URL or API the source reads. That is the definition's business.

## Write expressions

A property value written as `$( ... )` is an expression in [CEL](https://github.com/google/cel-spec), the same language Kubernetes uses in CRD validation rules and admission policies. Expressions can read two roots: `source` and `context`.

```yaml
components:
  - name: api
    type: webservice
    properties:
      image:     '$(source.catalog.image + ":1.25.0")'     # string concatenation
      replicas:  '$(source.tenant.maxReplicas / 2)'        # integer arithmetic
      port:      '$(source.catalog.httpPort)'              # stays an integer
      labels:    '$(source.catalog.standardLabels)'        # a whole object
      mirror:    '$(has(source.registry.mirror) ? source.registry.mirror : "none")'
      owner:     '$(context.appName + "." + context.namespace)'
      healthUrl: 'https://$(source.registry.host)/health'  # embedded in text
```

- A value that is only an expression keeps its type. An integer stays an integer, and an object or list is substituted whole.
- An expression embedded in other text is converted to a string. Only scalar values can be embedded.
- Write `$$(` to get a literal `$(`.
- Expressions are found at any depth inside `properties`, including nested objects and list items.
- The function set is the CEL standard library plus the strings and lists extensions: `has`, `all`, `exists`, `map`, `filter`, `split`, `join`, `replace`, `substring`, `trim`, `indexOf`, `lowerAscii`, list indexing and `slice`, and the `int`, `string`, `double` and `bool` conversions.
- Any identifier other than `source` and `context` is rejected, so `$(parameter.image)` does not compile.

### Optional fields

A source declares each output field as required or optional. An optional field may be missing at runtime. If it feeds a parameter that is required, you must guard it:

```yaml
region: '$(has(source.clusterInfo.region) ? source.clusterInfo.region : "us-east-1")'
```

| Source field | Target parameter | Guard needed |
|---|---|---|
| Required | Required or optional | No |
| Optional | Required | **Yes**, admission rejects the Application without one |
| Optional | Optional | No, an absent field omits the parameter |

A guard is not a fallback for fetch failures. Those are governed by the definition's [`onStaleFailure`](./caching-and-operations.md#when-a-refresh-fails).

## Where expressions can be used

| Surface | `source` | `context` |
|---|---|---|
| Component properties | yes | yes |
| Trait properties | yes | yes |
| `spec.sources[].properties` of a later source | yes | yes |
| Workflow step properties | yes | yes |
| Policy with a CUE template | yes | yes |
| Built-in policy (`topology`, `override`, ...) | no | yes |
| Application-scoped policy | no | yes |

Built-in policies read their properties directly, and Application-scoped policies render before the Application's sources are parsed, so neither can resolve a source. Reading `source` there is refused with a message rather than silently ignored:

```text
"source" cannot be read here; this surface permits "context"
```

A source can also be limited by what it reads. A source keyed on `context.componentName` cannot be read from a workflow step, because no component is being rendered there. Admission reports this for each binding.

## Chain sources

A source's `properties` can read sources declared **before** it:

```yaml
spec:
  sources:
    - name: registry
      type: platform-registry
    - name: tenant
      type: tenant-profile
    - name: catalog                       # fed by the two sources above
      type: service-catalog
      properties:
        registryHost: '$(source.registry.host)'
        team:         '$(source.tenant.team)'
        component:    nginx
```

Sources are processed in declaration order, and a source may only read one declared earlier. A reference to itself or to a later source is rejected at admission, so there are no cycles. Resolution is lazy and follows the chain: if a component reads `catalog`, the controller resolves `registry` and `tenant` first, even though the component never mentions them.

## What admission checks

The Application webhook checks every binding before anything is fetched. Nothing is resolved, and no external call is made, for these checks:

| You write | Rejected with |
|---|---|
| `port: '$(source.catalog.image)'` | *type mismatch: ... is string but component "webservice" parameter expects int* |
| `image: '$(source.catalog.standardLabels)'` | *... is object but ... expects string* |
| `image: '$(source.catalog.standardLabels)-x'` | *cannot be combined with text* |
| `image: '$(source.registry.mirror)'`, where `mirror` is optional | *may be absent and feeds required ... guard it with `has(...) ? ... : <fallback>`* |
| `image: '$(source.registry.nope)'` | *path "nope" is not declared in schema of SourceDefinition ...* |
| `image: '$(parameter.image)'` | *undeclared reference to 'parameter'* |
| `image: '$(source.my-source.x)'` | the dot form parses the hyphens as subtraction; use `$(source["my-source"].x)` |

Admission also checks that the SourceDefinition exists and that your `properties` match its parameters. When the operator enables the `ValidateDefinitionPermissions` gate (chart value `authorization.definitionValidationEnabled=true`), it also uses a `SubjectAccessReview` to check that you may `get` every SourceDefinition you bind. That permission check is disabled by default.

Admission checks the **type** an expression produces, never the value. A `> 0` bound on a parameter is enforced when the value is rendered, because the value can change on a later reconcile with no admission event to catch it.

Soundness checks run first. Only when they pass does the webhook try a validation render. That render uses types from each source's schema rather than fetching source values, so a type error is reported once, against the property that caused it, without making an external call.

## Re-dispatch when a value changes

By default a component is re-applied when its own spec changes. With `autoUpdate: true` on a binding, a component that read the source is also re-dispatched when the source resolves to a different value, even though the Application is unchanged.

```yaml
sources:
  - name: registry
    type: platform-registry
    autoUpdate: true      # pick up a new registry address immediately
  - name: flags
    type: feature-flags
    autoUpdate: false     # wait for the next rollout
```

If `autoUpdate` is unset, the controller-wide `EnableSourceAutoUpdate` gate decides. An `app.oam.dev/publishVersion` pin suppresses that gate-derived default, but an explicit `autoUpdate: true` keeps the binding live under the pin. Re-dispatch happens on reconcile, so a change can take until the next reconcile to show.

## Control what status records

The Application status records which values each consumer took. Fields the definition marks `// +sensitive` are always redacted. Use `statusPolicy` to hide more:

```yaml
sources:
  - name: db
    type: db-config
    statusPolicy:
      maskPaths: [password, "tls.key"]   # replaced with *** wherever they appear
      exposeConsumedValues: false        # omit every value, keep the property names
```

| Field | Unset | Effect |
|---|---|---|
| `maskPaths` | nothing masked beyond `+sensitive` | The path, and anything under it, is reported as `***` |
| `exposeConsumedValues` | values are exposed | `false` omits `value` entirely and keeps `property` and `sourceAttr` |

The two settings are independent. Neither changes what the workload receives. `status` is not a security boundary. When definition permission validation is enabled, RBAC on the SourceDefinition controls who may bind it; otherwise operators must control Application writes and the controller's own reach.

## Inspect what happened

```bash
vela status <app> --sources
```

lists each binding with its resolutions and consumers. The `--component` and `--cluster` flags filter the output, and `-o yaml|json|jsonpath` is available for scripts. The raw data is in `status.sources[]`, see [Application status](./caching-and-operations.md#application-status).
