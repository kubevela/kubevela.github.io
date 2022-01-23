---
title: Gateway for Public Access
---

The `gateway` trait exposes a component to public Internet via a valid domain.

## How to use

Attach a `gateway` trait to the component you want to expose and deploy.

```yaml
# vela-app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

```bash
vela up -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/vela-app.yaml
```
```console
application.core.oam.dev/first-vela-app created
```

Check the status until we see `status` is `running`:

```bash
vela status first-vela-app
```
```console
About:

  Name:      	first-vela-app
  Namespace: 	default
  Created at:	2022-01-11 22:04:29 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:gfgwqp6pqh
    name:express-server
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: express-server  Env:
    Type: webservice
    healthy Ready:1/1
    Traits:
      - ✅ gateway: Visiting URL: testsvc.example.com, IP: 1.5.1.1
```

You can also get the endpoint by:

```shell
vela status first-vela-app --endpoint
```
```
|--------------------------------|----------------------------+
|    REF(KIND/NAMESPACE/NAME)    |          ENDPOINT          |
|--------------------------------|----------------------------+
| Ingress/default/express-server | http://testsvc.example.com |
|--------------------------------|----------------------------+
```

Then you will be able to visit this application via its domain.

```
curl -H "Host:testsvc.example.com" http://<your ip address>/
```
```console
<xmp>
Hello World


                                       ##         .
                                 ## ## ##        ==
                              ## ## ## ## ##    ===
                           /""""""""""""""""\___/ ===
                      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~ ~ /  ===- ~~~
                           \______ o          _,/
                            \      \       _,'
                             `'--.._\..--''
</xmp>
```

> ⚠️ This section requires your runtime cluster has a working ingress controller.


## Specification

| NAME        | DESCRIPTION                                                                                        | TYPE           | REQUIRED | DEFAULT |
| ----------- | -------------------------------------------------------------------------------------------------- | -------------- | -------- | ------- |
| http        | Specify the mapping relationship between the http path and the workload port                       | map[string]int | true     |         |
| class       | Specify the class of ingress to use                                                                | string         | true     | nginx   |
| classInSpec | Set ingress class in '.spec.ingressClassName' instead of 'kubernetes.io/ingress.class' annotation. | bool           | false    | false   |
| domain      | Specify the domain you want to expose                                                              | string         | true     |         |
