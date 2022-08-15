---
title: 使用 YAML 描述插件应用
---

文档 [自定义插件](./intro) 介绍了插件的基本目录结构，并且介绍了插件中所需要安装的 Kubernetes operator 需要被定义在一个 KubeVela 应用（Application）中。本文档就将会详细介绍如何使用 YAML 格式的应用描述文件来定义这个应用。

应用描述文件通常需要包含两个部分，应用模版文件（template）和 resources/ 目录下的资源文件。

## 应用模版文件 (template.yaml)

应用模板文件就是用来定义这个插件应用的基础框架。你可以通过该文件描述这个应用的特定信息，比如你可以为应用打上特定的标签或注解，当然你也可以直接在该应用模版文件中添加组件，策略和设置工作流。

下面就是一个 YAML 应用模版文件的例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: velaux
  namespace: vela-system
spec:
  components:
    - name: namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: my-namespace
```

在这个例子中，我们定义的应用基础框架中包含了一个` k8s-objects` 类型的组件，组件中只包含了一个 Kubernetes namespace。

> 需要注意的是，即使你在应用模版文件中设置了应用的名称，该设置也不会生效，在启用时应用会统一以 addon-{addonName} 的格式自动命名。

## 目录 resources/ 下的 YAML 资源文件

虽然你可以在应用模版文件中定义这个完整的应用，但这可能会导致应用模版文件过于庞大，所以你也可以选择在 `resources/` 目录下编写单独的文件去定义组件资源。

`resources/` 目录下的 YAML 资源文件中所定义的必须是一些个 Kubernetes 资源对象，这些对象在渲染时会被追加到应用模版文件所定义应用的组件列表中，下面就一个 YAML 资源文件的例子：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
secrets:
  - name: my-secret
```

这个 YAML 中我们定义了一个 service account，经过渲染之后最终的应用为：

```yaml
kind: Application
metadata:
  name: example
  namespace: vela-system
spec:
  components:
    - name: namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: my-namespace
    - name: example-resources
      type: k8s-objects
      components:
        objects:
          - apiVersion: v1
            kind: ServiceAccount
            metadata:
              name: my-service-account
              namespace: default
              secrets:
                - name: my-secret
```

## 例子

一个采用 YAML 应用描述文件的例子是 [OCM control plane](https://github.com/kubevela/catalog/blob/master/addons/ocm-hub-control-plane/template.yaml) 插件。
