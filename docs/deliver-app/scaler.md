---
title: AutoScaler
---

## Specification


| NAME    | DESCRIPTION                                                                     | TYPE | REQUIRED | DEFAULT |
| ------- | ------------------------------------------------------------------------------- | ---- | -------- | ------- |
| min     | Specify the minimal number of replicas to which the autoscaler can scale down   | int  | true     | 1       |
| max     | Specify the maximum number of of replicas to which the autoscaler can scale up  | int  | true     | 10      |
| cpuUtil | Specify the average cpu utilization, for example, 50 means the CPU usage is 50% | int  | true     | 50      |

## How to use

```yaml
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend              # This is the component I want to deploy
      type: webservice
      properties:
        image: nginx
      traits:
        - type: cpuscaler         # Automatically scale the component by CPU usage after deployed
          properties:
            min: 1
            max: 10
            cpuPercent: 60
```
