---
title: Multi-Environment Policy
---

This documentation will introduce how to use env-binding to automate multi-stage application rollout across multiple environments.

## Background

Users usually have two or more environments to deploy applications to. For example, dev environment to test the application code, and production environment to deploy applications to serve live traffic. For different environments, the deployment configuration also has some nuance.

## Multi-env Application Deployment

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app
  namespace: demo
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
          - name: test
            placement: # selecting the namespace (in local cluster) to deploy to
              namespaceSelector:
                name: test
            selector: # selecting which component to use
              components:
                - data-worker

          - name: staging
            placement: # selecting the cluster to deploy to
              clusterSelector:
                name: cluster-staging

          - name: prod
            placement: # selecting both namespace and cluster to deploy to
              clusterSelector:
                name: cluster-prod
              namespaceSelector:
                name: prod
            patch: # overlay patch on above components
              components:
                - name: hello-world-server
                  type: webservice
                  traits:
                    - type: scaler
                      properties:
                        replicas: 3

  workflow:
    steps:
      # deploy to test env
      - name: deploy-test
        type: deploy2env
        properties:
          policy: example-multi-env-policy
          env: test

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

We apply the Application `policy-demo` in the example.

> Before applying this example application, you need a namespace named `demo` in the current cluster and namespace `test` in both the current cluster and the staging cluster. You need namespace `prod` in cluster `cluster-prod` as well. You can create it by executing cmd `kubectl create ns <namespace>`.

```shell
kubectl apply -f app.yaml
```

After the Application is created, a configured Application will be created under the `demo` namespace.

```shell
$ kubectl get app -n demo
NAME          COMPONENT            TYPE         PHASE     HEALTHY   STATUS   AGE
example-app   hello-world-server   webservice   running                      25s
```

If you want to learn more about `env-binding`, please refer to **[Multi Cluster Deployment](../../case-studies/multi-cluster)**.

## Appendix: Parameter List

Name | Desc | Type | Required | Default Value
:---------- | :----------- | :----------- | :----------- | :-----------
envs|environment configuration| `env` array|true|null

env

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------ 
name|environment name|string|true|null
patch|configure the components of the Application|`patch`|false|null
placement|resource scheduling strategy, choose to deploy the configured resources to the specified cluster or namespace| `placement`|true|null
| selector  | identify which components to be deployed for this environment, default to be empty which means deploying all components | `selector`  | false       | null     |

patch

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------ 
components|components that need to be configured| component array|true|null

placement

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------ 
clusterSelector| select deploy cluster by cluster name | `clusterSelector` |false|null
namespaceSelector| select deploy namespace by namespace name | `namespaceSelector` |false|null

selector

| 名称       | 描述                 | 类型           | 是否必须 | 默认值 |
| :--------- | :------------------- | :------------- | :------- | :----- |
| components | component names to be used | string array | false       | null     |

clusterSelector

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------
name |cluster name| string |false|null

namespaceSelector

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------
name |namespace name| string |false|null

> You need to upgrade to KubeVela v1.1.5+ to enable `namespaceSelector`.