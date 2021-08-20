---
title: 标签管理
---
`labels` 和 `annotations` 运维特征，允许你将标签和注释附加到组件。通过标签和注释，我们在实现业务逻辑时，能十分灵活的根据它们来对应地调用组件。

### 如何使用

首先，我们准备一个应用部署计划 YAML 如下：

```shell
# myapp.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
        - type: annotations
          properties:
            "description": "web application"
```

根据业务需要，我们定义这个组件供 `stable` 发布使用，并描述它是一个网页应用程序的业务。

编写完毕后部署：

```shell
kubectl apply -f myapp.yaml
```

成功后，在运行时集群上，检查应用是否已成功创建：

```bash
➜  vela ls
APP    	COMPONENT     	TYPE      	TRAITS            	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
myapp  	express-server	webservice	labels,annotations	running	healthy	      	2021-08-09 17:13:10 +0800 CST
```

一切正常。

让我们来使用命令检查 `labels`，符合预期的显示出来。

```bash
kubectl get deployments express-server -o jsonpath='{.spec.template.metadata.labels}'
```
```console
{"app.oam.dev/component":"express-server","release": "stable"}
```

使用命令检查 `annotations`，符合预期的显示出来。

```bash
kubectl get deployments express-server -o jsonpath='{.spec.template.metadata.annotations}'
```
```console
{"description":"web application"}
```
