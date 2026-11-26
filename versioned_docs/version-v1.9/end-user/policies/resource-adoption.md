---
title: Resource Adoption
---

There are times that you might want to use KubeVela application to adopt existing resources or from other sources like Helm release. In this case, you can leverage the capability of resource adoption in KubeVela.

## Use in Application

By default, when KubeVela application tries to dispatch (create or update) one resource, it will first check if this resource belongs to itself. This check is done by comparing the label values of `app.oam.dev/name` & `app.oam.dev/namespace` and see whether they are equal to the application's name & namespace.

If this resource does not belongs to the application itself (belongs to no one or some other application), the application will stop the dispatch operation and report an error. This mechanism is designed to prevent unintended edits to resources managed by other operators or systems.

If the resource is currently managed by other applications, you can refer to [shared-resource](./shared-resource.md) policy and read more about sharing resources across multiple applications.

If the resource is managed by no one, to allow KubeVela application to manage the resource, you can leverage the `read-only` policy or `take-over` policy to enforce resource adoption on these resources.

### ReadOnly Policy

With `read-only` policy, you can select resources that could be adopted by the current application. For example, in the below application, Deployment typed resources are treated as read-only resources and are able to be adopted by the given application.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: read-only
spec:
  components:
    - name: nginx
      type: webservice
      properties:
        image: nginx
  policies:
    - type: read-only
      name: read-only
      properties:
        rules:
          - selector:
              resourceTypes: ["Deployment"]
```

The `read-only` policy allows application to read the selected resources but will skip all edits to the target resource. Error will be reported if the target resource does not exist.

The target resource will **NOT** be attached with the application's label. It is possible for multiple applications to use the same resource with `read-only` policy concurrently. The deletion of the application will also skip the recycle process of the target resources.

Although the resources selected in the `read-only` policy will not be editable through application, both health check and resource topology graph can work normally. Therefore, you can use KubeVela application with `read-only` policy to build "monitoring group" for underlying resources and leverage tools such as `vela top` or `velaux` to observe them, without any modification.

<details>
<summary>practice</summary>

1. First create the nginx deployment.
```bash
kubectl create deploy nginx --image=nginx
```

2. Deploy the application with `read-only` policy.
```bash
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: read-only
spec:
  components:
    - name: nginx
      type: webservice
      properties:
        image: nginx
  policies:
    - type: read-only
      name: read-only
      properties:
        rules:
          - selector:
              resourceTypes: ["Deployment"]
EOF
```

3. Check the running status of the application.
```bash
vela status read-only
```

4. Use `vela top` to see the resource topology of the application.
![read-only-vela-top](../../resources/read-only-vela-top.jpg)

5. Use `velaux` to see the resource topology graph of the application.
![read-only-velaux](../../resources/read-only-velaux.jpg)

</details>

### TakeOver Policy

In the case you not only want KubeVela application to observe underlying resource but also want the application to be able to edit them, you can use the `take-over` policy in replace of the `read-only` policy.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: take-over
spec:
  components:
    - name: nginx-take-over
      type: k8s-objects
      properties:
        objects:
          - apiVersion: apps/v1
            kind: Deployment
            metadata:
              name: nginx
      traits:
        - type: scaler
          properties:
            replicas: 3
  policies:
    - type: take-over
      name: take-over
      properties:
        rules:
          - selector:
              resourceTypes: ["Deployment"]
```

In the above application, the `nginx` deployment will be added with owner labels and marked as belonged to the current app. The attached `scaler` trait in the application will modify the replica number of the target deployment to 3, while keeping all other fields untouched.
 
After the resource is taken over by the application, the application will control the upgrades and deletion of the target resource. Therefore, differ from `read-only` policy, each resource can only be managed by one application with `take-over` policy.

The `take-over` policy is helpful when you want to let the application to take the complete control for the given resources.

<details>
<summary>practice</summary>

1. First create the nginx deployment
```bash
kubectl create deploy nginx --image=nginx
```
2. Deploy the application with `take-over` policy.
```bash
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: take-over
spec:
  components:
    - name: nginx-take-over
      type: k8s-objects
      properties:
        objects:
          - apiVersion: apps/v1
            kind: Deployment
            metadata:
              name: nginx
      traits:
        - type: scaler
          properties:
            replicas: 3
  policies:
    - type: take-over
      name: take-over
      properties:
        rules:
          - selector:
              resourceTypes: ["Deployment"]
EOF
```

3. Check the application running status.
```bash
vela status take-over
```
</details>


## Use in CLI

The `read-only` and `take-over` policies adopt resources from inside an Application you write yourself. To build the Application from the existing resources instead, including everything a Helm release installed, use the `vela adopt` command. It prints the Application it builds, so you can review or edit it first; add `--apply` to apply it straight away.

### Adopt native resources

1. Create some resources to adopt:

```bash
kubectl create deploy example --image=nginx
kubectl create service clusterip example --tcp=80:80
kubectl create configmap example
kubectl create secret generic example
```

2. Run `vela adopt` with the resources to put in the Application:

```bash
vela adopt deployment/example service/example configmap/example secret/example
```

<details>
<summary>expected output</summary>

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  creationTimestamp: null
  labels:
    app.oam.dev/adopt: native
  name: example
  namespace: default
spec:
  components:
  - name: deployment-example
    properties:
      objects:
      - apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: example
          namespace: default
        spec:
          progressDeadlineSeconds: 600
          replicas: 1
          revisionHistoryLimit: 10
          selector:
            matchLabels:
              app: example
          # ... the rest of the Deployment's spec, as it is in the cluster
    type: k8s-objects
  # ... service-example, the same way
  - name: config
    properties:
      objects:
      - apiVersion: v1
        kind: ConfigMap
        metadata:
          name: example
          namespace: default
      - apiVersion: v1
        kind: Secret
        metadata:
          name: example
          namespace: default
    type: k8s-objects
  policies:
  - name: read-only
    properties:
      rules:
      - selector:
          componentNames:
          - deployment-example
          - service-example
          - config
    type: read-only
  workflow:
    steps:
    - name: apply-component
      subSteps:
      - name: apply-component:deployment-example
        properties:
          component: deployment-example
        type: apply-component
      # ... one apply-component step for each other component
      type: step-group
status: {}
```

</details>

Each workload and Service gets a `k8s-objects` component of its own, named `<kind>-<name>`, with its spec copied in. ConfigMaps and Secrets are grouped in one `config` component by name only, so the Application never holds their data. The `read-only` policy covers every component, and one workflow step group applies them all.

3. Apply the Application, and give it a name of your own with `--app-name`:

```bash
vela adopt deployment/example service/example configmap/example secret/example --apply --app-name=adopt-example
```

4. Check the result with `vela status adopt-example` and `vela status adopt-example -t -d`:

```bash
vela status adopt-example
```

The Application is `running`, its workflow shows the `apply-component` step group with a sub-step per component, and every component is healthy.

```bash
vela status adopt-example -t -d
```

```bash
CLUSTER       NAMESPACE     RESOURCE           STATUS    APPLY_TIME          DETAIL
local     ─── default   ─┬─ ConfigMap/example  updated   2023-01-11 14:15:34 Data: 0  Age: 6m1s
                         ├─ Secret/example     updated   2023-01-11 14:15:52 Type: Opaque  Data: 0  Age: 5m43s
                         ├─ Service/example    updated   2023-01-11 14:12:00 Type: ClusterIP  Cluster-IP: 10.43.65.46  External-IP: <none>  Port(s): 80/TCP  Age: 9m35s
                         └─ Deployment/example updated   2023-01-11 14:11:06 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 10m
```

`read-only` lets the Application observe the resources but never change them. To let it manage them, adopt with `--mode=take-over`, which uses the `take-over` policy instead.

### Adopt a Helm release

`vela adopt --type helm` reads the resources a Helm release installed, from the release's own record, and builds the Application from them.

1. Install a MySQL instance with Helm:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm install mysql bitnami/mysql
```

2. Check the release is there:

```bash
helm ls
```

```bash
NAME    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
mysql   default         1               2023-01-11 14:34:36.653778 +0800 CST    deployed        mysql-9.4.6     8.0.31
```

3. Adopt the release. As with native resources, you get an Application with a `read-only` policy, named after the release:

```bash
vela adopt mysql --type helm
```

<details>
<summary>expected output</summary>

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  creationTimestamp: null
  labels:
    app.oam.dev/adopt: helm
  name: mysql
  namespace: default
spec:
  components:
  - name: statefulset-mysql
    properties:
      objects:
      - apiVersion: apps/v1
        kind: StatefulSet
        metadata:
          name: mysql
          namespace: default
        spec:
          replicas: 1
          serviceName: mysql
          # ... the rest of the StatefulSet's spec, as the chart rendered it
    type: k8s-objects
  # ... service-mysql and service-mysql-headless, the same way
  - name: config
    properties:
      objects:
      - apiVersion: v1
        kind: Secret
        metadata:
          name: mysql
          namespace: default
      - apiVersion: v1
        kind: ConfigMap
        metadata:
          name: mysql
          namespace: default
    type: k8s-objects
  - name: sa
    properties:
      objects:
      - apiVersion: v1
        kind: ServiceAccount
        metadata:
          name: mysql
          namespace: default
    type: k8s-objects
  policies:
  - name: read-only
    properties:
      rules:
      - selector:
          componentNames:
          - statefulset-mysql
          - service-mysql
          - service-mysql-headless
          - config
          - sa
    type: read-only
  workflow:
    steps:
    - name: apply-component
      subSteps:
      - name: apply-component:statefulset-mysql
        properties:
          component: statefulset-mysql
        type: apply-component
      # ... one apply-component step for each other component
      type: step-group
status: {}
```

</details>

4. Apply it with `--apply`, and use `--mode take-over` to let the Application manage the resources. To hand the resources over to KubeVela completely, so Helm no longer manages them too, add `--recycle`: once the Application is running, it deletes the Helm release's records.

```bash
vela adopt mysql --type helm --mode take-over --apply --recycle
```

```
resources adopted in app default/mysql
successfully clean up old helm release
```

5. Check the result with `vela status mysql` and `vela status mysql -t -d`:

```bash
vela status mysql
```

The Application is `running`, with every component healthy.

```bash
vela status mysql -t -d
```

```bash
CLUSTER       NAMESPACE     RESOURCE               STATUS    APPLY_TIME          DETAIL
local     ─── default   ─┬─ ConfigMap/mysql        updated   2023-01-11 14:40:16 Data: 1  Age: 7m41s
                         ├─ Secret/mysql           updated   2023-01-11 14:40:16 Type: Opaque  Data: 2  Age: 7m41s
                         ├─ Service/mysql          updated   2023-01-11 14:40:16 Type: ClusterIP  Cluster-IP: 10.43.154.7  External-IP: <none>  Port(s): 3306/TCP  Age: 7m41s
                         ├─ Service/mysql-headless updated   2023-01-11 14:40:16 Type: ClusterIP  Cluster-IP: None  External-IP: <none>  Port(s): 3306/TCP  Age: 7m41s
                         ├─ ServiceAccount/mysql   updated   2023-01-11 14:40:16 Secrets: 0  Age: 7m41s
                         └─ StatefulSet/mysql      updated   2023-01-11 14:40:16 Ready: 1/1  Age: 7m41s
```

6. `helm ls` no longer lists the release, since its records were recycled:

```bash
helm ls
```

```bash
NAME    NAMESPACE       REVISION        UPDATED STATUS  CHART   APP VERSION
```

:::tip
There are two ways to use KubeVela together with Helm.

To keep Helm in charge of releasing the chart and use KubeVela to watch the resources, adopt in the default `read-only` mode and don't recycle the release. You can then watch what the chart deployed with KubeVela's tools and ecosystem, such as Grafana.

To move the resources from Helm to a KubeVela Application for good, adopt in `take-over` mode with `--apply --recycle`.
:::

### Customize the adoption

By default, `vela adopt` groups the resources from the source (a list of native resources or a Helm release) into components:

- Workloads (Deployment, StatefulSet, DaemonSet, CloneSet) and Services, Ingresses and HTTPRoutes each get a component with their spec copied in.
- ConfigMaps and Secrets go into one `config` component, and ServiceAccounts and RBAC objects into one `sa` component, by name only: the Application does not hold their contents.
- CustomResourceDefinitions and Namespaces get components of their own, `crds` and `ns`.

In `take-over` mode the Application also gets a `garbage-collect` policy that never deletes CustomResourceDefinitions and an `apply-once` policy for them, so deleting or changing the Application never removes a CRD that other resources rely on.

The rules are a CUE template. See the [default template](https://github.com/kubevela/kubevela/blob/master/references/cli/adopt-templates/default.cue) on GitHub. To use your own, pass it with `--adopt-template`.

1. Create a Deployment to adopt:

```bash
kubectl create deploy custom-adopt --image=nginx
```

2. Save this template as `my-adopt-rule.cue`. It turns each Deployment into a `webservice` component, with a `scaler` trait set to the Deployment's replicas:

```cue
#Resource: {
	apiVersion: string
	kind:       string
	metadata: {
		name:       string
		namespace?: string
		...
	}
	...
}

#Component: {
	type: string
	name: string
	properties: {...}
	dependsOn?: [...string]
	traits?: [...#Trait]
}

#Trait: {
	type: string
	properties: {...}
}

#Policy: {
	type: string
	name: string
	properties?: {...}
}

#Application: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:       string
		namespace?: string
		labels?: [string]:      string
		annotations?: [string]: string
	}
	spec: {
		components: [...#Component]
		policies?: [...#Policy]
		workflow?: {...}
	}
}

#AdoptOptions: {
	mode:         *"read-only" | "take-over"
	type:         *"helm" | string
	appName:      string
	appNamespace: string
	resources: [...#Resource]
	...
}

#Adopt: {
	$args:    #AdoptOptions
	$returns: #Application

	// adopt logics

	$returns: #Application & {
		metadata: {
			name:      $args.appName
			labels: "app.oam.dev/adopt": $args.type
		}
		spec: components: [for r in $args.resources if r.kind == "Deployment" {
		    type: "webservice"
		    name: r.metadata.name
		    properties: image: r.spec.template.spec.containers[0].image
		    traits: [{
		        type: "scaler"
		        properties: replicas: r.spec.replicas
		    }]
		}]
		spec: policies: [
			{
				type: $args.mode
				name: $args.mode
				properties: rules: [{
					selector: componentNames: [ for comp in spec.components {comp.name}]
				}]
			}]
	}
}
```

3. Adopt the Deployment with it:

```bash
vela adopt deployment/custom-adopt --adopt-template=my-adopt-rule.cue
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  creationTimestamp: null
  labels:
    app.oam.dev/adopt: native
  name: custom-adopt
  namespace: default
spec:
  components:
  - name: custom-adopt
    properties:
      image: nginx
    traits:
    - properties:
        replicas: 1
      type: scaler
    type: webservice
  policies:
  - name: read-only
    properties:
      rules:
      - selector:
          componentNames:
          - custom-adopt
    type: read-only
status: {}
```

### Adopt all resources

#### Adopt all native resources

To adopt every workload in a namespace, use `--all`:

```bash
vela adopt --all
```

By default this adopts every Deployment, StatefulSet and DaemonSet that no Application manages yet. Name a resource type to adopt that type instead, such as a custom resource:

```bash
vela adopt mycrd --all
```

For each resource it finds, the command also finds the resources that go with it, by a resource topology rule, and adopts them together into one Application named after the resource. The [default rule](https://github.com/kubevela/kubevela/blob/master/references/cli/resource-topology/builtin-rule.cue) takes the ConfigMaps and Secrets a workload mounts as volumes, the Services that select its pods, and the Ingresses that route to those Services.

For example, with these resources in the cluster:

<details>
<summary>Resources (Deployment, ConfigMap, Service, Ingress)</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test1
  namespace: default
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      myapp: test1
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      labels:
        myapp: test1
    spec:
      containers:
      - image: crccheck/hello-world
        imagePullPolicy: Always
        name: test1
        ports:
        - containerPort: 8000
          name: port-8000
          protocol: TCP
        resources: {}
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
        volumeMounts:
        - mountPath: /test
          name: configmap-my-test
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
      volumes:
      - configMap:
          defaultMode: 420
          name: my-test1
        name: configmap-my-test
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-test1
  namespace: default
---
apiVersion: v1
kind: Service
metadata:
  name: test1
  namespace: default
spec:
  ports:
  - port: 8000
    protocol: TCP
    targetPort: 8000
  selector:
    myapp: test1
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: test1
  namespace: default
spec:
  rules:
  - host: testsvc.example.com
    http:
      paths:
      - backend:
          service:
            name: test1
            port:
              number: 8000
        path: /
        pathType: ImplementationSpecific
```

</details>

`vela adopt --all` adopts them as one Application:

<details>
<summary>Adopted Application</summary>

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  creationTimestamp: null
  labels:
    app.oam.dev/adopt: native
  name: test1
  namespace: default
spec:
  components:
  - name: deployment-test1
    properties:
      objects:
      - apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: test1
          namespace: default
        spec:
          replicas: 1
          # ... the rest of the Deployment's spec
    type: k8s-objects
  # ... service-test1 and ingress-test1, the same way
  - name: config
    properties:
      objects:
      - apiVersion: v1
        kind: ConfigMap
        metadata:
          name: my-test1
          namespace: default
    type: k8s-objects
  policies:
  - name: read-only
    properties:
      rules:
      - selector:
          componentNames:
          - deployment-test1
          - service-test1
          - ingress-test1
          - config
    type: read-only
  workflow:
    steps:
    - name: apply-component
      subSteps:
      - name: apply-component:deployment-test1
        properties:
          component: deployment-test1
        type: apply-component
      # ... one apply-component step for each other component
      type: step-group
status: {}
```

</details>

To find relations the default rule doesn't know, such as those of your own custom resources, write a resource topology rule in CUE and pass it with `--resource-topology-rule`:

```bash
vela adopt --all --resource-topology-rule=my-rule.cue
```

Once the Applications are applied, list them with `vela ls` or see them in VelaUX.

![](https://kubevela.io/images/1.8/adopt-all.gif)

#### Adopt all Helm releases

To adopt every Helm release in a namespace, use `--all` with `--type=helm`:

```bash
vela adopt --all --type helm
```
