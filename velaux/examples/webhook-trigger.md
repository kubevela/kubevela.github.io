---
title: Redeploy from CI with a Trigger
description: Give an application a webhook, then call it the way a CI job would to roll out a new image.
---

A trigger is a webhook URL for one application. A CI job that has built a new image calls it, and VelaUX updates the component and runs the environment's workflow. This sets up a `custom` trigger, the one any CI system can call with `curl`, and calls it by hand to move `hello-api` from `oamdev/hello-world` to `oamdev/hello-world:v2`. [Triggers](../guides/delivery/triggers.md) covers the other payload types (Harbor, ACR, DockerHub, JFrog) and the GitLab and Jenkins setups.

## Before you start

Work through [Deploy with the API](deploy-with-the-api.md) first and keep `hello-api` deployed. You need its `VELAUX` and `TOKEN` variables in this shell.

## 1. Create the trigger

```shell
TRIGGER=$(curl -s -X POST $VELAUX/api/v1/applications/hello-api/triggers \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name": "ci", "workflowName": "workflow-default", "type": "webhook", "payloadType": "custom", "componentName": "hello-api"}')
echo "$TRIGGER" | jq '{name, type, payloadType, workflowName, token: (.token[0:6] + "...")}'
WEBHOOK_TOKEN=$(echo "$TRIGGER" | jq -r .token)
```

Expected output:

```json
{
  "name": "ci",
  "type": "webhook",
  "payloadType": "custom",
  "workflowName": "workflow-default",
  "token": "6qibdo..."
}
```

The webhook URL is `$VELAUX/api/v1/webhook/$WEBHOOK_TOKEN`. The token is the only credential it takes, so treat the URL as a secret: store it as a masked CI variable. In the console, the trigger's card on **Application Config** shows the same URL and a `curl` example.

## 2. Call it

This is the call a CI job makes after pushing its image. `upgrade` maps a component name to the properties to merge into it; `codeInfo` records where the build came from.

```shell
curl -s -X POST $VELAUX/api/v1/webhook/$WEBHOOK_TOKEN \
  -H 'Content-Type: application/json' \
  -d '{
    "upgrade": {"hello-api": {"image": "oamdev/hello-world:v2"}},
    "codeInfo": {"commit": "4f2a9c1", "branch": "main", "user": "ci-bot"}
  }' | jq '{version, status, triggerType, codeInfo}'
```

Expected output:

```json
{
  "version": "20261127095553558",
  "status": "running",
  "triggerType": "webhook",
  "codeInfo": {
    "commit": "4f2a9c1",
    "branch": "main",
    "user": "ci-bot"
  }
}
```

## 3. Check the rollout

```shell
kubectl get deploy hello-api -n default -o jsonpath='{.spec.template.spec.containers[0].image}'; echo
```

Expected output:

```
oamdev/hello-world:v2
```

The new revision carries the trigger type and the commit:

```shell
curl -s $VELAUX/api/v1/applications/hello-api/revisions -H "Authorization: Bearer $TOKEN" \
  | jq '.revisions[] | {version, triggerType, codeInfo}'
```

Expected output:

```json
{
  "version": "20261127095553558",
  "triggerType": "webhook",
  "codeInfo": {
    "commit": "4f2a9c1",
    "branch": "main",
    "user": "ci-bot"
  }
}
{
  "version": "20261127095544534",
  "triggerType": "api",
  "codeInfo": null
}
```

In the console, the same revision shows on the **Revisions** tab with the commit and branch.

## Clean up

```shell
curl -s -X DELETE $VELAUX/api/v1/applications/hello-api/triggers/$WEBHOOK_TOKEN -H "Authorization: Bearer $TOKEN"
```
