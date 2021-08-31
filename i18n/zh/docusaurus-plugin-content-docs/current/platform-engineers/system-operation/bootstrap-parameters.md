---
title: 启动参数说明
---

KubeVela 控制器的各项启动参数及其说明如下。

|            参数名           |  类型  |               默认值              | 描述                                                                         |
|:---------------------------:|:------:|:---------------------------------:|------------------------------------------------------------------------------|
|         use-webhook         |  bool  |               false               | 使用 Admission Webhook                                                       |
|       webhook-cert-dir      | string | /k8s-webhook-server/serving-certs | Admission Webhook 的密钥文件夹                                               |
|         webhook-port        |   int  |                9443               | Admission Webhook 的监听地址                                                 |
|         metrics-addr        | string |               :8080               | Prometheus 指标的监听地址                                                    |
|    enable-leader-election   |  bool  |               false               | 为 Controller Manager 启用 Leader Election，确保至多有一个控制器处于工作状态 |
|  leader-election-namespace  | string |                 ""                | Leader Election 的 ConfigMap 所在的命名空间                                  |
|        log-file-path        | string |                 ""                | 日志文件路径                                                                 |
|      log-file-max-size      |   int  |                1024               | 日志文件的最大量，单位为 MB                                                  |
|          log-debug          |  bool  |               false               | 将日志级别设为调试，开发环境下使用                                           |
|  application-revision-limit |   int  |                 10                | 最大维护的应用历史版本数量，当应用版本数超过此数值时，较早的版本会被丢弃    |
|  definition-revision-limit  |   int  |                 20                | 最大维护的模块定义历史版本数量                                                 |
| autogen-workload-definition |  bool  |                true               | 自动为 组件定义 生成 工作负载定义                                              |
|         health-addr         | string |               :9440               | 健康检查监听地址                                                               |
|       apply-once-only       | string |               false               | 工作负载及特征在生成后不再变更，在特定需求环境下使用                           |
|         disable-caps        | string |                 ""                | 禁用内置的能力                                                                 |
|        storage-driver       | string |               Local               | 应用文件的存储驱动                                                             |
|  informer-re-sync-interval  |  time  |                 1h                | 无变更情况下，控制器轮询维护资源的周期                                         |
| system-definition-namespace | string |            vela-system            | 系统级特征定义的命名空间                                                       |
|    concurrent-reconciles    |   int  |                 4                 | 控制器处理请求的并发线程数                                                     |
|         kube-api-qps        |   int  |                 50                | 控制器访问 apiserver 的速率                                                    |
|        kube-api-burst       |   int  |                100                | 控制器访问 apiserver 的短时最大速率                                            |
|         oam-spec-var        | string |                v0.3               | OAM 标准的使用版本                                                             |
|          pprof-addr         | string |                 ""                | 使用 pprof 监测性能的监听地址，默认为空时不监测           |
|         perf-enabled        |  bool  |               false               | 启用控制器性能记录，可以配合监控组件监测当前控制器的性能瓶颈 |

> 未列在表中的参数为旧版本参数，当前版本 v1.1 无需关心

### 重点参数介绍

- **informer-resync-interval**: 在应用配置未发生变化时，KubeVela 控制器主动维护应用的间隔时间。过短的时间会导致控制器频繁调谐不需要同步的应用。间隔性地维护确保应用及其组件的状态保持同步，不会因特殊情况造成的状态不一致持续过长时间
- **concurrent-reconciles**: 用来控制并发处理请求的线程数，当控制器能够获得较多的 CPU 资源时，如果不相应的提高线程数会导致无法充分利用多核的性能
- **kube-api-qps / kube-api-burst**: 用来控制 KubeVela 控制器访问 apiserver 的频率。当 KubeVela 控制器管理的应用较为复杂时 ( 包含较多的组件及资源 )，如果 KubeVela 控制器对 apiserver 的访问速率受限，则较难提高 KubeVela 控制器的并发量。然而过高的请求速率也有可能对 apiserver 造成较大的负担
- **pprof-addr**: 开启该地址可以启用 pprof 进行控制器性能调试
- **perf-enabled**: 启用时可以在日志中看到 KubeVela 控制器管理应用时各个阶段的时间开销，关闭可以简化日志记录
