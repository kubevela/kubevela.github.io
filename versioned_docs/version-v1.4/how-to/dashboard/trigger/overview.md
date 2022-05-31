---
title: Triggers
description: Integrate with CI system by Triggers
---

You can use triggers from [VelaUX addon](../../../reference/addons/velaux) to integrate with different CI systems, the architecture and supported platforms are described in the following picture, they're:

- [Custom](#custom-trigger), refer to [Jenkins CI](../../../tutorials/jenkins) guide for a real world use case
- [ACR](#ACR-trigger)
- [Harbor](#Harbor-trigger), refer to [Harbor Integration](../../../tutorials/trigger) guide for a real world use case
- [DockerHub](#DockerHub-trigger)
- [JFrog](#JFrog-trigger)

![trigger](../../../resources/trigger.jpg)

## How to use

A default trigger will be automatically generated after an application created. You can also delete it and create a new one.

![default-trigger](../../../resources/default-trigger.png)

KubeVela triggers can integrate with any CI tool like Gitlab CI, Jenkins Pipeline or image registry like Harbor or ACR.

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
      curl -X POST -H "Content-Type: application/json" -d '{"upgrade":{"'"$APP_NAME"'":{"image":"'"$BUILD_IMAGE"'"}},"codeInfo":{"user":"'"$CI_COMMIT_AUTHOR"'","commit":"'"$CI_COMMIT_SHA"'","branch":"'"$CI_COMMIT_BRANCH"'"}}' $WEBHOOK_URL
```

After CI have executed this step, we can see that application is deployed successfully in VelaUX. We can also see some relative code infos of this deployment.

![gitlab-trigger](../../../resources/gitlab-trigger.png)

You can refer to [Jenkins CI](../../../tutorials/jenkins) guide for a real use case about custom trigger.

## Harbor Trigger

Harbor Trigger can be integrated with Harbor image registry.

You can refer to [Harbor Image Registry](../../../tutorials/trigger) guide for the end to end tutorial.

## ACR Trigger

ACR Trigger can be integrated with ACR image registry.

We can start with creating a new ACR trigger. The Payload Type is ACR, and the Execution Workflow is the workflow you want to deploy in the trigger.

![alt](../../../resources/acr-trigger-newtrigger.png)

After creating the trigger, we can setup this trigger in ACR:

![alt](../../../resources/acr-trigger.png)

After configuring the trigger, we can see the new deploy revisions when a new image is pushed to the registry.

![alt](../../../resources/acr-trigger-acrrecord.png)

![alt](../../../resources/acr-trigger-revisions.png)

## DockerHub Trigger

DockerHub Trigger can be integrated with DockerHub.

We can start with creating a new DockerHub trigger. The Payload Type is DockerHub, and the Execution Workflow is the workflow you want to deploy in the trigger.

![alt](../../../resources/dockerhub-trigger-newtrigger.png)

After creating the trigger, we can setup this trigger in DockerHub:

![alt](../../../resources/dockerhub-trigger.png)

After configuring the trigger, we can see the new deploy revisions when a new image is pushed to the registry.

![alt](../../../resources/dockerhub-trigger-dockerhubrecord.png)

![alt](../../../resources/dockerhub-trigger-revisions.png)

## JFrog Trigger

jFrog Trigger can be integrated with JFrog Artifactory.

We can start with creating a new jFrog trigger. The Payload Type is jFrog, and the Execution Workflow is the workflow you want to deploy in the trigger.

![alt](../../../resources/jfrog-trigger-newtrigger.png)


After creating the trigger, we can setup this trigger in jFrog:

![alt](../../../resources/jfrog-trigger.png)

After configuring the trigger, we can see the new deploy revisions when a new image is pushed to the registry.

Note: jFrog webhook callback has no jFrog address, KubeVela will recognize the request header `X-jFrogURL` as jFrog address and use it in application `image` field.