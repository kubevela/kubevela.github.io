---
title: Definition Version Control
---

## Introduction
KubeVela supports Semantic Versioning for all types of [Definitions](../../../docs/getting-started/definition), providing control over which versions of Definitions are used in Applications. This feature enables to specify exact version or version range for Definitions, enforce Semantic Versioning, and manage automatic upgrades of Definitions within KubeVela Applications.

## Feature Overview
1. Semantic Versioning for Definition

Definition versions are defined using Semantic Versioning, which follows the format MAJOR.MINOR.PATCH. This ensures control over how components evolve.

2. Auto-Upgrade Control

KubeVela allows control over whether Applications automatically upgrade to newer Definition versions when they are available. The `app.oam.dev/autoUpdate` annotation is used to enable or disable auto-upgrade behavior.

  - Auto-update enabled: The application automatically uses the latest compatible version of a Definition.
  - Auto-update disabled: The application sticks to the specified version even if a new version of the Definition is released.

3. Version Range Control

You can specify either an exact version or a version range for Definition in your application. If a version range is used, KubeVela will select the latest version that fits within the range.

```
Note: If `app.oam.dev/autoUpdate annotation` is set to `false` or not specified in application, the application will use explicitly specified specified or latest component version. 
```

## User Guide
1. Create a `configmap-component` ComponentDefinition with `1.2.5` version 
```
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: configmap-component
  namespace: vela-system
spec:
  version: 1.2.5 # Specify the component version using Semantic Versioning
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "v1"
        	kind:       "ConfigMap"
        	metadata: {
        		name:      "comptest"
        	}
        	data: {
            version: "125"
        	}
        }

  workload:
    definition:
      apiVersion: v1
      kind: ConfigMap
```

2. Create a `configmap-component` ComponentDefinition with `2.0.5` version
```
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: configmap-component
  namespace: vela-system
spec:
  version: 2.5.0 # Specify the component version using Semantic Versioning
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "v1"
        	kind:       "ConfigMap"
        	metadata: {
        		name:      "comptest"
        	}
        	data: {
            version: "250"
        	}
        }

  workload:
    definition:
      apiVersion: v1
      kind: ConfigMap
```
3. List the DefinitionRevisions. 
```
kubectl get definitionrevision -n vela-system | grep -i my-component
my-component-v1.2.5                1          1a4f3ac77e4fcfef   Component
my-component-v2.5.0                2          e61e9b5e55b01c2b   Component
```

4. Create Application using `configmap-component@v1.2` version and enable the Auto Update using `app.oam.dev/autoUpdate` annotation.
```
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-app
  namespace: test
  annotations:
    app.oam.dev/autoUpdate: "true" # Enable automatic upgrades
spec:
  components:
    - name: test-configmap
      type: my-component@v1 # Use the latest version in the 'v1' range
```

    Expected Behavior:
    - Application will use `configmap-component@v1.2.5`, as `1.2.5` is highest version in specified range(`1`).

6. Create a `configmap-component` ComponentDefinition with `1.2.7` version 
```
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: configmap-component
  namespace: vela-system
spec:
  version: 1.2.7 # Specify the component version using Semantic Versioning
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "v1"
        	kind:       "ConfigMap"
        	metadata: {
        		name:      "comptest"
        	}
        	data: {
            version: "127"
        	}
        }

  workload:
    definition:
      apiVersion: v1
      kind: ConfigMap
```
    Expected Behavior:
    - After the Application is reconciled, it will use `configmap-component@v1.2.7`, as `1.2.7` is the latest version within the specified range (1).

7. List the DefinitionRevisions. 
```kubectl get definitionrevision -n vela-system | grep -i my-component
my-component-v1.2.5                1          1a4f3ac77e4fcfef   Component
my-component-v1.2.7                3          86d7fb1a36566dea   Component
my-component-v2.5.0                2          e61e9b5e55b01c2b   Component
````

## Adding a `version` Field in CUE-based Definitions
The version field should be placed directly under the spec section (i.e., spec.version). To enable semantic versioning in CUE based definitions, specify the version field under the attributes section in the .cue file.

Example:
```
"configmap-creater": {
    type: "component"
    attributes: {
        workload: definition: {
            apiVersion: "v1"
            kind:       "ConfigMap"
        }
        version: "1.1.1"
    }
}

template: {
    output: {
        apiVersion: "v1"
        kind:       "ConfigMap"
        metadata: {
            name: parameter.name
            namespace: context.namespace
        }
        data: parameter.data
    }

    parameter: {
        // +usage=Name of the ConfigMap.
        name: string
        // +usage=Data to be stored in the ConfigMap.
        data: [string]: string
    }
}
```
