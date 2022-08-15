---
title: Dry Run
---

The dry run is a very useful way to check the application configuration and the definitions. The dry run will render the application and print the output resources that check passed on the service side. If the definitions(component, trait) is invalid, the dry run will print the error message.

> The policies and workflows can not be dry run currently, this is a insufficiency.

When you do the following things please must pass dry run.

* Create or update an application.
* Create or update the definition, and dry run some example applications.

### Dry run via CLI

There is a simple application:

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

Copy it and write a file `app.yaml`

```bash
vela dry-run app.yaml
```

The outputs:

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

If we set the expose field of the port as false, the output resources do not include the `Service`. If we set the replicas field as "1", the output will be an error message:

```bash
Error: validate application: ./app.yaml by dry-run: admission webhook "validating.core.oam.dev.v1beta1.applications" denied the request: field "schematic": Invalid value error encountered, cannot evaluate trait "scaler": invalid template of trait scaler after merge with parameter and context: parameter.replicas: conflicting values (*1 | int) and "1" (mismatched types int and string) (and 1 more errors). 
```

This means the replicas field is int type but we provide a string value, this application configuration is not valid.

More use cases refer to the [Dry run command](../cli/vela_dry-run)

### Dry run via UI

![dry-run](https://static.kubevela.net/images/1.5/dry-run.jpg)

Click the `Deploy` button to open the workflow select dialog. You cloud select a workflow(every workflow corresponding to an environment) and click the `DryRun` button to execute a dry run. If passed, the result is like this:

![dry-run-successfully](https://static.kubevela.net/images/1.5/dry-run-success.jpg)

The result report is different from the CLI, there is a complete application configuration that is generated from the application metadata, you could check it. Different environments may have different application configurations.
