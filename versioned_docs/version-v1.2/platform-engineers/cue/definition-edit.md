---
title: Manage X-Definition
---

In KubeVela CLI (>= v1.1.0), `vela def` command group provides a series of convenient definition writing tools. With these commands, users only need to write CUE files to generate and edit definitions, instead of composing Kubernetes YAML object with mixed CUE string.

## init

`vela def init` is a command that helps users bootstrap new definitions. To create an empty trait definition, run `vela def init my-trait -t trait --desc "My trait description."`

```json
"my-trait": {
        annotations: {}
        attributes: {
                appliesToWorkloads: []
                conflictsWith: []
                definitionRef:   ""
                podDisruptive:   false
                workloadRefPath: ""
        }
        description: "My trait description."
        labels: {}
        type: "trait"
}
template: patch: {}
```

Or you can use `vela def init my-comp --interactive` to initiate definitions interactively.

```bash
$ vela def init my-comp --interactive
Please choose one definition type from the following values: component, trait, policy, workload, scope, workflow-step
> Definition type: component
> Definition description: My component definition.
Please enter the location the template YAML file to build definition. Leave it empty to generate default template.
> Definition template filename: 
Please enter the output location of the generated definition. Leave it empty to print definition to stdout.
> Definition output filename: my-component.cue
Definition written to my-component.cue
```

In addition, users can create definitions from existing YAML files. For example, if a user want to create a ComponentDefinition which is designed to generate a deployment, and this deployment has already been created elsewhere, he/she can use the `--template-yaml` flag to complete the transformation. The YAML file is as below

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: hello-world
  template:
    metadata:
      labels:
        app.kubernetes.io/name: hello-world
    spec:
      containers:
      - name: hello-world
        image: somefive/hello-world
        ports: 
        - name: http
          containerPort: 80
          protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: hello-world-service
spec:
  selector:
    app: hello-world
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

Running `vela def init my-comp -t component --desc "My component." --template-yaml ./my-deployment.yaml` to get the CUE-format ComponentDefinition

```json
"my-comp": {
        annotations: {}
        attributes: workload: definition: {
                apiVersion: "<change me> apps/v1"
                kind:       "<change me> Deployment"
        }
        description: "My component."
        labels: {}
        type: "component"
}
template: {
        output: {
                metadata: name: "hello-world"
                spec: {
                        replicas: 1
                        selector: matchLabels: "app.kubernetes.io/name": "hello-world"
                        template: {
                                metadata: labels: "app.kubernetes.io/name": "hello-world"
                                spec: containers: [{
                                        name:  "hello-world"
                                        image: "somefive/hello-world"
                                        ports: [{
                                                name:          "http"
                                                containerPort: 80
                                                protocol:      "TCP"
                                        }]
                                }]
                        }
                }
                apiVersion: "apps/v1"
                kind:       "Deployment"
        }
        outputs: "hello-world-service": {
                metadata: name: "hello-world-service"
                spec: {
                        ports: [{
                                name:       "http"
                                protocol:   "TCP"
                                port:       80
                                targetPort: 8080
                        }]
                        selector: app: "hello-world"
                        type: "LoadBalancer"
                }
                apiVersion: "v1"
                kind:       "Service"
        }
        parameter: {}

}
```

Then the user can make further modifications based on the definition file above, like removing *\<change me\>* in **workload.definition**。

## vet

After initializing definition files, run `vela def vet my-comp.cue` to validate if there are any syntax error in the definition file. It can be used to detect some simple errors such as missing brackets.

```bash
$ vela def vet my-comp.cue
Validation succeed.
```

## render / apply

After confirming the definition file has correct syntax. users can run  `vela def apply my-comp.cue --namespace my-namespace` to apply this definition in the `my-namespace` namespace。If you want to check the transformed Kubernetes YAML file, `vela def apply my-comp.cue --dry-run` or `vela def render my-comp.cue -o my-comp.yaml` can achieve that.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: My component.
  labels: {}
  name: my-comp
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
                metadata: name: "hello-world"
                spec: {
                        replicas: 1
                        selector: matchLabels: "app.kubernetes.io/name": "hello-world"
                        template: {
                                metadata: labels: "app.kubernetes.io/name": "hello-world"
                                spec: containers: [{
                                        name:  "hello-world"
                                        image: "somefive/hello-world"
                                        ports: [{
                                                name:          "http"
                                                containerPort: 80
                                                protocol:      "TCP"
                                        }]
                                }]
                        }
                }
                apiVersion: "apps/v11"
                kind:       "Deployment"
        }
        outputs: "hello-world-service": {
                metadata: name: "hello-world-service"
                spec: {
                        ports: [{
                                name:       "http"
                                protocol:   "TCP"
                                port:       80
                                targetPort: 8080
                        }]
                        selector: app: "hello-world"
                        type: "LoadBalancer"
                }
                apiVersion: "v1"
                kind:       "Service"
        }
        parameter: {}
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
```

```bash
$ vela def apply my-comp.cue -n my-namespace
ComponentDefinition my-comp created in namespace my-namespace.
```

## get / list / edit / del

While you can use native kubectl tools to confirm the results of the apply command, as mentioned above, the YAML object mixed with raw CUE template string is complex. Using `vela def get` will automatically convert the YAML object into the CUE-format definition.

```bash
$ vela def get my-comp -t component
```

Or you can list all defintions installed through `vela def list`

```bash
$ vela def list -n my-namespace -t component
NAME                    TYPE                    NAMESPACE       DESCRIPTION  
my-comp                 ComponentDefinition     my-namespace    My component.
```

Similarly, using `vela def edit` to edit definitions in pure CUE-format. The transformation between CUE-format definition and YAML object is done by the command. Besides, you can specify the `EDITOR` environment variable to use your favourate editor.

```bash
$ EDITOR=vim vela def edit my-comp
```

Finally, `vela def del` can be utilized to delete existing definitions.

```bash
$ vela def del my-comp -n my-namespace  
Are you sure to delete the following definition in namespace my-namespace?
ComponentDefinition my-comp: My component.
[yes|no] > yes
ComponentDefinition my-comp in namespace my-namespace deleted.
```

