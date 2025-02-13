---
title: View Application Logs
description: View an application log by KubeVela dashboard
---

## View logs via UI

![pod log](https://static.kubevela.net/images/1.3/pod-log.jpg)

You can view the logs of application in the environment tab.

By default, the logs will refresh every 5s. If your logs didn't have timestamp, you can click the `Show timestamps` to see.

## View logs via CLI

```bash
vela logs <app_name> -n <namespace>
```

Select a workload could view the logs.

### Next Step

* [Expose Application for Public Access](./get-application-endpoint.md)