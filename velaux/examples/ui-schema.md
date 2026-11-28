---
title: Shape a Definition's Form
description: Write a UI schema for the worker component and see VelaUX use it.
---

VelaUX builds a form for every definition from its parameters. A UI schema changes that form: labels, help text, order, validation, which fields show. This writes one for the built-in `worker` component, applies it, and reads the form back from the API to see the change. Every field a UI schema can set is in [UI Schema](../guides/extend/ui-schema.md).

## Before you start

VelaUX installed and port-forwarded, with `VELAUX` and `TOKEN` set as in steps 1 and 2 of [Deploy with the API](deploy-with-the-api.md#1-sign-in).

## 1. The form as it is

```shell
curl -s "$VELAUX/api/v1/definitions/worker?type=component" -H "Authorization: Bearer $TOKEN" \
  | jq '[.uiSchema[]? | select(.jsonKey == "image" or .jsonKey == "cmd") | {jsonKey, label, description, sort, validate}]'
```

Expected output:

```json
[
  {
    "jsonKey": "image",
    "label": "Image",
    "description": "Which image would you like to use for your service",
    "sort": 100,
    "validate": {
      "required": true,
      "immutable": false
    }
  },
  {
    "jsonKey": "cmd",
    "label": "Cmd",
    "description": "Commands to run in the container",
    "sort": 101,
    "validate": {
      "immutable": false
    }
  }
]
```

## 2. Write the UI schema

Save this as `component-uischema-worker.yaml`. The file name says which definition it's for: `<type>-uischema-<name>.yaml`.

```yaml
- jsonKey: image
  label: Container image
  description: The image to run, with its tag, for example busybox:1.36.
  sort: 1
  validate:
    required: true
    pattern: '^[^:]+:[^:]+$'
- jsonKey: cmd
  label: Command
  sort: 2
```

## 3. Apply it

```shell
vela uischema apply component-uischema-worker.yaml
kubectl get configmap component-uischema-worker -n vela-system
```

Expected output:

```
apply component-uischema-worker.yaml success
NAME                        DATA   AGE
component-uischema-worker   1      0s
```

## 4. The form now

```shell
curl -s "$VELAUX/api/v1/definitions/worker?type=component" -H "Authorization: Bearer $TOKEN" \
  | jq '[.uiSchema[]? | select(.jsonKey == "image" or .jsonKey == "cmd") | {jsonKey, label, description, sort, validate}]'
```

Expected output:

```json
[
  {
    "jsonKey": "image",
    "label": "Container image",
    "description": "The image to run, with its tag, for example busybox:1.36.",
    "sort": 1,
    "validate": {
      "required": true,
      "pattern": "^[^:]+:[^:]+$",
      "immutable": false
    }
  },
  {
    "jsonKey": "cmd",
    "label": "Command",
    "description": "Commands to run in the container",
    "sort": 2,
    "validate": {
      "immutable": false
    }
  }
]
```

VelaUX patched the generated form field by field: the two fields now come first, with your labels, and the image must carry a tag. In the console, create an application with a `worker` component to see the form; an image without a tag is refused under the field.

## Clean up

```shell
kubectl delete configmap component-uischema-worker -n vela-system
```
