---
title:  Canary Release with Istio
---

## Introduction

The application deployment model in KubeVela is designed and implemented with extreme level of extensibility at heart. Hence, KubeVela can be easily integrated with any existing tools to superpower your application delivery with modern technologies such as Service Mesh immediately, without writing dirty glue code/scripts.

This guide will introduce how to use KubeVela and [Istio](https://istio.io/latest/) to do an advanced canary release process. In this process, KubeVela will help you to:
- ship Istio capabilities to end users without asking them to become an Istio expert (i.e. KubeVela will provide you a rollout trait as abstraction);
- design canary release steps and do rollout/rollback in a declarative workflow, instead managing the whole process manually or with ugly scripts.

We will use the well-known [bookinfo](https://istio.io/latest/docs/examples/bookinfo/?ie=utf-8&hl=en&docs-search=Canary) application as the sample.

## Preparation

Install the Istio cluster plugin.
```shell
vela addon enable istio
```

The default namespace needs to be labeled so that Istio will auto-inject sidecar.

```shell
kubectl label namespace default istio-injection=enabled
```

## Initial deployment

Deploy the Application of `bookinfo`:

```shell
kubectl apply -f https://github.com/oam-dev/kubevela/blob/master/docs/examples/canary-rollout-use-case/first-deploy.yaml
```

The component architecture and  relationship of the application are as follows:

![book-info-struct](../resources/book-info-struct.jpg)

This Application has four Components, each configured with an`expose` Trait to expose cluster-level service.

The `productpage` component is also configured with an `istio-gateway` Trait, allowing the Component to receive traffic coming from outside the cluster. The example below show that it sets `gateway:ingressgateway` to use Istio's default gateway, and `hosts: "*"` to specify that any request can enter the gateway.
```shell
...
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
...
```

You can port-forward to the gateway as follows:
```shell
kubectl port-forward service/istio-ingressgateway -n istio-system 19082:80
```
Visit `127.0.0.1:19082` through the browser and you will see the following page.

![pic-v2](../resources/canary-pic-v2.jpg)

## Canary Release

Next, we take the `reviews` Component as an example to simulate the complete process of a canary release, and first upgrade a part of the component instances, and adjust the traffic at the same time, so as to achieve the purpose of progressive canary release.

Execute the following command to update the application.
```shell
kubectl apply -f https://github.com/oam-dev/kubevela/blob/master/docs/examples/canary-rollout-use-case/rollout-v2.yaml
```
This operation updates the mirror of the `reviews` Component from the previous v2 to v3. At the same time, the Rollout Trait of the `reviews` Component specifies that the number of target instances to be upgraded is two, which are upgraded in two batches, with one instance in each batch.

In addition, a canary-traffic Trait has been added to the Component.
```shell
...
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
            rolloutBatches:
              - replicas: 1
              - replicas: 1
              
        - type: canary-traffic
          properties:
            port: 9080
...
```

This update also adds an upgraded execution Workflow to the Application, which contains three steps.

The first step is to upgrade only the first batch of instances by specifying `batchPartition` equal to 0. And use `traffic.weightedTargets` to switch 10% of the traffic to the new version of the instance.

After completing the first step, the execution of the second step of the Workflow will enter a pause state, waiting for the user to verify the service status.

The third step of the Workflow is to complete the upgrade of the remaining instances and switch all traffic to the new component version.

```shell
...
  workflow:
    steps:
      - name: rollout-1st-batch
        type: canary-rollout
        properties:
          # just upgrade first batch of component
          batchPartition: 0
          traffic:
            weightedTargets:
              - revision: reviews-v1
                weight: 90 # 90% shift to new version
              - revision: reviews-v2
                weight: 10 # 10% shift to new version

      # give user time to verify part of traffic shifting to newRevision
      - name: manual-approval
        type: suspend

      - name: rollout-rest
        type: canary-rollout
        properties:
          # upgrade all batches of component
          batchPartition: 1
          traffic:
            weightedTargets:
              - revision: reviews-v2
                weight: 100 # 100% shift to new version
...
```

After the update is complete, visit the previous URL multiple times in the browser. There is about 10% probability that you will see the new page below,

![pic-v3](../resources/canary-pic-v3.jpg)

It can be seen that the new version of the page has changed from the previous black five-pointed star to a red five-pointed star.

### Continue with Full Release

If the service is found to meet expectations during manual verification, the Workflow needs to be continued to complete the full release. You can do that by executing the following command.

```shell
vela workflow reumse book-info
```

If you continue to verify the webpage several times on the browser, you will find that the five-pointed star will always be red.

### Terminate the publishing Workflow and Roll Back

If during manual verification, it is found that the service does not meet expectations, you need to terminate the pre-defined release workflow and switch the traffic and instances back to the previous version.

```shell
kubectl apply -f https://github.com/oam-dev/kubevela/blob/master/docs/examples/canary-rollout-use-case/revert-in-middle.yaml
```

This update deletes the previously defined workflow to terminate the execution of the workflow.

And by modifying the `targetRevision` of the Rollout Trait to point to the previous component version `reviews-v1`. In addition, this update also removes the canary-traffic Trait of the Component, and puts all traffic on the same component version `reviews-v1`.

```shell
...
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
            targetRevision: reviews-v1
            batchPartition: 1
            targetSize: 2
            # This means to rollout two more replicas in two batches.
            rolloutBatches:
              - replicas: 2
...
```

Continue to visit the website on the browser, you will find that the five-pointed star has changed back to black.

