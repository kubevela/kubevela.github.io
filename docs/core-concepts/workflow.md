---
title:  Workflow
---

Workflow in KubeVela empowers users to glue any operational tasks to automate the delivery of applications to hybrid environments.
It is designed to customize the control logic -- not just blindly apply all resources, but provide more procedural flexiblity.
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
            exportKey: dbConn
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
            parameterKey: mysqlConn
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
  name: step-def
  namespace: default
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
        }

        // apply the component
        apply: op.#ApplyComponent & {
          component: parameter.component
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

            // wait until resource object satisfy given condition. If not, it will reconcile again later
            "wait-\(index)": op.#ConditionalWait & {
              if step["resource-\(index)"].workload.status.ready == "true" {
                continue: true
              }
            }
          }
        }

```

Workflow is modular by design.
Each module is define in a Definition CRD and exposed in K8s API.
It acts as the superglue to quick integrate your favourite tools and processes via CUE language.
You can create your own module with a powerful declarative language and cloud native API.

Next step, you can:

- [Try out hands-on workflow scenarios](../end-user/workflow/apply-component).
- [Read how to create your own Definition module](../platform-engineers/workflow/steps). 
- [Learn the design behind the workflow system](https://github.com/oam-dev/kubevela/blob/master/design/vela-core/workflow_policy.md).
