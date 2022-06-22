---
title: 发布流程及周期
---

开发 KubeVela 将遵循以下流程：

* Maintainer 指定一系列功能和增强并通过创建 GitHub 里程碑（GitHub milestone）跟进工作进度。
* 尽可能避免推迟发布。因此在无法按时完成时将某个功能时，我们会将其移至下一次发布。
* 每 **2 个月**进行一次新发布。
* 重要的错误修复将会通过 cherry pick 的方式提交进 release 分支，并尽快通过补丁版本的方式发布。我们将会维护最新的 **2 个 release**。

![develop-flow](../resources/develop-code-flow.jpg)

## 发布计划

我们将通过 [GitHub 里程碑](https://github.com/kubevela/kubevela/milestones) 制定发布计划并持续跟进。每个发布里程碑中将会包括两类 issue：

* Maintainer 计划完成的重点 issues。Maintainers 将根据时间精力确定下一次发布前他们致力于完成的功能。通常来说，issue 可以会被任意一个 maintainer 离线添加，最终在贡献者会议或 [社区会议](https://github.com/kubevela/community#community-meetings) 中敲定。此类 issue 将会被分配给计划实现或测试它的 maintainer。
* 社区贡献者贡献的 nice-to-have 功能改进或 nice-to-have issue （通常是不紧急且足够小的功能增强）。Maintainer 不会致力于实现这些 issue，但会逐一审查来自社区的 PR。

里程碑会清晰地描述最重要的那些功能和预期完成日期。这将明确地告诉终端用户下一次发布的时间及内容。

除下一个里程碑外，我们也将维护未来的发布里程碑草案。

## 社区贡献

我们十分感谢来自优秀的社区的大量贡献。然而，审查和测试这些 PR 是大量的计划外工作，因此我们不能保证能在一次发布周期内及时地审查社区贡献（特别是那些特别大或复杂的）。Maintainer 将自行决定是否参与进贡献者的 PR，因此他们会自己给自己分配 PR 从而开始审查、合并，并在之后进行放行测试。

## 放行测试

在 release 分支创建前，我们将有 2 个星期的代码冻结期。在代码冻结期间，我们将不会合并任何功能性 PR 而只会修复错误。

Maintainer 将在每次发布前进行测试并修复这些最后的 issue 。