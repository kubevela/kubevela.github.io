---
title: kruise-rollout
---

Kruise Rollout addon provides canary release capabilities for Kubernetes Deployment, Statefulset and OpenKruise CloneSet.
For more details, please refer to: [Kruise Rollout](https://github.com/openkruise/rollouts/blob/master/docs/getting_started/introduction.md).


## Installation

```shell
vela addon enable kruise-rollout
```

## Uninstallation

```shell
vela addon disable kruise-rollout
```

## Usage

Kurise rollout addon help to canary rollout your workload no matter defined with [webservice](../../tutorials/webservice.mdx) or contained in a [helm](../../tutorials/helm.md).

If your workload is in a helm chart please refer to [doc](../../tutorials/helm-rollout.md) for more usage info, otherwise please refer to usage of webservice [component](../../end-user/traits/rollout.md).

### Properties

Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
canary| Configuration for canary rollout strategy| [Canary](#Canary)| true|
workloadType| Specify the target worklaod type| [WorkloadType](#WorkloadType)|false

#### Canary

Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
steps| Defines the entire rollout process in steps | [CanaryStep](#CanaryStep)|true
trafficRoutings| Define traffic routing related service, ingress information | [[]TrafficRouting](#TrafficRouting)| true


##### CanaryStep

Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
weight| Define the percentage of traffic routing to the new version in each step, e.g., 20%, 40%...| int|false
replicas| Define the replicas of release to the new version in each step, e.g., 5, 10...| int| false
duration| Define the behavior after release each step, if not filled, the default requires manual determination. If filled, it indicates the time to wait in seconds, e.g., 60| int|false

##### TrafficRouting

Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
service| Define service name | stirng | false | context.name
ingressName| Define ingress name | string | false | context.name

##### WorkloadType

Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
apiVersion| Target workload's apiVersion| string| true
kind| Target workload's kind | string | true

## Example

```yaml
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: canary-demo
  annotations:
    app.oam.dev/publishVersion: v1
spec:
  components:
  - name: canary-demo
    type: webservice
    properties:
      image: barnett/canarydemo:v1
      ports:
      - port: 8090
    traits:
    - type: scaler
      properties:
        replicas: 5
    - type: gateway
      properties:
        domain: canary-demo.com
        http:
          "/version": 8090
    - type: kruise-rollout
      properties:
        canary:
          steps:
           # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          - weight: 20
          # The second batch of Canary releases 90% Pods, and 90% traffic imported to the new version.
          - weight: 90
          trafficRoutings:
            - type: nginx
EOF
```
