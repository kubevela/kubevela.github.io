---
title:  Debug in the environment
---

> This feature is available in KubeVela v1.4.

When you deploy your application in a test environment and find problems with the application, you may want to debug the application in the environment. KubeVela provides the `vela debug` command to help you debug your application in the environment.

## Applications with workflow

If your application uses workflow, make sure your app has the `debug` policy before using the `vela debug` command:

```yaml
polices:
  - name: debug
    type: debug
```

You can also use `vela up -f <application yaml> --debug` to automatically add debug policy to your application.

For applications that use workflows, `vela debug` will first list all the steps in the workflow, and you can select the specified steps to debug. After selecting a step, you can view the contents of all CUE variables in that step individually. Among them: `do` and `provider` marked in yellow are the CUE actions used this time, and the error content will be marked in red.

![](https://static.kubevela.net/images/1.4/debug-workflow.gif)

You can also use `vela debug <application-name> -s <step-name> -f <variable>` to view the contents of specified variables in a single step.

![](https://static.kubevela.net/images/1.4/debug-workflow-focus.gif)

## Applications with components only

If your application only uses components, not workflows, then, you can use the `vela debug <application-name>` command directly to debug your application.

Deploy the following application. The first component will use `k8s-objects` to create a Namespace, and the second component will use the `webservice` with `gateway` trait to create a Deployment and its corresponding Service and Ingress.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: gateway-app
spec:
  components:
    - name: comp-namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: test-ns1
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        ports:
          - port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

After the application is deployed, you can use the `vela debug <application-name>` command to view all the resources rendered by the application.

![](https://static.kubevela.net/images/1.4/debug-application.gif)

You can also use `vela debug <application-name> -s <component-name>` to see all resources rendered in a single component.

![](https://static.kubevela.net/images/1.4/debug-application-comp.gif)
