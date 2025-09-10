---
title: 查看应用部署的资源列表
---

如果你希望查询应用在各集群部署了哪些资源，可通过下述操作方式查询。

## 通过 UI 查询

进入应用部署环境视图，默认进入状态展示页面，在该页面中即可查询到应用实际分发的资源列表，如果应用在更新过程中，资源列表会包括历史和当前版本。

![app-resources](https://kubevela.io/images/1.3/app-resources.jpg)

在该页面中同时展示了组件状态和整体的交付状态。

## 通过 CLI 查询

```bash
$ vela status <app_name> -n <namespace> --tree
```

基于如上命令可以查询应用部署的资源清单。

### 下一步

* [查看应用部署版本](./get-application-revision.md)