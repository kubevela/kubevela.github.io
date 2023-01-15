---
title: Dry Run
---

The dry run is a very useful way to check the application configuration and the definitions. The dry run will render the application and print the output resources that check passed on the service side. If the definitions(component, trait) is invalid, the dry run will print the error message.

> Override/topology Policies and deploy workflow are supported now!    
> Limitation: Only support one object per file(yaml) for "-f" flag. More support will be added in the future improvement.  
	

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



### Dry run with policy and workflow via CLI
Let's take the following application for example.  
The application explicitly specify override,topology policies and deploy workflow.
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

Dry run will produce 
```yaml
---
# Application(first-vela-app with topology target-default) -- Component(express-server) 
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: webservice
  name: express-server
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app.oam.dev/component: express-server
  template:
    metadata:
      labels:
        app.oam.dev/component: express-server
        app.oam.dev/name: first-vela-app
    spec:
      containers:
      - image: oamdev/hello-world
        name: express-server
        ports:
        - containerPort: 8000
          name: port-8000
          protocol: TCP

---
## From the auxiliary workload 
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: TRAIT
    trait.oam.dev/resource: webserviceExpose
    trait.oam.dev/type: AuxiliaryWorkload
  name: express-server
  namespace: default
spec:
  ports:
  - name: port-8000
    port: 8000
    targetPort: 8000
  selector:
    app.oam.dev/component: express-server
  type: ClusterIP

---

---
# Application(first-vela-app with topology target-prod) -- Component(express-server) 
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: webservice
  name: express-server
  namespace: default
spec:
  replicas: 5
  selector:
    matchLabels:
      app.oam.dev/component: express-server
  template:
    metadata:
      labels:
        app.oam.dev/component: express-server
        app.oam.dev/name: first-vela-app
    spec:
      containers:
      - image: oamdev/hello-world
        name: express-server
        ports:
        - containerPort: 8000
          name: port-8000
          protocol: TCP

---
## From the auxiliary workload 
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: TRAIT
    trait.oam.dev/resource: webserviceExpose
    trait.oam.dev/type: AuxiliaryWorkload
  name: express-server
  namespace: default
spec:
  ports:
  - name: port-8000
    port: 8000
    targetPort: 8000
  selector:
    app.oam.dev/component: express-server
  type: ClusterIP

---
```
Each deploy workflow step with topology policy will render individual result.

Also, the application can use external workflow.
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
```yaml
# ha.yaml
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: ha
type: override
properties:
  components:
  - type: webservice
    traits:
    - type: scaler
      properties:
        replicas: 5
```
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
      policies: ["ha", "target-prod"]
```
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
  workflow:
    ref: deploy-demo
```
Dry run will produce 
```yaml
---
# Application(first-vela-app with topology target-prod) -- Component(express-server) 
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: webservice
  name: express-server
  namespace: default
spec:
  replicas: 5
  selector:
    matchLabels:
      app.oam.dev/component: express-server
  template:
    metadata:
      labels:
        app.oam.dev/component: express-server
        app.oam.dev/name: first-vela-app
    spec:
      containers:
      - image: oamdev/hello-world
        name: express-server
        ports:
        - containerPort: 8000
          name: port-8000
          protocol: TCP

---
## From the auxiliary workload 
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: TRAIT
    trait.oam.dev/resource: webserviceExpose
    trait.oam.dev/type: AuxiliaryWorkload
  name: express-server
  namespace: default
spec:
  ports:
  - name: port-8000
    port: 8000
    targetPort: 8000
  selector:
    app.oam.dev/component: express-server
  type: ClusterIP

---
```

Moreover, dry run can take standalone policies and workflow as consideration by using "merge" flag.

For example, 
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
```
vela dry-run -f app.yaml -f target-prod.yaml -f workflow.yaml
```
will produce 
```yaml
WARNING: workflow deploy-demo not referenced by application

WARNING: policy target-prod not referenced by application

---
# Application(default) -- Component(express-server) 
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: webservice
  name: express-server
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app.oam.dev/component: express-server
  template:
    metadata:
      labels:
        app.oam.dev/component: express-server
        app.oam.dev/name: first-vela-app
    spec:
      containers:
      - image: oamdev/hello-world
        name: express-server
        ports:
        - containerPort: 8000
          name: port-8000
          protocol: TCP

---
## From the auxiliary workload 
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: TRAIT
    trait.oam.dev/resource: webserviceExpose
    trait.oam.dev/type: AuxiliaryWorkload
  name: express-server
  namespace: default
spec:
  ports:
  - name: port-8000
    port: 8000
    targetPort: 8000
  selector:
    app.oam.dev/component: express-server
  type: ClusterIP

---

```
In this case, warning messages show up and the policy and workflow do not take effect. Because those are not referenced by the application and being viewed as standalone files and being ignored.  

So to make those take effect, please provide "merge" flag with the command:
```
vela dry-run -f app.yaml -f target-prod.yaml -f workflow.yaml --merge
```
will produce 
```yaml
---
# Application(first-vela-app with topology target-prod) -- Component(express-server) 
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: webservice
  name: express-server
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app.oam.dev/component: express-server
  template:
    metadata:
      labels:
        app.oam.dev/component: express-server
        app.oam.dev/name: first-vela-app
    spec:
      containers:
      - image: oamdev/hello-world
        name: express-server
        ports:
        - containerPort: 8000
          name: port-8000
          protocol: TCP

---
## From the auxiliary workload 
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: first-vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: TRAIT
    trait.oam.dev/resource: webserviceExpose
    trait.oam.dev/type: AuxiliaryWorkload
  name: express-server
  namespace: default
spec:
  ports:
  - name: port-8000
    port: 8000
    targetPort: 8000
  selector:
    app.oam.dev/component: express-server
  type: ClusterIP

---
```

More use cases refer to the [Dry run command](../cli/vela_dry-run)  

### Dry run via UI

![dry-run](https://static.kubevela.net/images/1.5/dry-run.jpg)

Clicking the `Deploy` button to open the workflow selector dialog. You could select a workflow(every workflow corresponding to an environment) and click the `DryRun` button to execute a dry run. If passed, the result is like this

![dry-run-successfully](https://static.kubevela.net/images/1.5/dry-run-success.jpg)

The result report is different from the CLI, there is a complete application configuration that is generated from the application metadata, you could check it. Different environments may have different application configurations.
