---
title: Built-in Policy Type
---

This documentation will walk through the built-in policies.

## apply-once

### Overview

Allow configuration drift for applied resources.

### Parameter

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------ |
|  enable   |  bool  |   If true, allow configuration drift.  |

### Example

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: apply-once-app
spec:
  components:
    - name: hello-world
      type: webservice
      properties:
        image: crccheck/hello-world
      traits:
        - type: scaler
          properties:
            replicas: 1
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
```

## garbage-collect

### Overview

Configure the garbage collection behaviour for the application.

### Parameter

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------ |
|  keepLegacyResource   |  bool  |   If true, outdated versioned resourcetracker will not be recycled automatically. Outdated resources will be kept until resourcetracker be deleted manually.  |
| rules | []GarbageCollectPolicyRule | A list of rules to control gc strategy at resource level, if one resource is controlled by multiple rules, first rule will be used. |

#### GarbageCollectPolicyRule

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------ |
| selector | GarbageCollectPolicyRuleSelector | Select the target resources of the rule. |
| strategy | String | The strategy for target resources to recycle. Available values: never, onAppDelete, onAppUpdate. |

#### GarbageCollectPolicyRuleSelector

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------ |
| componentNames | []String | Select target resources by component names. |
| componentTypes | []String | Select target resources by component types. |
| traitTypes | []String | Select target resources by trait types. |

### Example

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: ingress-1-20
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
  policies:
    - name: keep-legacy-resource
      type: garbage-collect
      properties:
        keepLegacyResource: true
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: garbage-collect-app
spec:
  components:
    - name: hello-world-new
      type: webservice
      properties:
        image: crccheck/hello-world
      traits:
        - type: expose
          properties:
            port: [8000]
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              traitTypes:
                - expose
            strategy: onAppDelete
```

## Override

### Overview

Describe the configuration to override when deploying resources.

### Parameter

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------ |
| components | []ComponentPatch | A list of component configurations to override. |
| selector | []String | A list of component names to use. If not set, all components will be used. |

#### ComponentPatch

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------ |
| name | string | The name of the component to override. If not set, it will match all components with the specified type. Can be used with wildcard * for fuzzy match. |
| type | String | The type of the component to override. If not set, all component types will be matched. |
| properties | Object | The component properties to merge. |
| traits | []TraitPatch | A list of trait configurations to override. |

#### TraitPatch

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------ |
| type | String | The type of the trait to override. |
| properties | Object | The trait properties to merge. |
| disable | bool | If trait, this trait will be removed. |

### Examples

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-with-override
  namespace: examples
spec:
  components:
    - name: nginx-with-override
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
    - name: override-nginx-legacy-image
      type: override
      properties:
        components:
          - name: nginx-with-override
            properties:
              image: nginx:1.20
    - name: override-high-availability
      type: override
      properties:
        components:
          - type: webservice
            traits:
              - type: scaler
                properties:
                  replicas: 3
  workflow:
    steps:
      - type: deploy
        name: deploy-local
        properties:
          policies: ["topology-local"]
      - type: deploy
        name: deploy-hangzhou
        properties:
          policies: ["topology-hangzhou-clusters", "override-nginx-legacy-image", "override-high-availability"]
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: advance-override
  namespace: examples
spec:
  components:
    - name: nginx-advance-override-legacy
      type: webservice
      properties:
        image: nginx:1.20
    - name: nginx-advance-override-latest
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
    - name: override-nginx-legacy
      type: override
      properties:
        selector: ["nginx-advance-override-legacy"]
    - name: override-nginx-latest
      type: override
      properties:
        selector: ["nginx-advance-override-latest", "nginx-advance-override-stable"]
        components:
          - name: nginx-advance-override-stable
            type: webservice
            properties:
              image: nginx:stable
  workflow:
    steps:
      - type: deploy
        name: deploy-local
        properties:
          policies: ["topology-local", "override-nginx-legacy"]
      - type: deploy
        name: deploy-hangzhou
        properties:
          policies: ["topology-hangzhou-clusters", "override-nginx-latest"]
```

## topology

### Overview

Describe the destination where components should be deployed to.

### Parameter

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------ |
| clusters |  []string | The names of the clusters to select. |
| clusterLabelSelector | mpa[string]string | The label selector for clusters. Exclusive to "clusters" |
| namespace | string | The target namespace to deploy in the selected clusters. If not set, components will inherit the original namespace. |

### Example

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: basic-topology
  namespace: examples
spec:
  components:
    - name: nginx-basic
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusters: ["hangzhou-1", "hangzhou-2"]
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: label-selector-topology
  namespace: examples
spec:
  components:
    - name: nginx-label-selector
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: local-ns-topology
  namespace: examples
spec:
  components:
    - name: nginx-local-ns
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
```