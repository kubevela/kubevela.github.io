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

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| canary | The rollout steps and traffic routing. See [canary](#canary). | object | true | |
| auto | Release every step without pausing between them. | bool | false | `false` |
| releaseMode | `canary` (an extra canary Deployment) or `batch` (updates the Deployment in place, in batches). | string | false | `canary` |
| workloadType | The workload to roll out, when it can't be detected. See [workloadType](#workloadtype). | object | false | |
| stepPartition | Run steps 1 to `stepPartition` without pausing, then pause as usual. When set, `duration` is ignored. | int | false | |

#### canary

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| steps | The rollout, as a list of steps. See [steps](#steps). | []object | true | |
| trafficRoutings | The Service and Ingress or Gateway route that split traffic. See [trafficRoutings](#trafficroutings). | []object | false | |

#### steps

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| weight | Percentage of traffic sent to the new version at this step, for example `20`. | int | false | |
| replicas | Pods on the new version at this step, as a number (`5`) or a percentage (`"20%"`). | int or string | false | |
| duration | Seconds to wait before the next step. Without it, the rollout pauses until you resume it. | int | false | |
| matches | Header rules that send matching requests to the new version. Each entry has `headers`, a list of `{Type, Name, Value}` where `Type` is `Exact` (default) or `RegularExpression`. | []object | false | |

#### trafficRoutings

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| type | The traffic route: `ingress`, `gateway` or `aliyun-alb`. | string | false | `ingress` |
| service | Service that selects the stable Pods. | string | false | the component name |
| ingressName | Ingress to split traffic on, when `type` is `ingress`. | string | false | the component name |
| gatewayHTTPRouteName | Gateway API `HTTPRoute` to split traffic on, when `type` is `gateway`. | string | false | |
| gracePeriodSeconds | Seconds to wait after changing the route. | int | false | `5` |

#### workloadType

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| apiVersion | The workload's apiVersion. | string | true | |
| kind | The workload's kind. | string | true | |

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
            - type: ingress
EOF
```
