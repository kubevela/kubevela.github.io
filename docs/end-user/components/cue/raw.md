---
title:  Raw
---

Use raw Kubernetes resources directly. For example, a Job.

## How to use

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-raw
spec:
  components:
    - name: myjob
      type: raw
      properties:
        apiVersion: batch/v1
        kind: Job
        metadata:
          name: pi
        spec:
          template:
            spec:
              containers:
              - name: pi
                image: perl
                command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
              restartPolicy: Never
          backoffLimit: 4
```