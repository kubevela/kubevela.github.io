---
title: Auto Scaling
---

KubeVela supports integrate any auto-scaling ways in Kubernetes world. In this doc, we'll use [KEDA](https://github.com/kedacore/keda) for auto-scaling. KEDA is a Kubernetes-based Event Driven Autoscaling component, it provides event driven scale for any container running in Kubernetes.


## Enable the addon

```bash
vela addon enable keda
```

After installed, you'll get the `keda-auto-scaler` trait, you can learn [the specification](#specification-of-keda-auto-scaler) below.

## Use keda-auto-scaler in Application

KEDA scales on events it reads through a KEDA scaler trigger, such as `cron` or `cpu`. The examples below show how to use them from an Application.

:::caution
When you're using HPA, you must specify the [`apply-once`](../end-user/policies/apply-once.md) policy to let the HPA control the replica field.
:::

## Examples

:::caution
The `keda` addon installs KEDA 2.8 (chart 2.8.2), which supports Kubernetes 1.17 to 1.25. On 1.26 and later its operator cannot create HorizontalPodAutoscalers (it uses `autoscaling/v2beta2`, removed in 1.26), so nothing scales while the Application still reports healthy.
:::

### Cron HPA

We can use cron hpa with the [keda cron trigger](https://keda.sh/docs/2.8/scalers/cron/).

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: scaler-eg-app
spec:
  components:
    - name: hello-world-scaler
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true        
      traits:
        # This Trait used for initializing the replica
        - type: scaler
          properties:
            replicas: 1
        - type: keda-auto-scaler
          properties:
            triggers:
            - type: cron
              metadata:
                timezone: Asia/Hong_Kong  # The acceptable values would be a value from the IANA Time Zone Database.
                start: 00 * * * *       # Every hour at minute 0
                end: 10 * * * *         # Every hour at minute 10
                desiredReplicas: "3"

  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
        rules:
        - strategy:
            path: ["spec.replicas"]
          selector:
            resourceTypes: ["Deployment"]
```

In this example, it will scale up to 3 replicas from 0-10 in every hour. After that, it will scale back to the initial replica `1`.

### CPU based HPA

We can use CPU based hpa with the [keda cpu trigger](https://keda.sh/docs/2.8/scalers/cpu/).


:::tip
You must follow the prerequisite of this keda trigger:

KEDA uses standard `cpu` and `memory` metrics from the Kubernetes Metrics Server, which is not installed by default on certain Kubernetes deployments such as EKS on AWS. Additionally, the resources section of the relevant Kubernetes Pods must include limits (at a minimum).
:::

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: scaler-eg-app
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        cpu: "0.1"
        ports:
          - port: 8080
            expose: true
      traits:
        # This Trait used for initializing the replica
        - type: scaler
          properties:
            replicas: 1
        - type: gateway
          properties:
            class: traefik
            classInSpec: true
            domain: test.my.domain
            http:
              "/": 8080
        - type: keda-auto-scaler
          properties:
            minReplicaCount: 1
            maxReplicaCount: 10
            cooldownPeriod: 10
            pollingInterval: 10
            triggers:
            - type: cpu
              metricType: Utilization
              metadata:
                value: "80"
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
        rules:
        - strategy:
            path: ["spec.replicas"]
          selector:
            resourceTypes: ["Deployment"]
```

This example also exposes the service with the `gateway` trait, so it needs the traefik addon: `vela addon enable traefik`.

We can get the endpoint by the following command.
  ```
  $ vela status scaler-eg-app --endpoint
    Please access scaler-eg-app from the following endpoints:
    +---------+-----------+--------------------------+------------------------------+-------+
    | CLUSTER | COMPONENT | REF(KIND/NAMESPACE/NAME) |           ENDPOINT           | INNER |
    +---------+-----------+--------------------------+------------------------------+-------+
    | local   | frontend  | Service/default/frontend | http://frontend.default:8080 | true  |
    | local   | frontend  | Ingress/default/frontend | http://test.my.domain        | false |
    +---------+-----------+--------------------------+------------------------------+-------+
  ```

Please configure the `/etc/hosts` for visit the service:

```
echo "<IP of your service>   test.my.domain" >> /etc/hosts
```

Then we can add CPU pressure by using the `ab` tool.

```
ab -n 300000 -c 200  http://test.my.domain/
```

We can use `vela top` to check the replica changing during the ab test.

<iframe 
src="https://kubevela.io/images/1.6/cpu_based_trigger_demo.mp4" 
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="true" width="1000" height="550"> </iframe>


### Other Triggers

All of the triggers are supported and the trigger part spec in KubeVela `keda-auto-scaler` trait are all aligned with KEDA trigger, you can refer to [the docs of keda](https://keda.sh/docs/2.8/scalers/) to learn details.

## Specify the Applied Workload

If your component is `webservice` which actually using Kubernetes Deployment as the underlying workload, you don't need to specify the workload type.

If you're using `helm` or customized component types, you should specify the `scaleTargetRef` field to tell the trait which workload it should work with.

KEDA supports Deployment, StatefulSet and Custom Resource, the only constraint is that the target Custom Resource must define [`/scale` subresource](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#scale-subresource).


## Specification of `keda-auto-scaler`


 | Name             | Description                                                                                                                 | Type                              | Required | Default |
 | ---------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------- | ------- |
 | triggers         |                                                                                                                             | [[]triggers](#triggers)           | true     |
 | scaleTargetRef   | Specify the target workload. Every field has a default.                                                                     | [scaleTargetRef](#scaletargetref) | false    |
 | pollingInterval  | specify the polling interval of metrics,  Default: 30 seconds.                                                              | int                               | false    | 30      |
 | cooldownPeriod   | Specify the cool down period that prevents the scaler from scaling down after each trigger activation. Default: 60 seconds. | int                               | false    | 60      |
 | idleReplicaCount | Specify the idle period that the scaler to scale to zero. Default: ignored, must be less than minReplicaCount.              | int                               | false    | 0       |
 | minReplicaCount  | Specify the minimal replica count. Default: 0.                                                                              | int                               | false    | 1       |
 | maxReplicaCount  | Specify the maximal replica count. Default: 100.                                                                            | int                               | false    | 100     |
 | fallback         | Specify the fallback value when the metrics server is not available.                                                        | [fallback](#fallback)             | false    |


#### triggers

 | Name     | Description                                                                                               | Type         | Required | Default |
 | -------- | --------------------------------------------------------------------------------------------------------- | ------------ | -------- | ------- |
 | type     | specify the type of trigger, the rest spec here aligns with KEDA spec.                                    | string       | true     |
 | metadata | specify the metadata of trigger, the spec aligns with the spec of KEDA https://keda.sh/docs/2.8/scalers/. | map[string]_ | true     |

A trigger also takes the other fields KEDA defines for it, such as `metricType`.


#### scaleTargetRef

 | Name                   | Description                                                                           | Type   | Required | Default    |
 | ---------------------- | ------------------------------------------------------------------------------------- | ------ | -------- | ---------- |
 | apiVersion             | Specify apiVersion for target workload.                                               | string | false    | apps/v1    |
 | kind                   | Specify kind for target workload.                                                     | string | false    | Deployment |
 | envSourceContainerName | Specify containerName, default to find this path ".spec.template.spec.containers[0]". | string | false    | empty      |
 | name                   | Specify the instance name for target workload.                                        | string | false    | `context.name` (the component name) |


#### fallback

 | Name             | Description                                                                 | Type | Required | Default |
 | ---------------- | --------------------------------------------------------------------------- | ---- | -------- | ------- |
 | failureThreshold | Specify the failure threshold of the scaler. Default: 3.                    | int  | false    | 3       |
 | replicas         | Specify the replica when failed to get metrics. Default to minReplicaCount. | int  | false    | minReplicaCount |