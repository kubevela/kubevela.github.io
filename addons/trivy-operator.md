---
title: Trivy-operator
---

This addon installs the [Aqua Security Trivy Operator](https://github.com/aquasecurity/trivy-operator), which scans the images of the workloads in your cluster for known vulnerabilities and writes what it finds to `VulnerabilityReport` resources. It also adds a `trivy-check` workflow step, so an application's workflow can read the scan of the component it just deployed and pass the result on, to a notification for example.

The addon deploys the operator's Helm chart (`trivy-operator` 0.9.1, from `https://aquasecurity.github.io/helm-charts`) into the `trivy-system` namespace by default, with `trivy.ignoreUnfixed` on, so only vulnerabilities that have a fix are reported. It depends on the `fluxcd` addon, which installs the chart, and enables it if needed.

## Install

```shell
vela addon enable trivy-operator
```

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `clusters` | list of strings | all clusters | The clusters to deploy the operator to; set it with `--clusters`. |
| `namespace` | string | `trivy-system` | The namespace the operator runs in. |
| `upgradeCRD` | bool | `false` | Upgrade the operator's CRDs when the addon is upgraded. |

For example, to deploy only to the hub cluster:

```shell
vela addon enable trivy-operator --clusters={local}
```

## Uninstall

```shell
vela addon disable trivy-operator
```

## See the scan results

Once the operator is running, it scans every workload in the cluster. Check that the addon is healthy:

```shell
vela status addon-trivy-operator -n vela-system
```

Each scanned workload gets a `VulnerabilityReport` in its own namespace, with a count of the vulnerabilities found at each severity:

```shell
kubectl get vulnerabilityreports -A
```

To see the vulnerabilities in one report, with their IDs, the affected package and the fixed version:

```shell
kubectl get vulnerabilityreports -n <namespace> <name> -o yaml
```

## Scan an image in a workflow

The `trivy-check` step finds the scan of a workload the application deployed and returns it as `result.message`. This application deploys a component with an image that has known vulnerabilities, scans it, and sends the result to Slack:

```yaml title="example.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example
  namespace: default
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        port: 8000
        image: fogdong/simple-web-demo:v1
  workflow:
    steps:
      - name: apply-comp
        type: apply-component
        properties:
          component: frontend
      - name: image-scan
        type: trivy-check
        outputs:
          - name: image-scan-result
            valueFrom: result.message
        properties:
          resource:
            name: frontend
      - name: notification
        type: notification
        inputs:
          - from: image-scan-result
            parameterKey: slack.message.text
        if: always
        properties:
          slack:
            url:
              value: <your Slack webhook URL>
```

```shell
vela up -f example.yaml
```

When all three steps have succeeded (`vela status example`), the Slack channel has the image's vulnerability summary and, for each `CRITICAL` vulnerability, its ID, title and link. See [Notification](/docs/end-user/workflow/built-in-workflow-defs#notification) to send it somewhere else.

`trivy-check` takes these properties:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `resource.name` | string | | The workload to read the scan for. Required. |
| `resource.kind` | string | `Deployment` | The workload's kind: `Deployment`, `StatefulSet`, `ReplicaSet`, `Job`, `Pod` or `DaemonSet`. For a `Deployment`, the step waits for the rollout and reads the scan of its current ReplicaSet. |
| `level` | list of strings | `["CRITICAL"]` | The severities to list in the details. |
| `showDetail` | bool | `true` | List each vulnerability at those severities, not only the summary. |

The step waits for scan jobs in `trivy-system` to finish, whatever `namespace` the addon was enabled with, so keep the default namespace if you use it.

## Reference

- [Trivy Operator documentation](https://aquasecurity.github.io/trivy-operator/)
- [The addon's source](https://github.com/kubevela/catalog/tree/master/addons/trivy-operator)
