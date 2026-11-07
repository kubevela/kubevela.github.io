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
      - name: read-config
        valueFrom: output.config
```

## How the steps work with Config resources

Since v1.12, the steps work with `Config` resources and still read configs created by v1.11:

- `create-config` creates a `Config` in the Application's namespace, or the `namespace` you give.
  The Application owns it: it is updated when the step runs again and deleted with the
  Application. The step waits until the Config is `Available` for the latest change, and fails
  with the controller's reason if the Config goes to `Error`. For example, the step's message in
  the Application's status when a Secret of that name already exists:

  ```console
  failed function call error for deploy: config my-team/db: secret my-team/db already exists and is not owned by this Config
  ```

- If a v1.11 config of the same name exists, `create-config` adopts it in place, unless another
  Application manages it, which is refused.
- `read-config` and `list-config` return Config resources and v1.11 configs, each config once.
  `read-config` waits for a Config that is not `Available` yet, and fails on one in `Error`.
- A sensitive config can be written, but never read: `read-config` fails with
  `the config is sensitive`. See
  [Sensitive templates](../../../reference/config-template.md#sensitive-templates).
- `delete-config` deletes the Config. To delete a Config another Application created, delete it
  through that Application; otherwise that Application creates it again the next time it
  reconciles.
- A template from another namespace may be used only as the
  [Scope](../../../reference/config-template.md#scope-who-may-use-a-template) rules allow. The step
  checks the Application's user when the `AuthenticateApplication` feature gate is on; with it off,
  it may use only a template in the Application's namespace or a system template.
