---
title: Dry Run
---

Dry run will help you to understand what are the real resources which will to be expanded and deployed
to the Kubernetes cluster. In other words, it will mock to run the same logic as KubeVela's controller 
and output the results locally.

For example, let's dry-run the following application:

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: ingress
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

```shell
kubectl vela dry-run -f app.yaml
---
# Application(vela-app) -- Comopnent(express-server)
---

apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    workload.oam.dev/type: webservice
spec:
  selector:
    matchLabels:
      app.oam.dev/component: express-server
  template:
    metadata:
      labels:
        app.oam.dev/component: express-server
    spec:
      containers:
      - image: crccheck/hello-world
        name: express-server
        ports:
        - containerPort: 8000

---
apiVersion: v1
kind: Service
metadata:
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    trait.oam.dev/resource: service
    trait.oam.dev/type: ingress
  name: express-server
spec:
  ports:
  - port: 8000
    targetPort: 8000
  selector:
    app.oam.dev/component: express-server

---
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    trait.oam.dev/resource: ingress
    trait.oam.dev/type: ingress
  name: express-server
spec:
  rules:
  - host: testsvc.example.com
    http:
      paths:
      - backend:
          serviceName: express-server
          servicePort: 8000
        path: /

---
```

In this example, the definitions(`webservice` and `ingress`) which `vela-app` depends on are the built-in 
components and traits of KubeVela. You can also use `-d `or `--definitions` to specify your local definition files.

`-d `or `--definitions` permits users to provide capability definitions used in the application from local files.
`dry-run` cmd will prioritize the provided capabilities than the living ones in the cluster.