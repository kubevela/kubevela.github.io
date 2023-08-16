---
title: 用于 RBAC 的 ServiceAccount 集成
---

KubeVela 用控制器 ServiceAccount 应用组件并执行工作流，这使用户可以跨命名空间管理组件。

但在 [Namespaces as a Service](https://kubernetes.io/blog/2021/04/15/three-tenancy-models-for-kubernetes/#namespaces-as-a-service) 等软多租环境中，你可能需要限制应用程序只能在已授权的命名空间中应用组件或执行工作流。

你可以通过设置 `app.oam.dev/service-account-name` 注解来限制特定的 ServiceAccount 名称。如果定义了名称，那么 KubeVela 在应用组件和执行工作流时，将使用给定的 ServiceAccount 而不是控制器的 ServiceAccount。

## 示例

假设我们有两个命名空间：

- `demo-service`: 用于管理应用程序
- `demo-service-prod`: 为生产环境部署组件

在此示例中，我们让应用程序使用特定的 ServiceAccount，而不是控制器 ServiceAccount。

### 创建 ServiceAccount

在 `demo-service` 命名空间中创建 `deployer` ServiceAccount。

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployer
  namespace: demo-service
```

### 创建 Role/RoleBinding

允许 `demo-service` 中的 `deployer` ServiceAccount 通过创建 Role/RoleBinding 来管理 `demo-service-prod` 的应用部署。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployments:admin
  namespace: demo-service-prod
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployments:admin
  namespace: demo-service-prod
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: deployments:admin
subjects:
  - kind: ServiceAccount
    name: deployer
    namespace: demo-service
```

### 使用 ServiceAccount 部署应用

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: multi-env-demo-with-service-account
  namespace: demo-service
  annotations:
    app.oam.dev/service-account-name: deployer # 所创建的 ServiceAccount 名称
spec:
  components:
    - name: nginx-server
      type: webservice
      properties:
        image: nginx:1.21
        port: 80
  policies:
    - name: env
      type: env-binding
      properties:
        created: false
        envs:
          - name: prod
            patch:
              components:
                - name: nginx-server
                  type: webservice
                  properties:
                    image: nginx:1.20
                    port: 80
            placement:
              namespaceSelector:
                name: demo-service-prod
  workflow:
    steps:
      - name: deploy-prod-server
        type: deploy2env
        properties:
          policy: env
          env: prod
```

在部署完应用程序后，你可以检查是否部署成功。

```sh
NAME                                  COMPONENT      TYPE         PHASE              HEALTHY   STATUS      AGE
multi-env-demo-with-service-account   nginx-server   webservice   workflowFinished   true      Ready:1/1   18s
```

如果你给注解设置了未授权的 ServiceAccount，你会在应用程序状态中找到如下错误信息。

```
Dispatch: Found 1 errors. [(cannot get object: deployments.apps "nginx-server" is forbidden: User "system:serviceaccount:demo-service:non-authorized-account" cannot get resource "deployments" in API group "apps" in the namespace "demo-service-prod")]
```

## 局限性

ServiceAccount 集成不支持多集群应用程序交付。这意味着如果在一个非本地集群中，即使你将 ServiceAccount 名称设为注解，KubeVela 也将忽略它。

你可以在 [GitHub](https://github.com/kubevela/kubevela/issues/3440) 上跟进此问题。
