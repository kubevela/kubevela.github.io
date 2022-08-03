---
title: Built-in Policy Type
---

This documentation will walk through all the built-in policy types sorted alphabetically.

> It was generated automatically by [scripts](../../contributor/cli-ref-doc), please don't update manually, last updated at 2022-07-24T21:01:20+08:00.

## Apply-Once

### Description

Allow configuration drift for applied resources, delivery the resource without continuously reconciliation.

### Examples (apply-once)

It's generally used in [one time delivery only without continuous management](https://kubevela.io/docs/end-user/policies/apply-once) scenario.

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
        image: oamdev/hello-world
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

### Specification (apply-once)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 enable | Whether to enable apply-once for the whole application. | bool | false | false 
 rules | Specify the rules for configuring apply-once policy in resource level. | [[]rules](#rules-apply-once) | false |  


#### rules (apply-once)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 selector | Specify how to select the targets of the rule. | [selector](#selector-apply-once) | false |  
 strategy | Specify the strategy for configuring the resource level configuration drift behaviour. | [strategy](#strategy-apply-once) | true |  


##### selector (apply-once)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 componentNames | Select resources by component names. | []string | false |  
 componentTypes | Select resources by component types. | []string | false |  
 oamTypes | Select resources by oamTypes (COMPONENT or TRAIT). | []string | false |  
 traitTypes | Select resources by trait types. | []string | false |  
 resourceTypes | Select resources by resource types (like Deployment). | []string | false |  
 resourceNames | Select resources by their names. | []string | false |  


##### strategy (apply-once)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | Specify the path of the resource that allow configuration drift. | []string | true |  


## Garbage-Collect

### Description

Configure the garbage collect behaviour for the application.

### Examples (garbage-collect)

It's used in [garbage collection](https://kubevela.io/docs/end-user/policies/gc) scenario. It can be used to configure the collection policy, e.g. don't delete the legacy resources when updating.

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
        image: oamdev/hello-world
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
        image: oamdev/hello-world
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

### Specification (garbage-collect)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 keepLegacyResource | If is set, outdated versioned resourcetracker will not be recycled automatically, outdated resources will be kept until resourcetracker be deleted manually. | bool | false | false 
 rules | Specify the list of rules to control gc strategy at resource level, if one resource is controlled by multiple rules, first rule will be used. | [[]rules](#rules-garbage-collect) | false |  


#### rules (garbage-collect)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 selector | Specify how to select the targets of the rule. | [[]selector](#selector-garbage-collect) | true |  
 strategy | Specify the strategy for target resource to recycle. | string | false | onAppUpdate 


##### selector (garbage-collect)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 componentNames | Select resources by component names. | []string | false |  
 componentTypes | Select resources by component types. | []string | false |  
 oamTypes | Select resources by oamTypes (COMPONENT or TRAIT). | []string | false |  
 traitTypes | Select resources by trait types. | []string | false |  
 resourceTypes | Select resources by resource types (like Deployment). | []string | false |  
 resourceNames | Select resources by their names. | []string | false |  


## Health

### Description

Apply periodical health checking to the application.

### Specification (health)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 probeTimeout | Specify health checking timeout(seconds), default 10s. | int | false | 10 
 probeInterval | Specify health checking interval(seconds), default 30s. | int | false | 30 


## Override

### Description

Describe the configuration to override when deploying resources, it only works with specified `deploy` step in workflow.

### Examples (override)

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

### Specification (override)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 components | Specify the overridden component configuration. | [[]components](#components-override) | true |  
 selector | Specify a list of component names to use, if empty, all components will be selected. | []string | false |  


#### components (override)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of the patch component, if empty, all components will be merged. | string | false |  
 type | Specify the type of the patch component. | string | false |  
 properties | Specify the properties to override. | map[string]:(null\|bool\|string\|bytes\|{...}\|[...]\|number) | false |  
 traits | Specify the traits to override. | [[]traits](#traits-override) | false |  


##### traits (override)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type | Specify the type of the trait to be patched. | string | true |  
 properties | Specify the properties to override. | map[string]:(null\|bool\|string\|bytes\|{...}\|[...]\|number) | false |  
 disable | Specify if the trait should be remove, default false. | bool | false | false 


## Topology

### Description

Describe the destination where components should be deployed to.

### Examples (topology)

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

### Specification (topology)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 cluster | Specify the names of the clusters to select. | []string | false |  
 clusterLabelSelector | Specify the label selector for clusters. | map[string]:string | false |  
 clusterSelector | Deprecated: Use clusterLabelSelector instead. | map[string]:string | false |  
 namespace | Specify the target namespace to deploy in the selected clusters, default inherit the original namespace. | string | false |  


