---
title: Built-in Policy Type
---

This documentation will walk through all the built-in policy types sorted alphabetically.

> It was generated automatically by [scripts](../../contributor/cli-ref-doc), please don't update manually, last updated at 2023-01-16T19:19:03+08:00.

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
 affect | When the strategy takes effect,e.g. onUpdate、onStateKeep. | string | false |  
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
 strategy | Specify the strategy for target resource to recycle. | "onAppUpdate" or "onAppDelete" or "never" | false | onAppUpdate 


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

### Examples (health)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app-rollout
  namespace: default
spec:
  components:
    - name: hello-world-server
      type: webservice
      properties:
        image: crccheck/hello-world
        ports: 
        - port: 8000
          expose: true
        type: webservice
  policies:
    - name: health-policy-demo
      type: health
      properties:
        probeInterval: 5
        probeTimeout: 10
```

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
 properties | Specify the properties to override. | map[string]_ | false |  
 traits | Specify the traits to override. | [[]traits](#traits-override) | false |  


##### traits (override)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type | Specify the type of the trait to be patched. | string | true |  
 properties | Specify the properties to override. | map[string]_ | false |  
 disable | Specify if the trait should be remove, default false. | bool | false | false 


## Read-Only

### Description

Configure the resources to be read-only in the application (no update / state-keep).

### Examples (read-only)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: read-only
spec:
  components:
    - name: busybox
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000000'
  policies:
    - type: read-only
      name: read-only
      properties:
        rules:
          - selector:
              resourceTypes: ["Deployment"]
```

### Specification (read-only)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 rules | Specify the list of rules to control read only strategy at resource level. | [[]rules](#rules-read-only) | false |  


#### rules (read-only)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 selector | Specify how to select the targets of the rule. | [[]selector](#selector-read-only) | true |  


##### selector (read-only)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 componentNames | Select resources by component names. | []string | false |  
 componentTypes | Select resources by component types. | []string | false |  
 oamTypes | Select resources by oamTypes (COMPONENT or TRAIT). | []string | false |  
 traitTypes | Select resources by trait types. | []string | false |  
 resourceTypes | Select resources by resource types (like Deployment). | []string | false |  
 resourceNames | Select resources by their names. | []string | false |  


## Replication

### Description

Describe the configuration to replicate components when deploying resources, it only works with specified `deploy` step in workflow.

### Examples (replication)

### Background

In KubeVela, we can dispatch resources across the clusters. But projects like [OpenYurt](https://openyurt.io) have finer-grained division like node pool.
This requires to dispatch some similar resources to the same cluster. These resources are called replication. Back to the example of OpenYurt, it can
integrate KubeVela and replicate the resources then dispatch them to the different node pool.

### Usage

Replication is an internal policy. It can be only used with `deploy` workflow step. When using replication policy. A new field `replicaKey` will be added to context.
User can use definitions that make use of `context.replicaKey`. For example, apply a replica-webservice ComponentDefinition.

In this ComponentDefinition, we can use `context.replicaKey` to distinguish the name of Deployment and Service.

> **NOTE**: ComponentDefinition below is trimmed for brevity. See complete YAML in [replication.yaml](https://github.com/kubevela/kubevela/tree/master/test/e2e-test/testdata/definition/replication.yaml)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: Webservice, but can be replicated
  name: replica-webservice
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "apps/v1"
        	kind:       "Deployment"
        	metadata: {
        		if context.replicaKey != _|_ {
        			name: context.name + "-" + context.replicaKey
        		}
        		if context.replicaKey == _|_ {
        			name: context.name
        		}
        	}
        	spec: {
        		selector: matchLabels: {
        			"app.oam.dev/component": context.name
        			if context.replicaKey != _|_ {
        				"app.oam.dev/replicaKey": context.replicaKey
        			}
        		}

        		template: {
        			metadata: {
        				labels: {
        					if parameter.labels != _|_ {
        						parameter.labels
        					}
        					if parameter.addRevisionLabel {
        						"app.oam.dev/revision": context.revision
        					}
        					"app.oam.dev/name":      context.appName
        					"app.oam.dev/component": context.name
        					if context.replicaKey != _|_ {
        						"app.oam.dev/replicaKey": context.replicaKey
        					}

        				}
        				if parameter.annotations != _|_ {
        					annotations: parameter.annotations
        				}
        			}
        		}
        	}
        }
        outputs: {
        	if len(exposePorts) != 0 {
        		webserviceExpose: {
        			apiVersion: "v1"
        			kind:       "Service"
        			metadata: {
        				if context.replicaKey != _|_ {
        					name: context.name + "-" + context.replicaKey
        				}
        				if context.replicaKey == _|_ {
        					name: context.name
        				}
        			}
        			spec: {
        				selector: {
        					"app.oam.dev/component": context.name
        					if context.replicaKey != _|_ {
        						"app.oam.dev/replicaKey": context.replicaKey
        					}
        				}
        				ports: exposePorts
        				type:  parameter.exposeType
        			}
        		}
        	}
        }
```

Then user can apply application below. Replication policy is declared in `application.spec.policies`. These policies are used in `deploy-with-rep` workflow step.
They work together to influence the `deploy` step.

- override: select `hello-rep` component to deploy.
- topology: select cluster `local` to deploy.
- replication: select `hello-rep` component to replicate.

As a result, there will be two Deployments and two Services:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-replication-policy
spec:
  components:
    - name: hello-rep
      type: replica-webservice
      properties:
        image: crccheck/hello-world
        ports:
          - port: 80
            expose: true
  policies:
    - name: comp-to-replicate
      type: override
      properties:
        selector: [ "hello-rep" ]
    - name: target-default
      type: topology
      properties:
        clusters: [ "local" ]
    - name: replication-default
      type: replication
      properties:
        keys: ["beijing","hangzhou"]
        selector: ["hello-rep"]

  workflow:
    steps:
      - name: deploy-with-rep
        type: deploy
        properties:
          policies: ["comp-to-replicate","target-default","replication-default"]
```

```shell
kubectl get deploy -n default
NAME                 READY   UP-TO-DATE   AVAILABLE   AGE
hello-rep-beijing    1/1     1            1           5s
hello-rep-hangzhou   1/1     1            1           5s

kubectl get service -n default
NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
hello-rep-hangzhou   ClusterIP   10.43.23.200   <none>        80/TCP    41s
hello-rep-beijing    ClusterIP   10.43.24.116   <none>        80/TCP    12s
```

### Specification (replication)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 keys | Spicify the keys of replication. Every key coresponds to a replication components. | []string | true |  
 selector | Specify the components which will be replicated. | []string | false |  


## Shared-Resource

### Description

Configure the resources to be sharable across applications.

### Examples (shared-resource)

It's used in [shared-resource](https://kubevela.io/docs/end-user/policies/shared-resource) scenario.
It can be used to configure which resources can be shared between applications. The target resource will allow multiple application to read it but only the first one to be able to write it.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app1
spec:
  components:
    - name: ns1
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: example
    - name: cm1
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: ConfigMap
            metadata:
              name: cm1
              namespace: example
            data:
              key: value1
  policies:
    - name: shared-resource
      type: shared-resource
      properties:
        rules:
          - selector:
              resourceTypes: ["Namespace"]
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app2
spec:
  components:
    - name: ns2
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: example
    - name: cm2
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: ConfigMap
            metadata:
              name: cm2
              namespace: example
            data:
              key: value2
  policies:
    - name: shared-resource
      type: shared-resource
      properties:
        rules:
          - selector:
              resourceTypes: ["Namespace"]
```

### Specification (shared-resource)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 rules | Specify the list of rules to control shared-resource strategy at resource level. | [[]rules](#rules-shared-resource) | false |  


#### rules (shared-resource)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 selector | Specify how to select the targets of the rule. | [[]selector](#selector-shared-resource) | true |  


##### selector (shared-resource)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 componentNames | Select resources by component names. | []string | false |  
 componentTypes | Select resources by component types. | []string | false |  
 oamTypes | Select resources by oamTypes (COMPONENT or TRAIT). | []string | false |  
 traitTypes | Select resources by trait types. | []string | false |  
 resourceTypes | Select resources by resource types (like Deployment). | []string | false |  
 resourceNames | Select resources by their names. | []string | false |  


## Take-Over

### Description

Configure the resources to be able to take over when it belongs to no application.

### Examples (take-over)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: take-over
spec:
  components:
    - name: busybox
      type: k8s-objects
      properties:
        objects:
          - apiVersion: apps/v1
            kind: Deployment
            metadata:
              name: busybox-ref
  policies:
    - type: take-over
      name: take-over
      properties:
        rules:
          - selector:
              resourceTypes: ["Deployment"]
```

### Specification (take-over)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 rules | Specify the list of rules to control take over strategy at resource level. | [[]rules](#rules-take-over) | false |  


#### rules (take-over)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 selector | Specify how to select the targets of the rule. | [[]selector](#selector-take-over) | true |  


##### selector (take-over)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 componentNames | Select resources by component names. | []string | false |  
 componentTypes | Select resources by component types. | []string | false |  
 oamTypes | Select resources by oamTypes (COMPONENT or TRAIT). | []string | false |  
 traitTypes | Select resources by trait types. | []string | false |  
 resourceTypes | Select resources by resource types (like Deployment). | []string | false |  
 resourceNames | Select resources by their names. | []string | false |  


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
 clusters | Specify the names of the clusters to select. | []string | false |  
 clusterLabelSelector | Specify the label selector for clusters. | map[string]string | false |  
 allowEmpty | Ignore empty cluster error. | bool | false |  
 clusterSelector | Deprecated: Use clusterLabelSelector instead. | map[string]string | false |  
 namespace | Specify the target namespace to deploy in the selected clusters, default inherit the original namespace. | string | false |  


