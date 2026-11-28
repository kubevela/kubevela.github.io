---
title: Quick Start
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This guide takes you from an empty directory to a running Application in about 15 minutes. You write one component type, `api-service` (a Deployment with a Service in front of it), test it with `go test`, install it on your cluster, and deploy an Application that uses it. The later defkit guides build on the same module.

## 1. Before you start

You need:

| What | Check it with | You should see |
|---|---|---|
| Go 1.27.1 or later | `go version` | `go version go1.27.1` or later |
| The `vela` CLI, 1.12 or later | `vela version` | `CLI Version: 1.12...` |
| A cluster running KubeVela 1.12 or later | `vela version` and `kubectl get crd componentdefinitions.core.oam.dev` | `Core Version: 1.12...`, and the CRD listed |

To install KubeVela and the CLI, see [Installation](../../install.mdx).

## 2. Create a module

A module is a Go module that holds your definitions. Scaffold one and fetch its dependencies:

```shell
vela def init-module --name my-platform --go-module github.com/acme/my-platform
cd my-platform
```

Open `go.mod`. The `require` line must name a version with a `v` prefix, such as `v1.12.0`. If it reads `1.12.0`, add the `v`, or Go refuses the file with `version "1.12.0" invalid: unknown revision`. Then run:

```shell
go mod tidy
```

If your Go is older than KubeVela's, Go prints `requires go >= 1.27.1; switching to ...` and fetches a newer toolchain. Either way, `go mod tidy` raises the scaffold's `go` line to match KubeVela's, so the top of `go.mod` now reads:

```text title="go.mod"
module github.com/acme/my-platform

go 1.27.1

require github.com/oam-dev/kubevela v1.12.0
```

The scaffold gives you:

```text
my-platform/
├── cmd/register/main.go   # loads every definition; the vela def commands run it
├── components/            # also traits/, policies/, workflowsteps/
├── go.mod
└── module.yaml            # module name, description, placement, hooks
```

Each definition registers itself from an `init()` function, and `cmd/register` imports the definition packages, so a new file in `components/` is picked up with no other wiring.

## 3. Write a component

Create `components/api_service.go`. It declares three parameters, `image`, `replicas` (default 2) and `port` (default 8080), and uses them as Go variables inside the template:

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go title="components/api_service.go"
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

// APIService is a Deployment with a Service in front of it.
func APIService() *defkit.ComponentDefinition {
	image := defkit.String("image").Description("Container image to run")
	replicas := defkit.Int("replicas").Default(2).Description("Number of replicas")
	port := defkit.Int("port").Default(8080).Description("Port the container listens on")

	return defkit.NewComponent("api-service").
		Description("A Deployment with a Service in front of it").
		Workload("apps/v1", "Deployment").
		Params(image, replicas, port).
		Template(func(tpl *defkit.Template) {
			vela := defkit.VelaCtx()

			tpl.Output(defkit.NewResource("apps/v1", "Deployment").
				Set("metadata.name", vela.Name()).
				Set("spec.replicas", replicas).
				Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
				Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
				Set("spec.template.spec.containers[0].name", vela.Name()).
				Set("spec.template.spec.containers[0].image", image).
				Set("spec.template.spec.containers[0].ports[0].containerPort", port))

			tpl.Outputs("service", defkit.NewResource("v1", "Service").
				Set("metadata.name", vela.Name()).
				Set("spec.selector[app.oam.dev/component]", vela.Name()).
				Set("spec.ports[0].port", port).
				Set("spec.ports[0].targetPort", port))
		}).
		HealthPolicy(defkit.DeploymentHealth().Build()).
		CustomStatus(defkit.DeploymentStatus().Build())
}

func init() { defkit.Register(APIService()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
"api-service": {
	type: "component"
	annotations: {}
	labels: {}
	description: "A Deployment with a Service in front of it"
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
		status: {
			customStatus: #"""
				ready: {
					readyReplicas: *0 | int
				} & {
					if context.output.status.readyReplicas != _|_ {
						readyReplicas: context.output.status.readyReplicas
					}
				}
				message: "Ready:\(ready.readyReplicas)/\(context.output.spec.replicas)"
				"""#
			healthPolicy: #"""
				ready: {
					updatedReplicas:    *0 | int
					readyReplicas:      *0 | int
					replicas:           *0 | int
					observedGeneration: *0 | int
				} & {
					if context.output.status.updatedReplicas != _|_ {
						updatedReplicas: context.output.status.updatedReplicas
					}
					if context.output.status.readyReplicas != _|_ {
						readyReplicas: context.output.status.readyReplicas
					}
					if context.output.status.replicas != _|_ {
						replicas: context.output.status.replicas
					}
					if context.output.status.observedGeneration != _|_ {
						observedGeneration: context.output.status.observedGeneration
					}
				}
				_isHealth: (context.output.spec.replicas == ready.readyReplicas) && (context.output.spec.replicas == ready.updatedReplicas) && (context.output.spec.replicas == ready.replicas) && (ready.observedGeneration == context.output.metadata.generation || ready.observedGeneration > context.output.metadata.generation)
				isHealth: *_isHealth | bool
				if context.output.metadata.annotations != _|_ {
					if context.output.metadata.annotations["app.oam.dev/disable-health-check"] != _|_ {
						isHealth: true
					}
				}
				"""#
		}
	}
}
template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: {
			name: context.name
		}
		spec: {
			replicas: parameter.replicas
			selector: {
				matchLabels: {
					"app.oam.dev/component": context.name
				}
			}
			template: {
				metadata: {
					labels: {
						"app.oam.dev/component": context.name
					}
				}
				spec: {
					containers: [{
						name: context.name
						image: parameter.image
						ports: [{
							containerPort: parameter.port
						}]
					}]
				}
			}
		}
	}
	outputs: {
		service: {
			apiVersion: "v1"
			kind:       "Service"
			metadata: {
				name: context.name
			}
			spec: {
				selector: {
					"app.oam.dev/component": context.name
				}
				ports: [{
					port: parameter.port
					targetPort: parameter.port
				}]
			}
		}
	}
	parameter: {
		// +usage=Container image to run
		image: string
		// +usage=Number of replicas
		replicas: *2 | int
		// +usage=Port the container listens on
		port: *8080 | int
	}
}
```

</TabItem>
</Tabs>

The CUE tab is what `vela def gen-module . -o ./generated-cue` writes for this component, and what the controller runs. `DeploymentHealth()` and `DeploymentStatus()` are presets: the component reports healthy once every replica is ready, and `vela status` shows `Ready:<ready>/<desired>`.

## 4. Test it

Create `components/api_service_test.go`. `RenderAll` renders the component's outputs from a test context. It also compiles the generated CUE first and panics if that fails, so a broken template fails the test:

```go title="components/api_service_test.go"
package components

import (
	"testing"

	"github.com/oam-dev/kubevela/pkg/definition/defkit"
)

func TestAPIServiceDefaults(t *testing.T) {
	ctx := defkit.TestContext().
		WithName("my-api").
		WithParam("image", "nginx:1.27")

	out := APIService().RenderAll(ctx)

	if got := out.Primary.Get("spec.replicas"); got != 2 {
		t.Errorf("spec.replicas = %v, want 2", got)
	}
	svc, ok := out.Auxiliary["service"]
	if !ok {
		t.Fatal("no service output")
	}
	if got := svc.Get("spec.ports[0].port"); got != 8080 {
		t.Errorf("service port = %v, want 8080", got)
	}
}
```

```shell
go test ./components/
```

```text
ok  	github.com/acme/my-platform/components	0.705s
```

## 5. Check and apply

Validate the module. This builds it and checks every definition it registers:

```shell
vela def validate-module .
```

```text
Loading module from ....

Module: /path/to/my-platform
Version: v0.0.0-local
Description: KubeVela definition module

Definitions:
  Components:     1
  Traits:         0
  Policies:       0
  Workflow Steps: 0

Module validation passed.
```

Preview what would be installed. `--dry-run` prints the ComponentDefinition YAML without touching the cluster:

```shell
vela def apply-module . --dry-run
```

```text
...
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: A Deployment with a Service in front of it
  labels: {}
  name: api-service
  namespace: vela-system
...
```

Then install it:

```shell
vela def apply-module .
```

```text
...
ComponentDefinition api-service created in namespace vela-system

Complete: created: 1
```

```shell
vela def list | grep api-service
```

```text
api-service    ComponentDefinition   vela-system   A Deployment with a Service in front of it
```

## 6. Deploy an Application

Save this as `app.yaml`. The image listens on 8080, the component's default port:

```yaml title="app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
  namespace: default
spec:
  components:
    - name: my-api
      type: api-service
      properties:
        image: nginxinc/nginx-unprivileged:1.27
```

```shell
vela up -f app.yaml
vela status my-app
```

Once the pods are up, the Application is healthy and the component's status message shows both replicas ready:

```text
About:

  Name:         my-app
  Namespace:    default
  Created at:   ...
  Healthy:      ✅
  Details:      running

Workflow:

  mode: DAG-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: s9wjn9qylr
    name: my-api
    type: apply-component
    phase: succeeded

Services:

  - Name: my-api
    Cluster: local
    Namespace: default
    Type: api-service
    Health: ✅
      Message: Ready:2/2
    No trait applied
```

## 7. Change it and re-apply

This is the loop you'll work in: change the Go, test, apply, deploy. Add an optional `cpu` parameter that sets the container's CPU request. In `components/api_service.go`, declare it beside the others, add it to `Params`, and set it on the container:

```go
	cpu := defkit.String("cpu").Optional().Description("CPU request, for example 250m")
	// ...
		Params(image, replicas, port, cpu).
	// ...
				Set("spec.template.spec.containers[0].ports[0].containerPort", port).
				SetIf(cpu.IsSet(), "spec.template.spec.containers[0].resources.requests.cpu", cpu))
```

Add a test for it to `components/api_service_test.go`:

```go
func TestAPIServiceCPU(t *testing.T) {
	ctx := defkit.TestContext().
		WithName("my-api").
		WithParam("image", "nginx:1.27").
		WithParam("cpu", "250m")

	out := APIService().Render(ctx)

	if got := out.Get("spec.template.spec.containers[0].resources.requests.cpu"); got != "250m" {
		t.Errorf("cpu request = %v, want 250m", got)
	}
}
```

Run the tests, then apply again. The definition already exists, so `apply-module` needs `--conflict=overwrite` to update it:

```shell
go test ./components/
vela def apply-module . --conflict=overwrite
```

```text
...
ComponentDefinition api-service updated in namespace vela-system

Complete: updated: 1
```

Add `cpu: 250m` under `properties` in `app.yaml`, then deploy it and check the Deployment:

```shell
vela up -f app.yaml
kubectl get deployment my-api -o jsonpath='{.spec.template.spec.containers[0].resources}'
```

```text
{"requests":{"cpu":"250m"}}
```

## If something goes wrong

| Symptom | Cause and fix |
|---|---|
| `go mod tidy` fails with `version "1.12.0" invalid: unknown revision` | The `require` line in `go.mod` has no `v` prefix. Make it `v1.12.0` and run `go mod tidy` again. |
| `validate-module` fails with `... is replaced but not required` | The module's dependencies haven't been fetched. Run `go mod tidy`. |
| `apply-module` fails with `already exists ... (use --conflict=overwrite to update)` | The definition is installed already. Re-run with `--conflict=overwrite`. |
| The Application stays unhealthy | Read the component's health and message in `vela status my-app`. The controller runs the generated CUE, so look at it with `vela def gen-module . -o ./generated-cue`. |

## Next

- [ComponentDefinition](./definition-component.md): every builder method for components
- [TraitDefinition](./definition-trait.md): write a trait that patches a component
- [Testing](./testing.md): test definitions with Ginkgo matchers, health checks and traits
- [Cluster Placement](./cluster-placement.md) and [Module Hooks](./module-hooks.md): control where and how a module is applied
- [defkit on pkg.go.dev](https://pkg.go.dev/github.com/oam-dev/kubevela/pkg/definition/defkit): the Go API reference
