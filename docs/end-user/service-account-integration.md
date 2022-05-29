---
title: Kubernetes RBAC
---

KubeVela applies Components and runs Workflow with the controller service account, which allows you to manage components across namespaces.

However, in the soft-multitenancy environments, such as [Namespaces as a Service](https://kubernetes.io/blog/2021/04/15/three-tenancy-models-for-kubernetes/#namespaces-as-a-service), you may need to limit Applications to allow applying components or running workflows in the authorized namespaces only.

You can limit by setting `app.oam.dev/service-account-name` annotation with the specific ServiceAccount name. If defined, KubeVela will use the given ServiceAccount instead of the controller ServiceAccount when applying Components and running Workflow.

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

```sh
NAME                                  COMPONENT      TYPE         PHASE              HEALTHY   STATUS      AGE
multi-env-demo-with-service-account   nginx-server   webservice   workflowFinished   true      Ready:1/1   18s
```

If you set non-authorized ServiceAccount to the annotation, you can find an error message like below in the Application status.

```
Dispatch: Found 1 errors. [(cannot get object: deployments.apps "nginx-server" is forbidden: User "system:serviceaccount:demo-service:non-authorized-account" cannot get resource "deployments" in API group "apps" in the namespace "demo-service-prod")]
```

## Limitations

ServiceAccount Integration doesn't support Multi-Cluster Application Delivery.
Even if you set ServiceAccount name to the annotation, KubeVela will ignore it if the scope is a non-local cluster.

You can follow up about this issue on [GitHub](https://github.com/kubevela/kubevela/issues/3440).
