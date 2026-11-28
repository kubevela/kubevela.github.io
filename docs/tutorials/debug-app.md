---
title: Debugging Application
---

When an application doesn't behave, start here. Each section below starts from a symptom and gives the `vela` command that answers it. The commands run against the control plane and reach resources in every managed cluster, so you never switch kubeconfig context.

With several clusters or pods, `vela logs` and `vela exec` ask which one. Pass `--cluster`, `--component` or `--pod` to choose up front.

:::tip
Prefer a terminal UI? See [vela top](./vela-top.md).
:::

## Deploy an example app

The examples on this page use the application from [Quick Start](../quick-start.md). Save it as `first-app.yaml`:

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
        # The cluster with name local is installed the KubeVela.
        clusters: ["local"]
        namespace: "default"
    - name: target-prod
      type: topology
      properties:
        clusters: ["local"]
        # This namespace must be created before deploying.
        namespace: "prod"
    - name: deploy-ha
      type: override
      properties:
        components:
          - type: webservice
            traits:
              - type: scaler
                properties:
                  replicas: 2
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

```bash
vela up -f first-app.yaml
```

## Which applications are there?

`vela ls` lists your applications, with their phase and health.

```
vela ls
```

<details>
<summary>expected output</summary>

```
APP           	COMPONENT     	TYPE      	TRAITS	PHASE             	HEALTHY	STATUS   	CREATED-TIME
first-vela-app	express-server	webservice	scaler	workflowSuspending	healthy	Ready:1/1	2022-10-09 12:10:30 +0800 CST
```

</details>

## Is it running?

`vela status` shows the workflow's progress and the health of each component, in every cluster.

```
vela status first-vela-app
```

<details>
<summary>expected output</summary>

```
About:

  Name:      	first-vela-app
  Namespace: 	default
  Created at:	2022-10-09 12:10:30 +0800 CST
  Status:    	workflowSuspending

Workflow:

  mode: StepByStep
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id: g1jtl5unra
    name: deploy2default
    type: deploy
    phase: succeeded
    message:
  - id: 6cq88ufzq5
    name: manual-approval
    type: suspend
    phase: running
    message:

Services:

  - Name: express-server
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    Traits:
      ✅ scaler
```

</details>

`vela status --pod` lists the application's pods and their phase.

```
vela status first-vela-app --pod
```

<details>
<summary>expected output</summary>

```
CLUSTER	COMPONENT     	POD NAME                      	NAMESPACE	PHASE  	CREATE TIME         	REVISION	HOST
local  	express-server	express-server-b768d95b7-qnwb4	default  	Running	2022-10-09T04:10:31Z	        	izrj9f9wodrsepwyb9mcetz
```

</details>

`vela status --endpoint` lists the endpoints you can reach the application on.

```
vela status first-vela-app --endpoint
```

<details>
<summary>expected output</summary>

```
Please access first-vela-app from the following endpoints:
+---------+----------------+--------------------------------+-----------------------------+-------+
| CLUSTER |   COMPONENT    |    REF(KIND/NAMESPACE/NAME)    |          ENDPOINT           | INNER |
+---------+----------------+--------------------------------+-----------------------------+-------+
| local   | express-server | Service/default/express-server | express-server.default:8000 | true  |
+---------+----------------+--------------------------------+-----------------------------+-------+
```

</details>

## What did it create?

`vela status --tree --detail` lists every resource the application created, where it lives, and its state.

```
vela status first-vela-app --tree --detail
```

<details>
<summary>expected output</summary>

```
CLUSTER       NAMESPACE     RESOURCE                  STATUS    APPLY_TIME          DETAIL
local     ─── default   ─┬─ Service/express-server    updated   2022-10-09 12:10:30 Type: ClusterIP  Cluster-IP: 10.43.212.235  External-IP: <none>  Port(s): 8000/TCP  Age: 6m44s
                         └─ Deployment/express-server updated   2022-10-09 12:10:30 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 6m44s
```

</details>

## Why is it failing?

`vela logs` shows the pods' logs, from whichever cluster they run in. Add `--component` or `--pod` to pick one.

```bash
vela logs first-vela-app
```

<details>
<summary>expected output</summary>

```
+ express-server-b768d95b7-qnwb4 › express-server
express-server 2022-10-09T12:10:33.785549770+08:00 httpd started
```

</details>

## Look inside a container

`vela exec` runs a command in a pod's container, in whichever cluster it runs in.

```bash
vela exec first-vela-app -it -- ls
```

<details>
<summary>expected output</summary>

```
bin   dev   etc   home  proc  root  sys   tmp   usr   var   www
```

</details>

## Reach it from your machine

`vela port-forward` finds the application's pods or Services, in any cluster, and forwards a local port to them.

```
vela port-forward first-vela-app 8001:8000
```

Then call it with `curl http://127.0.0.1:8001/`.

## More

See the [CLI reference](../cli/vela.md) for every flag.