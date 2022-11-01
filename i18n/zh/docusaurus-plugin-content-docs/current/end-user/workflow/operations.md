---
title:  工作流操作
---

本节将介绍如何使用 `vela` CLI 来进行操作工作流。

## 暂停工作流

如果你有一个正在执行中的工作流，那么，你可以用 `suspend` 命令来暂停这个工作流。

```bash
vela workflow suspend <name>
```

:::tip
如果工作流已经执行完毕，对应用使用 `vela workflow suspend` 命令不会产生任何效果。
请查看 [工作流的暂停和继续](./suspend) 来获得更多例子。
:::

## 继续工作流

当工作流进入暂停状态后，你可以使用 `vela workflow resume` 命令来手动继续工作流。workflow resume 命令会把工作流从暂停状态恢复到执行状态。

```bash
vela workflow resume <name>
```

:::tip
请查看 [工作流的暂停和继续](./suspend) 来获得更多例子。
:::

## 终止工作流

当工作流正在执行时，如果你想终止它，你可以使用 `vela workflow terminate` 命令来终止工作流。

```bash
vela workflow terminate <name>
```

:::tip
区别于暂停，终止的工作流不能继续执行，只能重新运行工作流。重新运行意味着工作流会重新开始执行所有工作流步骤，而继续工作流则是从暂停的步骤后面继续执行。
:::

:::caution
一旦应用被终止，KubeVela 控制器不会再对资源做状态维持，你可以对底层资源做手动修改但请注意防止配置漂移。
:::

## 重新运行工作流

如果你希望重新运行工作流，那么你可以使用 `vale workflow restart` 命令来重新运行工作流。

```bash
vela workflow restart my-app
```

## 查看工作流日志

如果你想查看工作流的日志，你可以使用 `vela workflow logs` 命令来查看工作流的日志。

:::tip
只有配置了 [op.#Log](../../platform-engineers/workflow/cue-actions#log) 的步骤才会有日志输出。
:::

```bash
vela workflow logs <name>
```

## 调试工作流

如果你想在环境中调试工作流，你可以使用 `vela workflow debug` 命令来调试工作流。

```bash
vela workflow debug <name>
```

:::tip
请查看 [Debug 文档](../../platform-engineers/debug/debug#使用工作流的应用) 来获得更多例子。
:::
