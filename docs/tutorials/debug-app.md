---
title: Debugging Application
---

KubeVela supports several CLI commands for debugging your applications, they can work on control plane and help you access resources across multi-clusters. Which also means you can play with your pods in managed clusters directly on the hub cluster, without switching KubeConfig context. If you have multiple clusters in on application, the CLI command will ask you to choose one interactively.

## List Apps

List all your applications.

```
vela ls
```

<details>
<summary>expected output</summary>
```
APP          	COMPONENT   	TYPE      	TRAITS 	PHASE             	HEALTHY	STATUS                                                      	CREATED-TIME
war          	war         	java-war  	       	running           	healthy	Ready:1/1                                                   	2022-09-30 17:32:29 +0800 CST
ck-instance  	ck-instance 	clickhouse	       	running           	healthy	                                                            	2022-09-30 17:38:13 +0800 CST
kubecon-demo 	hello-world 	java-war  	gateway	running           	healthy	Ready:1/1                                                   	2022-10-08 11:32:47 +0800 CST
ck-app       	my-ck       	clickhouse	gateway	running           	healthy	Host not specified, visit the cluster or load balancer in   	2022-10-08 17:55:20 +0800 CST
             	            	          	       	                  	       	front of the cluster with IP: 47.251.8.82
demo2        	catalog     	java-war  	       	workflowSuspending	healthy	Ready:1/1                                                   	2022-10-08 16:22:11 +0800 CST
├─           	customer    	java-war  	       	workflowSuspending	healthy	Ready:1/1                                                   	2022-10-08 16:22:11 +0800 CST
└─           	order-web   	java-war  	gateway	workflowSuspending	healthy	Ready:1/1                                                   	2022-10-08 16:22:11 +0800 CST
kubecon-demo2	hello-world2	java-war  	gateway	workflowSuspending	healthy	Ready:1/1                                                   	2022-10-08 11:48:41 +0800 CST
```
</details>

## Show status of app

- `vela status` can give you an overview of your deployed multi-cluster application.

```
vela up -f https://kubevela.net/example/applications/first-app.yaml
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

- `vela status --pod` can list the pod status of your application.

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

- `vela status --endpoint` can list the access endpoints of your application.

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

-- `vela status --tree --detail` can list resources of your application.

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

## Show logs of app

- `vela logs` shows pod logs in managed clusters.

```bash
vela logs first-vela-app
```

<details>
<summary>expected output</summary>

```
? You have 2 deployed resources in your app. Please choose one: Cluster: cluster-hangzhou-1 | Namespace: examples | Kind: Deployment | Name: nginx-basic
+ nginx-basic-dfb6dcf8d-km5vk › nginx-basic
nginx-basic-dfb6dcf8d-km5vk nginx-basic 2022-04-08T06:38:10.540430392Z /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
nginx-basic-dfb6dcf8d-km5vk nginx-basic 2022-04-08T06:38:10.540742240Z /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
```

</details>

## Execute commands inside pod container

- `vela exec` helps you execute commands in pods in managed clusters.

```bash
vela exec basic-topology -n examples -it -- ls 
```

<details>
<summary>expected output</summary>

```
? You have 2 deployed resources in your app. Please choose one: Cluster: cluster-hangzhou-1 | Namespace: examples | Kind: Deployment | Name: nginx-basic
bin   docker-entrypoint.d   home   media  proc  sbin  tmp
boot  docker-entrypoint.sh  lib    mnt    root  srv   usr
dev   etc                   lib64  opt    run   sys   var
```

</details>

## Access port locally

- `vela port-forward` can discover and forward ports of pods or services in managed clusters to your local endpoint. 

```bash
vela port-forward basic-topology -n examples 8080:80
```

<details>
<summary>expected output</summary>

```
? You have 4 deployed resources in your app. Please choose one: Cluster: cluster-hangzhou-1 | Namespace: examples | Kind: Deployment | Name: nginx-basic
Forwarding from 127.0.0.1:8080 -> 80
Forwarding from [::1]:8080 -> 80

Forward successfully! Opening browser ...
Handling connection for 8080
```

</details>

## More CLI Details

Please refer to the [CLI docs](../cli/vela).