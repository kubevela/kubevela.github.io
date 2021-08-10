---
title:  Workflow
---

Workflow in KubeVela empowers users to customize control logic to handle operational tasks.
Compared to Components and Traits which are rendered into declarative states, Workflow contains procedural tasks that would be executed step-by-step.

Workflow is modular by design. It automates the delivery of applications to hybrid environments,
by integrating different tasks via Definition CRDs, and integrating different tools in a Definition via CUE language.

Workflow contains multiple steps and each step instantiates from a Definition.
By running a workflow of an application, KubeVela controller will orchestrate the flow of data between workflow steps.

Here's an example:

```yaml
kind: Application
spec:
  components: ...

  # workflow is used to customize the control logic.
  # If workflow is specified, Vela won't apply any resource, but provide rendered resources in a ConfigMap, referenced via AppRevision.
  # workflow steps are executed in array order, and each step:
  # - will have a context in annotation.
  # - should mark "finish" phase in status.conditions.
  workflow:

    # suspend can manually stop the workflow and resume. it will also allow suspend policy for workflow.
    suspend:
      manual: true

    steps:

    # blue-green rollout
    - type: blue-green-rollout
      properties:
        partition: "50%"

    # traffic shift
    - type: traffic-shift
      properties:
        partition: "50%"

    # promote/rollback
    - type: rollout-promotion
      properties:
        manualApproval: true
        rollbackIfNotApproved: true
```

To learn more about Workflow:

- Learn how to use Workflow via user scenarios in [end user doc](../end-user/workflow/apply-component).
- Learn how to define your own workflow task in [platform admin doc](../platform-engineers/workflow/steps). 
- Learn the design behind the workflow system in [design doc](https://github.com/oam-dev/kubevela/blob/master/design/vela-core/workflow_policy.md).
