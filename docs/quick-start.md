---
title: Deploy First Application
---

> Before starting, please confirm that you've installed KubeVela Core and VelaUX in the control plane cluster based on [Installation](./install.mdx)

Welcome to KubeVela! In this section, we show you how to deliver your first app.

## Deploy a simple application via CLI

A simple deployment definition in KubeVela looks as below:

```yaml
cat <<EOF | vela up -f -
# YAML begins
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
        ports: 
         - port: 8000
           expose: true
# YAML ends
EOF
```

This command will deploy a web service component to target environment, which in our case is the Kubernetes cluster that KubeVela itself is installed.

```
$ vela port-forward first-vela-app 8000:8000
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

> Currently, The application created by CLI will be synced to UI, but it will be readonly.

## Deploy a simple application via UI

After logging into the UI, the first page you enter is for managing the applications:

Then click the button of `New Application` on the upper-right, type in these things:

1. Name and other basic Infos.
2. Choose the Project. We've created a default Project for you to use or you can click `New` to create your own.
3. Choose the main component type. In this case, we use `webservice` to deploy Stateless Application.
4. Choose your environment. We select the `Default` Environment based on the `Default` Target.

### Setting up properties

Next step, we see the page of properties. Configure following:

- Image address `crccheck/hello-world`

![create hello world app](https://static.kubevela.net/images/1.3/create-helloworld.jpg)

Confirmed. Notice that this application is only created but not deployed yet. VelaUX default generates [Workflow](./getting-started/core-concept#workflow) and a scaler [Trait](./getting-started/core-concept#trait).

### Executing Workflow to deploy

Click the deploy button on the upper-right. When the workflow is finished, you'll get to see the list of status lying within.

![](./resources/succeed-first-vela-app.jpg)

## Deleting Application

If you want to delete the application when it's no longer used, simply:

1. Enter the page of environment, click `Recycle` to reclaim the resources that this environment used.
2. Go back to the list of applications and click the drop-down menu to remove it.

That's it! You succeed at the first application delivery. Congratulation!

## Next Step

- View [Core Concepts](./getting-started/core-concept) to look on more concepts.
- View [User Guide](./tutorials/webservice) to look on more of what you can achieve with KubeVela.
