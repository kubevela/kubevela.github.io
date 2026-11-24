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

## Which namespace a step works in

From v1.11.2, the config steps in an Application's workflow work on configs in the Application's own namespace. The `namespace` property defaults to it, and another namespace is refused, with two exceptions:

* `read-config` and `list-config` may read the shared system configs in `vela-system`: configs made from a system-scoped template, as platform configs such as Helm repositories and image registries are. They can't create or delete them.
* With the `AuthenticateApplication` feature gate on, a step may work in another namespace if the user the Application runs as may do the same to Secrets there (`get`, `list`, `create` or `delete`), because a config is stored as a Secret.

Otherwise the step fails with a message like `config team-b/db is outside the application's namespace team-a: it may get it only if its user can (grant get on secrets in namespace team-b)`. Before v1.11.2, a step could work on configs in any namespace.

This applies only to Applications. A Pipeline runs as a WorkflowRun, which has no Application, so its config steps aren't restricted: `namespace` defaults to the WorkflowRun's namespace and may name any other.

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
