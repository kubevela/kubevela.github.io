---
title: Sources
---

:::caution
SourceDefinition and `$( )` property expressions are alpha features. Both are disabled by default and must be turned on with feature gates, see [Enable the feature](#enable-the-feature).
:::

Applications often need data that lives somewhere else: a registry address in a ConfigMap, the owner label on a namespace, a file in a Git registry, the health of another Application. Today you fetch that data with workflow steps and pass it along by hand, so application authors have to know where the data comes from and how to move it.

A **SourceDefinition** removes that work. A platform engineer declares how to fetch a piece of data, what shape it has, and how long it can be cached. An application author names the source, and writes an expression wherever the value should go. The platform controls *how* and *when* the data is fetched. The application author controls *what* they need and *where* it goes.

## How it works

Four pieces take part:

| Layer | Object | Written by | Responsibility |
|---|---|---|---|
| Definition | `SourceDefinition` | Platform engineer | Declares the output schema, the cache policy and the fetch logic |
| Binding | `spec.sources[]` in an Application | Application author | Names a SourceDefinition, gives it a local name and supplies its properties |
| Resolution | `Config` | Controller | Serves a cached value, or runs the fetch logic and stores the result |
| Consumption | `$( )` expression | Application author | Puts a resolved value into a property of a component, trait, workflow step or policy |

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: checkout
  annotations:
    app.oam.dev/cel-expressions: "true"
spec:
  sources:
    - name: registry               # local name, used in expressions
      type: platform-registry      # the SourceDefinition
  components:
    - name: api
      type: webservice
      properties:
        image: '$(source.registry.host + "/api:1.4.0")'
```

When the controller renders the `api` component it does the following:

1. It finds the expression and works out that `registry` is needed.
2. It computes the cache key for `platform-registry` and looks for a fresh cached value.
3. Only on a cache miss, or when the cached value has expired, it runs the definition's fetch logic and stores the result.
4. It substitutes the resolved value into `image`, then renders the component with concrete values.

The component's own template never fetches anything. It receives a plain string.

Admission checks the binding before anything is fetched. Every expression must name a field the source declares, and the type of the expression must fit the parameter it feeds. See [Using sources](./using-sources.md#what-admission-checks).

## Enable the feature

Expressions are off by default. `$(VAR_NAME)` is also Kubernetes' own syntax for a dependent environment variable in `env`, `command` and `args`. If expressions were read everywhere, an existing Application using that form would be refused. Two feature gates therefore give three states:

| State | `EnableCelExpressions` | `RequireCelExpressionOptIn` | Expressions are read in |
|---|---|---|---|
| Off (default) | `false` | n/a | no Application |
| Opt-in | `true` | `true` (default) | Applications annotated `app.oam.dev/cel-expressions: "true"` |
| On | `true` | `false` | every Application |

Set them through the chart:

```shell
helm upgrade --install vela-core kubevela/vela-core \
  -n vela-system --create-namespace \
  --set featureGates.enableCelExpressions=true
```

Or pass `--feature-gates=EnableCelExpressions=true` to the controller, see [Feature Gates](../system-operation/bootstrap-parameters.md#feature-gates).

Opt-in mode is meant for a gradual rollout. Enable the feature, let each team annotate the Applications it has checked for `$(VAR)` strings, and set `featureGates.requireCelExpressionOptIn=false` only after every Application has been reviewed.

Two more gates affect sources and policies:

| Gate | Default | Effect |
|---|---|---|
| `EnableSourceAutoUpdate` | `false` | Default for [`spec.sources[].autoUpdate`](./using-sources.md#re-dispatch-when-a-value-changes) |
| `EnableApplicationScopedPolicies` | `false` | Required for all Application-scoped policy functionality |

## Sources that ship with KubeVela

Eight SourceDefinitions are installed with `vela-core`, so most Applications do not need to author one. See [Built-in sources](./built-in-sources.md).

## Next

- [Using sources](./using-sources.md): bind a source and write expressions, for application authors.
- [Built-in sources](./built-in-sources.md): the sources that ship with the chart.
- [Authoring a SourceDefinition](./authoring-source-definition.md): write your own, for platform engineers.
- [Caching and operations](./caching-and-operations.md): freshness, stale data, status and the CLI.
