---
title: Unified Declarative CI/CD
---

## Overview

From code to application, one of the indispensable step is to build image. This section will introduce how to orchestrate image build, image push and application delivery in KubeVela.

## How to use

### Use standalone workflow

KubeVela introduced [standalone workflow](../end-user/pipeline/workflowrun.md) in version v1.6 that can be used **independently**, which can be used to orchestrate the process between CI steps and application delivery. Different from the workflow in the KubeVela application, it is **one-time** and does not manage resources. Even if the workflow is deleted, the created resources will not be deleted.

:::tip
Please make sure that you have enabled workflow addon with `vela addon enable vela-workflow`.
:::

#### Create the registry secret

The build step pushes to your image registry, so it needs your registry credentials. Create them as a Secret in the namespace the workflow runs in:

```shell
kubectl create secret docker-registry image-secret \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=<your-username> \
  --docker-password=<your-password>
```

If the Git repository is private, also create a Secret with a Git token:

```shell
kubectl create secret generic git-token --from-literal='GIT_TOKEN=<your-token>'
```

and add it under the step's `credentials`, next to `image`:

```yaml
credentials:
  image:
    name: image-secret
  git:
    name: git-token
    key: GIT_TOKEN
```

#### Run the workflow

Apply the following workflow:

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: build-push-image
  namespace: default
spec:
  context:
    image: my-registry/test-image:v2
  workflowSpec:
   steps:
    - name: build-push
      type: build-push-image
      inputs:
        - from: context.image
          parameterKey: image
      properties:
        # if kanikoExecutor is not set, it uses ghcr.io/osscontainertools/kaniko:v1.29.1@sha256:e7cba1f7e70c01c8ee1cbe622d07990c04dea550430c4c81319d26679226cd37
        # (from v1.11.2; oamdev/kaniko-executor:v1.9.1 before). To use your own copy, pin it by digest:
        # kanikoExecutor: <your-registry>/kaniko:v1.29.1@sha256:e7cba1f7e70c01c8ee1cbe622d07990c04dea550430c4c81319d26679226cd37
        # you can use context with git and branch or directly specify the context, please refer to https://github.com/GoogleContainerTools/kaniko#kaniko-build-contexts
        context:
          git: github.com/FogDong/simple-web-demo
          branch: main
        # Note that this field will be replaced by the image in inputs
        image: my-registry/test-image:v1
        # specify your dockerfile, if not set, it will use default dockerfile ./Dockerfile
        # dockerfile: ./Dockerfile
        credentials:
          image:
            name: image-secret
        # buildArgs:
        #   - key="value"
        # platform: linux/arm
    - name: apply-app
      type: apply-app
      inputs:
        - from: context.image
          parameterKey: data.spec.components[0].properties.image
      properties:
        data:
          apiVersion: core.oam.dev/v1beta1
          kind: Application
          metadata:
            name: my-app
          spec:
            components:
              - name: my-web
                type: webservice
                properties:
                  # Note that this field will be replaced by the image in inputs
                  image: my-registry/test-image:v1
                  imagePullSecrets:
                    - image-secret
                  ports:
                    - port: 80
                      expose: true
```

The workflow has two steps:

1. Use the `build-push-image` step type to build and push the image. This step will use the specified Git url and the code in its branch to build the image. You can also directly specify in the context field. The bottom layer of this step will use [Kaniko](https://github.com/GoogleContainerTools/kaniko) for image building. During the building, you can use `vela workflow logs build-push-image --step build-push` to view the log of the step. Note that this step has an input from `context.image`, which will override the image field in properties. As you can see, we currently declare `image: my-registry/test-image:v2` in the context. When we need to reuse this workflow to build a new image version, we only need to update the data in the context to update the entire process.
2. In the last step, the image version in `context.image` will be used to publish the application. When the application starts, you can use `vela port-forward my-app 8080:80` to check the result.

If you configure the process in VelaUX's Pipeline, you can directly see the status and sequence of all steps on the page, including step logs, input and output, etc.

![](../resources/build-image.png)

### Use Application workflow

You can also build the image in an Application's workflow, and deploy the new image with the component. The `image` in the `build-push` step must match the component's `image`: the step pushes that tag, and `apply-component` deploys the component as written. This example uses the `image-secret` created above. Apply the following application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-web-build
  namespace: default
spec:
  components:
  - name: my-web
    type: webservice
    properties:
      image: my-registry/test-image:v1
      ports:
        - port: 80
          expose: true
  workflow:
    steps:
    - name: build-push
      type: build-push-image
      properties:
        # if kanikoExecutor is not set, it uses ghcr.io/osscontainertools/kaniko:v1.29.1@sha256:e7cba1f7e70c01c8ee1cbe622d07990c04dea550430c4c81319d26679226cd37
        # (from v1.11.2; oamdev/kaniko-executor:v1.9.1 before). To use your own copy, pin it by digest:
        # kanikoExecutor: <your-registry>/kaniko:v1.29.1@sha256:e7cba1f7e70c01c8ee1cbe622d07990c04dea550430c4c81319d26679226cd37
        # you can use context with git and branch or directly specify the context, please refer to https://github.com/GoogleContainerTools/kaniko#kaniko-build-contexts
        context:
          git: github.com/FogDong/simple-web-demo
          branch: main
        image: my-registry/test-image:v1
        # specify your dockerfile, if not set, it will use default dockerfile ./Dockerfile
        # dockerfile: ./Dockerfile
        credentials:
          image:
            name: image-secret
        # buildArgs:
        #   - key="value"
        # platform: linux/arm
    - name: apply-comp
      type: apply-component
      properties:
        component: my-web
```

In the application above, the first step in the workflow will use the `build-push-image` step to build the image, and the second step will deploy the component with the newly built image.