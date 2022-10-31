---
title: Bootstrap Parameters
---

The introduction of bootstrap parameters in KubeVela controller are listed as below

|       Parameter Name        |  Type  |           Default Value           | Description                                                                                                                             |
| :-------------------------: | :----: | :-------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
|         use-webhook         |  bool  |               false               | Use Admission Webhook                                                                                                                   |
|      webhook-cert-dir       | string | /k8s-webhook-server/serving-certs | The directory of Admission Webhook cert/secret                                                                                          |
|        webhook-port         |  int   |               9443                | The address of Admission Webhook                                                                                                        |
|        metrics-addr         | string |               :8080               | The address of Prometheus metrics                                                                                                       |
|   enable-leader-election    |  bool  |               false               | Enable Leader Election for Controller Manager and ensure that only one replica is active                                                |
|  leader-election-namespace  | string |                ""                 | The namespace of Leader Election ConfigMap                                                                                              |
|        log-file-path        | string |                ""                 | The log file path                                                                                                                       |
|      log-file-max-size      |  int   |               1024                | The maximum size (MBi) of log files                                                                                                     |
|          log-debug          |  bool  |               false               | Set the logging level to DEBUG, used in develop environment                                                                             |
| application-revision-limit  |  int   |                10                 | The maximum number of application revisions to keep. When the number of revisions exceeeds this number, older version will be discarded |
|  definition-revision-limit  |  int   |                20                 | The maximum number of definition revisions to keep                                                                                      |
| autogen-workload-definition |  bool  |               true                | Generate WorkloadDefinition for ComponentDefinition automatically                                                                       |
|         health-addr         | string |               :9440               | The address of health check                                                                                                             |
|        disable-caps         | string |                ""                 | Disable internal capabilities                                                                                                           |
|       storage-driver        | string |               Local               | The storage driver for applications                                                                                                     |
|  application-re-sync-period |  time  |                5m                 | Re-sync period for application to re-sync, also known as the state-keep interval.                                                       |
|    informer-sync-period     |  time  |                10h                | The re-sync period for informer in controller-runtime. This is a system-level configuration.                                            |
|     reconcile-timeout       |  time  |                3m                 | The timeout for controller reconcile.                                                                                                   |
| system-definition-namespace | string |            vela-system            | The namespace for storing system definitions                                                                                            |
|    concurrent-reconciles    |  int   |                 4                 | The number of threads that controller uses to process requests                                                                          |
|        kube-api-qps         |  int   |                50                 | The QPS for controller to access apiserver                                                                                              |
|       kube-api-burst        |  int   |                100                | The burst for controller to access apiserver                                                                                            |
|        oam-spec-var         | string |               v0.3                | The version of OAM spec to use                                                                                                          |
|         pprof-addr          | string |                ""                 | The address of pprof, default to be emtpy to disable pprof                                                                              |
|        perf-enabled         |  bool  |               false               | Enable performance logging, working with monitoring tools like Loki and Grafana to discover performance bottleneck                      |
|    enable-cluster-gateway   |  bool  |               false               | Enable multi cluster feature                                                                                                            |
| max-workflow-wait-backoff-time | int |                60                 | the maximal backoff interval for workflow to retry when workflow step is waiting (unit: second)                                         |
| max-workflow-failed-backoff-time | int |              300                | the maximal backoff interval for workflow to retry when workflow step fails (unit: second)                                              |
| max-workflow-step-error-retry-times | int |           10                 | the maximal retry times for workflow to retry when workflow step fails                                                                  |
|      reconcile-timeout      |  time  |                3m                 | the timeout for controller reconcile                                                                                                    |
| reconcile-termination-graceful-period | time |        5s                 | graceful period for terminating reconcile                                                                                               |


> Other parameters not listed in the table are old parameters used in previous versions, the latest version ( v1.1 ) does not use them.

## Key Parameters

- **application-re-sync-period**: The resync time of applications when no changes were made. A short time may cause controller to reconcile frequently but uselessly. The regular reconciles of applications can help ensure that application and its components keep up-to-date in case some unexpected differences.
- **concurrent-reconciles**: The number of threads to use for controller to handle requests. When rich CPU resources are available, a small number of working threads may lead to insufficient usage of CPU resources.
- **kube-api-qps / kube-api-burst**: The rate limit for KubeVela controller to access apiserver. When managed applications are complex (containing multiple components and resources), if the access rate of apiserver is limited, it will be hard to increase the concurrency of KubeVela controller. However, high access rate may cause huge burden to apiserver. It is critical to keep a balance when handling massive applications.
- **pprof-addr**: The pprof address to enable controller performance debugging.
- **perf-enabled**: Use this flag if you would like to check time costs for different stages when reconciling applications. Switch it off to simplify loggings.

> Several sets of recommended parameter configurations are enclosed in section [Performance Fine-tuning](./performance-finetuning).

## Feature Gates

You can use `--feature-gates=XXX=true` to enable feature `XXX`. There are a list of feature gates allow you to enable advanced features or alpha features.

- **AuthenticateApplication**: enable the authentication for application.
- **ZstdResourceTracker**: enables the zstd compression for ResourceTracker. It can be useful if you have large application that needs to dispatch lots of resources or large resources (like CRD or huge ConfigMap), which at the cost of slower processing speed due to the extra overhead for compression and decompression.
- **ApplyOnce**: enable the apply-once feature for all applications. If enabled, no StateKeep will be run, ResourceTracker will also disable the storage of all resource data, only metadata will be kept.
- **MultiStageComponentApply**: enable multi-stage feature for component. If enabled, the dispatch of manifests is performed in batches according to the stage.