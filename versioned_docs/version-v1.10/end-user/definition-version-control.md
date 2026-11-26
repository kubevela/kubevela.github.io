---
title: Definition Version Control
---

## Introduction
KubeVela supports Semantic Versioning for all types of [Definitions](../getting-started/definition), providing control over which versions of Definitions are used in Applications. This feature enables to specify exact version or version range for Definitions, enforce Semantic Versioning, and manage automatic upgrades of Definitions within KubeVela Applications.

## Feature Overview
1. Semantic Versioning for Definition

Definition versions are defined using Semantic Versioning, which follows the format MAJOR.MINOR.PATCH. This ensures control over how components evolve.

2. Auto-Upgrade Control

KubeVela allows control over whether Applications automatically upgrade to newer Definition versions when they are available. The `app.oam.dev/autoUpdate` annotation is used to enable or disable auto-upgrade behavior.

  - Auto-update enabled: The application automatically uses the latest compatible version of a Definition.
  - Auto-update disabled: The application sticks to the specified version even if a new version of the Definition is released.

3. Version Range Control

You can specify either an exact version or a version range for Definition in your application. If a version range is used, KubeVela will select the latest version that fits within the range.

Version ranges (`@v1`, `@v1.2`) only work when the Application sets `app.oam.dev/autoUpdate: "true"`. Without it, KubeVela looks for a revision with exactly that name, so give the full version, such as `configmap-component@v1.2.5`.

## User Guide

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

## Adding a `version` Field in CUE-based Definitions

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
