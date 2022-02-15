---
title: UI-Schema
---

KubeVela designs and implements the UI-Schema specification for the scalability of components, workflow steps, and operation and maintenance feature resources, in the case of variable input parameters, to achieve a more native UI experience.

At present, the UI-Schema specification mainly acts on the data input side and will be extended to the data visualization side in the future.

### How UI-Schema works

The components, workflow steps, and operation and maintenance feature types with different UI-Schema working principles are defined through CUE, which we call XDefinition, and almost every definition includes the definition of input parameters. for example:

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

In the above example, the user input parameter is `replicas`.

In the UI we want the user to be able to set the number of replicas via a number input form.

![ui schema](../resources/ui-schema.jpg)

Its workflow is in the figure above. The API Schema is generated through the defined CUE, and then the default UI Schema is generated through the API Schema. If there is a custom UI Schema, the default configuration is patched with the custom configuration. The UI renders the front-end page based on the final UI Schema.

The spec are as follows:

```
- jsonKey: string         field name
  label: string           show name in UI
  description: string     help info
  uiType: string          the react component type in UI
  sort: int               sort number
  validate:               data validate rule.
    required: bool
    max: int
    min: int
    pattern: string
    options:              Optional, for select forms
    - label: string
      value: string
  subParameters:
    ...
```

### Supported react component types

#### Basic form

- [x] Input
- [x] Number
- [x] Select
- [x] Switch
- [x] Radio
- [ ] DatePicker
- [ ] Textarea
- [x] Password

#### Business form

- [x] Ignore: There are subordinate fields, and the current field is not displayed.
- [ ] ClusterSelect
- [ ] EnvSelect
- [x] SecretSelect
- [x] SecretKeySelect
- [ ] ComponentSelect
- [ ] ImageInput
- [ ] ClassStorageSelect
- [ ] PVCSelect
- [x] CPUNumber
- [x] MemoryNumber
- [x] K8sObjectsCode

#### Combination form

- [x] KV
- [x] Strings
- [x] Structs
- [x] Group: render as a titled container
- [x] InnerGroup
- [ ] TabGroup

### How to expand

UI-Schema mainly extends front-end react components, refer to [https://github.com/oam-dev/velaux/tree/main/src/extends](https://github.com/oam-dev/velaux/tree/main/src/extends)
