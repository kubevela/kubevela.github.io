---
title: 灰度发布和扩缩容
---
本章节会介绍，如何使用灰度发布( Rollout )运维特征完成对工作负载的滚动发布和扩缩容。

## 背景

### 组件版本

每次对组件的修改都会产生一个组件版本(kubernetes controllerRevision)，组件版本名称的默认产生规则是：`<组件名>-<版本序号>`。你也可以通过设置应用部署计划的 `spec.components[x].externalRevision` 字段来指定组件版本名称。

### 支持的组件类型
灰度发布运维特征支持 webservice，worker，clonset 类型的工作负载。

当使用 webservice和worker 作为工作负载类型并配合使用灰度发布运维特征时，工作负载的名称将被命名为组件版本的名称。 当工作负载类型为 cloneset 时，由于 clonset 支持原地更新， 工作负载的名称将被命名为组件的名称。

## 如何使用

### 首次发布 
   
应用下面的 YAML 来创建一个应用部署计划，该应用包含了一个使用了灰度发布运维特征的 webservice 类型的组件，并通过设置 `spec.components[0].externalRevision` 来指定组件版本名称为 express-server-v1 。

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      # 设置组件版本为 express-server-v1
      externalRevision: express-server-v1
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: rollout
          # 缺省设置 targetRevision 直接指向最新的组件版本也就是 express-server-v1
          properties:
            # 设置部署5个副本
            targetSize: 5
            # 分两批发布，上一批次副本全部就绪之后部署下一批次
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```
这个灰度发布运维特征表示分两个批次发布工作负载，目标工作负载的副本个数为5个，第一批发布2个副本，第二批发布3个副本。前一批次的副本全部就绪之后，才会发布下一批次。

等待一段时间发布成功之后查看应用状态。
```shell
$ kubectl get app rollout-trait-test
NAME                 COMPONENT        TYPE         PHASE     HEALTHY   STATUS   AGE
rollout-trait-test   express-server   webservice   running   true               2d20h
```

查看组件版本。
```shell
$ kubectl get controllerRevision  -l controller.oam.dev/component=express-server
NAME                CONTROLLER                                    REVISION   AGE
express-server-v1   application.core.oam.dev/rollout-trait-test   1          2d22h
```

查看灰度发布运维特征的状态， `ROLLING-STATE` 为 rolloutSucceed 说明发布成功，`BATCH-STATE` 为 batchReady 表明当前批次的副本已全部就绪。`TARGET` `UPGRADED` `READY` 三列说明目标的副本5个，完成升级的副本为5个，就绪的副本为5个。
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5          5       batchReady    rolloutSucceed   2d20h
```

查看工作负载状态（ webservice/worker 的底层工作负载是  [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) )
```shell
$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   5/5     5            5           2d20h
```

### 灰度升级
   
应用下面的 YAML 来修改容器的镜像，将工作负载升级到新的组件版本。
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      # 设置更新后的组件版本为 express-server-v2
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetSize: 5
            # 只灰度发布第一批次的副本
            batchPartition: 0
            # 分两批灰度发布
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```
该灰度发布运维特征表示，目标副本个数为5个，分两批升级，第一批升级2个副本，第二批升级3个副本，并通过设置 `batchPartition` 为0来指定只升级第1批的2个副本。

查看组件版本，可见生成了一个新的组件版本 express-server-v2。
```shell
$ kubectl get controllerRevision -l controller.oam.dev/component=express-server
NAME                CONTROLLER                                    REVISION   AGE
express-server-v1   application.core.oam.dev/rollout-trait-test   1          2d22h
express-server-v2   application.core.oam.dev/rollout-trait-test   2          1m
```

一段时间之后，成功升级第一批次后，查看灰度发布运维特征的状态。 `TARGET` `UPGRADED` `READY` 表示这次升级目标版本的副本5个，已经升级完成了2个，2个已经就绪。 batchReady 状态表示当前的第1批次的副本全部就绪， rollingInBatches 状态表示还未完成全部批次的升级，仍在升级当中。
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        2          2       batchReady   rollingInBatches  2d20h
```

查看工作负载状态进行验证，可见新版本的工作负载 express-server-v2 已经升级完成2个副本，老版本的工作负载 express-server-v1 尚有3个副本。
```shell
$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   3/3     3            3           2d20h
express-server-v2   2/2     2            2           1m
```

应用下面的 YAML 来去掉灰度发布运维特征的 `batchPartition` 字段来将全部副本升级到最新版本。
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```

查看灰度发布运维特征，可见已经升级成功。
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5           5       batchReady   rolloutSucceed  2d20h
```

查看工作负载状态，可见新版本的工作负载已经完成升级，并且老版本的工作负载已经被删除。
```shell
$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v2   5/5     5            5           1m
```


### 回滚
   
应用下面的 YAML 来指定灰度发布运维特征的 `targetRevision` 将组件回滚到 express-server-v1 组件版本。
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            # 设置目标版本为之前的组件版本来进行回滚
            targetRevision: express-server-v1
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```

回滚成功之后查看灰度发布运维特征状态。
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   5        5          5       batchReady    rolloutSucceed  2d20h
```

查看工作负载状态，可见工作负载状态回滚到了 express-server-v1 组件版本。 
```shell
$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   5/5     5            5           15s
```

### 扩容

灰度发布运维特征还可以完成工作负载的扩容操作，应用下面的 YAML 来修改targetSize，将副本个数由原来的5个增加至7个。
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetRevision: express-server-v1
            targetSize: 7
            # 刚才工作负载有5个副本，分两批扩容，第一批扩容1个，第二批再扩容1个
            rolloutBatches:
              - replicas: 1
              - replicas: 1
EOF
```
这个灰度发布运维特征的表示，从刚才的5个副本个数扩容至目标的7个副本，第一个批次扩容1个，第二个批次再扩容1个。

扩容成功之后，查看资源状态。
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   7        7          7       batchReady    rolloutSucceed   2d20h

$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   7/7     7            7           2m
```

### 缩容
   
应用下面的 YAML 将副本个数由之前的7个缩减至3个
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetRevision: express-server-v1
            # 刚才工作负载有7个，分两批缩容，第一批缩减1个，第二批缩减3个。
            targetSize: 3
            rolloutBatches:
              - replicas: 1
              - replicas: 3
EOF
```
这个灰度发布运维特征的表示，从刚才扩容之后的7个副本缩容至目标的3个副本，第一个批次缩容1个，第二个批次缩容3个。

缩容成功之后，查看资源状态。
```shell
$ kubectl get rollout express-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
express-server   3        3          3       batchReady    rolloutSucceed   2d20h

$ kubectl get deploy -l app.oam.dev/component=express-server
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   3/3     3            3           5m
```

### cloneset 类型工作负载的灰度发布

启用 kruise 的[扩展插件](./addons/introduction)。
```shell
$ vela addon enable kruise
```

查看组件类型
```shell
$ vela components
NAME                NAMESPACE        WORKLOAD                        DESCRIPTION
cloneset            vela-system     clonesets.apps.kruise.io                                  
```


应用下面的 YAML 来创建一个应用部署计划，该应用包含一个 cloneset 类型的工作负载和一个灰度发布运维特征。
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test-cloneset
spec:
  components:
    - name: cloneset-server
      type: cloneset
      externalRevision: cloneset-server-v1
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```

查看相关资源。
```shell
$ kubectl get app rollout-trait-test-cloneset
NAME                              COMPONENT         TYPE               PHASE      HEALTHY   STATUS     AGE
rollout-trait-test-cloneset   cloneset-server       clonset            running      true               4m18s

$ kubectl get controllerRevision  -l controller.oam.dev/component=cloneset-server
NAME                CONTROLLER                                           REVISION   AGE
cloneset-server-v1   application.core.oam.dev/rollout-trait-test-cloneset   1          4m45s

$ kubectl get rollout cloneset-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
cloneset-server   5        5          5       batchReady    rolloutSucceed   5m10s
```

查看工作负载状态，可以看到由于 cloneset 工作负载支持原地升级，它与 webservice/worker 的最大区别是底层工作负载的名称就是组件名称。
```shell
$ kubectl get cloneset -l app.oam.dev/component=cloneset-server
NAME             DESIRED   UPDATED   UPDATED_READY   READY   TOTAL   AGE
cloneset-server   5         5         5               5       5       7m3s
```

查看镜像。
```shell
$ kubectl get cloneset cloneset-server -o=jsonpath='{.spec.template.spec.containers[0].image}'
stefanprodan/podinfo:4.0.3
```

应用下面的 YAML 更新镜像。
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test-cloneset
spec:
  components:
    - name: cloneset-server
      type: cloneset
      externalRevision: cloneset-server-v2
      properties:
        image: stefanprodan/podinfo:5.0.2
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
EOF
```

升级完成之后，查看相关资源。
```shell
$ kubectl get controllerRevision  -l controller.oam.dev/component=cloneset-server
NAME                CONTROLLER                                             REVISION    AGE
cloneset-server-v1   application.core.oam.dev/rollout-trait-test-cloneset    1          6m43s
cloneset-server-v2   application.core.oam.dev/rollout-trait-test-clonesett   2          108s

$ kubectl get rollout cloneset-server
NAME             TARGET   UPGRADED   READY   BATCH-STATE   ROLLING-STATE    AGE
cloneset-server  5        5          5       batchReady    rolloutSucceed   6m10s
```

查看工作负载状态，可见升级之后的工作负载仍是 cloneset-server。
```shell
$ kubectl get cloneset -l app.oam.dev/component=cloneset-server
NAME             DESIRED   UPDATED   UPDATED_READY   READY   TOTAL   AGE
cloneset-server   5         5         5               5       5       7m3s
```

进一步通过查看镜像进行验证。
```shell
$ kubectl get cloneset cloneset-server -o=jsonpath='{.spec.template.spec.containers[0].image}'
stefanprodan/podinfo:5.0.2
```

其他的扩缩容，回滚等操作与 webservice/worker 类型的工作负载的操作方式完全一致。

## 参数说明

灰度发布运维特征的所有配置项

名称 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
targetRevision|目标组件版本|string|否|当该字段为空时，一直指向组件的最新版本
targetSize|目标副本个数|int|是|无
rolloutBatches|批次发布策略|rolloutBatch数组|是|无
batchPartition|发布批次|int|否|无，缺省为发布全部批次

rolloutBatch的属性

名称 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
replicas|批次的副本个数|int|是|无
