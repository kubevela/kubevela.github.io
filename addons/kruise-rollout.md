---
title: kruise-rollout
---

The `kruise-rollout` addon installs [Kruise Rollout](https://github.com/openkruise/rollouts/blob/master/docs/getting_started/introduction.md), which rolls out a new version of a Deployment, StatefulSet or OpenKruise CloneSet in steps: a share of the Pods and traffic at a time, pausing between steps until you resume.

## When to use it

Use it when you want a canary or batch release of a component, rather than replacing every Pod at once. It works on a workload defined by a [webservice](/docs/tutorials/webservice) component or one inside a Helm chart.

## Install

The addon depends on the [fluxcd](./fluxcd.md) addon, which `vela addon enable` installs first if it is missing.

```shell
vela addon enable kruise-rollout
```

To remove it:

```shell
vela addon disable kruise-rollout
```

### Addon parameters

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| clusters | Clusters to install to. Leave empty to install to all clusters. | []string | false | |
| upgradeCRD | Upgrade the Kruise Rollout CRDs when the addon is upgraded. | bool | false | `false` |

## What it installs

| What | What it does for you |
| --- | --- |
| Kruise Rollout controller (Helm chart `kruise-rollout`, in `vela-system`) | Watches `Rollout` and `BatchRelease` objects and moves the workload through the steps. |
| `kruise-rollout` trait | Adds a canary or batch rollout to a component. |
| `canary-deploy` workflow step | Deploys a canary of the components to the clusters of your policies, at a given weight. |
| `rolling-release` trait | Used by the `canary-deploy` step, which adds it for you. Don't use it directly. |

## Usage

- A canary rollout of a component or a Helm chart with the `kruise-rollout` trait: see [Canary Rollout](/docs/tutorials/helm-rollout).

## kruise-rollout trait

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

## canary-deploy step

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| weight | Percentage of replicas updated, and traffic sent, to the new version. | int | true | |
| policies | Policies that choose where to deploy. Without them, the components go to the hub cluster. | []string | false | `[]` |
| components | Components to roll out. Without them, every component is. | []string | false | `[]` |
| rolloutType | `partition` or `canary`. | string | false | `partition` |
