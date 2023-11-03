---
title: 系统集成
---

KubeVela 的应用（Application）天然支持身份模拟，即使没有启用其身份验证功能。 这意味着当禁用身份验证时，您可以在应用的注解部分手动设置要模拟的身份。例如以下指南将举例说明如何使用指定的服务账号（ServiceAccount）部署应用 。

## 例子

假设我们有两个名称空间：

- `demo-service`：用于管理应用程序
- `demo-service-prod`：为生产环境部署组件

在此示例中，我们将使应用使用特定的服务账号而不是控制器的服务账号来进行部署。

### 创建服务账号（ServiceAccount）

在 `demo-service` 命名空间下创建 `deployer` 服务账号。

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployer
  namespace: demo-service
```

### 创建角色/角色绑定（Role/RoleBinding）

通过创建角色和角色绑定来允许 `demo-service` 命名空间下的 `deployer` 服务账号管理 `demo-service-prod` 命名空间下的 Deployments。

> 请注意，KubeVela 应用程序需要模拟身份才能拥有写 ControllerRevision 的权限。 如果您在 KubeVela 控制器中使用 `--optimize-disable-component-revision`，则可以忽略此要求。

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

### 使用指定服务账号部署应用

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: multi-env-demo-with-service-account
  namespace: demo-service
  annotations:
    app.oam.dev/service-account-name: deployer # 我们上面创建的服务账号
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

部署应用程序后，您可以检查应用程序是否部署成功：

```bash
$ vela status multi-env-demo-with-service-account -n demo-service     
About:

  Name:         multi-env-demo-with-service-account
  Namespace:    demo-service                       
  Created at:   2022-05-31 17:58:14 +0800 CST      
  Status:       running                            

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:ut3bxuisoy
    name:deploy-prod-server
    type:deploy2env
    phase:succeeded 
    message:

Services:

  - Name: nginx-server  
    Cluster: local  Namespace: demo-service-prod
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

如果你在注解中设置了非授权的服务账号，你会在应用的status输出中看到类似下面的错误信息：

```
Dispatch: Found 1 errors. [(cannot get object: deployments.apps "nginx-server" is forbidden: User "system:serviceaccount:demo-service:non-authorized-account" cannot get resource "deployments" in API group "apps" in the namespace "demo-service-prod")]
```

## 模拟指定用户/用户组

如果您想让应用程序模拟特定的用户和组，您可以在应用程序中分别设置注解 `app.oam.dev/username` 和 `app.oam.dev/group`。