---
title: 代码规范
---

在本节中，你将学到与 KubeVela 项目相关的各种代码的代码惯例。不需要一次性学完全篇，但在编码之前，应该提前阅读编码相关的部分。

* [Go 代码规范](#go-代码规范)

* [Bash 或脚本规范](#bash-或脚本规范)

* [API 规范](#api-规范)

* [测试规范](#测试规范)

* [目录和文件规范](#目录和文件规范)

* [日志规范](#日志规范)

## Go 代码规范

* [Go 代码评审建议](https://github.com/golang/go/wiki/CodeReviewComments)

* [高效 Go 编码](https://golang.org/doc/effective_go.html)

* 了解并避免 [Go 的使用误区](https://gist.github.com/lavalamp/4bd23295a9f32706a48f)

* 代码注释

  * [Go 的注释惯例](https://go.dev/blog/godoc)

  * 在容易让人感到疑惑的代码处写下注释将会带来很大帮助。

* 命令行标志应该使用破折号，而不是下划线。

* API

  * 根据 RFC3986，URLs 是“大小写敏感”的。KubeVela 对 API URLs 使用蛇形法。
    
    * 例如：`POST /v1/cloud_clusters`

* 命名

  * 在命名接口时，请考虑包的名称，避免重复使用。

    * 例如：`storage.Interface` 比 `storage.StorageInterface` 好。

  * 在包名中不要使用大写字母、下划线或破折号。

  * 在给包命名时，请考虑父目录的名称。

    * 例如 pkg/controllers/autoscaler/foo.go 包名是 `package autoscaler` 而不是 `package autoscalercontroller`。
    * 包名 `package foo` 应该和 .go 文件存在的目录名称相匹配。
    * 如果引入包的使用者需要消除歧义，可以使用不同的名称来引入包。

  * 锁变量应该被称为 `lock`，注意不应使用嵌入结构体来使用锁（使用示例 `lock sync.Mutex`）。当存在多个锁时，按照 Go 的惯例给每个锁起一个独特的名称 —— `stateLock`，`mapLock` 等。

## Bash 或脚本规范
  
  * https://google.github.io/styleguide/shell.xml

  * 请确保构建、发布、测试和集群管理脚本能在 macOS 上运行。

## API 规范
  
  * KubeVela 的 API 遵循 Kubernetes 的规范。

    * [API 变化](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api_changes.md)

    * [API 规范](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)

## 测试规范

  * 所有新的包和大多数新的重要功能必须有单元测试。

  * 表驱动的测试是测试多个场景或输入的首选；例如 [TestNamespaceAuthorization](https://git.k8s.io/kubernetes/test/integration/auth/auth_test.go)。

  * 单元测试必须在 macOS 和 Windows 平台上通过，如果有使用 Linux 的独有命令，这个测试用例就必须在 windows 上跳过或输出信息（当运行 Linux 的独有命令时跳过测试用例更好，当你的代码不能在 Windows 上编译时必须输出信息）。

  * 避免设置太短的等待时间（或不等待），通过 Expect 异步检测目标事件（例如，使用 Expect 等待 1 秒并检测 Pod 是否运行）。使用等待和重试完成测试代码。

  * 重要的功能需要有集成（test/integration）或端到端（e2e）测试。

  * 测试代码需要覆盖新的 vela cli 命令和现有命令的主要功能。

更多细节请参考[测试原理](./principle-of-test.md)。

## 目录和文件规范

* 避免包过度扩张。需要为新包找到一个合适的子目录。

  * 没有合适的子目录的包请放到 pkg/util 的子目录中作为新的包。

* 避免命名为 util。 “util” 的含义模糊不清。应该使用一个描述所需功能的名字。例如，处理等待操作的实用功能在 “wait” 包中包含了 Poll 功能。所以全称是 wait.Poll。

* 所有的文件名都应该是小写的。

* Go 源文件和目录使用下划线，而不是破折号。

  * 包目录一般尽量避免使用分隔符（当包是多个单词时，通常在嵌套的子目录中）。

* 文档目录和文件名应该使用破折号而不是下划线。

* 根据针对角色，部署应用程序的用户或者集群管理员，将系统功能说明的例子放到 `/docs/user-guide` 或 `/docs/admin` 下，。实际的应用案例放到 `/examples` 目录下。

  * 案例还应该说明[配置和使用系统的最佳做法](https://kubernetes.io/docs/concepts/configuration/overview/)。

* 第三方代码

  * 正常的第三方依赖的 Go 代码使用 [go modules](https://github.com/golang/go/wiki/Modules) 来管理。

  * 其他第三方代码属于 `/third_party`

    * fork 的第三方 Go 代码归入 `/third_party/forked`
    * fork 的 golang stdlib 代码放在 `/third_party/forked/golang` 中。

  * 第三方代码必须包括许可证。

  * 也包括修改过的第三方代码和部分摘录。

## 日志规范

### 结构化日志

我们推荐使用 `klog.InfoS` 来构造日志。`msg` 参数的首字母要大写。而 `name` 参数应该始终使用小写首字母的驼峰命名法，例：`lowerCamelCase`。

```golang
// func InfoS(msg string, keysAndValues ...interface{})
klog.InfoS("Reconcile traitDefinition", "traitDefinition", klog.KRef(req.Namespace, req.Name))
// outputs: 
// I0605 10:10:57.308074 22276 traitdefinition_controller.go:59] "Reconcile traitDefinition" traitDefinition="vela-system/expose"
```

### 为 Kubernetes 对象使用 `klog.KObj` 和 `klog.KRef`

`klog.KObj` 和 `klog.KRef` 可以使 kubernetes 对象的输出一致。

```golang
klog.InfoS("Start to reconcile", "appDeployment", klog.KOObj(appDeployment))
// 在记录 Kubernetes 对象的信息时，KRef 被用来创建 ObjectRef，但不能访问 metav1.Object
klog.InfoS("Reconcile application", "application", klog.KRef(req.Namespace, req.Name))
```

### 日志级别

[logs.go](https://github.com/kubevela/kubevela/blob/master/pkg/controller/common/logs.go) 包含了KubeVela的日志级别，你可以通过 `klog.V(level)` 设置日志级别。

```golang
//你可以使用 klog.V(common.LogDebug) 来打印调试日志
klog.V(common.LogDebug).InfoS("Successfully applied components", "workloads", len(workloads))
```

更多细节在[结构化日志指南](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-instrumentation/migration-to-structured-logging.md#structured-logging-in-kubernetes)。

## 提示和格式化

为了整个 Go 代码库的一致性，所有代码都需要通过 linter 检查。

要运行所有的 linters，请使用 `reviewable` 的 Makefile target：

```shell script
make reviewable
```

该命令在进行一些 lint 检查的同时会整洁代码。所以请检查命令运行完成后的所有修改。