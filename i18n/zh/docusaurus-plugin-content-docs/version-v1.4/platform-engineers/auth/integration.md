---
title: Systems Integration 
---

KubeVela application natively supports impersonation even without the Authentication flag enabled. That means when the Authentication flag is disabled, you can manually set the identity to impersonate in the application's annotation fields. For example, the following guide will give an example on how to manually set the application to impersonate as a ServiceAccount.

## Example

Let's assume that we have two namespaces:

- `demo-service`: for managing application
- `demo-service-prod`: to deploy components for the production environment

In this example, we will make the Application use a specific ServiceAccount instead of the controller ServiceAccount.

### Creating ServiceAccount

Create `deployer` ServiceAccount in `demo-service` namespace.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployer
  namespace: demo-service
```

### Creating Role/RoleBinding

Allow `deployer` ServiceAccount in `demo-service` to manage Deployments in `demo-service-prod` by creating Role/RoleBinding.

> Notice that KubeVela application requires the identity to impersonate to have the privileges for writing ControllerRevision. If you use `--optimize-disable-component-revision` in the KubeVela controller, you can ignore this requirement.

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

### Deploying an Application with ServiceAccount

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

After deploying the Application, you can check the Application is deployed successfully.

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

If you set non-authorized ServiceAccount to the annotation, you can find an error message like below in the Application status.

```
Dispatch: Found 1 errors. [(cannot get object: deployments.apps "nginx-server" is forbidden: User "system:serviceaccount:demo-service:non-authorized-account" cannot get resource "deployments" in API group "apps" in the namespace "demo-service-prod")]
```

## Impersonate as User/Groups

If you would like to let the application to impersonate as specific user and group, you can set the annotation `app.oam.dev/username` and `app.oam.dev/group` in the application respectively. 