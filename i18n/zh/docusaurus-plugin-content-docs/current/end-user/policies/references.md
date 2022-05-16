---
title: 内置策略类型
---

本文档将介绍 KubeVela 内置的各个策略类型。

## apply-once

**简介**

允许被部署资源的配置漂移。

**参数**

|   参数名    |  类型  |           说明            |
| :-------: | :----: | :------------------------------ |
|  enable   |  bool  |   当设置为 true 时，将允许配置飘逸  |

**示例**

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

## garbage-collect

**简介**

为应用配置垃圾回收行为。

**参数**

|   参数名    |   类型  |           说明            |
| :-------: | :----: | :------------------------------ |
|  keepLegacyResource   |  bool  |   如果为 true，过时的版本化 resource tracker 将不会自动回收。 过时的资源将被保留，直到手动删除 resource tracker。  |
| rules | []GarbageCollectPolicyRule | 在资源级别控制垃圾回收策略的规则列表，如果一个资源由多个规则控制，将使用第一个规则。 |

*GarbageCollectPolicyRule*

|   参数名    |   类型  |           说明            |
| :-------: | :----: | :------------------------------ |
| selector | GarbageCollectPolicyRuleSelector | 选择规则的目标资源。 |
| strategy | String | 目标资源循环利用的策略。 可用值：never、onAppDelete、onAppUpdate。 |

*GarbageCollectPolicyRuleSelector*

|   参数名    |   类型  |           说明            |
| :-------: | :----: | :------------------------------ |
| componentNames | []String | 按组件名称选择目标资源。 |
| componentTypes | []String | 按组件类型选择目标资源。 |
| traitTypes | []String | 按 trait 类型选择目标资源。 |

**示例**

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

## Override

**简介**

描述部署资源时要覆盖的配置。

**参数**

|   参数名    |  类型  |           说明            |
| :-------: | :----: | :------------------------------ |
| components | []ComponentPatch | 要覆盖的组件配置列表。 |
| selector | []String | 要使用的组件名称列表。 如果未设置，将使用所有组件。 |

*ComponentPatch*

|   参数名    |  类型  |           说明            |
| :-------: | :----: | :------------------------------ |
| name | string | 要覆盖的组件的名称。 如果未设置，它将匹配具有指定类型的所有组件。 可以与通配符 * 一起使用以进行模糊匹配。 |
| type | String | 要覆盖的组件的类型。 如果未设置，将匹配所有组件类型。 |
| properties | Object | 要合并的组件属性。 |
| traits | []TraitPatch | 要覆盖的 trait 配置列表。 |

*TraitPatch*

|   参数名    |  类型  |           说明            |
| :-------: | :----: | :------------------------------ |
| type | String | 要覆盖的 trait 类型。 |
| properties | Object | 要合并的 trait 属性。 |
| disable | bool | 如果为 true，该 trait 将被删除。 |

**示例**

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

**简介**

描述组件应该部署到的环境。

**参数**

|   参数名    |   类型  |           说明            |
| :-------: | :----: | :------------------------------ |
| clusters |  []string | 要选择的集群的名称。 |
| clusterLabelSelector | mpa[string]string | 集群的标签选择器。 |
| namespace | string | 要在选定集群中部署的目标命名空间。 如果未设置，组件将继承原始命名空间。 |

**示例**

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