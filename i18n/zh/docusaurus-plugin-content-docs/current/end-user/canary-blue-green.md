
# 金丝雀发布

本文将会介绍如何借助 [istio](https://istio.io/latest/) 实现一个经典的 [bookinfo](https://istio.io/latest/docs/examples/bookinfo/?ie=utf-8&hl=en&docs-search=Canary) 的金丝雀发布案例。 

## 准备工作

开启 istio 集群插件
```shell
vela addon enable istio
```

 为 default namespace 打上 istio 自动注入 sidecar 的标签。
```shell
kubectl label namespace default istio-injection=enabled
```

## 初次部署

等待一段时间，等 istio 集群插件就绪之后。应用下面的 YAML 部署一个应用。

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: book-info
  namespace: default
spec:
  components:
    - name: reviews
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-reviews-v2:1.16.2
        port: 9080
        volumes:
            - name: wlp-output
              type: emptyDir
              mountPath: /opt/ibm/wlp/output
            - name: tmp
              type: emptyDir
              mountPath: /tmp


      traits:
        - type: expose
          properties:
            port:
            - 9080

        - type: rollout
          properties:
            targetSize: 2
            rolloutBatches:
              - replicas: 2

    - name: productpage
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-productpage-v1:1.16.2
        port: 9080

      traits:
        - type: expose
          properties:
            port:
            - 9080

        - type: istio-gateway
          properties:
            hosts:
            - "*"
            gateway: ingressgateway
            match:
               - exact: /productpage
               - prefix: /static
               - exact: /login
               - prefix: /api/v1/products
            port: 9080

    - name: ratings
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-ratings-v1:1.16.2
        port: 9080

      traits:
        - type: expose
          properties:
            port:
            - 9080

    - name: details
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-details-v1:1.16.2
        port: 9080

      traits:
        - type: expose
          properties:
            port:
            - 9080
EOF
```
该应用包含四个组件，组件 productpage 配置了一个网关出口接收进入集群的流量。你通过执行下面的命令将网关的端口映射到本地。

```shell
kubectl port-forward service/istio-ingressgateway -n istio-system 19082:80
```
通过浏览器访问 `127.0.0.1:19082` 将会看到下面的页面。

![pic-v2](../resources/canary-pic-v2.jpg)

## 金丝雀发布

接下来我们会通过升级一部分 reviews 组件的实例和流量来演示金丝雀发布。
```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: book-info
  namespace: default
spec:
  components:
    - name: reviews
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-reviews-v3:1.16.2
        port: 9080
        volumes:
          - name: wlp-output
            type: emptyDir
            mountPath: /opt/ibm/wlp/output
          - name: tmp
            type: emptyDir
            mountPath: /tmp


      traits:
        - type: expose
          properties:
            port:
              - 9080

        - type: rollout
          properties:
            targetSize: 2
            # 分两个批次升级组件，两批各升级一个实例
            rolloutBatches:
              - replicas: 1
              - replicas: 1

    - name: productpage
      type: webservice
      properties:
          image: docker.io/istio/examples-bookinfo-productpage-v1:1.16.2
          port: 9080

      traits:
          - type: expose
            properties:
              port:
                - 9080

          - type: istio-gateway
            properties:
              hosts:
                - "*"
              gateway: ingressgateway
              match:
                - exact: /productpage
                - prefix: /static
                - exact: /login
                - prefix: /api/v1/products
              port: 9080

    - name: ratings
      type: webservice
      properties:
          image: docker.io/istio/examples-bookinfo-ratings-v1:1.16.2
          port: 9080

      traits:
          - type: expose
            properties:
              port:
                - 9080

    - name: details
      type: webservice
      properties:
          image: docker.io/istio/examples-bookinfo-details-v1:1.16.2
          port: 9080

      traits:
        - type: expose
          properties:
            port:
              - 9080



  workflow:
    steps:
      - name: rollout-1st-batch
        type: canary-rollout
        properties:
          # 只灰度升级第一个批次的实例
          batchPartition: 0
          traffic:
            weightedTargets:
              # 90%的流量打到老的组件版本实例上
              - revision: reviews-v1
                weight: 90 
              # 10%的流量打到新的组件版本实例上
              - revision: reviews-v2
                weight: 10 # 10% shift to new version

      # 暂停发布工作流，给用户时间做人工校验
      - name: manual-approval
        type: suspend

      - name: rollout-rest
        type: canary-rollout
        properties:
          # 完成剩余实例的升级
          batchPartition: 1
          traffic:
            # 将全部的流量打到新的组件版本实例上面
            weightedTargets:
              - revision: reviews-v2
                weight: 100 

EOF
```

这次不仅更新了 reviews 组件的镜像，还定义了一个应用升级的工作流，该工作流的第一步会先升级第一批次的1个实例，并将10%的流量切换到新版本的实例上面。之后工作流会进入暂停状态，等待用户的确认。

等待一段时间，当实例和流量就绪之后，再在浏览器多次访问之前的网址。发现有大概10%的概率会看到下面这个新的页面，

![pic-v3](../resources/canary-pic-v3.jpg)

可见新版本的页面由之前的黑色五角星变成了红色五角星

### 继续完成全量发布

如果在人工校验阶段，新版本的服务符合你预期，需要继续工作流，完成全量发布。可以通过执行下面的命令完成这一动作。

```shell
vela workflow reumse book-info
```

在浏览器上继续多次访问网页，会发现五角星将一直是红色的。

### 终止发布工作流并回滚

如果在人工校验阶段，你发现服务不符合预期，需要终止预先定义好的发布工作流，并将流量和实例切换回之前的版本。可以通过应用下面的 YAML 来完成这一动作。

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: book-info
  namespace: default
spec:
  components:
    - name: reviews
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-reviews-v3:1.16.2
        port: 9080
        volumes:
          - name: wlp-output
            type: emptyDir
            mountPath: /opt/ibm/wlp/output
          - name: tmp
            type: emptyDir
            mountPath: /tmp


      traits:
        - type: expose
          properties:
            port:
              - 9080

        - type: rollout
          properties:
            # 设置 targetRevision 指向之前的组件版本
            targetRevision: reviews-v1
            batchPartition: 1
            targetSize: 2
            rolloutBatches:
              - replicas: 2

    - name: productpage
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-productpage-v1:1.16.2
        port: 9080

      traits:
        - type: expose
          properties:
            port:
              - 9080

        - type: istio-gateway
          properties:
            hosts:
              - "*"
            gateway: ingressgateway
            match:
              - exact: /productpage
              - prefix: /static
              - exact: /login
              - prefix: /api/v1/products
            port: 9080

    - name: ratings
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-ratings-v1:1.16.2
        port: 9080

      traits:
        - type: expose
          properties:
            port:
              - 9080

    - name: details
      type: webservice
      properties:
        image: docker.io/istio/examples-bookinfo-details-v1:1.16.2
        port: 9080

      traits:
        - type: expose
          properties:
            port:
              - 9080
EOF
```

在浏览器上继续访问网址，会发现五角星又变回到了黑色。

