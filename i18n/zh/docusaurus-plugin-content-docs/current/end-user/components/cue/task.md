---
title:  部署一次性或周期性任务
---

> 此类型适用于 UI 和 CLI

### 一次性任务（Task）描述运行代码或脚本以完成的作业

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-worker
spec:
  components:
    - name: mytask
      type: task
      properties:
        image: perl
        count: 10
        cmd: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
```

### 描述一个定时任务

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: cron-worker
spec:
  components:
    - name: mytask
      type: cron-task
      properties:
        image: perl
        count: 10
        cmd: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
        schedule: "*/1 * * * *"
```
