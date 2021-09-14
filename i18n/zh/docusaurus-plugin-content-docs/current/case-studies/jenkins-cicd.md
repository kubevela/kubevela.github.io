---
title:  对接 Jenkins 实现 CI/CD
---

本文将会以一个 HTTP 服务的开发部署为例，简单介绍如何将 KubeVela 与 Jenkins 对接实现应用的持续集成与持续交付。[参考代码，请点击](https://github.com/Somefive/KubeVela-demo-CICD-app)。

## 准备工作

在对接之前，用户首先需要确保以下环境。

1. 已部署好 Jenkins 服务并配置了 Docker 在 Jenkins 中的环境，包括相关插件及镜像仓库的访问权限。
2. 已配置好的 Git 仓库并开启 Webhook。确保 Git 仓库对应分支的变化能够通过 Webhook 触发 Jenkins 流水线的运行。
3. 准备好需要部署的 Kubernetes 集群环境，并在环境中安装 KubeVela 基础组件及 apiserver，确保 KubeVela apiserver 能够从公网访问到。

## 对接 Jenkins 与 KubeVela apiserver

在 Jenkins 中以下面的 Groovy 脚本为例设置部署流水线。可以将流水线中的 Git 地址、镜像地址、apiserver 的地址、应用命名空间及应用替换成自己的配置，同时在自己的代码仓库中存放 Dockerfile 及 app.yaml，用来构建及部署 KubeVela 应用。

```groovy
pipeline {
    agent any
    environment {
        GIT_BRANCH = 'prod'
        GIT_URL = 'https://github.com/Somefive/KubeVela-demo-CICD-app.git'
        DOCKER_REGISTRY = 'https://registry.hub.docker.com'
        DOCKER_CREDENTIAL = 'DockerHubCredential'
        DOCKER_IMAGE = 'somefive/kubevela-demo-cicd-app'
        APISERVER_URL = 'http://47.88.24.19'
        APPLICATION_YAML = 'app.yaml'
        APPLICATION_NAMESPACE = 'kubevela-demo-namespace'
        APPLICATION_NAME = 'cicd-demo-app'
    }
    stages {
        stage('Prepare') {
            steps {
                script {
                    def checkout = git branch: env.GIT_BRANCH, url: env.GIT_URL
                    env.GIT_COMMIT = checkout.GIT_COMMIT
                    env.GIT_BRANCH = checkout.GIT_BRANCH
                    echo "env.GIT_BRANCH=${env.GIT_BRANCH},env.GIT_COMMIT=${env.GIT_COMMIT}"
                }
            }
        }
        stage('Build') {
            steps {
                script {
                    docker.withRegistry(env.DOCKER_REGISTRY, env.DOCKER_CREDENTIAL) {
                        def customImage = docker.build(env.DOCKER_IMAGE)
                        customImage.push()
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                sh 'wget -q "https://github.com/mikefarah/yq/releases/download/v4.12.1/yq_linux_amd64"'
                sh 'chmod +x yq_linux_amd64'
                script {
                    def app = sh (
                        script: "./yq_linux_amd64 eval -o=json '.spec' ${env.APPLICATION_YAML} | sed -e 's/GIT_COMMIT/$GIT_COMMIT/g'",
                        returnStdout: true
                    )
                    echo "app: ${app}"
                    def response = httpRequest acceptType: 'APPLICATION_JSON', contentType: 'APPLICATION_JSON', httpMode: 'POST', requestBody: app, url: "${env.APISERVER_URL}/v1/namespaces/${env.APPLICATION_NAMESPACE}/applications/${env.APPLICATION_NAME}"
                    println('Status: '+response.status)
                    println('Response: '+response.content)
                }
            }
        }
    }
}
```

之后向流水线中使用的 Git 仓库的分支推送代码变更，Git 仓库的 Webhook 会触发 Jenkins 中新创建的流水线。该流水线会自动构建代码镜像并推送至镜像仓库，然后对 KubeVela apiserver 发送 POST 请求，将仓库中的应用配置文件部署到 Kubernetes 集群中。其中 app.yaml 可以参照以下样例。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: kubevela-demo-app
spec:
  components:
    - name: kubevela-demo-app-web
      type: webservice
      properties:
        image: somefive/kubevela-demo-cicd-app
        imagePullPolicy: Always
        port: 8080
      traits:
        - type: rollout
          properties:
            rolloutBatches:
              - replicas: 2
              - replicas: 3
            batchPartition: 0
            targetSize: 5
        - type: labels
          properties:
            jenkins-build-commit: GIT_COMMIT
        - type: ingress
          properties:
            domain: <your domain>
            http:
              "/": 8088
```

其中 GIT_COMMIT 会在 Jenkins 流水线中被替换为当前的 git commit id。这时可以通过 kubectl 命令查看 Kubernetes 集群中应用的部署情况。

```bash
$ kubectl get app -n kubevela-demo-namespace   
NAME            COMPONENT               TYPE         PHASE     HEALTHY   STATUS   AGE
cicd-demo-app   kubevela-demo-app-web   webservice   running   true               102s
$ kubectl get deployment -n kubevela-demo-namespace
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
kubevela-demo-app-web-v1   2/2     2            2           111s
$ kubectl get ingress -n kubevela-demo-namespace 
NAME                    CLASS    HOSTS                                                                                 ADDRESS          PORTS   AGE
kubevela-demo-app-web   <none>   <your domain>   198.11.175.125   80      117s
```

在部署的应用文件中，我们使用了灰度发布(Rollout)的特性，应用初始发布先创建 2 个 Pod，以便进行金丝雀验证。待验证完毕，你可以将应用配置中 Rollout 特性的 `batchPatition: 0` 删去，以便完成剩余实例的更新发布。这个机制大大提高发布的安全性和稳定性，同时你也可以根据实际需要，调整 Rollout 发布策略。

```bash
$ kubectl edit app -n kubevela-demo-namespace   
application.core.oam.dev/cicd-demo-app edited
$ kubectl get deployment -n kubevela-demo-namespace
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
kubevela-demo-app-web-v1   5/5     5            5           4m16s
$ curl http://<your domain>/
Version: 0.1.2
```

## 更多

详细的环境部署流程以及更加完整的应用滚动更新可以参考[博客](/blog/2021/09/02/kubevela-jenkins-cicd)。