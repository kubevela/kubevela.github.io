---
title: UI-Schema
---

KubeVela 针对组件、工作流步骤、运维特征资源的可扩展性，在可变输入参数项的情况下，为了实现较为原生的 UI 体验，设计并实现了 UI-Schema 规范。

目前 UI-Schema 规范主要作用于数据输入侧，未来将扩展到数据可视化侧。

### UI-Schema 作用原理

不同的组件、工作流步骤、运维特征类型通过 CUE 进行定义，我们称其为 XDefinition, 几乎每一种定义都包括了输入参数的定义。比如：

```cue
scaler: {
	type: "trait"
	annotations: {}
	labels: {}
	description: "Manually scale K8s pod for your workload which follows the pod spec in path 'spec.template'."
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["*"]
	}
}
template: {
	parameter: {
		// +usage=Specify the number of workload
		replicas: *1 | int
	}
	// +patchStrategy=retainKeys
	patch: spec: replicas: parameter.replicas
}
```

如上的例子，需要用户输入参数为`replicas`，代表副本数量。

在 UI 中我们希望用户可以通过一个数字输入表单来设置副本数。

![ui schema](../resources/ui-schema.jpg)

它的工作流程如上图所示，通过定义的 CUE 生成 API Schema，然后再通过 API Schema 生成 默认的 UI Schema，如果存在自定义的 UI Schema，使用自定义的配置对默认配置进行更新。UI 基于最终的 UI Schema 渲染出前端页面。

UI Schema 包含的字段如下：

```
- jsonKey: string 字段名称
  label: string UI 显示名称
  description: string 描述信息
  uiType: string UI 组件类型
  sort: int 排序
  validate:  数据校验规则
    required: bool 是否必填
    max: int 最大值
    min: int 最小值
    regular: string 正则校验规则
    options: 可选项，适用于选择性表单
    - label: string 可选项显示名称
      value: string 可选项值
  subParameters: 下级参数
    ...
```

### 已支持的类型

#### 基础表单

- [x] Input: 基础 Input 表单
- [x] Number: 数字输入表单
- [x] Select: 固定可选值表单
- [x] Switch: 开关选择器
- [x] Radio: 单选表单
- [ ] DatePicker: 时间选择框
- [ ] Textarea: 多行文本输入框
- [x] Password: 密码输入表单

#### 业务表单

- [x] Ignore: 当前字段存在下级字段，本级不显示。
- [ ] ClusterSelect: 集群选择器
- [ ] EnvSelect: 应用下环境选择器 （参数：appName）
- [x] SecretSelect: 目标集群密钥选择器 （参数：clusterName）
- [x] SecretKeySelect: Secret 资源中的 Key 选择，它必须与 SecretSelect 表单级联存在。 （参数：secretKeys）
- [ ] ComponentSelect: 应用下组件选择器 （参数：appName）
- [ ] ImageInput: 镜像输入框（针对镜像进行检测）
- [ ] ClassStorageSelect：目标集群存储类型选择器 （参数：clusterName）
- [ ] PVCSelect: 目标集群的存储卷选择 （参数：clusterName, namespace）
- [x] CPUNumber: cpu 数值输入框 支持小数点后 2 位，默认单位为 Core
- [x] MemoryNumber: 内存数值输入框 2^n 数值输入方式，默认单位为 MB
- [x] K8sObjectsCode: kubernetes yaml 编辑框，支持上传 yaml，输出多个 k8s 资源对象。

#### 组合表单

- [x] KV: KV 组合输入框
- [x] Strings: 多行 Input 输入框
- [x] Structs: 多个表单组合成单行 形成 多行输入表单。
  > 支持基于 Options 定义差异性子集，即不同的下级属性组成不同的表单集合。
  > AddByKV:env.name|env.value
  > AddBySecret:env.name|env.valueFrom
- [x] Group: 组合（渲染为一个带标题的容器)
- [x] InnerGroup: 行内组合容器
- [ ] TabGroup: 条件判断 Tab，只有一组生效。

### 如何扩展

UI-Schema 主要扩展的是前端组件，参考 [https://github.com/oam-dev/velaux/tree/main/src/extends](https://github.com/oam-dev/velaux/tree/main/src/extends)
