---
title: Multi-Environment Deployment
---

This documentation will introduce how to use env-binding to automate multi-stage application rollout across multiple environments.

## Background

Users usually have two or more environments to deploy applications to. For example, dev environment to test the application code, and production environment to deploy applications to serve live traffic. For different environments, the deployment configuration also has some nuance.

## Multi-env Application Deployment

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: policy-demo
  namespace: default
spec:
  components:
    - name: nginx-server
      type: webservice
      properties:
        image: nginx:1.21
        port: 80

  policies:
    - name: my-policy
      type: env-binding
      properties:
        clusterManagementEngine: single-cluster
        envs:
          - name: test
            patch:
              components:
                - name: nginx-server
                  type: webservice
                  properties:
                    image: nginx:1.20
                    port: 80
            placement:
              namespaceSelector:
                name: test
  workflow:
    steps:
      - name: deploy-test-env
        type: multi-env
        properties:
          # Specify the policy name
          policy: my-policy
          # Specify the env name in the policy
          env: test
```

We apply the Application `policy-demo` in the example.

Before applying an Application, you need a namespace named `test` in the current cluster. You can create it by executing cmd `kubectl create ns test`.

```shell
kubectl apply -f app.yaml
```

After the Application is created, a configured Application will be created under the `test` namespace.

```shell
$ kubectl get app -n test
NAME          COMPONENT      TYPE         PHASE     HEALTHY   STATUS   AGE
policy-demo   nginx-server   webservice   running   true               65s
```

If you want to learn more about `env-binding`, please refer to **[Multi Cluster Deployment](../multi-app-env-cluster)**.

## Appendix: Parameter List

Name | Desc | Type | Required | Default Value
:---------- | :----------- | :----------- | :----------- | :-----------
clusterManagementEngine|cluster management engine, options: single-cluster, ocm|string|false|ocm
envs|environment configuration| `env` array|true|null

env

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------ 
name|environment name|string|true|null
patch|configure the components of the Application|`patch`|true|null
placement|resource scheduling strategy, choose to deploy the configured resources to the specified cluster or namespace| `placement`|true|null

patch

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------ 
components|components that need to be configured| component array|true|null

placement

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------ 
clusterSelector|Cluster selector, filter clusters by label or name,only valid when clusterManagementEngine is ocm| `clusterSelector` |true|null
namespaceSelector|Namespace selector, filter namespaces by label or name,only valid when clusterManagementEngine is single-cluster| `namespaceSelector` |true|null

clusterSelector

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------
labels |cluster labels| map[string]string |false|null
name |cluster name| string |false|null

namespaceSelector

Name | Desc | Type | Required | Default Value
:----------- | :------------ | :------------ | :------------ | :------------
labels |namespace labels| map[string]string |false|null
name |namespace name| string |false|null