---
title: Write an Addon from Scratch
---

This builds a small addon by hand, with no scaffold and no Helm chart, so you can see every file and what it does. The addon, `greeter`, adds a component type that runs an HTTP server answering with a fixed message, and runs a server of its own whose message is the addon's one parameter.

## The files

```
greeter/
├── metadata.yaml
├── README.md
├── parameter.cue
├── template.cue
└── definitions/
    └── greeter.cue
```

Create the directory and its files:

```shell
mkdir -p greeter/definitions && cd greeter
```

`metadata.yaml` names the addon and gives its version:

```shell
cat > metadata.yaml <<'EOF'
name: greeter
version: 0.1.0
description: An HTTP greeter, and the greeter component type to run your own.
icon: https://kubevela.io/img/logo.svg
url: https://github.com/hashicorp/http-echo
tags:
  - example
system:
  vela: ">=1.9.0"
EOF
```

`README.md` is what VelaUX shows before someone enables it:

```shell
cat > README.md <<'EOF'
# greeter

Runs an HTTP server in `vela-system` that answers every request with a greeting, and adds the
`greeter` component type so Applications can run their own.
EOF
```

`parameter.cue` declares what `vela addon enable greeter key=value` accepts, with defaults:

```shell
cat > parameter.cue <<'EOF'
package main

parameter: {
	// +usage=The greeting the addon's own server answers with
	message: *"Hello from the greeter addon" | string
}
EOF
```

`definitions/greeter.cue` is the component type. It's an ordinary [ComponentDefinition in CUE](/docs/platform-engineers/components/custom-component): a Deployment running [http-echo](https://github.com/hashicorp/http-echo), and a Service in front of it:

```shell
cat > definitions/greeter.cue <<'EOF'
greeter: {
	type:        "component"
	description: "An HTTP server that answers every request with a fixed message."
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		spec: {
			selector: matchLabels: "app.oam.dev/component": context.name
			template: {
				metadata: labels: "app.oam.dev/component": context.name
				spec: containers: [{
					name:  "greeter"
					image: "hashicorp/http-echo:1.0"
					args: ["-text=" + parameter.message, "-listen=:8080"]
					ports: [{containerPort: 8080}]
				}]
			}
		}
	}
	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		metadata: name: context.name
		spec: {
			selector: "app.oam.dev/component": context.name
			ports: [{port: 80, targetPort: 8080}]
		}
	}
	parameter: {
		// +usage=The message to answer with
		message: string
	}
}
EOF
```

`template.cue` is the addon's own Application, the one KubeVela names `addon-greeter` and puts in `vela-system`. It runs the same server with the built-in `webservice` type and passes the parameter through. It can't use the `greeter` type itself: KubeVela applies the addon's Application before its definitions, so the admission webhook refuses it with `WorkloadDefinition.core.oam.dev "greeter" not found`.

```shell
cat > template.cue <<'EOF'
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: components: [{
		name: "greeter"
		type: "webservice"
		properties: {
			image: "hashicorp/http-echo:1.0"
			args: ["-text=" + parameter.message, "-listen=:8080"]
			ports: [{port: 8080, expose: true}]
		}
	}]
}
EOF
cd ..
```

## Render it

Check what KubeVela makes of it before anything is applied:

```shell
vela addon enable ./greeter --dry-run message="Hello from the hub"
```

```console
enabling addon by local dir: ./greeter
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  annotations:
    addon.oam.dev/componentDefinitions: greeter
  labels:
    addons.oam.dev/name: greeter
    addons.oam.dev/registry: local
    addons.oam.dev/version: 0.1.0
  name: addon-greeter
  namespace: vela-system
spec:
  components:
  - name: greeter
    properties:
      args:
      - -text=Hello from the hub
      - -listen=:8080
      image: hashicorp/http-echo:1.0
      ports:
      - expose: true
        port: 8080
    type: webservice
status: {}

---
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: An HTTP server that answers every request with
      a fixed message.
  labels: {}
  name: greeter
  namespace: vela-system
spec:
  schematic:
    cue:
      template: "output: {\n\tapiVersion: \"apps/v1\"\n\tkind:       \"Deployment\"\n\tspec:
        {\n\t\tselector: matchLabels: \"app.oam.dev/component\": context.name\n\t\ttemplate:
        {\n\t\t\tmetadata: labels: \"app.oam.dev/component\": context.name\n\t\t\tspec:
        containers: [{\n\t\t\t\tname:  \"greeter\"\n\t\t\t\timage: \"hashicorp/http-echo:1.0\"\n\t\t\t\targs:
        [\"-text=\" + parameter.message, \"-listen=:8080\"]\n\t\t\t\tports: [{containerPort:
        8080}]\n\t\t\t}]\n\t\t}\n\t}\n}\noutputs: service: {\n\tapiVersion: \"v1\"\n\tkind:
        \      \"Service\"\n\tmetadata: name: context.name\n\tspec: {\n\t\tselector:
        \"app.oam.dev/component\": context.name\n\t\tports: [{port: 80, targetPort:
        8080}]\n\t}\n}\nparameter: {\n\t// +usage=The message to answer with\n\tmessage:
        string\n}\n"
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
```

## Enable it

```shell
vela addon enable ./greeter message="Hello from the hub"
```

```console
enabling addon by local dir: ./greeter
Addon greeter enabled successfully.
Please access addon-greeter from the following endpoints:
+---------+-----------+-----------------------------+---------------------------------+-------+
| CLUSTER | COMPONENT |  REF(KIND/NAMESPACE/NAME)   |            ENDPOINT             | INNER |
+---------+-----------+-----------------------------+---------------------------------+-------+
| local   | greeter   | Service/vela-system/greeter | http://greeter.vela-system:8080 | true  |
+---------+-----------+-----------------------------+---------------------------------+-------+
```

```shell
vela addon status greeter
```

```console
greeter: enabled (0.1.0)
==> Installed Clusters
[local]
==> Registry Name
local
```

The addon's own server is running in `vela-system`:

```shell
kubectl run curl -n vela-system --rm -i --restart=Never --image=curlimages/curl:8.11.1 -- -s http://greeter:8080
```

```console
Hello from the hub
```

## Use the component type

The `greeter` type is now available to any Application:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-greeting
  namespace: default
spec:
  components:
    - name: hi
      type: greeter
      properties:
        message: Hi from my own Application
EOF
```

```shell
vela status my-greeting
```

```console
About:

  Name:      	my-greeting
  Namespace: 	default
  Created at:	2026-11-27 10:48:28 +0000 GMT
  Healthy:   	✅
  Details:   	running

Workflow:

  mode: DAG-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: jg6a6zw6gf
    name: hi
    type: apply-component
    phase: succeeded

Services:

  - Name: hi
    Cluster: local
    Namespace: default
    Type: greeter
    Health: ✅
    No trait applied
```

```shell
kubectl run curl --rm -i --restart=Never --image=curlimages/curl:8.11.1 -- -s http://hi
```

```console
Hi from my own Application
```

## Change it

Edit the addon and enable it again; the same command updates what's on the cluster. Change the parameter, for example:

```shell
vela addon enable ./greeter message="Hello again"
```

```shell
kubectl run curl -n vela-system --rm -i --restart=Never --image=curlimages/curl:8.11.1 -- -s http://greeter:8080
```

```console
Hello again
```

## Disable it

While `my-greeting` uses the `greeter` type, disabling the addon is refused:

```shell
vela addon disable greeter
```

```console
Error: this addon is being used by: default/my-greeting applications. Please delete all of them before removing.
```

Delete the Application first:

```shell
vela delete my-greeting -y
vela addon disable greeter
```

```console
Start deleting application default/my-greeting
Delete application default/my-greeting succeeded
Successfully disable addon:greeter
```

## Next

- [Addon Reference](../developer/addon-reference.md) lists every other file an addon can carry: UI schemas, config templates, views and Go definitions.
- [Test an Addon Locally](../developer/test-locally.md) runs the catalog's own checks.
- [Contribute to the Catalog](../developer/contribute.md) when it's ready to share.
