---
title:  Jenkins CI Integration
---

This section will introduce how to use KubeVela with existing CI tools such as Jenkins and why.

## Introduction

With a simple integration effort, KubeVela as a universal application delivery control plane can then supercharge existing CI/CD tools with modern application deployment capabilities such as:
- hybrid/multi-cloud delivery;
- cross-environments promotion;
- service mesh based application rollout/rollback;
- handling deployment dependencies and topology (DAG);
- declare, provision and consume cloud resources alongside with your application;
- enjoy benefits of [GitOps](https://www.weave.works/blog/what-is-gitops-really) delivery without the need to introduce full GitOps transformation to your team;
- ... and much more.

The following guide will use Jenkins as an example to release a sample HTTP server application step by step. The application code can be found in [this GitHub repo](https://github.com/Somefive/KubeVela-demo-CICD-app).

## Preparation

Before combining KubeVela and Jenkins, you need to ensure the following environments have already been set up.

1. Deploy Jenkins service with Docker support, including related plugins and credentials which will be used to access image repository.
2. A git repository with Webhook enabled. Ensure commits to the target branch will trigger the running of the Jenkins pipeline.
3. Get Kubernetes for deployment. Install KubeVela and enable its apiserver. Ensure the KubeVela apiserver can be accessed from external environment.

## Combining Jenkins with KubeVela apiserver

Deploy Jenkins pipeline with the following Groovy script. You can change the git repository address, image address, apiserver address and other environment configurations on demand. Your git repository should contain the `Dockerfile` and `app.yaml` configuration file to tell how to build the target image and which component the application contains.

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

Push commits to the target branch in the git repository, which the Jenkins pipeline focuses on. The webhook of git repo will trigger the newly created Jenkins pipeline. This pipeline will automatically build container images and push it to the image repository. Then it will send POST request to KubeVela apiserver, which will deploy `app.yaml` to Kubernetes cluster. An example of `app.yaml` is shown below.

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

THe *GIT_COMMIT* identifier will be replaced by the current git commit id in Jenkins pipeline. You can check the deployment status in Kubernetes through `kubectl`.

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

In the deployed application, we use the `rollout` trait, which enables us to release 2 pods first for canary validation. After validation succeed, remove `batchPatition: 0` in application configuration in the `rollout` trait. After that, a complete release will be fired. This mechanism greatly improves the security and stability of the releasing process. You can adjust the rollout strategy depending on your scenario.

```bash
$ kubectl edit app -n kubevela-demo-namespace   
application.core.oam.dev/cicd-demo-app edited
$ kubectl get deployment -n kubevela-demo-namespace
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
kubevela-demo-app-web-v1   5/5     5            5           4m16s
$ curl http://<your domain>/
Version: 0.1.2
```

Refer to the [blog post](/blog/2021/09/02/kubevela-jenkins-cicd) for more details about deploying Jenkins + KubeVela and more comprehensive demo for application rolling update.

