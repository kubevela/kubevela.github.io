---
title: Dry Run
---

`vela dry-run` renders an application into the Kubernetes resources it would create, and prints them without deploying anything. Use it to check:

* an application before you create or update it;
* a definition (component, trait) before you apply it, by dry-running an example application against it.

If the application or a definition is invalid, dry-run prints the error instead.

## Dry run an application

Save this application as `app.yaml`:

```yaml
kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: webservice-app
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        ports:
          - port: 8080
            expose: true
      traits:
        - type: scaler
          properties:
            replicas: 1
```

Render it:

```bash
vela dry-run -f app.yaml
```

<details>
<summary>expected output</summary>

```yaml
---
# Application(webservice-app) -- Component(frontend)
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: frontend
    app.oam.dev/name: webservice-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: webservice
  name: frontend
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app.oam.dev/component: frontend
  template:
    metadata:
      labels:
        app.oam.dev/component: frontend
        app.oam.dev/name: webservice-app
    spec:
      containers:
      - command:
        - node
        - server.js
        image: oamdev/testapp:v1
        name: frontend
        ports:
        - containerPort: 8080
          name: port-8080
          protocol: TCP

---
## From the auxiliary workload
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: frontend
    app.oam.dev/name: webservice-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: TRAIT
    trait.oam.dev/resource: webserviceExpose
    trait.oam.dev/type: AuxiliaryWorkload
  name: frontend
  namespace: default
spec:
  ports:
  - name: port-8080
    port: 8080
    targetPort: 8080
  selector:
    app.oam.dev/component: frontend
  type: ClusterIP

---
```

</details>

With `expose: false` on the port, the output has no `Service`. Set `replicas: "1"` (a string) and dry-run prints an error instead:

```bash
Error: validate application: ./app.yaml by dry-run: admission webhook "validating.core.oam.dev.v1beta1.applications" denied the request: field "schematic": Invalid value error encountered, cannot evaluate trait "scaler": invalid template of trait scaler after merge with parameter and context: parameter.replicas: conflicting values (*1 | int) and "1" (mismatched types int and string) (and 1 more errors).
```

`replicas` is an `int`, so a string is not valid.

### Without a cluster

By default dry-run reads definitions from the cluster and validates the result there. Add `--offline` to run with no cluster at all: validation is skipped, and every definition the application uses must come from `-d`, a file or a directory of definitions:

```bash
vela dry-run --offline -d ./definitions -f app.yaml
```

`-d` also works online, alongside the definitions in the cluster. `-x` (`--definition-namespace`) sets the namespace the CLI reads definitions from; it defaults to `vela-system`.

## Check a definition before you apply it

Pass a definition you are writing with `-d`, and dry-run an application that uses it. Nothing is applied to the cluster. For example, a trait that labels pods with their team, saved as `my-trait.cue`:

```cue
"my-trait": {
	type:        "trait"
	description: "Label the pods with the owning team."
	attributes: appliesToWorkloads: ["deployments.apps"]
}
template: {
	patch: spec: template: metadata: labels: team: parameter.team
	parameter: team: string
}
```

And an application that uses it, saved as `app.yaml`:

```yaml
kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: webservice-app
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
      traits:
        - type: my-trait
          properties:
            team: payments
```

```bash
vela dry-run -f app.yaml -d my-trait.cue
```

The Deployment in the output carries the label `team: payments`. If the template is broken, say it reads `parameter.teem`, dry-run names the field:

```
Error: cannot generate manifests from components and traits: cannot generate manifests from component frontend:

Template errors:
  spec.template.metadata.labels.team: undefined field: teem
```

## Dry run with policies and a workflow

Dry-run takes `override` and `topology` policies and `deploy` workflow steps into account. It ignores other workflow steps.

This application deploys to `default`, waits for approval, then deploys to `prod` with 5 replicas:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true
      traits:
        - type: scaler
          properties:
            replicas: 1
  policies:
    - name: target-default
      type: topology
      properties:
        clusters: ["local"]
        namespace: "default"
    - name: target-prod
      type: topology
      properties:
        clusters: ["local"]
        namespace: "prod"
    - name: deploy-ha
      type: override
      properties:
        components:
          - type: webservice
            traits:
              - type: scaler
                properties:
                  replicas: 5
  workflow:
    steps:
      - name: deploy2default
        type: deploy
        properties:
          policies: ["target-default"]
      - name: manual-approval
        type: suspend
      - name: deploy2prod
        type: deploy
        properties:
          policies: ["target-prod", "deploy-ha"]
```

Dry-run renders each `deploy` step separately, with the same Deployment and Service as above for each. Only these lines differ between the two:

```yaml
# Application(first-vela-app with topology target-default) -- Component(express-server)
...
spec:
  replicas: 1
...
# Application(first-vela-app with topology target-prod) -- Component(express-server)
...
spec:
  replicas: 5
```

Dry-run applies the override policies but not the topology's placement: the output is labelled with the topology, and the resources still show the Application's namespace (`default`). When the Application is deployed, they go to the namespace `target-prod` sets (`prod`).

### Dry run one environment

To dry-run one environment, pass its Policy and Workflow files with `-f` and add `--merge`.

Keep the application without its `policies` and `workflow`:

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true
      traits:
        - type: scaler
          properties:
            replicas: 1
```

And the production environment in two files of its own:

```yaml
# workflow.yaml
apiVersion: core.oam.dev/v1alpha1
kind: Workflow
metadata:
  name: deploy-demo
steps:
  - type: deploy
    name: deploy-prod
    properties:
      policies: ["target-prod"]
```

```yaml
# target-prod.yaml
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: target-prod
type: topology
properties:
  clusters: ["local"]
  namespace: "prod"
```

```bash
vela dry-run -f app.yaml -f target-prod.yaml -f workflow.yaml --merge
```

The output is the same Deployment and Service, rendered once, under `# Application(first-vela-app with topology target-prod) -- Component(express-server)`.

Without `--merge`, files the application does not reference are ignored, with a warning for each:

```
WARNING: workflow deploy-demo not referenced by application

WARNING: policy target-prod not referenced by application
```

:::note
An Application that references a Workflow with `workflow: ref:` can't be dry-run from local files: the referenced Workflow, and the Policies it names, must already exist in the cluster, and the Workflow must be readable by the user the Application runs as. To dry-run files on disk, use `--merge` as above.
:::

See the [dry-run command reference](../cli/vela_dry-run.md) for every flag.

## Dry run in VelaUX

![dry-run](https://kubevela.io/images/1.5/dry-run.jpg)

Click **Deploy** to open the workflow picker. Each workflow belongs to one environment. Pick one and click **DryRun**. If it passes, you see this:

![dry-run-successfully](https://kubevela.io/images/1.5/dry-run-success.jpg)

The report differs from the CLI's: it shows the whole Application that VelaUX generates for that environment, so different environments can show different configurations.
