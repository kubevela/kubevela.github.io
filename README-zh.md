欢迎加入中文翻译 SIG 钉群：

![alt](https://raw.githubusercontent.com/kubevela/kubevela.io/main/static/img/zh-CN-dingding-group.png)


参与翻译活动的基本流程如下：
- 任务领取：在 [标记了 i18n/zh 标签的 Issues](https://github.com/kubevela/kubevela.io/labels/i18n%2Fzh) 下面留言即可认领任务；
- 提交：参与人员提交 PR 等待 review；
- 审阅：maintainer 审阅 PR；
- 终审： 对 review 后的内容进行最后确认；
- 合并：merge 到 master 分支，任务结束。

![翻译流程](https://tvax1.sinaimg.cn/large/ad5fbf65gy1gpdbriuraij20k20l6dhm.jpg)


### 参与指南

下面具体介绍参与翻译的具体工作。

#### 准备工作

- 账号：你需要先准备一个 GitHub 账号。使用 Github 进行翻译任务的认领和 PR 提交。
- 仓库和分支管理
  - fork [kubevela.io](https://github.com/kubevela/kubevela.io) 的仓库，并作为自己仓库的上游： `git remote add upstream https://github.com/kubevela/kubevela.io.git`
  - 在自己的仓库，也就是 origin 上进行翻译；
  - 一个任务新建一个 branch
- Node.js 版本 >= 12.13.0 （可以使用 `node -v` 命令查看）
- Yarn 版本 >= 1.5（可以使用 `yarn --version` 命令查看）

#### 参与步骤

**Step1：任务浏览**

在[标记了 i18n/zh 标签的 Issues](https://github.com/kubevela/kubevela.io/labels/i18n%2Fzh) 中浏览有哪些需要翻译的任务。

**Step2：任务领取**

在对应 Issue 下面留言并认领任务。注意：为保证质量，同一译者只能同时认领三个任务，完成后才可继续认领。

**Step3：本地构建和预览**

```shell
# 命令安装依赖
$ yarn install
# 本地运行中文文档
$ yarn run start -- --locale zh
yarn run v1.22.10
warning From Yarn 1.0 onwards, scripts don't require "--" for options to be forwarded. In a future version, any explicit "--" will be forwarded as-is to the scripts.
$ docusaurus start --locale zh
Starting the development server...
Docusaurus website is running at: http://localhost:3000/zh/
✔ Client
  Compiled successfully in 7.54s
ℹ ｢wds｣: Project is running at http://localhost:3000/
ℹ ｢wds｣: webpack output is served from /zh/
ℹ ｢wds｣: Content not from webpack is served from /Users/saybot/own/kubevela.io
ℹ ｢wds｣: 404s will fallback to /index.html
✔ Client
  Compiled successfully in 137.94ms
```
请勿修改 `/docs` 目录下内容，中文文档在 `/i18n/zh/docusaurus-plugin-content-docs` 中，之后就可以在 http://localhost:3000/zh/ 中进行预览了。

**Step4：提交 PR**

确认翻译完成就可以提交 PR 了，注意：为了方便 review 每篇翻译为**一个 PR**，如果翻译多篇请 checkout **多个分支**并提交多个 PR。

**Step5：审阅**

由 maintainer 对 PR 进行 review。

**Step6：任务完成**

翻译合格的文章将会 merge 到 [kubevela.io](https://github.com/kubevela/kubevela.io) 的 main 分支进行发布。


### 翻译要求

- 数字和英文两边是中文要加空格。
- KubeVela 统一写法。K 和 V 大写。
- 翻译完请先阅读一遍，不要出现遗漏段落，保证文章通顺、符合中文阅读习惯。不追求严格一致，可以意译。review 的时候也会检验。
- 你和您不要混用，统一使用用 **“你”**。
- 不会翻译的词汇可以不翻译，可以在 PR 中说明，review 的时候会查看。
- Component、Workload、Trait 这些 OAM/KubeVela 里面定义的专属概念不要翻译，我们也要加强这些词汇的认知。可以在一篇新文章最开始出现的时候用括号加上中文翻译。
- 注意中英文标点符号。
- `PR` 命名规范 `Translate <翻译文件相对路径>`，如 `Translate i18n/zh/docusaurus-plugin-content-docs/current/introduction.md`。