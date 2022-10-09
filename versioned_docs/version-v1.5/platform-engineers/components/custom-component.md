---
title:  Component Definition
---

In this section, we will introduce how to use [CUE](../cue/basic) to customize components via `ComponentDefinition`. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition) and [how to manage definition](../cue/definition-edit).

## Declare `ComponentDefinition`

First, generate `ComponentDefinition` scaffolds via `vela def init` with existed YAML file.

The YAML file:

```yaml
apiVersion: "apps/v1"
kind: "Deployment"
spec:
  selector:
    matchLabels:
      "app.oam.dev/component": "name"
  template:
    metadata:
      labels:
        "app.oam.dev/component": "name"
    spec:
      containers: 
      - name: "name"
        image: "image"
```

Generate `ComponentDefinition` based on the YAML file:

```shell
vela def init stateless -t component --template-yaml ./stateless.yaml -o stateless.cue
```

It generates a file:

```cue
// $ cat stateless.cue
stateless: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "<change me> apps/v1"
		kind:       "<change me> Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {
		spec: {
			selector: matchLabels: "app.oam.dev/component": "name"
			template: {
				metadata: labels: "app.oam.dev/component": "name"
				spec: containers: [{
					name:  "name"
					image: "image"
				}]
			}
		}
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	outputs: {}
	parameter: {}
}
```

In detail:
- `.spec.workload` is required to indicate the workload type of this component.
- `.spec.schematic.cue.template` is a CUE template, specifically:
    * The `output` filed defines the template for the abstraction.
    * The `parameter` filed defines the template parameters, i.e. the configurable properties exposed in the `Application`abstraction (and JSON schema will be automatically generated based on them).

Add parameters in this auto-generated custom component file :

```cue
stateless: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "<change me> apps/v1"
		kind:       "<change me> Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {
		spec: {
			selector: matchLabels: "app.oam.dev/component": parameter.name
			template: {
				metadata: labels: "app.oam.dev/component": parameter.name
				spec: containers: [{
					name:  parameter.name
					image: parameter.image
				}]
			}
		}
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	outputs: {}
	parameter: {
    name: string
    image: string
  }
}
```

You can use `vela def vet` to validate the format:

```shell
$ vela def vet stateless.cue
Validation succeed.
```

Declare another component named `task` which is an abstraction for run-to-completion workload.

```shell
vela def init task -t component -o task.cue
```

It generates a file:

```cue
// $ cat task.cue
task: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "<change me> apps/v1"
		kind:       "<change me> Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {}
	parameter: {}
}
```

Edit the generated component file:

```cue
task: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "batch/v1"
		kind:       "Job"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
  output: {
    apiVersion: "batch/v1"
    kind:       "Job"
    spec: {
      parallelism: parameter.count
      completions: parameter.count
      template: spec: {
        restartPolicy: parameter.restart
        containers: [{
          image: parameter.image
          if parameter["cmd"] != _|_ {
            command: parameter.cmd
          }
        }]
      }
    }
  }
	parameter: {
    count:   *1 | int
    image:   string
    restart: *"Never" | string
    cmd?: [...string]
  }
}
```

Apply above `ComponentDefinition` files to your Kubernetes cluster:

```shell
$ vela def apply stateless.cue
ComponentDefinition stateless created in namespace vela-system.
$ vela def apply task.cue
ComponentDefinition task created in namespace vela-system.
```

## Declare an `Application`

The `ComponentDefinition` can be instantiated in `Application` abstraction as below:

  ```yaml
  apiVersion: core.oam.dev/v1alpha2
  kind: Application
  metadata:
    name: website
  spec:
    components:
      - name: hello
        type: stateless
        properties:
          image: oamdev/hello-world
          name: mysvc
      - name: countdown
        type: task
        properties:
          image: centos:7
          cmd:
            - "bin/bash"
            - "-c"
            - "for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done"
  ```

### Under The Hood
<details>

Above application resource will generate and manage following Kubernetes resources in your target cluster based on the `output` in CUE template and user input in `Application` properties.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  ... # skip tons of metadata info
spec:
  template:
    spec:
      containers:
        - name: mysvc
          image: oamdev/hello-world
    metadata:
      labels:
        app.oam.dev/component: mysvc
  selector:
    matchLabels:
      app.oam.dev/component: mysvc
---
apiVersion: batch/v1
kind: Job
metadata:
  name: countdown
  ... # skip tons of metadata info
spec:
  parallelism: 1
  completions: 1
  template:
    metadata:
      name: countdown
    spec:
      containers:
        - name: countdown
          image: 'centos:7'
          command:
            - bin/bash
            - '-c'
            - for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done
      restartPolicy: Never
```  
</details>

## CUE `Context`

KubeVela allows you to reference the runtime information of your application via `context` keyword.

The most widely used context is application name(`context.appName`) component name(`context.name`).

```cue
context: {
  appName: string
  name: string
}
```

For example, let's say you want to use the component name filled in by users as the container name in the workload instance:

```cue
parameter: {
    image: string
}
output: {
  ...
    spec: {
        containers: [{
            name:  context.name
            image: parameter.image
        }]
    }
  ...
}
```

> Note that `context` information are auto-injected before resources are applied to target cluster.

### Full available `context` information can be used

* Check the reference docs of [definition protocol](../../platform-engineers/oam/x-definition#definition-runtime-context) to see all of the available information in KubeVela `context`.

## Composition

It's common that a component definition is composed by multiple API resources, for example, a `webserver` component that is composed by a Deployment and a Service. CUE is a great solution to achieve this in simplified primitives.

> Another approach to do composition in KubeVela of course is [using Helm](../../tutorials/helm).

## How-to

KubeVela requires you to define the template of workload type in `output` section, and leave all the other resource templates in `outputs` section with format as below:

```cue
outputs: <unique-name>: 
  <full template data>
```

> The reason for this requirement is KubeVela needs to know it is currently rendering a workload so it could do some "magic" like patching annotations/labels or other data during it.

Below is the example for `webserver` definition: 

```cue
webserver: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    spec: {
      selector: matchLabels: {
        "app.oam.dev/component": context.name
      }
      template: {
        metadata: labels: {
          "app.oam.dev/component": context.name
        }
        spec: {
          containers: [{
            name:  context.name
            image: parameter.image

            if parameter["cmd"] != _|_ {
              command: parameter.cmd
            }

            if parameter["env"] != _|_ {
              env: parameter.env
            }

            if context["config"] != _|_ {
              env: context.config
            }

            ports: [{
              containerPort: parameter.port
            }]

            if parameter["cpu"] != _|_ {
              resources: {
                limits:
                  cpu: parameter.cpu
                requests:
                  cpu: parameter.cpu
              }
            }
          }]
        }
      }
    }
  }
  // an extra template
  outputs: service: {
    apiVersion: "v1"
    kind:       "Service"
    spec: {
      selector: {
        "app.oam.dev/component": context.name
      }
      ports: [
        {
          port:       parameter.port
          targetPort: parameter.port
        },
      ]
    }
  }
	parameter: {
    image: string
    cmd?: [...string]
    port: *80 | int
    env?: [...{
      name:   string
      value?: string
      valueFrom?: {
        secretKeyRef: {
          name: string
          key:  string
        }
      }
    }]
    cpu?: string
  }
}
```

Apply to your Kubernetes cluster:

```shell
$ vela def apply webserver.cue
ComponentDefinition webserver created in namespace vela-system.
```

The user could now declare an `Application` with it:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webserver-demo
  namespace: default
spec:
  components:
    - name: hello-world
      type: webserver
      properties:
        image: oamdev/hello-world
        port: 8000
        env:
        - name: "foo"
          value: "bar"
        cpu: "100m"
```

It will generate and manage below Kubernetes API resources in target cluster, you can use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to check:

```shell
kubectl get deployment
```
```console
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
hello-world-v1   1/1     1            1           15s
```

```shell
kubectl get svc
```
```console
NAME                           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
hello-world-trait-7bdcff98f7   ClusterIP   <your ip>       <none>        8000/TCP   32s
```

## What's Next

* Learn more about [defining customized trait](../traits/customize-trait) in CUE.
* Learn how to [define health check and custom status](../traits/status) of Component.
* Learn how to [define policy](../policy/custom-policy) in CUE.