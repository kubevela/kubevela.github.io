---
title: Deploy an Advanced Application
---

This guide takes one application to two environments: it deploys to development, waits for you to approve, and then deploys to production with more replicas and different settings. Along the way it introduces **policies** and **workflows**.

It follows on from [Deploy Your First Application](../quick-start.md).

## Policies and workflows

[Components and traits](../quick-start.md#applications-components-and-traits) say what to run and how. Two more parts of an Application say where and when:

- **Policies** describe where and with what changes an application is deployed. A [topology](../end-user/policies/references.md#topology) policy picks the clusters and namespace; an [override](../end-user/policies/references.md#override) policy changes component properties or traits for one environment. The [policies reference](../end-user/policies/references.md) lists the rest.
- **The workflow** is the ordered list of steps that delivers the application. A [deploy](../end-user/workflow/built-in-workflow-defs.md#deploy) step deploys with the policies it names; a [suspend](../end-user/workflow/built-in-workflow-defs.md#suspend) step waits until someone resumes it. Others send notifications, call webhooks or group steps; see the [workflow steps reference](../end-user/workflow/built-in-workflow-defs.md).

Put together: the same component goes to development with one set of policies, the workflow waits, and then it goes to production with another set.

## Create the production namespace

The production deployment goes to a `prod` namespace, which must exist before deploying:

```bash
kubectl create namespace prod
```

## Create the application

Save the following as `advanced-app.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: advanced-app
  namespace: default
spec:
  components:
    - name: backend-api
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true
        env:
          - name: APP_ENV
            value: "development"
      traits:
        - type: scaler
          properties:
            replicas: 1

  policies:
    # Where development runs
    - name: env-development
      type: topology
      properties:
        clusters: ["local"]
        namespace: "default"

    # Where production runs
    - name: env-production
      type: topology
      properties:
        clusters: ["local"]
        namespace: "prod"

    # What changes in production
    - name: production-configs
      type: override
      properties:
        components:
          - name: backend-api
            properties:
              env:
                - name: APP_ENV
                  value: "production"
            traits:
              - type: scaler
                properties:
                  replicas: 3

  workflow:
    steps:
      - name: deploy-to-dev
        type: deploy
        properties:
          policies: ["env-development"]

      - name: manual-approval
        type: suspend
        properties:
          message: "Please review the development deployment before promoting to production"

      - name: deploy-to-prod
        type: deploy
        properties:
          policies: ["env-production", "production-configs"]
```

| Part | What it does |
| --- | --- |
| `backend-api` | One web service with 1 replica and `APP_ENV=development`. |
| `env-development` | Deploys to the `default` namespace of the `local` cluster, the one KubeVela runs in. |
| `env-production` | Deploys to the `prod` namespace of the same cluster. |
| `production-configs` | In production, sets `APP_ENV=production` and 3 replicas. |
| `deploy-to-dev` | Deploys with the development policy. |
| `manual-approval` | Waits for you, showing its message. |
| `deploy-to-prod` | Deploys with the production policies. |

## Deploy to development

```bash
vela up -f advanced-app.yaml
```

The workflow deploys to development and stops at the approval step:

```bash
vela status advanced-app -n default
```

<details>
<summary>expected output</summary>

```console
About:

  Name:      	advanced-app
  Namespace: 	default
  Created at:	2026-11-22 22:04:28 +0000 GMT
  Healthy:   	✅
  Details:   	workflowSuspending

Workflow:

  mode: StepByStep-DAG
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id: 5yz1bd5o7t
    name: deploy-to-dev
    type: deploy
    phase: succeeded
  - id: os4jpov5sk
    name: manual-approval
    type: suspend
    phase: suspending
    message: Please review the development deployment before promoting to production

Services:

  - Name: backend-api
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:1/1
    Traits:
      Type: scaler
      Health: ✅
```
</details>

Check the development deployment at http://localhost:8001:

```bash
vela port-forward advanced-app -n default 8001:8000
```

## Approve production

Happy with development? Resume the workflow:

```bash
vela workflow resume advanced-app -n default
```

<details>
<summary>expected output</summary>

```console
Successfully resume workflow: advanced-app
```
</details>

The workflow carries on to `deploy-to-prod`. Check the status again:

```bash
vela status advanced-app -n default
```

<details>
<summary>expected output</summary>

```console
...
Services:

  - Name: backend-api
    Cluster: local
    Namespace: prod
    Type: webservice
    Health: ✅
      Message: Ready:3/3
    Traits:
      Type: scaler
      Health: ✅

  - Name: backend-api
    Cluster: local
    Namespace: default
    Type: webservice
    Health: ✅
      Message: Ready:1/1
    Traits:
      Type: scaler
      Health: ✅
```
</details>

One component, two deployments: 1 replica in `default`, 3 in `prod`. To see the production settings:

```bash
kubectl get deployment backend-api -n prod -o jsonpath='{.spec.template.spec.containers[0].env}'
```

```console
[{"name":"APP_ENV","value":"production"}]
```

And to open production at http://localhost:8002:

```bash
kubectl port-forward -n prod svc/backend-api 8002:8000
```

## Run it again

Change anything in `advanced-app.yaml` and run `vela up` again: the workflow starts from the top, deploys to development, and waits for your approval before production changes. To run the workflow again without a change:

```bash
vela workflow restart advanced-app -n default
```

## Clean up

```bash
vela delete advanced-app -n default -y
kubectl delete namespace prod
```

## Troubleshooting

<details>
<summary>The workflow is still suspended</summary>

That's the approval step waiting. `vela status advanced-app -n default` shows `phase: suspending` on `manual-approval`; resume it with `vela workflow resume advanced-app -n default`.
</details>

<details>
<summary>The production deployment fails</summary>

Check the `prod` namespace exists with `kubectl get namespace prod`, and look at the resources behind each environment:

```bash
vela status advanced-app -n default --tree --detail
```
</details>

<details>
<summary>Production has the development settings</summary>

Check `deploy-to-prod` names both `env-production` and `production-configs`, and that the override's component `name` matches the component (`backend-api`).
</details>

## Next steps

- [Read External Data with Sources](./sources.md): new in 1.12, read values the application doesn't own.
- [Create Your First Component](./first-component.md): write your own component type.
- [Multi-cluster delivery](../case-studies/multi-cluster.md): the same idea across Kubernetes clusters.
- [Version control](../end-user/version-control.md): publish versions of an application and roll back to them.
- [GitOps](../case-studies/gitops.md): deliver applications from Git.
- References: [components](../end-user/components/references.md), [traits](../end-user/traits/references.md), [policies](../end-user/policies/references.md), [workflow steps](../end-user/workflow/built-in-workflow-defs.md).
