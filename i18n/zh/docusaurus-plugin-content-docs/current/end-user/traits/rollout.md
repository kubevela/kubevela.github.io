---
title: 滚动发布
---
本章节会介绍，如何使用 rollout 运维特征动完成对工作负载的滚动发布。

## 属性

rollout 运维特征的所有配置项

名称 | 描述 | 类型 | 是否必须 | 默认值 
------------ | ------------- | ------------- | ------------- | ------------- 
targetRevision|目标组件版本|string|否|当前最新的组件版本
targetSize|目标副本个数|int|是|无
rolloutBatches|批次发布策略|rolloutBatch数组|是|无

rolloutBatch的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
replicas|该批次的副本个数|int|是|无

## 背景
每次对组件的修改都会产生一个组件版本(kubernetes controllerRevision)，组件版本名称的默认产生规则是：组件名-版本序号。

另外，当使用 [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) 作为工作负载类型并配合使用 rollout 运维特征时，工作负载的名称将被命名为组件版本的名称。 当工作负载类型为 [CloneSet](https://openkruise.io/en-us/docs/cloneset.html) 时，工作负载的名称将被命名为组件的名称。


## 如何使用
1. 应用下面的 YAML 来创建一个应用部署计划，该应用包含了一个使用了 rollout 运维特征的组件。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
```

这个 rollout 运维特征表示分两个批次发布工作负载，目标工作负载的副本个数为5个，第一批发布2个副本，第二批发布3个副本。前一批次的副本全部就绪之后，才会发布下一批次。

等待一段时间发布成功之后查看资源状态

```shell
$ kubectl get app rollout-trait-test
NAME                 COMPONENT        TYPE         PHASE     HEALTHY   STATUS   AGE
rollout-trait-test   express-server   webservice   running   true               2d20h

$ kubectl get controllerRevision express-server-v1
NAME                CONTROLLER                                    REVISION   AGE
express-server-v1   application.core.oam.dev/rollout-trait-test   1          2d22h

$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5          5       batchReady    rolloutSucceed   2d20h

$ kubectl get deploy express-server-v1
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   5/5     5            5           2d20h
```

2. 应用下面的 YAML 来修改容器的镜像，将工作负载升级到v2。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
```

该 rollout 运维特征表示，目标副本个数为5个，分两批升级，第一批升级2个副本，第二批升级3个副本。

查看资源状态

```shell
$ kubectl get controllerRevision express-server-v2
NAME                CONTROLLER                                    REVISION   AGE
express-server-v2   application.core.oam.dev/rollout-trait-test   1          1m

$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5          5       batchReady    rolloutSucceed   2d20h

$ kubectl get deploy express-server-v2
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v2   5/5     5            5           1m
```

3. 应用下面的 YAML 来指定 rollout 运维特征的 targetRevision 将组件回滚到v1版本。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetRevision: express-server-v1
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
```

回滚成功之后，查看资源状态。

```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5          5       batchReady    rolloutSucceed   2d20h

$ kubectl get deploy express-server-v1
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   5/5     5            5           15s
```

4. rollout 运维特征还可以完成工作负载的扩容操作，应用下面的 YAML 来修改targetSize，将副本个数由原来的5个增加至7个。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetRevision: express-server-v1
            targetSize: 7
            rolloutBatches:
              - replicas: 1
              - replicas: 1
```

这个 rollout 运维特征的表示，从之前的5个副本个数扩容至目标的7个副本，第一个批次扩容1个，第二个批次再扩容1个。

扩容成功之后，查看资源状态。

```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   7        7          7       batchReady    rolloutSucceed   2d20h

$ kubectl get deploy express-server-v1
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   7/7     7            7           2m
```
