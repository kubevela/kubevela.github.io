---
title: Definition Version Control
---

Every [definition](../getting-started/definition.md) (component, trait, policy, workflow step and source) keeps its history as DefinitionRevisions. An Application can pin a revision, so a change to the definition doesn't reach it, or follow a version range, so it picks up compatible releases.

## When to use this

You change a definition in a way that would break the Applications already using it. Publish it as a new major version: Applications pinned to `@v1` keep the old behaviour, and those with `autoUpdate` move only within their range.

## How revisions are named

KubeVela cuts a new DefinitionRevision each time a definition's content changes. Applying the same content again, or upgrading KubeVela, doesn't cut one.

| The definition sets | Revision names | Pin it in an Application as |
| --- | --- | --- |
| No `spec.version` | Numbered: `webservice-v1`, `webservice-v2`, ... | `webservice@v2` |
| `spec.version: 1.2.5` ([Semantic Versioning](https://semver.org/), `MAJOR.MINOR.PATCH`) | By version: `configmap-component-v1.2.5` | `configmap-component@v1.2.5` |

A definition can't set both `spec.version` and the `definitionrevision.oam.dev/name` annotation.

List a definition's revisions with `vela def get`:

```shell
vela def get webservice --revisions
```

```console
NAME      	REVISION	TYPE     	HASH
webservice	1       	Component	dfa072dac5088ed8
webservice	2       	Component	519e11eb7cbe9cdd
```

To read the parameters of one revision, pass its number to `vela show`:

```shell
vela show webservice --revision 1
```

## Choosing a revision in an Application

The `type` of a component, trait, policy or workflow step picks the revision:

| `type` | `app.oam.dev/autoUpdate` | What the Application uses |
| --- | --- | --- |
| `configmap-component` | any | The definition as it is now, each time the Application renders. |
| `configmap-component@v1.2.5` | unset or `"false"` | Exactly revision `configmap-component-v1.2.5`. |
| `configmap-component@v1` or `@v1.2` | `"true"` | The highest version in that range: `@v1` matches `1.x.x`, `@v1.2` matches `1.2.x`. |
| `configmap-component@v1` or `@v1.2` | unset or `"false"` | Refused, unless a revision is literally named `configmap-component-v1`. Ranges need `autoUpdate`. |

Without `autoUpdate`, give the full version. With it, a new revision in the range doesn't trigger the Application: it moves on the next periodic resync (every 5 minutes by default) or the next change to the Application.

The webhook refuses an Application that sets both `app.oam.dev/autoUpdate: "true"` and `app.oam.dev/publishVersion`. Use one or the other.

## Walkthrough

This publishes `configmap-component` at three versions and shows which one an Application with `autoUpdate` renders. Each version writes its own number into the ConfigMap, so you can read it back.

1. Create the namespace the Application runs in:

   ```shell
   kubectl create namespace test
   ```

2. Save this as `configmap-component-1.2.5.yaml` and apply it with `kubectl apply -f configmap-component-1.2.5.yaml`:

   ```yaml
   apiVersion: core.oam.dev/v1beta1
   kind: ComponentDefinition
   metadata:
     name: configmap-component
     namespace: vela-system
   spec:
     version: 1.2.5
     workload:
       definition:
         apiVersion: v1
         kind: ConfigMap
     schematic:
       cue:
         template: |
           output: {
             apiVersion: "v1"
             kind:       "ConfigMap"
             metadata: name: context.name
             data: version: "1.2.5"
           }
   ```

3. Publish version `2.5.0`, the breaking release. Apply the same file with `version: 2.5.0` and `data: version: "2.5.0"`:

   ```yaml
   apiVersion: core.oam.dev/v1beta1
   kind: ComponentDefinition
   metadata:
     name: configmap-component
     namespace: vela-system
   spec:
     version: 2.5.0
     workload:
       definition:
         apiVersion: v1
         kind: ConfigMap
     schematic:
       cue:
         template: |
           output: {
             apiVersion: "v1"
             kind:       "ConfigMap"
             metadata: name: context.name
             data: version: "2.5.0"
           }
   ```

4. List the revisions:

   ```shell
   kubectl get definitionrevision -n vela-system | grep configmap-component
   ```

   ```console
   configmap-component-v1.2.5   1          1a4f3ac77e4fcfef   Component
   configmap-component-v2.5.0   2          e61e9b5e55b01c2b   Component
   ```

5. Deploy an Application that follows the `v1` range:

   ```yaml
   apiVersion: core.oam.dev/v1beta1
   kind: Application
   metadata:
     name: test-app
     namespace: test
     annotations:
       app.oam.dev/autoUpdate: "true"
   spec:
     components:
       - name: comptest
         type: configmap-component@v1
   ```

   It renders `1.2.5`, the highest version in `v1`. `2.5.0` is outside the range:

   ```shell
   kubectl get cm comptest -n test -o jsonpath='{.data.version}'
   ```

   ```console
   1.2.5
   ```

6. Publish `1.2.7`, a fix inside the `v1` range. Apply the same definition again with `version: 1.2.7` and `data: version: "1.2.7"`.

   The Application moves to `1.2.7` on its next resync, up to 5 minutes later, or as soon as you change it. Then:

   ```shell
   kubectl get cm comptest -n test -o jsonpath='{.data.version}'
   ```

   ```console
   1.2.7
   ```

7. List the revisions again:

   ```shell
   kubectl get definitionrevision -n vela-system | grep configmap-component
   ```

   ```console
   configmap-component-v1.2.5   1          1a4f3ac77e4fcfef   Component
   configmap-component-v1.2.7   3          86d7fb1a36566dea   Component
   configmap-component-v2.5.0   2          e61e9b5e55b01c2b   Component
   ```

To clean up, run `kubectl delete application test-app -n test` and `kubectl delete componentdefinition configmap-component -n vela-system`.

## How long revisions are kept

vela-core keeps a limited number of unused revisions per definition, set by its `--definition-revision-limit` flag (the Helm chart's `definitionRevisionLimit`, 2 by default), and deletes the oldest beyond it. A revision that an Application pins with `@v...` is never deleted and doesn't count against the limit.

## Setting the version in a CUE definition

In a CUE definition, put `version` under `attributes`. Leave it out if you don't need semantic versions, and revisions are numbered instead.

```cue
"configmap-component": {
	type: "component"
	attributes: {
		workload: definition: {
			apiVersion: "v1"
			kind:       "ConfigMap"
		}
		version: "1.2.5"
	}
}

template: {
	output: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: name: parameter.name
		data: version: "1.2.5"
	}

	parameter: {
		// +usage=Name of the ConfigMap.
		name: string
	}
}
```

:::tip
To stop Applications from following a definition's latest content by accident, an admission webhook of your own can add a revision to any `type` that doesn't set one.
:::
