---
title: 使用 Jenkins + KubeVela 完成应用的持续交付
author: Da Yin, Yang Song
author_title: KubeVela 团队
author_url: https://github.com/oam-dev/kubevela
author_image_url: https://kubevela.io/img/logo.svg
tags: [ kubevela ]
description: ""
image: https://raw.githubusercontent.com/oam-dev/kubevela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

KubeVela 打通了应用与基础设施之间的交付管控的壁垒，相较于原生的 Kubernetes 对象，KubeVela 的 Application 更好地简化抽象了开发者需要关心的配置，将复杂的基础设施能力及编排细节留给了平台工程师。而 KubeVela 的 apiserver 则是进一步为开发者提供了使用 HTTP Request 直接操纵 Application 的途径，使得开发者即使没有 Kubernetes 的使用经验与集群访问权限也可以轻松部署自己的应用。

本文就以经典的持续集成 (Continuous Integration) 工具 Jenkins 为基础，简单介绍如何打造基于 GitOps 的应用持续交付的“高速公路”。

## 持续交付“高速公路”

作为应用开发者的你，更多地关心自己的应用是否正常运作，开发流程是否便捷高效。为此，在这条持续交付的“高速公路”上，将会由以下部件为你保驾护航。
1. 你需要一个 git 仓库来存放应用程序代码、测试代码，以及描述 KubeVela Application 的 YAML 文件。
2. 你需要一个持续集成 (Continuous Integration) 的工具帮你自动化完成程序代码的测试，并打包成镜像上传到仓库中。
3. 你需要在 Kubernetes 集群上安装 KubeVela 并启用 apiserver 功能。

> 目前 KubeVela 的 apiserver 在权限认证方面仍待完善，后续启用 apiserver 后将会加入权限配置环节。

本文的介绍中采用了 Github 作为 git 仓库，Jenkins 作为 CI 工具，DockerHub 作为镜像仓库。应用程序以一个简单的 HTTP Server 为例，整个持续交付的流程如下。可以看到，在这条持续交付的“高速公路”上，开发者只需要关心应用的开发并使用 Git 进行代码版本的维护，即可自动走完测试流程并部署应用到 Kubernetes 集群中。

![arch](/img/jenkins-cicd/arch.png)

## 部署环境

### Jenkins 环境

> 本文采用了 Jenkins 作为持续集成工具，开发者也可以使用其他 CI 工具，如 TravisCI 或者 GitHub Action。

首先你需要准备一份 Jenkins 环境来部署 CI 流水线。安装与初始化 Jenkins 流程可以参见[官方文档](https://www.jenkins.io/doc/book/installing/linux/)。

需要注意的是，由于本文的 CI 流水线是基于 Docker 及 GitHub 的，因此在安装 Jenkins 之后还需要安装相关插件 (Dashboard > Manage Jenkins > Manage Plugins) ，包括 Pipeline、HTTP Request Plugin、Docker Pipeline、Docker Plugin。

此外，还需要为 Jenkins 配置 Docker 的运行环境 (Dashboard > Manage Jenkins > Configure System > Docker Builder) ，如 Jenkins 所在环境已经安装了 Docker，可以将 Docker URL 配置为 `unix:///var/run/docker.sock`。

由于在 CI 流水线运行过程中，还需要将容器镜像推至镜像仓库，为此需在 Jenkins 的 Credential 中将镜像仓库的账户配置好 (Dashboard > Manage Jenkins > Manage Credentials > Add Credentials) ，比如将 DockerHub 的用户名及密码存入。

![jenkins-credential](/img/jenkins-cicd/jenkins-credential.png)

### GitHub 仓库环境

> 本文的介绍采用了 Github 作为代码仓库，开发者还可以根据各自的需求与喜好，使用其他代码仓库，如 Gitlab。

为使持续集成工具 Jenkins 能够获取到 GitHub 中的更新，并将流水线的运行状态反馈回 GitHub，需要在 GitHub 中完成以下两步操作。

1. [配置](https://github.com/settings/tokens/new) Personal Access Token。注意将 `repo:status` 勾选，以获得向 GitHub 推送 Commit 状态的权限。

![github-pat](/img/jenkins-cicd/github-pat.png)

然后在 Jenkins 的 Credential 中加入 Secret Text 类型的 Credential 并将上述的 GitHub 的 Personal Access Token 填入。

![jenkins-secret-text](/img/jenkins-cicd/jenkins-secret-text.png)

最后来到 Jenkins 的 Dashboard > Manage Jenkins > Configure System > GitHub 中点击 Add GitHub Server 并将刚才创建的 Credential 填入。完成后可以点击 Test connection 来验证配置是否正确。

![jenkins-github](/img/jenkins-cicd/jenkins-github.png)

2. 在 GitHub 的代码仓库的设定里添加 Webhook，将 Jenkins 的地址对应的 Webhook 地址填入，比如 http://my-jenkins.example.com/github-webhook/ 。这样，该代码仓库的所有 Push 事件推送到 Jenkins 中。

![github-webhook](/img/jenkins-cicd/github-webhook.png)

### KubeVela 环境

你需要在 Kubernetes 集群中安装 KubeVela，并启用 apiserver 功能，可以参考[官方文档](/docs/platform-engineers/advanced-install#install-kubevela-with-apiserver)。

## 编写应用

本文采用的应用是一个基于 Golang 语言编写的简单的 HTTP Server。在代码中，声明了一个名叫 `VERSION` 的常量，并在访问该服务时打印出来。同时还附带一个简单的测试，用来校验 `VERSION` 的格式是否符合标准。
```go
// main.go

package main

import (
	"fmt"
	"net/http"
)

const VERSION = "0.1.0-v1alpha1"

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = fmt.Fprintf(w, "Version: %s\n", VERSION)
	})
	if err := http.ListenAndServe(":8088", nil); err != nil {
		println(err.Error())
	}
}
```
```go
// main_test.go

package main

import (
	"regexp"
	"testing"
)

const verRegex string = `^v?([0-9]+)(\.[0-9]+)?(\.[0-9]+)?` +
	`(-([0-9A-Za-z\-]+(\.[0-9A-Za-z\-]+)*))?` +
	`(\+([0-9A-Za-z\-]+(\.[0-9A-Za-z\-]+)*))?$`

func TestVersion(t *testing.T) {
	if ok, _ := regexp.MatchString(verRegex, VERSION); !ok {
		t.Fatalf("invalid version: %s", VERSION)
	}
}
```

在应用交付时需要将 Golang 服务打包成镜像并以 KubeVela Application 的形式发布到 Kubernetes 集群中，因此在代码仓库中还包含 `Dockerfile` 以及 `app.yaml` 文件，分别用来描述镜像的打包方式以及 Application 的相关配置。

```Dockerfile
# Dockerfile
FROM golang:1.13-rc-alpine3.10 as builder
WORKDIR /app
COPY main.go .
RUN go build -o kubevela-demo-cicd-app main.go

FROM alpine:3.10
WORKDIR /app
COPY --from=builder /app/kubevela-demo-cicd-app /app/kubevela-demo-cicd-app
ENTRYPOINT ./kubevela-demo-cicd-app
EXPOSE 8088
```

在 app.yaml 中，声明了部署的应用包含 5 个不同副本，同时通过 Ingress 的形式发布给集群外部。而 labels 则是给应用中的 Pod 打上了当前的 git commit 作为标签。当 Jenkins 的部署流水线运行时，会将 GIT_COMMIT 注入其中，提交到 KubeVela apiserver，从而触发 Application 的更新。在版本更新过程中，按照 2, 3 的数量分两次次更新副本，同时在第一次更新后停止自动更新，等待手动确认后再进行全部更新，实现金丝雀发布的过程。

```yaml
# app.yaml
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
            domain: kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com
            http:
              "/": 8088
```

## 配置 CI 流水线

在本文的案例中，包含两条流水线，一条是用来进行测试的流水线 (对应用代码运行测试) ，一条是交付流水线 (将应用代码打包上传镜像仓库，同时更新目标环境中的应用，实现自动更新) 。

### 测试流水线
在 Jenkins 中创建一条新的 Pipeline，并配置 Build Triggers 为 GitHub hook trigger for GITScm polling。

![test-pipeline-create](/img/jenkins-cicd/test-pipeline-create.png)
![test-pipeline-config](/img/jenkins-cicd/test-pipeline-config.png)

在这条流水线中，首先是采用了 golang 的镜像作为执行环境，方便后续运行测试。然后将分支配置为 GitHub 仓库中的 dev 分支，代表该条流水线被 Push 事件触发后会拉取 dev 分支上的内容并执行测试。测试结束后将流水线的状态回写至 GitHub 中。

```groovy
void setBuildStatus(String message, String state) {
  step([
      $class: "GitHubCommitStatusSetter",
      reposSource: [$class: "ManuallyEnteredRepositorySource", url: "https://github.com/Somefive/KubeVela-demo-CICD-app"],
      contextSource: [$class: "ManuallyEnteredCommitContextSource", context: "ci/jenkins/test-status"],
      errorHandlers: [[$class: "ChangingBuildStatusErrorHandler", result: "UNSTABLE"]],
      statusResultSource: [ $class: "ConditionalStatusResultSource", results: [[$class: "AnyBuildResult", message: message, state: state]] ]
  ]);
}
pipeline {
    agent {
        docker { image 'golang:1.13-rc-alpine3.10' }
    }
    stages {
        stage('Prepare') {
            steps {
                script {
                    def checkout = git branch: 'dev', url: 'https://github.com/Somefive/KubeVela-demo-CICD-app.git'
                    env.GIT_COMMIT = checkout.GIT_COMMIT
                    env.GIT_BRANCH = checkout.GIT_BRANCH
                    echo "env.GIT_BRANCH=${env.GIT_BRANCH},env.GIT_COMMIT=${env.GIT_COMMIT}"
                }
                setBuildStatus("Test running", "PENDING");
            }
        }
        stage('Test') {
            steps {
                sh 'CGO_ENABLED=0 GOCACHE=$(pwd)/.cache go test *.go'
            }
        }
    }
    post {
        success {
            setBuildStatus("Test success", "SUCCESS");
        }
        failure {
            setBuildStatus("Test failed", "FAILURE");
        }
    }
}
```

### 部署流水线
在部署流水线中，类似测试流水线，首先将代码仓库中的分支拉取下来，区别是这里采用 prod 分支。然后使用 Docker 进行镜像构建并推送至远端镜像仓库 (这里为 DockerHub，其中 withRegistry 中填写镜像仓库位置以及在先前步骤中存入的 DockerHub 的账户对应的 Credential 的 ID) 。构建成功后，再将 Application 对应的 YAML 文件转换为 JSON 文件并注入 GIT_COMMIT，最后向 KubeVela apiserver (此处为 http://47.88.24.19/) 发送请求进行创建或更新。

> 目前的 KubeVela apiserver 接收 JSON 参数，因此在流水线中做了相应的转换。未来的 KubeVela apiserver 将会进一步改进交互模式，简化此处的流程，同时再加上更为严格的权限认证，提高安全性。

> 该案例中会向 kubevela-demo-namespace 这个 Namespace 中创建名叫 cicd-demo-app 的应用，注意这个 Namespace 需要预先在 Kubernetes 中创建出来。未来 KubeVela 的 apiserver 同样会简化这一流程。

```groovy
void setBuildStatus(String message, String state) {
  step([
      $class: "GitHubCommitStatusSetter",
      reposSource: [$class: "ManuallyEnteredRepositorySource", url: "https://github.com/Somefive/KubeVela-demo-CICD-app"],
      contextSource: [$class: "ManuallyEnteredCommitContextSource", context: "ci/jenkins/deploy-status"],
      errorHandlers: [[$class: "ChangingBuildStatusErrorHandler", result: "UNSTABLE"]],
      statusResultSource: [ $class: "ConditionalStatusResultSource", results: [[$class: "AnyBuildResult", message: message, state: state]] ]
  ]);
}
pipeline {
    agent any
    stages {
        stage('Prepare') {
            steps {
                script {
                    def checkout = git branch: 'prod', url: 'https://github.com/Somefive/KubeVela-demo-CICD-app.git'
                    env.GIT_COMMIT = checkout.GIT_COMMIT
                    env.GIT_BRANCH = checkout.GIT_BRANCH
                    echo "env.GIT_BRANCH=${env.GIT_BRANCH},env.GIT_COMMIT=${env.GIT_COMMIT}"
                    setBuildStatus("Deploy running", "PENDING");
                }
            }
        }
        stage('Build') {
            steps {
                script {
                    docker.withRegistry("https://registry.hub.docker.com", "DockerHubCredential") {
                        def customImage = docker.build("somefive/kubevela-demo-cicd-app")
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
                        script: "./yq_linux_amd64 eval -o=json '.spec' app.yaml | sed -e 's/GIT_COMMIT/$GIT_COMMIT/g'",
                        returnStdout: true
                    )
                    echo "app: ${app}"
                    def response = httpRequest acceptType: 'APPLICATION_JSON', contentType: 'APPLICATION_JSON', httpMode: 'POST', requestBody: app, url: "http://47.88.24.19/v1/namespaces/kubevela-demo-namespace/applications/cicd-demo-app"
                    println('Status: '+response.status)
                    println('Response: '+response.content)
                }
            }
        }
    }
    post {
        success {
            setBuildStatus("Deploy success", "SUCCESS");
        }
        failure {
            setBuildStatus("Deploy failed", "FAILURE");
        }
    }
}
```

## 实际表现

在完成上述的配置流程后，持续交付的流程便已经搭建完成。我们可以来检验一下它的效果。

![pipeline-overview](/img/jenkins-cicd/pipeline-overview.png)

我们首先将 `main.go` 中的 `VERSION` 字段修改为 `Bad Version Number`，即
```go
const VERSION = "Bad Version Number"
```
然后提交该修改至 dev 分支。我们可以看到 Jenkins 上的测试流水线被触发运行，失败后将该状态回写给 GitHub。

![test-pipeline-fail](/img/jenkins-cicd/test-pipeline-fail.png)
![test-github-fail](/img/jenkins-cicd/test-github-fail.png)

我们重新将 `VERSION` 修改为 0.1.1，然后再次提交。可以看到这一次测试流水线成功完成执行，并在 GitHub 对应的 Commit 上看到了成功的标志。

![test-pipeline-success](/img/jenkins-cicd/test-pipeline-success.png)
![test-github-success](/img/jenkins-cicd/test-github-success.png)

接下来我们在 GitHub 上提交 Pull Request 尝试将 dev 分支上的更新合并至 prod 分支上。

![pull-request](/img/jenkins-cicd/pull-request.png)

可以看到在 Jenkins 的部署流水线成功运行结束后，GitHub 上 prod 分支最新的 Commit 也显示了成功的标志。

![deploy-pipeline-success](/img/jenkins-cicd/deploy-pipeline-success.png)
![deploy-github-success](/img/jenkins-cicd/deploy-github-success.png)

```bash
$ kubectl get app -n kubevela-demo-namespace
NAME                     COMPONENT               TYPE         PHASE     HEALTHY   STATUS   AGE
kubevela-demo-cicd-app   kubevela-demo-app-web   webservice   running   true               112s
$ kubectl get deployment -n kubevela-demo-namespace
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
kubevela-demo-app-web-v1   2/2     2            2           2m1s
```

如图显示，要部署的应用顺利被 KubeVela apiserver 接受并由 KubeVela 控制器创建了相关资源。当前 Deployment 的副本数是 2，在删除了该 Application 中 rollout 特征内的 `batchPartition: 0` 后代表确认了当前的发布，然后对应的 Deployment 副本数更新至 5。这时我们可以访问 Ingress 所配置的域名，成功显示了当前的版本号。

```bash
$ kubectl edit app -n kubevela-demo-namespace
application.core.oam.dev/kubevela-demo-cicd-app edited
$ kubectl get deployment -n kubevela-demo-namespace -w
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
kubevela-demo-app-web-v1   4/5     5            4           3m39s
kubevela-demo-app-web-v1   5/5     5            5           3m39s
kubevela-demo-app-web-v1   5/5     5            5           3m40s
kubevela-demo-app-web-v1   5/5     5            5           3m40s
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.1
```

我们重复以上步骤，将版本升级至 0.1.2，完成测试流水线及部署流水线。接着我们会发现 Kubernetes 的集群内对应的 Application 控制的 Deployment 发生了版本更替，旧版本的 Deployment 从 5 副本下降到 3 副本，新版本的 Deployment 则出现了 2 副本。如果此时我们再访问原来的服务地址，会发现有时会显示 0.1.1 版本，有时会显示 0.1.2 版本。这是因为在当前滚动更新过程中，新旧副本同时存在，访问的流量会被负载均衡器分发到不同的副本上，因此会出现两种版本的服务同时存在的现象。

```bash
$ kubectl get deployment -n kubevela-demo-namespace -w
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
kubevela-demo-app-web-v1   5/5     5            5           11m
kubevela-demo-app-web-v2   0/0     0            0           0s
kubevela-demo-app-web-v2   0/0     0            0           0s
kubevela-demo-app-web-v2   0/0     0            0           0s
kubevela-demo-app-web-v1   5/5     5            5           12m
kubevela-demo-app-web-v2   0/0     0            0           0s
kubevela-demo-app-web-v2   0/0     0            0           0s
kubevela-demo-app-web-v2   0/0     0            0           0s
kubevela-demo-app-web-v2   0/0     0            0           0s
kubevela-demo-app-web-v2   0/2     0            0           0s
kubevela-demo-app-web-v2   0/2     0            0           0s
kubevela-demo-app-web-v2   0/2     0            0           0s
kubevela-demo-app-web-v2   0/2     2            0           0s
kubevela-demo-app-web-v1   5/5     5            5           12m
kubevela-demo-app-web-v2   1/2     2            1           2s
kubevela-demo-app-web-v2   2/2     2            2           2s
kubevela-demo-app-web-v1   5/3     5            5           13m
kubevela-demo-app-web-v1   5/3     5            5           13m
kubevela-demo-app-web-v1   3/3     3            3           13m
```
```bash
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.1
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.1
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.1
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.1
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.2
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.2
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.2
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.2
$ curl http://kubevela-demo-cicd-app.cf7c0ed25b151437ebe1ef58efc29bca4.us-west-1.alicontainer.com/
Version: 0.1.1
```

当我们确认新版本的服务正常运作后，可以类似上述步骤，将 Application 中 rollout 特性内的 `batchPartition: 0` 删去，完成整个金丝雀发布流程。

```bash
$ kubectl get deployment -n kubevela-demo-namespace -w
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
kubevela-demo-app-web-v1   3/3     3            3           18m
kubevela-demo-app-web-v2   2/2     2            2           5m24s
kubevela-demo-app-web-v2   2/5     2            2           5m36s
kubevela-demo-app-web-v2   2/5     2            2           5m37s
kubevela-demo-app-web-v2   2/5     2            2           5m37s
kubevela-demo-app-web-v2   2/5     5            2           5m37s
kubevela-demo-app-web-v2   3/5     5            3           5m38s
kubevela-demo-app-web-v2   4/5     5            4           5m38s
kubevela-demo-app-web-v2   5/5     5            5           5m39s
kubevela-demo-app-web-v1   3/0     3            3           18m
kubevela-demo-app-web-v1   3/0     3            3           18m
kubevela-demo-app-web-v1   0/0     0            0           18m
kubevela-demo-app-web-v1   0/0     0            0           18m
kubevela-demo-app-web-v2   5/5     5            5           5m41s
kubevela-demo-app-web-v2   5/5     5            5           5m41s
kubevela-demo-app-web-v1   0/0     0            0           18m
```

## 小结

至此，我们便已经成功实现了一整套持续交付流程。在这个流程中，应用的开发者借助 KubeVela + Jenkins 的能力，可以轻松完成应用的迭代更新、集成测试、自动发布与滚动升级，而整个流程在各个环节也可以按照开发者的喜好和条件选择不同的工具，比如使用 Gitlab 替代 GitHub，或是使用 TravisCI 替代 Jenkins。

在上述过程中，细心的读者可能还会发现，这套流程不仅能够实现应用服务的升级，而且还可以通过修改 app.yaml 自动完成部署方案的升级，比如将 5 副本应用扩容到 10 副本，或是为容器添加 sidecar，从而实现部分 GitOps 能力。关于使用 KubeVela 实践 GitOps 的更多内容，感兴趣的读者可以继续阅读相关案例。