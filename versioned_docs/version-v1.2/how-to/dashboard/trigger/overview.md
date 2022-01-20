---
title: Use triggers to integrate with CI tools
description: Use triggers to integrate with CI tools
---

After you have created an application, a default trigger is automatically created. You can also delete or create a new trigger.

![default-trigger](../../../resources/default-trigger.png)

KubeVela triggers can integrate with any CI tool like Gitlab CI, Jenkins Pipeline or image registry like Harbor or ACR.

We now support three types of triggers: Custom, ACR, and Harbor.

## Custom Trigger

Custom triggers will provide a webhook URL, which you can use to integrate with your CI tool using the specified request body.

The default trigger is a custom trigger, click `Manual Trigger` to get more info of this trigger:

![manual-trigger](../../../resources/manual-trigger.png)

Webhook URL is the address of this trigger, you can see request body in `Curl Command` example:

```json
  {
    // required, the upgrade of this deployment
    "upgrade": {
      // key is the name of application
      "<application-name>": {
        // the fields that need to be patched
        "image": "<image-name>"
      }
    },
    // optional, the code info of this deployment
    "codeInfo": {
      "commit": "<commit-id>",
      "branch": "<branch>",
      "user": "<user>",
    }
  }
```

`upgrade` is the key of the object that need to be patched, `<application-name>` is the name of application. `image` is the field that need to be patched. You can also add more fields in `<application-name>`.

In `codeInfo`, you can add some code infos of this deployment like commit id, branch or user.

Below is an example of using Custom Trigger in Gitlab CI, we use env in this example:

```shell
webhook-request:
  stage: request
  before_script:
    - apk add --update curl && rm -rf /var/cache/apk/*
  script:
    - |
      curl -X POST -H "Content-Type: application/json" -d '{"upgrade":{"'"$ APP_NAME"'":{"image":"'"$BUILD_IMAGE"'"}},"codeInfo":{"user":"'"$CI_COMMIT_AUTHOR"'","commit":"'"$CI_COMMIT_SHA"'","branch":"'"$CI_COMMIT_BRANCH"'"}}' $WEBHOOK_URL
```

After CI have executed this step, we can see that application is deployed successfully in VelaUX. We can also see some relative code infos of this deployment.

![gitlab-trigger](../../../resources/gitlab-trigger.png)

## Harbor Trigger

Harbor Trigger can be integrated with Harbor image registry.

We can start with creating a new harbor trigger. The Payload Type is Harbor, and the Execution Workflow is the workflow you want to deploy in the trigger.

![alt](../../../resources/harbor-trigger-newtrigger.png)

After creating the trigger, we can setup this trigger in Harbor:

![alt](../../../resources/harbor-trigger.png)

After configuring the trigger, we can see the new deploy revisions when a new image is pushed to the registry.

![alt](../../../resources/harbor-trigger-harborrecord.png)

![alt](../../../resources/harbor-trigger-revisions.png)

## ACR Trigger

ACR Trigger can be integrated with ACR image registry.

We can start with creating a new ACR trigger. The Payload Type is ACR, and the Execution Workflow is the workflow you want to deploy in the trigger.

![alt](../../../resources/acr-trigger-newtrigger.png)

After creating the trigger, we can setup this trigger in ACR:

![alt](../../../resources/acr-trigger.png)

After configuring the trigger, we can see the new deploy revisions when a new image is pushed to the registry.

![alt](../../../resources/acr-trigger-acrrecord.png)

![alt](../../../resources/acr-trigger-revisions.png)