---
title: 工作机制
---

这个文档会简单介绍 KubeVela 工作流的一些内部的核心运行机制。

## 运行模式
工作流的执行分为两种模式：DAG 模式和 StepByStep 模式。在 DAG 模式下，工作流中的各个步骤会并发运行，并根据各步骤的 Input/Output 形成依赖关系。前置条件未满足的步骤会先处于等待状态。在 StepByStep 模式下，工作流中的各个步骤则是会按照顺序一步步执行。在 KubeVela v1.2+ 的版本中，在配置工作流的情况下，默认采用 StepByStep 模式，KubeVela v1.5+ 的版本支持显式指定工作流以 DAG 模式运行。

## 暂停与重试

工作流会因为不同的原因重试或者暂停。
1. 当工作流步骤失败或者等待特定条件时，工作流会在一段时间后进行重试。重试的时间会根据重试的次数增加。
2. 如果工作流步骤失败次数过多，工作流会进入暂停状态并停止重试。
3. 如果工作流步骤在等待人工审核，工作流会立刻进入暂停状态。

### 重试时间

工作流的重试时间可以依据 `int(0.05 * 2^(n-1))` 进行计算，其中 `n` 是重试的次数。最小的重试时间是 1 秒。前 10 次重试时间如下表所示：

| 重试次数 | 2^(n-1) | 0.05*2^(n-1) | 重试时间 |
|-------|---------|--------------|------------------|
| 1     | 1       | 0.05         | 1                |
| 2     | 2       | 0.1          | 1                |
| 3     | 4       | 0.2          | 1                |
| 4     | 8       | 0.4          | 1                |
| 5     | 16      | 0.8          | 1                |
| 6     | 32      | 1.6          | 1                |
| 7     | 64      | 3.2          | 3                |
| 8     | 128     | 6.4          | 6                |
| 9     | 256     | 12.8         | 12               |
| 10    | 512     | 25.6         | 25               |
| ...   | ...     | ...          | ...              |

如果工作流步骤处于等待状态，最大的重试时间为 60 秒，你可以通过修改[启动参数](../system-operation/bootstrap-parameters) `--max-workflow-wait-backoff-time` 来设置这一时间。

如果工作流步骤处于失败状态，最大的重试时间为 300 秒，你可以通过修改[启动参数](../system-operation/bootstrap-parameters) `--max-workflow-failed-backoff-time` 来设置这一时间。

### 最大重试次数

对于工作流步骤失败的场景，工作流默认情况下会在重试最多 10 次后进入等待状态。你可以通过修改[启动参数](../system-operation/bootstrap-parameters) `--max-workflow-step-error-retry-times` 来设置这一时间。

> 注意如果工作流步骤是因为资源不健康（如 Pod 尚未启动），工作流步骤会被标记为等待而不是失败。

## 状态维持

当工作流处于健康运行状态 (running) 或是由于等待资源健康状态而暂停时 (suspending)，KubeVela 的应用在默认配置下会定期检查之前下发的资源是否存在配置漂移，并将这些资源恢复成原先下发时的配置。默认定期检查的时间是 5 分钟，可以通过在 KubeVela 控制器[启动参数](../system-operation/bootstrap-parameters)在中设置 `--application-re-sync-period` 来调节。如果想要禁用状态维持的能力，也可以在应用中配置 [apply-once](https://github.com/kubevela/kubevela/blob/master/docs/examples/app-with-policy/apply-once-policy/apply-once.md) 策略。
