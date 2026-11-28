---
title: Deploy with the API
description: Create an application in VelaUX, deploy it to an environment and read its status, all from the shell.
---

Everything the VelaUX console does goes through its REST API, so a script can do it too. This creates a web service in the `default` project, deploys it to the `default` environment, and reads back its status and revisions: the same as the [Quick Start](../getting-started/quick-start.md), from the shell.

## Before you start

- VelaUX installed and its administrator created ([Install VelaUX](../getting-started/install.md)); this page uses `admin` / `VelaUX12345`.
- VelaUX port-forwarded to `127.0.0.1:8000`:

  ```shell
  vela port-forward -n vela-system addon-velaux 8000:8000
  ```

- `curl` and [`jq`](https://jqlang.github.io/jq/).

## 1. Sign in

```shell
VELAUX=http://127.0.0.1:8000
TOKEN=$(curl -s -X POST $VELAUX/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "admin", "password": "VelaUX12345"}' | jq -r .accessToken)
```

The token lasts an hour. Every other call sends it as `Authorization: Bearer $TOKEN`.

## 2. Find the environment

```shell
curl -s $VELAUX/api/v1/envs -H "Authorization: Bearer $TOKEN" \
  | jq '.envs[] | {name, namespace, project: .project.name, targets: [.targets[]?.name]}'
```

Expected output:

```json
{
  "name": "default",
  "namespace": "default",
  "project": "default",
  "targets": [
    "default"
  ]
}
```

The `default` environment deploys to the `default` target, which is the `default` namespace of the cluster VelaUX runs in.

## 3. Create the application

The component's `properties` is a JSON string, the same properties the `webservice` form fills in:

```shell
curl -s -X POST $VELAUX/api/v1/applications \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{
    "name": "hello-api",
    "project": "default",
    "envBinding": [{"name": "default"}],
    "component": {
      "name": "hello-api",
      "componentType": "webservice",
      "properties": "{\"image\": \"oamdev/hello-world\", \"ports\": [{\"port\": 8000, \"expose\": true}]}"
    }
  }' | jq '{name, project: .project.name}'
```

Expected output:

```json
{
  "name": "hello-api",
  "project": "default"
}
```

Binding the environment gave the application a workflow for it, named `workflow-<environment>`:

```shell
curl -s $VELAUX/api/v1/applications/hello-api/workflows -H "Authorization: Bearer $TOKEN" \
  | jq '.workflows[] | {name, envName, steps: [.steps[].type]}'
```

Expected output:

```json
{
  "name": "workflow-default",
  "envName": "default",
  "steps": [
    "deploy"
  ]
}
```

## 4. Deploy

```shell
curl -s -X POST $VELAUX/api/v1/applications/hello-api/deploy \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"workflowName": "workflow-default", "triggerType": "api", "note": "first deploy"}' \
  | jq '{version, status, envName, record: .record.status}'
```

Expected output:

```json
{
  "version": "20261127095544534",
  "status": "running",
  "envName": "default",
  "record": "initializing"
}
```

## 5. Check it's running

Give the pod a few seconds to start, then:

```shell
curl -s $VELAUX/api/v1/applications/hello-api/envs/default/status -H "Authorization: Bearer $TOKEN" \
  | jq '{phase: .status.status, services: [.status.services[]? | {name, healthy}]}'
```

Expected output:

```json
{
  "phase": "running",
  "services": [
    {
      "name": "hello-api",
      "healthy": true
    }
  ]
}
```

VelaUX created a KubeVela Application of the same name in the environment's namespace:

```shell
kubectl get application hello-api -n default
```

Expected output:

```
NAME        COMPONENT   TYPE         PHASE     HEALTHY   STATUS      AGE
hello-api   hello-api   webservice   running   true      Ready:1/1   7s
```

Each deploy is a revision, with who or what triggered it:

```shell
curl -s $VELAUX/api/v1/applications/hello-api/revisions -H "Authorization: Bearer $TOKEN" \
  | jq '.revisions[] | {version, status, triggerType, envName, note}'
```

Expected output:

```json
{
  "version": "20261127095544534",
  "status": "complete",
  "triggerType": "api",
  "envName": "default",
  "note": "first deploy"
}
```

## Clean up

Recycle the environment, which deletes the Application from the cluster, then delete the application from VelaUX. Each prints `{}` when it works; VelaUX refuses to delete an application that is still deployed anywhere.

```shell
curl -s -X POST $VELAUX/api/v1/applications/hello-api/envs/default/recycle \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json'
curl -s -X DELETE $VELAUX/api/v1/applications/hello-api -H "Authorization: Bearer $TOKEN"
```

Keep it if you're going on to [Redeploy from CI with a trigger](webhook-trigger.md) or [Give a teammate access to a project](project-member.md), which use it.

The full API is in the [VelaUX REST API](../reference/rest-api.md) reference.
