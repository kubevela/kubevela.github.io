---
title: Container Image
description: deploy the business application by kubevela
---

This article introduces how companies deliver business applications based on KubeVela. It does not require you to know much about Kubernetes.

## Before starting

- Containerize your business. No matter what language you're using, first to build an image via CI or locally.
- Place your business image at a hub that KubeVela can access to.
- Enable the VelaUX addon, If you are only CLI users, go to [Deploy via CLI](#deploy-via-cli)

## Creating an application

Enter the page of Application on the left, click `New Application` to create. Pick your name, alias, and description; Select type of `webservice`; Decide your environment, Default environment is already available in the first place. You could also enter the page of Environments to set up new.

Click `Next Step` so to the configuration page. We need to set up the Image address and resources limit. If you want to set up a command for the image, open up the row `CMD`.

![set webservice application](https://static.kubevela.net/images/1.3/create-webservice.jpg)

Done by clicking `Create` and then we enter the management page.

## Deploying the application

Click the `Deploy` button on the upper right and select a workflow. Note that each Environment of the application has its workflow. On the right of the `Baseline Config` tab is the environments. Check out the status of the environment and its instance information as you wish.

![webservice application env page](../resources/webservice-env.jpg)

When it has several targets in this environment, you may find them all in the `Instances` list. If you want to look at the process of application deployment, click `Check the details` to reveal.

In the `Instances` list, you may find some of them are in pending status. Click `+` in the beginning to figure out the reason in more detail.

## Update image

After the first deployment, our business keeps evolving and the following updates come along.

Click `Baseline Config` and you can see the all components. Then click the component name and open the configuration page, you can update your latest requirements for image, version, and environment variable.

## Update replicas

If your business requires more than one replicas, enter the `Properties` page. By default, The component have a `Set Replicas` trait. Click it so that you can update the replicas.

![set application replicas](../resources/set-replicas.jpg)

## Upgrading the application

By twos steps as above, it is still in a draft state, we need to click the deployment button again to complete the upgrade of the application.

## Application recycling and deletion

If you need to delete the application after testing, you need to recycle all the deployed environments first. Click the environment name to enter the environment instance list, and click the `Recycle` button to recycle the deployment of the application in that environment. After it's done, the application in this environment rolls back as an undeployed one.

After all of the environments have been recycled, the application can be deleted. Currently, the entry for application deletion is on the application list page. Back to the application list page, mouse on the menu icon on the right side of the application name, and click the `Remove` option.

![delete application](../resources/app-delete.jpg)

At this point, you have basically mastered the deployment method of Docker image.

## Deploy via CLI

You also can deploy the application via CLI.

```yaml
cat <<EOF | vela up -f -
# YAML begins
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        ports:
          - port: 8080
            expose: true
        exposeType: LoadBalancer
        cpu: "0.5"
        memory: "512Mi"
      traits:
        - type: scaler
          properties:
            replicas: 1
# YAML ends
EOF
```

> Currently, The application created by CLI will be synced to UI, but it will be readonly.

You can also save the YAML file as webservice-app.yaml and use the `vela up -f webservice-app.yaml` command to deploy.

Next, check the deployment status of the application through `vela status webservice-app`

```
About:

  Name:      	test-app
  Namespace: 	default
  Created at:	2022-04-21 12:03:42 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:y4n26n7uql
    name:frontend
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: frontend
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    Traits:
      ✅ scaler
```

## Next Step

[Learn to deploy Helm Chart](./helm)
