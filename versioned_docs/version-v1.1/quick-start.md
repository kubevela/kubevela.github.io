---
title:  Deploy First Application
---

Welcome to KubeVela! In this guide, we'll walk you through how to install KubeVela, and deploy your first simple application.

## Installation

Make sure you have finished and verified KubeVela installation following [this guide](install).

## A Simple Application

A simple deployment definition in KubeVela looks as below:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: ingress-1-20
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

Now deploy it to KubeVela:

```bash
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/vela-app.yaml
```

This command will deploy a web service component to target environment, which in our case is the Kubernetes cluster that KubeVela itself is installed.

After deployed, you can now directly visit this application as it already attached with a `ingress` trait (assume your cluster has Ingress enabled).

```
$ curl -H "Host:testsvc.example.com" http://<some ip address>/
<xmp>
Hello World


                                       ##         .
                                 ## ## ##        ==
                              ## ## ## ## ##    ===
                           /""""""""""""""""\___/ ===
                      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~ ~ /  ===- ~~~
                           \______ o          _,/
                            \      \       _,'
                             `'--.._\..--''
</xmp>
```

## Deploy More Components

KubeVela allows you to deploy diverse components types. In above example, the `Web Service` component is actually a predefined [CUE](https://cuelang.org/) module. 

You can also try:

### Helm components

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis-comp
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        url: https://charts.bitnami.com/bitnami
        repoType: helm
```

### Terraform components

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rds-cloud-source
spec:
  components:
    - name: sample-db
      type: alibaba-rds
      properties:
        instance_name: sample-db
        account_name: oamtest
        password: U34rfwefwefffaked
        writeConnectionSecretToRef:
          name: db-conn
```

### Components from Git repository

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: git-app
spec:
  components:
    - name: git-comp
      type: kustomize
      properties:
        repoType: git
        url: https://github.com/<path>/<to>/<repo>
        git:
          branch: master
        path: ./app/dev/
```

... and many many more. Please check the `Deploying Components` section under `User Manuals` for all supported types, and even go ahead to add your own.

## Attach Operational Behaviors

KubeVela is not just about deploy. It allows you to attach predefined operational behaviors (named `Traits`) to your components in-place. For example, let's assign a batch rollout strategy to our web service:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v1
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
```

Now whenever the image version is updated in above YAML file, the `express-server` component will rollout following strategy defined in `rolloutBatches`. 

For all supported traits in KubeVela, please check `Attaching Traits` section under `User Manuals`. Not surprisingly, you can also add your own traits to KubeVela with just minimal effort.

## Define Policies and Workflow

Components and traits are just the beginning of your vela sail. KubeVela is by design a full functional Continuous Delivery (CD) platform with fine grained support for hybrid/multi-cloud/multi-cluster deployment.

Let's say:

> I want to deploy an micro-services application with two components, firstly to staging cluster with only 1 instance, then pause and wait for manual approval. If approved, then deploy it to production cluster but with instances scaled to 3.

Oops, imagine how many add-hoc scripts and glue code are needed in your CI/CD pipeline to achieve automation and deployment success rate in above process.

While with KubeVela, above process can be easily modeled as a declarative deployment plan as below:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app
  namespace: default
spec:
  components:
    - name: hello-world-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: scaler
          properties:
            replicas: 1
    - name: data-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000000'
  policies:
    - name: example-multi-env-policy
      type: env-binding
      properties:
        envs:
          - name: staging
            placement: # selecting the cluster to deploy to
              clusterSelector:
                name: cluster-staging
            selector: # selecting which component to use
              components:
                - hello-world-server

          - name: prod
            placement:
              clusterSelector:
                name: cluster-prod
            patch: # overlay patch on above components
              components:
                - name: hello-world-server
                  type: webservice
                  traits:
                    - type: scaler
                      properties:
                        replicas: 3

    - name: health-policy-demo
      type: health
      properties:
        probeInterval: 5
        probeTimeout: 10

  workflow:
    steps:
      # deploy to staging env
      - name: deploy-staging
        type: deploy2env
        properties:
          policy: example-multi-env-policy
          env: staging

      # manual check
      - name: manual-approval
        type: suspend

      # deploy to prod env
      - name: deploy-prod
        type: deploy2env
        properties:
          policy: example-multi-env-policy
          env: prod
```  

No more add-hoc scripts or glue code, KubeVela will get the application delivery workflow done with full automation and determinism. Most importantly, KubeVela expects you keep using the CI solutions you are already familiar with and KubeVela is fully complementary to them as the CD control plane.

For using KubeVela with your own CI pipelines and other tools, please check `Best Practices` section in the sidebar for more real world examples.

## What's Next

All above features are just the first glance of KubeVela. For next steps, we recommend:
- Learn KubeVela's [application model](./core-concepts/application).
- Interested in KubeVela itself? Learn its [design and architecture](./core-concepts/architecture).
