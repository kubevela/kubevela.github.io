---
title: Web 服务
---

服务型组件是以容器为核心支撑对外访问服务的组件，其功能涵盖了主流微服务场景的需要，即在后端长时间运行、可水平扩展、且对外暴露服务端口的服务。

## 如何使用

为了便于你快速学习，请直接复制下面的 Shell 执行，应用会部署到集群中：

```shell
cat <<EOF | vela up -f -
# YAML 文件开始
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        ports:
          - port: 8080
        cpu: "0.1"
        env:
          - name: FOO
            value: bar
# YAML 文件结束
EOF
```

你也可以自行将 YAML 文件保存为 website.yaml，使用 `vela up -f website.yaml` 命令进行部署。

接下来，通过 `vela status <应用 name>` 查看应用的部署状态：

```shell
$ vela status website
About:

  Name:      	website
  Namespace: 	default
  Created at:	2022-01-11 21:04:59 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:2y4rv8479h
    name:frontend
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: frontend  Env:
    Type: webservice
    healthy Ready:1/1
```

当我们看到 Workflow 的 finished 的字段为 true，并且 Status 为 running 时，即表示整个应用交付成功。

如果 Status 显示为 rendering，或者 healthy 为 false，则表示应用要么部署失败，要么还在部署中。

你也可以通过列表查看，使用如下命令：

```shell
$ vela ls
APP    	COMPONENT	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
website	frontend 	webservice	      	running	healthy	      	2021-08-28 18:26:47 +0800 CST
```

我们也看到 website APP 的 PHASE 为 running，同时 STATUS 为 healthy。
