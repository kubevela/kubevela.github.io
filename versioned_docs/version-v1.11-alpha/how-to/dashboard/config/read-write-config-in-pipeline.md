---
title: Read And Write Config In Pipeline
---

After you read the [Connect Helm Repository](./helm-repo.md) and the [Connect Image Registry](./image-registry.md) guides, you learned to manage the config via CLI and UI. In this guide, we will introduce how to read and write the config in the Pipeline or Workflow.

## Why do we need to manage the config in the Pipeline?

There are many scenarios, such as:

* Deploy a DB application and write the connector info to the config and share it with other applications.
* Read the shared config to deploy the application.
* Base the config to orchestrate the Pipeline and Workflow.

## The Step Type References

* [Create Config](../../../end-user/workflow/built-in-workflow-defs.md#create-config)

* [List Configs](../../../end-user/workflow/built-in-workflow-defs.md#list-config)

* [Read Config](../../../end-user/workflow/built-in-workflow-defs.md#read-config)

* [Delete Config](../../../end-user/workflow/built-in-workflow-defs.md#delete-config)

All steps are suitable for the Workflow and Pipeline.

## Create and read config without the template

In the workflow, if we only want to share the config content and can not need to check the content validity, we could create the config without the template.

```yaml
kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: create-config
  namespace: "config-e2e-test"
spec:
  components: []
  workflow:
    steps:
    - name: write-config
      type: create-config
      properties:
        name: test
        config: 
          key1: value1
          key2: 2
          key3: true
          key4: 
            key5: value5
---

kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: read-config
  namespace: "config-e2e-test"
spec:
  components: []
  workflow:
    steps:
    - name: read-config
      type: read-config
      properties:
        name: test
      outputs:
      - fromKey: config
        name: read-config
```
