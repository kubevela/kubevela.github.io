---
title:  Deploy First Application
---

Welcome to KubeVela! In this guide, we'll walk you through how to install KubeVela, and deploy your first simple application.

## Installation

Make sure you have finished and verified KubeVela installation following [this guide](../install.mdx).

## A Simple Application

A simple deployment definition in KubeVela looks as below:

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
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

Now deploy it to KubeVela:

```bash
vela up -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/vela-app.yaml
```

This command will deploy a web service component to target environment, which in our case is the Kubernetes cluster that KubeVela itself is installed.

After deployed, you can now directly visit this application as it already attached with a `ingress` trait (assume your cluster has [ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/) installed).

```
$ curl -H "Host:testsvc.example.com" http://<some ip address>/
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

Great! You have finished deploying your first KubeVela application, the simplest component can only have one component, the rest fields are all optional including trait, policies and workflow.


## Next Step

* Read from [the introduction](../) to learn more about the project.
* Learn how to do [Multi-Cluster Application Delivery](../case-studies/multi-cluster). Components and traits are just the beginning of your vela sail, there're more powerful features around Policy and Workflow.
* Refer to [VelaUX](../quick-start) for UI Console experience.