---
title: 如何使用 KubeVela AI 插件来完成模型训练及模型服务
author: Tianxin Dong
author_title: KubeVela 团队
author_url: https://github.com/oam-dev/kubevela
author_image_url: https://kubevela.io/img/logo.svg
tags: [ kubevela ]
description: ""
image: https://raw.githubusercontent.com/oam-dev/kubevela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

KubeVela 作为一个简单、易用、且高可扩展的云原生应用管理工具，能让开发人员方便快捷地在 Kubernetes 上定义与交付现代微服务应用，无需了解任何 Kubernetes 基础设施相关的细节。

而 KubeVela 的插件体系则帮助用户在不变更 KubeVela 的基础上，使用或添加自己的插件，从而实现更多的功能，提升扩展性。

本文主要介绍如何使用 KubeVela 的 AI 插件，来帮助工程师更便捷地完成模型训练及模型服务。

## KubeVela AI 插件

KubeVela AI 插件分为模型训练和模型服务两个插件，模型训练插件基于 KubeFlow 的 training-operator，能够支持如 TensorFlow、PyTorch、MXNet 等不同框架的分布式模型训练。而模型服务插件基于 Seldon Core，可以便捷地使用模型启动模型服务，同时也支持流量分发，A/B 测试等高级功能。

![alt](/img/ai/ai-addon.png)

通过 KubeVela AI 插件，可以大大简化模型训练任务的部署以及模型服务的部署，同时，可以将模型训练、模型服务等过程与 KubeVela 本身的工作流、多集群等功能相结合，从而完成生产可用的服务部署。

## 模型训练

在使用模型训练功能前，需要首先启动模型训练的插件。

```bash
vela addon enable model-training
```

模型训练中包含 `model-training` 和 `jupyter-notebook` 两个组件类型，可以通过 `vela show` 命令来查看这两个组件中的具体参数。

```bash
vela show model-training
vela show jupyter-notebook
```

我们来训练一个简单的使用 TensorFlow 框架的模型，这个模型的效果是能够将灰色的图片变成彩色的。部署如下 YAML 文件：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: training-serving
  namespace: default
spec:
  components:
  # 训练模型
  - name: demo-training
    type: model-training
    properties:
      # 训练模型的镜像
      image: fogdong/train-color:v1
      # 模型训练的框架
      framework: tensorflow
      # 声明存储，将模型持久化。此处会使用集群内的默认 storage class 来创建 PVC
      storage:
        - name: "my-pvc"
          mountPath: "/model"
```

此时， KubeVela 将拉起一个 `TFJob` 进行模型训练。

仅仅是训练模型很难看出效果，我们修改一下这个 YAML 文件，将模型服务放到模型训练的步骤之后。同时，因为模型服务会直接启动模型，而模型的输入输出不太直观（ndarray 或者 Tensor），因此，我们再部署一个测试服务来调用服务，并将结果转换成图像。

部署如下 YAML 文件：
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: training-serving
  namespace: default
spec:
  components:
  # 训练模型
  - name: demo-training
    type: model-training
    properties:
      image: fogdong/train-color:v1
      framework: tensorflow
      storage:
        - name: "my-pvc"
          mountPath: "/model"
  
  # 启动模型服务
  - name: demo-serving
    type: model-serving
    # 模型服务会在模型训练完成后启动
    dependsOn:
      - demo-training
    properties:
      protocol: tensorflow
      predictors:
        - name: model
          replicas: 1
          graph:
            # 模型名
            name: my-model
            # 模型框架
            implementation: tensorflow
            # 模型地址，上一步会将训练完的模型保存到 my-pvc 这个 pvc 当中，所以通过 pvc://my-pvc 指定模型的地址
            modelUri: pvc://my-pvc

  # 测试模型服务
  - name: demo-rest-serving
    type: webservice
    dependsOn:
      - demo-serving
    properties:
      image: fogdong/color-serving:v1
      # 使用 LoadBalancer 暴露对外地址，方便调用
      exposeType: LoadBalancer
      env:
        - name: URL
          # 模型服务的地址
          value: http://ambassador.vela-system.svc.cluster.local/seldon/default/demo-serving/v1/models/my-model:predict
      ports:
        - port: 3333
          expose: true
```

部署之后，通过 `vela ls` 来查看应用的状态：

```bash
$ vela ls

training-serving      	demo-training      	model-training	       	running	healthy	Job Succeeded	2022-03-02 17:26:40 +0800 CST
├─                  	demo-serving       	model-serving 	       	running	healthy	Available    	2022-03-02 17:26:40 +0800 CST
└─                  	demo-rest-serving  	webservice    	       	running	healthy	Ready:1/1    	2022-03-02 17:26:40 +0800 CST
```

可以看到，应用已经正常启动。通过 `vela status <app-name> --endpoint` 来查看应用的服务地址。

```bash
$ vela status training-serving --endpoint

+---------+-----------------------------------+---------------------------------------------------+
| CLUSTER |     REF(KIND/NAMESPACE/NAME)      |                     ENDPOINT                      |
+---------+-----------------------------------+---------------------------------------------------+
|         | Service/default/demo-rest-serving | tcp://47.251.10.177:3333                          |
|         | Service/vela-system/ambassador    | http://47.251.36.228/seldon/default/demo-serving  |
|         | Service/vela-system/ambassador    | https://47.251.36.228/seldon/default/demo-serving |
+---------+-----------------------------------+---------------------------------------------------+
```

该应用有三个服务地址，第一个是我们的测试服务的地址，第二个和第三都是原生模型的地址。我们可以调用测试服务来查看模型的效果：测试服务会读取图像的内容，并将其转成 `Tensor` 并请求模型服务，最后将模型服务返回的 `Tensor` 转成图像返回。

我们选择一张黑白的女性图片作为输入：

![alt](/img/ai/woman-grey.png)

请求后，可以看到，输出了一张彩色图片：

![alt](/img/ai/test-request.png)

## 模型服务：灰度测试

除了直接启动模型服务，我们还可以在一个模型服务中使用多个版本的模型，并对其分配不同的流量以进行灰度测试。

部署如下 YAML，可以看到，v1 版本的模型和 v2 版本的模型都设置为了 50% 的流量。同样，我们在模型服务后面部署一个测试服务：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: color-serving
  namespace: default
spec:
  components:
  - name: color-model-serving
    type: serving
    properties:
      protocol: tensorflow
      predictors:
        - name: model1
          replicas: 1
          # v1 版本的模型流量为 50
          traffic: 50
          graph:
            name: my-model
            implementation: tensorflow
            modelUri: pvc://color-model/model/v1
        - name: model2
          replicas: 1
          # v2 版本的模型流量为 50
          traffic: 50
          graph:
            name: my-model
            implementation: tensorflow
            modelUri: pvc://color-model/model/v2
  - name: color-rest-serving
    type: webservice
    dependsOn:
      - color-model-serving
    properties:
      image: fogdong/color-serving:v1
      exposeType: LoadBalancer
      env:
        - name: URL
          value: http://ambassador.vela-system.svc.cluster.local/seldon/default/color-model-serving/v1/models/my-model:predict
      ports:
        - port: 3333
          expose: true
```

当模型部署完成后，通过 `vela status <app-name> --endpoint` 查看模型服务的地址：

```bash
$ vela status color-serving --endpoint

+---------+------------------------------------+----------------------------------------------------------+
| CLUSTER |      REF(KIND/NAMESPACE/NAME)      |                         ENDPOINT                         |
+---------+------------------------------------+----------------------------------------------------------+
|         | Service/vela-system/ambassador     | http://47.251.36.228/seldon/default/color-model-serving  |
|         | Service/vela-system/ambassador     | https://47.251.36.228/seldon/default/color-model-serving |
|         | Service/default/color-rest-serving | tcp://47.89.194.94:3333                                  |
+---------+------------------------------------+----------------------------------------------------------+
```

使用一张黑白的城市图片请求模型：

![alt](/img/ai/chicago-grey.png)

可以看到，第一次请求的结果如下。虽然天空和地面都被渲染成彩色了，但是城市本身还是黑白的：

![alt](/img/ai/canary-request1.png)

再次请求，可以看到，这次请求的结果中，天空、地面和城市都被渲染成了彩色：

![alt](/img/ai/canary-request2.png)

通过对不同版本的模型进行流量分发，可以帮助我们更好地对模型结果进行判断。

## 模型服务：A/B 测试

同样一张黑白的图片，我们既可以通过模型将其变成彩色的，也可以通过上传另一张风格图片，对原图进行风格迁移。

对于用户来说，究竟是彩色的图片好还是不同风格的图片更胜一筹？我们可以通过进行 A/B 测试，来探索这个问题。

部署如下 YAML，通过设置 `customRouting`，将 `Header` 中带有 `style: transfer` 的请求，转发到风格迁移的模型。同时，使这个风格迁移的模型与彩色化的模型共用一个地址。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: color-style-ab-serving
  namespace: default
spec:
  components:
  - name: color-ab-serving
    type: model-serving
    properties:
      protocol: tensorflow
      predictors:
        - name: model1
          replicas: 1
          graph:
            name: my-model
            implementation: tensorflow
            modelUri: pvc://color-model/model/v2
  - name: style-ab-serving
    type: model-serving
    properties:
      protocol: tensorflow
      # 风格迁移的模型需要的时间较长，设置超时时间使请求不会被超时
      timeout: "10000"
      customRouting:
        # 指定自定义 Header
        header: "style: transfer"
        # 指定自定义路由
        serviceName: "color-ab-serving"
      predictors:
        - name: model2
          replicas: 1
          graph:
            name: my-model
            implementation: tensorflow
            modelUri: pvc://style-model/model
  - name: ab-rest-serving
    type: webservice
    dependsOn:
      - color-ab-serving
      - style-ab-serving
    properties:
      image: fogdong/style-serving:v1
      exposeType: LoadBalancer
      env:
        - name: URL
          value: http://ambassador.vela-system.svc.cluster.local/seldon/default/color-ab-serving/v1/models/my-model:predict
      ports:
        - port: 3333
          expose: true
```

部署成功后，通过 `vela status <app-name> --endpoint` 查看模型服务的地址：

```bash
$ vela status color-style-ab-serving --endpoint

+---------+---------------------------------+-------------------------------------------------------+
| CLUSTER |    REF(KIND/NAMESPACE/NAME)     |                       ENDPOINT                        |
+---------+---------------------------------+-------------------------------------------------------+
|         | Service/vela-system/ambassador  | http://47.251.36.228/seldon/default/color-ab-serving  |
|         | Service/vela-system/ambassador  | https://47.251.36.228/seldon/default/color-ab-serving |
|         | Service/vela-system/ambassador  | http://47.251.36.228/seldon/default/style-ab-serving  |
|         | Service/vela-system/ambassador  | https://47.251.36.228/seldon/default/style-ab-serving |
|         | Service/default/ab-rest-serving | tcp://47.251.5.97:3333                                |
+---------+---------------------------------+-------------------------------------------------------+
```

这个应用中，两个服务各自有两个地址，但是第二个 `style-ab-serving` 的模型服务地址是无效的，因为这个模型服务已经被指向了 `color-ab-serving` 的地址中。同样，我们通过请求测试服务来查看模型效果。

首先，在不加 header 的情况下，图像会从黑白变为彩色：

![alt](/img/ai/ab-request1.png)

我们添加一个海浪的图片作为风格渲染：

![alt](/img/ai/wave.jpg)

我们为本次请求加上 `style: transfer` 的 Header，可以看到，城市变成了海浪风格：

![alt](/img/ai/ab-request2.png)

我们还可以使用一张水墨画的图片作为风格渲染：

![alt](/img/ai/chinese-style.jpg)

可以看到，这次城市变成了水墨画风格：

![alt](/img/ai/ab-request3.png)

## 总结

通过 KubeVela 的 AI 插件，可以帮助用户更便捷地进行模型训练与模型服务。

除此之外，通过与 KubeVela 的结合，我们还能将测试完效果的模型通过 KubeVela 的多环境功能，下发到不同的环境中，从而实现模型的灵活部署。