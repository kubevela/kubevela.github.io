---
title:  模块版本控制
---

当系统中的组件类型和运维功能变化时，也会产生对应的版本号。

* 查看组件类型的版本变化

```shell
$  kubectl get definitionrevision -l="componentdefinition.oam.dev/name=webservice" -n vela-system
NAME            REVISION   HASH               TYPE
webservice-v1   1          3f6886d9832021ba   Component
webservice-v2   2          b3b9978e7164d973   Component
```

* 查看运维能力的版本变化

```shell
$ kubectl get definitionrevision -l="trait.oam.dev/name=rollout" -n vela-system
NAME         REVISION   HASH               TYPE
rollout-v1   1          e441f026c1884b14   Trait
```

控制版本最简单的办法是每次都以固定的后缀生成一个新的 Definition.

## 在应用中指定组件类型和运维功能的版本

你也可以使用 KubeVela 系统自动生成的版本记录。在应用中指定使用的组件类型、运维能力的版本，加上后缀 `@version` 即可。在下面的例子里，你可以指定 `webservice@v1` 表示一直使用 `webservice`这个组件的 v1 版本。

这一动作也可以通过编写控制的 webhook 自动完成。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
  - name: server
    type: webservice@v1
    properties:
      image: stefanprodan/podinfo:4.0.3
```

通过这种方式，系统管理员对组件类型和运维功能的变更就不会影响到你的应用，否则每次应用的更新都会使用最新的组件类型和运维功能。