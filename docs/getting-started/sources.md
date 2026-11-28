---
title: Read External Data with Sources
---

:::note
Sources are new in KubeVela 1.12 and in alpha. They are off by default, so this page starts by switching them on. Everything else in Getting Started works without them.
:::

An application often needs a value it doesn't own: a registry chosen by the platform team, a setting that differs per cluster, an endpoint someone else runs. Copy it into the Application and the copy goes stale the day the value moves. A **source** reads it when the Application renders instead, so the Application says where the value comes from rather than carrying a copy.

This guide keeps an application's environment name and replica count in a ConfigMap, reads them with a source, then changes the ConfigMap and watches the application follow.

It follows on from [Deploy an Advanced Application](./advanced-application.md).

## Switch on property expressions

A source is read with a property expression, `$( )`, and expressions are behind the `enableCelExpressions` feature gate. Turn it on for your KubeVela installation (VelaD and `vela install` both name it `kubevela`):

```bash
helm upgrade kubevela kubevela/vela-core -n vela-system --version 1.12.0 --reset-then-reuse-values \
  --set featureGates.enableCelExpressions=true --wait
```

`--reset-then-reuse-values` (Helm 3.14+) keeps the values you set yourself and takes the rest from the chart. Avoid plain `--reuse-values` on 1.12: it can fail, or leave vela-core on an older image.

Check the controller has picked it up:

```bash
kubectl get configmap kubevela-feature-gates -n vela-system -o yaml | grep Cel
```

```console
  EnableCelExpressions: "true"
  RequireCelExpressionOptIn: "true"
```

`RequireCelExpressionOptIn` means each Application still has to ask for expressions with an annotation, so turning the gate on changes nothing for applications that already exist.

## Create the settings

The platform's settings for this namespace live in a ConfigMap:

```bash
kubectl create configmap platform-settings -n default \
  --from-literal=environment=staging \
  --from-literal=replicas=2
```

## Read them in an application

Save the following as `sources-app.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: sources-app
  annotations:
    app.oam.dev/cel-expressions: "true"
spec:
  sources:
    - name: settings
      type: configmap-local
      autoUpdate: true
      properties:
        name: platform-settings
  components:
    - name: backend-api
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true
        env:
          - name: APP_ENV
            value: "$(source.settings.data.environment)"
      traits:
        - type: scaler
          properties:
            replicas: "$(int(source.settings.data.replicas))"
```

| Part | What it does |
| --- | --- |
| `app.oam.dev/cel-expressions: "true"` | Opts this Application in to `$( )` expressions. |
| `sources` | Binds a source named `settings`, of the built-in `configmap-local` type, to the `platform-settings` ConfigMap in the Application's namespace. |
| `autoUpdate: true` | When the value read from the source changes, the components and traits that read it are updated, without running the workflow again. |
| `$(source.settings.data.environment)` | Reads the `environment` key from the ConfigMap's `data`. |
| `$(int(source.settings.data.replicas))` | ConfigMap values are always strings, so `int()` turns the replica count into the number `scaler` expects. |

`configmap-local` is one of the sources that ship with KubeVela. To see them all:

```bash
vela def list --type source
```

Deploy it:

```bash
vela up -f sources-app.yaml
```

## See what it read

```bash
vela status sources-app
```

<details>
<summary>expected output</summary>

```console
...
Services:

  - Name: backend-api
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:2/2
    Traits:
      Type: scaler
      Health: ✅

Sources:

  - Name: settings
    Type: configmap-local
    Healthy: ✅
    Instances:
      - configmap-local-local-default-53c9640ad6b6c1e4 ✅
    Consumers:
      - Name: backend-api
        Type: webservice (component)
```
</details>

Two replicas, from the ConfigMap. And the environment variable:

```bash
kubectl get deployment backend-api -o jsonpath='{.spec.template.spec.containers[0].env}'
```

```console
[{"name":"APP_ENV","value":"staging"}]
```

The Application's status records each value it read and where it went, which is handy when you need to know why a property has the value it has:

```bash
kubectl get application sources-app -o jsonpath='{.status.sources[0].consumedBy[0].values}'
```

```console
[{"property":"env[0].value","sourceAttr":"data.environment","value":"staging"},{"property":"replicas","sourceAttr":"data.replicas","value":"2"}]
```

## Change the settings

Now the platform team moves this namespace to production with more replicas. They change the ConfigMap; nobody touches the Application:

```bash
kubectl patch configmap platform-settings -n default --type merge \
  -p '{"data":{"environment":"production","replicas":"4"}}'
```

`configmap-local` keeps what it read for five minutes, so within five minutes the source reads the new values, and because of `autoUpdate`, the application follows:

```bash
kubectl get deployment backend-api -o jsonpath='{.spec.replicas} {.spec.template.spec.containers[0].env}'
```

```console
4 [{"name":"APP_ENV","value":"production"}]
```

How long a source keeps a value is set in its definition, so a source for a value that rarely changes can keep it for longer.

## Clean up

```bash
vela delete sources-app -n default -y
kubectl delete configmap platform-settings -n default
```

To switch expressions off again:

```bash
helm upgrade kubevela kubevela/vela-core -n vela-system --version 1.12.0 --reset-then-reuse-values \
  --set featureGates.enableCelExpressions=false --wait
```

## Troubleshooting

<details>
<summary>"source expressions are not enabled on this cluster"</summary>

The feature gate is off:

```console
error: cannot create object: admission webhook "validating.core.oam.dev.v1beta1.applications" denied the request:
  1) "spec.sources": source expressions are not enabled on this cluster; an operator enables them with the EnableCelExpressions feature gate.
```

Turn it on as in [Switch on property expressions](#switch-on-property-expressions).
</details>

<details>
<summary>"this Application has not opted in to source expressions"</summary>

The Application is missing the `app.oam.dev/cel-expressions: "true"` annotation:

```console
error: cannot create object: admission webhook "validating.core.oam.dev.v1beta1.applications" denied the request:
  1) "spec.sources": this Application has not opted in to source expressions; set the app.oam.dev/cel-expressions annotation to "true", ...
```

Add it under `metadata.annotations` and apply again.
</details>

<details>
<summary>The application doesn't pick up a changed value</summary>

- Give it five minutes: that's how long `configmap-local` keeps a value. The value is kept for the namespace, not for one Application, so if you run through this page again within five minutes, the new Application starts with the values from last time.
- Check the binding has `autoUpdate: true`. Without it, a changed value is used the next time the workflow runs, for example on your next `vela up` with a change.
- `vela status sources-app` shows whether the source is healthy.
</details>

## Next steps

- [Create Your First Component](./first-component.md): write your own component type.
- `vela def show configmap-local` shows what a source takes, what it returns and how long it keeps it.

{/* PENDING: link the Sources pages (using sources, the built-in sources, writing a SourceDefinition) once kubevela.github.io#1469 merges. */}
