---
title:  Workflow
---

Workflow in KubeVela empowers users to glue any operational tasks to automate the delivery of applications to hybrid environments.
It is designed to customize the control logic -- not just blindly apply all resources, but provide more procedural flexiblity.
This provides solutions to build more complex operations, e.g. workflow suspend, approval gate, data flow, multi-stage rollout, A/B testing.

Workflow is modular by design.
Each module is defined by a Definition CRD and exposed via K8s API.
Under the hood, it uses a powerful declarative language -- CUE as the superglue for your favourite tools and processes.

Here is an example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  components:
    - name: database
      type: helm
      properties:
        repoUrl: chart-repo-url
        chart: mysql

    - name: web
      type: helm
      properties:
        repoUrl: chart-repo-url
        chart: my-web

  # Deploy the database first and then the web component.
  # In each step, it ensures the resource has been deployed successfully before jumping to next step.
  # The connection information will be emitted as output from database and input for web component.
  workflow:

    # Workflow contains multiple steps and each step instantiates from a Definition.
    # By running a workflow of an application, KubeVela will orchestrate the flow of data between steps.
    steps:
      - name: deploy-database
        type: apply-and-wait
        outputs:
          - name: db-conn
            exportKey: outConn
        properties:
          component: database
          resourceType: StatefulSet
          resourceAPIVersion: apps/v1beta2
          names:
            - mysql

      - name: deploy-web
        type: apply-and-wait
        inputs:
          - from: db-conn # input comes from the output from `deploy-database` step
            parameterKey: dbConn
        properties:
          component: web
          resourceType: Deployment
          resourceAPIVersion: apps/v1
          names:
            - my-web

---
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-and-wait
spec:
  schematic:
    cue:
      template: |
        import (
        	"vela/op"
        )
        parameter: {
          component: string
          names: [...string]
          resourceType: string
          resourceAPIVersion: string
          dbConn?: string
        }
        // apply the component
        apply: op.#ApplyComponent & {
          component: parameter.component
          if dbConn != _|_ {
            spec: containers: [{env: [{name: "DB_CONN",value: parameter.dbConn}]}]
          }
        }
        // iterate through given resource names and wait for them
        step: op.#Steps & {
          for index, resource in parameter.names {
            // read resource object
            "resource-\(index)": op.#Read & {
              value: {
                kind: parameter.resourceType
                apiVersion: parameter.resourceAPIVersion
                metadata: {
                  name: resource
                  namespace: context.namespace
                }
              }
            }
            // wait until resource object satisfy given condition.
            "wait-\(index)": op.#ConditionalWait & {
              if step["resource-\(index)"].workload.status.ready == "true" {
                continue: true
              }
            }
          }
        }
        outConn: apply.status.address.ip
```

Here are more detailed explanation of the above example:

- There is a WorkflowStepDefinition that defines the templated operation process:
  - It applies the specified component.
    It uses the `op.#ApplyComponent` action which applies all resources of a component.
  - It then waits all resources of given names to be ready.
    It uses `op.#Read` action which reads a resource into specified key,
    and then uses `op#ConditionalWait` which waits until the `continue` field becomes true.
- There is an Application that uses the predefined Definition to initiate delivery of two service components:
  - It first does `apply-and-wait` on `database` component.
    This will invoke the templated process as defined above with given properties.
  - Once the first step is finished, it outputs the value of the `outConn` key to output named `db-conn`,
    which basically means any steps can use the output `db-conn` as input later.
  - The second step that takes an input `db-conn` from previous output will
    get the value of `db-conn` and fill it into the parameter key `dbConn`.
  - It then does `apply-and-wait` on `web` component.
    This will invoke the same templated process as before except that this time the `dbConn` field will have value.
    This basically means the container env field will be rendered as well.
  - Once the second step is finished, the workflow will run to completion and stop.

So far we have introduced the basic concept of KubeVela Workflow. For next steps, you can:

- [Try out hands-on workflow scenarios](../end-user/workflow/apply-component).
- [Read how to create your own Definition module](../platform-engineers/workflow/steps). 
- [Learn the design behind the workflow system](https://github.com/oam-dev/kubevela/blob/master/design/vela-core/workflow_policy.md).
