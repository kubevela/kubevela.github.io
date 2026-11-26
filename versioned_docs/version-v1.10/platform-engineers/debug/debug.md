---
title:  Debug Workflow
slug: /platform-engineers/debug/debug
---

:::caution
Debug workflow will run workflow in the real environment, make sure you're debugging in the test environment.

`vela debug` reads the Application, the definitions it uses and, for a workflow, the debug data the `debug` policy stores in ConfigMaps in the app's namespace. If it reports `forbidden`, ask your platform team for read access to Applications and ConfigMaps in that namespace.
:::

When you deploy your application in a test environment and find problems with the application, you may want to debug the application in the environment. KubeVela provides the `vela debug` command to help you debug your application in the environment.

## Add the debug policy

`vela debug` works only on an Application with the `debug` policy, whether or not it has a workflow. Without the policy it stops with `please make sure your application have the debug policy`. Add it to the Application:

```yaml
policies:
  - name: debug
    type: debug
```

You can also use `vela up -f <application yaml> --debug` to automatically add debug policy to your application.

## Applications with workflow

For applications that use workflows, `vela debug` will first list all the steps in the workflow, and you can select the specified steps to debug. After selecting a step, you can view the contents of all CUE variables in that step individually. Among them: `do` and `provider` marked in yellow are the CUE actions used this time, and the error content will be marked in red.

![](https://kubevela.io/images/1.4/debug-workflow.gif)

You can also use `vela debug <application-name> -s <step-name> -f <variable>` to view the contents of specified variables in a single step.

![](https://kubevela.io/images/1.4/debug-workflow-focus.gif)

## Applications with components only

If your application only uses components, not workflows, `vela debug <application-name>` shows what each component renders. It still needs the `debug` policy.

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
        image: oamdev/hello-world
        ports:
          - port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
  policies:
    - name: debug
      type: debug
```

After the application is deployed, you can use the `vela debug <application-name>` command to view all the resources rendered by the application.

![](https://kubevela.io/images/1.4/debug-application.gif)

You can also use `vela debug <application-name> -s <component-name>` to see all resources rendered in a single component.

![](https://kubevela.io/images/1.4/debug-application-comp.gif)
