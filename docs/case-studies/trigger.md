---
title: Use KubeVela triggers to automatically apply application based on image tags

---

## Introduction

In our daily development, when an image tags is changed, it is often necessary to update the latest image to each environment. We can apply it manually, but it's tedious and tricky. Therefore, we need a tool to automatically apply application based on image tags.

In KubeVela 1.2, [VelaUX](../install#3-install-velaux) provides a good way to do this. We can use KubeVela triggers to apply applications automatically.

In this section, you will know how to use KubeVela triggers to automatically apply application based on image tags. In this example, we will use GitLab as code repository and ACR as image repository.

## Create Application

To use triggers, we need to create a new application on VelaUX first. We can create a new WebService type application and use LoadBalancer to expose port 80 for access.

![alt](../resources/acr-trigger-newapp.png)

## Create Triggers for Application

After creating the application, use `New Trigger` to create a trigger. Here we use `ACR` as payload type to support requests from the `ACR` image registry.

![alt](../resources/acr-trigger-newtrigger.png)

Check the details of the trigger, you can see the specific Webhook URL and the manual trigger command.

![alt](../resources/acr-trigger-info.png)

## Setup ACR Trigger

ACR payload triggers need to cooperate with Ali Cloud ACR image registry. After creating a trigger of type ACR, we can copy the Webhook URL of the trigger and configure it in the ACR image registry.

![alt](../resources/acr-trigger.png)

## Test and Apply

After these setups, we can now test the trigger.

Let's start by looking at the current app page, you can directly jump to the LoadBalancer address through the `Service Endpoint` of the application.

![alt](../resources/acr-trigger-endpoints.png)

As you can see, the current Demo application's version is `v1.0.0`.

![alt](../resources/acr-trigger-appv1.png)

This source code of this demo is on the [GitLab] (https://gitlab.com/FogDong/KubeVela-GitOps-Demo-Code). There is also a CI file in this repo, in which steps are simple, every time the code is updated, it will automatically build the image and pushed to the image registry.

We can change the version in the code to `v2.0.0`:

```javascript
data(){
    return {
      v: 'v2.0.0',
    }
  },
```

After changing the code, the GitLab CI will automatically build the image and push it to the image registry.

In the access log of the ACR trigger, we can see that ACR sends a request to our Webhook URL when the latest image is pushed to the image registry.

![alt](../resources/acr-trigger-acrrecord.png)

Check the application revisions in VelaUX, you can see that the most recent revision was from `Webhook`.

![alt](../resources/acr-trigger-revisions.png)

Looking back at the app page, you can see that the app version has changed to `v2.0.0` and the background of the page has changed with the version.


![alt](../resources/acr-trigger-appv2.png)

## Summary

The KubeVela triggers' combination with the image registry is smooth and seamless. In addition to ACR, KubeVela also supports Harbor and custom trigger payload types.

With KubeVela triggers, we can easily apply application based on image tags automatically and complete iterations of application versions.
