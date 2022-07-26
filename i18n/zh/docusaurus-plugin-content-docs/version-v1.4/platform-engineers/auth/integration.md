---
title: 系统集成 
---

即使没有启用[权限验证](./basic)功能，KubeVela 应用程序本身也支持 Kubernetes 角色扮演。这意味着当权限验证功能被禁用时，你可以在应用程序的注释字段中手动设置要扮演的身份。例如，以下指南将举例说明如何手动将应用程序角色扮演为指定账号 ServiceAccount。
## 例子

假设我们有两个命名空间:

- `demo-service`: 用于管理应用程序
- `demo-service-prod`: 为生产环境部署组件

在这个例子, 我们将使应用程序使用特定的 ServiceAccount，而不是控制器 ServiceAccount。

### 创建 ServiceAccount

在 `demo-service` 命名空间里，创建 `deployer` ServiceAccount .

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployer
  namespace: demo-service
```

### 创建 Role/RoleBinding

允许在 `demo-service` 里的类型为ServiceAccount的`deployer`  通过创建 Role/RoleBinding 管理在 `demo-service-prod` 里的部署

> 注意 KubeVela 应用程序需要模拟身份才能具有写入ControllerRevision的权限。如果在KubeVela控制器中使用`--optimize-disable-component-revision` ，则可以忽略此要求。

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

### 使用ServiceAccount部署应用程序

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: multi-env-demo-with-service-account
  namespace: demo-service
  annotations:
    app.oam.dev/service-account-name: deployer # the name of the ServiceAccount we created
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

部署应用程序后，您可以检查应用程序是否已成功部署。

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

如果你将非授权的ServiceAccount设置为标注 , 则可以在应用程序状态中找到如下错误消息。

```
Dispatch: Found 1 errors. [(cannot get object: deployments.apps "nginx-server" is forbidden: User "system:serviceaccount:demo-service:non-authorized-account" cannot get resource "deployments" in API group "apps" in the namespace "demo-service-prod")]
```

## 模拟为 User/Groups

如果您想让应用程序模拟为特定的用户和组，您可以分别在应用程序中设置注释为`app.oam.dev/username` and `app.oam.dev/group`。