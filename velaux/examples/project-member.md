---
title: Give a Teammate Access to a Project
description: Create a local user, add them to a project as a viewer, and promote them to a developer who can deploy.
---

VelaUX decides what a user can do from the roles they hold in each project. This creates a user, `dana`, adds her to the `default` project as a `project-viewer`, shows that she can see the applications but not deploy them, then makes her an `app-developer`. The built-in roles and how to write your own are in [RBAC](../guides/users/rbac.md).

## Before you start

Work through [Deploy with the API](deploy-with-the-api.md) first, so `default` has the `hello-api` application, and keep its `VELAUX` and `TOKEN` variables (the administrator's token) in this shell.

## 1. Create the user

```shell
curl -s -X POST $VELAUX/api/v1/users \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name": "dana", "email": "dana@example.com", "password": "Dana12345", "roles": []}' \
  | jq '{name, email}'
```

Expected output:

```json
{
  "name": "dana",
  "email": "dana@example.com"
}
```

`roles` holds platform roles, such as `admin`. She gets none: what she can do comes from her project roles.

## 2. Add her to the project as a viewer

```shell
curl -s -X POST $VELAUX/api/v1/projects/default/users \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"userName": "dana", "userRoles": ["project-viewer"]}' | jq '{name, userRoles}'
```

Expected output:

```json
{
  "name": "dana",
  "userRoles": [
    "project-viewer"
  ]
}
```

## 3. Sign in as her

```shell
DANA=$(curl -s -X POST $VELAUX/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "dana", "password": "Dana12345"}' | jq -r .accessToken)

curl -s "$VELAUX/api/v1/applications?project=default" -H "Authorization: Bearer $DANA" \
  | jq '[.applications[].name]'
```

Expected output:

```json
[
  "hello-api"
]
```

She can see the project's applications. Deploying one is refused:

```shell
curl -s -w '\nHTTP %{http_code}\n' -X POST $VELAUX/api/v1/applications/hello-api/deploy \
  -H "Authorization: Bearer $DANA" -H 'Content-Type: application/json' \
  -d '{"workflowName": "workflow-default", "triggerType": "api"}'
```

Expected output:

```
{
 "BusinessCode": 403,
 "Message": "403 Forbidden"
}
HTTP 403
```

## 4. Make her a developer

```shell
curl -s -X PUT $VELAUX/api/v1/projects/default/users/dana \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"userRoles": ["app-developer"]}' | jq '{name, userRoles}'
```

Expected output:

```json
{
  "name": "dana",
  "userRoles": [
    "app-developer"
  ]
}
```

The same token now deploys, since VelaUX checks her roles on each request:

```shell
curl -s -X POST $VELAUX/api/v1/applications/hello-api/deploy \
  -H "Authorization: Bearer $DANA" -H 'Content-Type: application/json' \
  -d '{"workflowName": "workflow-default", "triggerType": "api", "force": true}' \
  | jq '{version, status, deployUser: .deployUser.name}'
```

Expected output:

```json
{
  "version": "20261127095634198",
  "status": "running",
  "deployUser": "dana"
}
```

The revision records her as the user who deployed it.

## Clean up

```shell
curl -s -X DELETE $VELAUX/api/v1/projects/default/users/dana -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE $VELAUX/api/v1/users/dana -H "Authorization: Bearer $TOKEN"
```
