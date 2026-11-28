---
title:  Patch in the Definitions
---

When we are writing the definition, sometimes we need to patch to the corresponding component or traits. We can use the `patch` capability when you're writing trait definitions or workflow step definitions.

Most examples on this page are in the CUE format, applied with `vela def apply`; the few in Kubernetes YAML are whole `...Definition` objects. [The Definition File](../oam/definition-file.md) shows the two formats side by side.

## Patch Strategy

By default, KubeVela will merge patched values with CUE's merge. However, CUE cannot handle conflicting fields currently.

For example, if `replicas=5` has been set in a component instance, once there is another trait, attempting to patch the value of the replicas field, it will fail. So we recommend that you need to plan ahead and don't use duplicate fields between components and traits.

But in some cases, we do need to deal with overwriting fields that have already been assigned a value. For example, when set up resources in multi-environments, we hope that the `envs` in different environments are different: i.e., the default `env` is `MODE=PROD`, and in the test environment, it needs to be modified to `MODE=DEV DEBUG=true `.

In this case, we can apply the following application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-with-override
spec:
  components:
    - name: nginx-with-override
      type: webservice
      properties:
        image: nginx
        env:
          - name: MODE
            value: prod
  policies:
    - name: test
      type: topology
      properties:
        clusters: ["local"]
        namespace: test
    - name: prod
      type: topology
      properties:
        clusters: ["local"]
        namespace: prod
    - name: override-env
      type: override
      properties:
        components:
          - name: nginx-with-override
            traits:
              - type: env
                properties:
                  env:
                    MODE: test
                    DEBUG: "true"

  workflow:
    steps:
      - type: deploy
        name: deploy-test
        properties:
          policies: ["test", "override-env"]
      - type: deploy
        name: deploy-prod
        properties:
          policies: ["prod"]
```

After deploying the application, you can see that in the `test` namespace, the `envs` of the nginx application are as follows:

```yaml
spec:
  containers:
  - env:
    - name: MODE
      value: test
    - name: DEBUG
      value: "true"
```

At the same time, in the `prod` namespace, the `envs` are as follows:

```yaml
spec:
  containers:
  - env:
    - name: MODE
      value: prod
```

`deploy-test` will deploy nginx to the test namespace. At the same time, the `env` trait overwrite the same envs by using the patch strategy, thus adding `MODE=test DEBUG=true` in the test namespace, while the nginx in the prod namespace will retain the original `MODE=prod` env.

KubeVela provides a series of patching strategies to help resolve conflicting issues. When writing patch traits and workflow steps, you can use these patch strategies to solve conflicting values. Note that the patch strategy is not an official capability provided by CUE, but an extension developed by KubeVela.

For the usage of all patch strategies, please refer to [Patch Strategy](../cue/patch-strategy.md).

## Patch in Traits

**Patch** is a very common pattern of trait definitions, i.e. the app operators can amend/patch attributes to the component instance or traits to enable certain operational features such as sidecar or node affinity rules (and this should be done **before** the resources applied to target cluster).

This pattern is extremely useful when the component definition is provided by third-party component provider (e.g. software distributor) so app operators do not have privilege to change its template.

### Patch to components

Below is an example for `node-affinity` trait:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "affinity specify node affinity and toleration"
  name: node-affinity
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: {
        	spec: template: spec: {
        		if parameter.affinity != _|_ {
        			affinity: nodeAffinity: requiredDuringSchedulingIgnoredDuringExecution: nodeSelectorTerms: [{
                // +patchStrategy=retainKeys
        				matchExpressions: [
        					for k, v in parameter.affinity {
        						key:      k
        						operator: "In"
        						values:   v
        					},
        				]}]
        		}
        		if parameter.tolerations != _|_ {
              // +patchStrategy=retainKeys
        			tolerations: [
        				for k, v in parameter.tolerations {
        					effect:   "NoSchedule"
        					key:      k
        					operator: "Equal"
        					value:    v
        				}]
        		}
        	}
        }

        parameter: {
        	affinity?: [string]: [...string]
        	tolerations?: [string]: string
        }
```

In `patch`, we declare the component object fields that this trait will patch to.

The patch trait above assumes the target component instance have `spec.template.spec.affinity` field.
Hence, we need to use `appliesToWorkloads` to enforce the trait only applies to those workload types have this field. Meanwhile, we use `// +patchStrategy=retainKeys` to override the conflict fields in the original component instance.

Another important field is `podDisruptive`, this patch trait will patch to the pod template field,
so changes on any field of this trait will cause the pod to restart, We should add `podDisruptive` and make it to be true
to tell users that applying this trait will cause the pod to restart.

Now the users could declare they want to add node affinity rules to the component instance as below:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/testapp:v1
      traits:
        - type: "gateway"
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
        - type: "node-affinity"
          properties:
            affinity:
              server-owner: ["owner1","owner2"]
              resource-pool: ["pool1","pool2","pool3"]
            tolerations:
              resource-pool: "broken-pool1"
              server-owner: "old-owner"
```

### Set organisation defaults with a patch trait

A patch trait is a handy place for the defaults your organisation wants on every workload. Say every Deployment must run on Linux nodes of one architecture. The `myorgsetup` trait below patches node affinity into the component's pod template, with the OS and architecture as parameters that default to your organisation's choice:

```cue title="myorgsetup.cue"
myorgsetup: {
	annotations: {}
	attributes: {
		appliesToWorkloads: ["deployments.apps"]
		podDisruptive: true
	}
	description: "Add the organisation's default node affinity."
	labels: {}
	type: "trait"
}

template: {
	// +patchStrategy=jsonMergePatch
	patch: spec: template: spec: affinity: nodeAffinity: requiredDuringSchedulingIgnoredDuringExecution: nodeSelectorTerms: [{
		matchExpressions: [{
			key:      "kubernetes.io/os"
			operator: "In"
			values: [parameter.os]
		}, {
			key:      "kubernetes.io/arch"
			operator: "In"
			values: [parameter.arch]
		}]
	}]

	parameter: {
		// +usage=The node operating system to schedule on
		os: *"linux" | string
		// +usage=The node architecture to schedule on
		arch: *"arm64" | string
	}
}
```

`+patchStrategy=jsonMergePatch` applies the patch as a JSON merge patch, so it replaces any node affinity the component already set rather than conflicting with it. `appliesToWorkloads` limits the trait to Deployments, since a CronJob keeps its pod template at a different path.

Apply it to the cluster:

```shell
vela def apply myorgsetup.cue
```

Add the trait to an Application. With no properties it uses the defaults:

```yaml title="app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: arch-test
spec:
  components:
    - name: arch-test
      type: webservice
      properties:
        image: nginx:1.27
      traits:
        - type: myorgsetup
```

To try it before applying anything, put `myorgsetup.cue` in a directory called `kubevela`, add the `webservice` definition beside it with `vela def get webservice > kubevela/webservice.cue`, and render the Application offline. The CLI still needs a kubeconfig it can read, though the cluster doesn't have to be running:

```shell
vela dry-run -d kubevela -f app.yaml --offline
```

<details>
<summary>expected output</summary>

```yaml
---
# Application(arch-test) -- Component(arch-test)
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: arch-test
    app.oam.dev/name: arch-test
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: webservice
  name: arch-test
  namespace: default
spec:
  selector:
    matchLabels:
      app.oam.dev/component: arch-test
  template:
    metadata:
      labels:
        app.oam.dev/component: arch-test
        app.oam.dev/name: arch-test
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
              - key: kubernetes.io/arch
                operator: In
                values:
                - arm64
      containers:
      - image: nginx:1.27
        name: arch-test
```
</details>

A component that needs something else sets the trait's properties:

```yaml
      traits:
        - type: myorgsetup
          properties:
            os: windows
            arch: amd64
```

Each Application still has to list the trait. To apply it to every Application without editing them, use a [global Application-scoped policy](../policy/application-scoped-policy.md#global-policies) that adds the trait to each component.

### Patch to traits

> Note: it's available after KubeVela v1.4.

You can also patch the objects other traits render, with `patchOutputs` in the definition. Each key under `patchOutputs` is the name an object has in another trait's `outputs`. For example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: patch-annotation
spec:
  schematic:
    cue:
      template: |
        patchOutputs: {
          ingress: {
            metadata: annotations: {
              "nginx.ingress.kubernetes.io/proxy-read-timeout": parameter.timeout
            }
          }
        }

        parameter: {
          // +usage=Seconds the ingress controller waits for a response from the service
          timeout: *"60" | string
        }
```

This trait expects another trait on the same component to render an object called `ingress`, as the `gateway` trait does. It sets the proxy read timeout annotation on that Ingress.

We can deploy the following application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/testapp:v1
      traits:
        - type: "gateway"
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
        - type: "patch-annotation"
          properties:
            timeout: "120"
```

The Ingress the `gateway` trait renders now carries the annotation (labels left out):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"
  name: express-server
spec:
  rules:
  - host: testsvc.example.com
    http:
      paths:
      - backend:
          service:
            name: express-server
            port:
              number: 8000
        path: /
        pathType: ImplementationSpecific
```

:::caution
A trait's `patchOutputs` only sees the objects rendered by traits listed before it on the same component, so list it after the traits it patches. Listed first, it finds nothing to patch, and the Application deploys without the change and without an error.
:::

You can even write a `for-loop` in patch trait, below is an example that can patch for all resources with specific annotation.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: patch-for-argo
spec:
  schematic:
    cue:
      template: |
        patch: {
            metadata: annotations: {
                "argocd.argoproj.io/compare-options": "IgnoreExtraneous"
                "argocd.argoproj.io/sync-options": "Prune=false"
            }
        }
        patchOutputs: {
          for k, v in context.outputs {
            "\(k)": {
              metadata: annotations: {
                "argocd.argoproj.io/compare-options": "IgnoreExtraneous"
                "argocd.argoproj.io/sync-options":    "Prune=false"
              }
            }
          }
        }
```

This example solved a [real case](https://github.com/kubevela/kubevela/issues/4342).

## Patch in Workflow Step

When a custom workflow step applies a component with `oam.#ApplyComponent` (from `vela/oam`), it can patch the component's objects in the `patch` parameter:

- `patch.workload` patches the component's main workload.
- `patch.traits.<name>` patches the object a trait renders under that name in its `outputs`, for example `ingress` for the `gateway` trait.

The step below applies one component and records a release name on its Deployment and its Ingress. Patch strategies work here too, written as comments in the patch.

```cue title="apply-with-release.cue"
import "vela/oam"

"apply-with-release": {
	type: "workflow-step"
	annotations: {}
	labels: {}
	description: "Apply one component, with a release annotation on its workload and its Ingress."
}

template: {
	load: oam.#LoadComponets

	apply: {
		for name, comp in load.$returns.value if name == parameter.component {
			"\(name)": oam.#ApplyComponent & {
				$params: {
					value: comp
					patch: {
						workload: metadata: annotations: "example.com/release": parameter.release
						traits: ingress: metadata: annotations: "example.com/release": parameter.release
					}
				}
			}
		}
	}

	parameter: {
		// +usage=The component to apply
		component: string
		// +usage=The release name to record on its objects
		release: string
	}
}
```

Use it in an Application's workflow, after `vela def apply apply-with-release.cue`:

```yaml
  workflow:
    steps:
      - name: apply-express-server
        type: apply-with-release
        properties:
          component: express-server
          release: v2
```
