---
title: Deploy Container as Web Service
---

Service-oriented components are components that support external access to services with the container as the core, and their functions cover the needs of most of he microservice scenarios.

Please copy shell below and apply to the cluster:

```shell
cat <<EOF | vela up -f -
# YAML begins
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        ports:
          - port: 8080
        cpu: "0.1"
        env:
          - name: FOO
            value: bar
# YAML ends
EOF
```

You can also save the YAML file as website.yaml and use the `vela up -f website.yaml` command to deploy.

Next, check the deployment status of the application through `vela status <application name>`:

```shell
$ vela status website
About:

  Name:      	website
  Namespace: 	default
  Created at:	2022-01-11 21:04:59 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:2y4rv8479h
    name:frontend
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: frontend  Env:
    Type: webservice
    healthy Ready:1/1
```

When we see that the `finished` field in Workflow is `true` and the Status is `running`, it means that the entire application is delivered successfully.

If status shows as rendering or healthy as false, it means that the application has either failed to deploy or is still being deployed. Please proceed according to the information returned in `kubectl get application <application name> -o yaml`.

You can also view application list by using the following command:

```shell
$ vela ls
APP    	COMPONENT	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
website	frontend 	webservice	      	running	healthy	      	2021-08-28 18:26:47 +0800 CST
```

We also see that the PHASE of the app is running and the STATUS is healthy.

