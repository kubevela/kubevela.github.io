---
title: Easily Manage your Application Shipment With Differentiated Configuration in Multi-Cluster 
author: Wei Duan
author_title: KubeVela Team
author_url: https://github.com/oam-dev/KubeVela
author_image_url: https://KubeVela.io/img/logo.svg
tags: [ KubeVela ]
description: ""
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

Under today's multi-cluster business scene, we often encounter these typical requirements: distribute to multiple specific clusters, specific group distributions according to business need, and differentiated configurations for multi-clusters.

KubeVela v1.3 iterates based on the previous multi-cluster function. This article will reveal how to use it to do swift multiple clustered deployment and management to address all your anxieties.

### Before Starting

1. Prepare a Kubernetes cluster as the control plane of KubeVela.
1. Make sure [KubeVela v1.3](https://github.com/oam-dev/kubevela/releases/tag/v1.3.0) and KubeVela CLI v1.3.0 have been installed successfully.
2. The list of Kubeconfig from sub clusters that you want to manage. We will take three clusters naming beijing-1, beijing-2 and us-west-1 as examples.
3. Download and combine with [Multi-Cluster-Demo](https://github.com/oam-dev/sample/tree/master/12.multi_cluster_demo) to better understand how to use the KubeVela multi-cluster capabilities.

### Distribute to Multiple Specified Clusters
Distributing multiple specified clusters is the most basic multi-cluster management operation. In KubeVela, you will use a policy called `topology` to implement it. The cluster will be listed in the attribute `clusters`, an array.

First let's make sure switching kubeconfig to the control plane cluster, go with `vela cluster join` to include in the 3 clusters of Beijing-1, Beijing-2 and us-west-1:
```
➜   vela cluster join beijing-1.kubeconfig --name beijing-1
➜   vela cluster join beijing-2.kubeconfig --name beijing-2
➜   vela cluster join us-west-1.kubeconfig --name us-west-1
➜   vela cluster list
CLUSTER        	TYPE           	ENDPOINT                 	ACCEPTED	LABELS
beijing-1      	X509Certificate	https://47.95.22.71:6443 	true
beijing-2      	X509Certificate	https://47.93.117.83:6443	true
us-west-1      	X509Certificate	https://47.88.31.118:6443	true
```
Then open multi-cluster-demo, look into `Basic.yaml`:
```
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app
  namespace: default
spec:
  components:
    - name: hello-world-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: scaler
          properties:
            replicas: 3
        - type: gateway
          properties:
            domain: testsvc-mc.example.com
            # classInSpec : true   If the sub clusters has Kubernetes versions below v1.20 installed, please add this field
            http:
              "/": 8000
  policies:
    - type: topology
      name: beijing-clusters
      properties:
        clusters: ["beijing-1","beijing-2"]
```
It can be seen that this app uses the component of type `webservice` and distributes 3 Deployments to beijing-1 and beijing-2 clusters through the `topology` policy.

Please note that the premise of successfully distributing resource into managed clusters is that it must contain the exactly same namespace as control plane did.  Since each cluster has the **`default`** namespace by default, we won't be worry in this case. But suppose we change the namespace in **`basic.yaml`** to be **`multi-cluster`**, we will receive an error:
```
... 
 Status:    	runningWorkflow

Workflow:

  mode: DAG
  finished: false
  Suspend: false
  Terminated: false
  Steps
  - id:9fierfkhsc
    name:deploy-beijing-clusters
    type:deploy
    phase:failed
    message:step deploy: step deploy: run step(provider=oam,do=components-apply): Found 1 errors. [(failed to apply component beijing-1-multi-cluster-0: HandleComponentsRevision: failed to create componentrevision beijing-1/multi-cluster/hello-world-server-v1: namespaces "multi-cluster" not found)]

Services:
...
```

**In future versions of KubeVela, we plan to support a comprehensive Authentication System, more convenient and more securely to: create namespaces in managed cluster through the hub cluster in quick moves.**

After creating the sub cluster's namespace, come back to the control plane cluster to create the application and ship out resources:
```
➜   vela up -f basic.yaml
Applying an application in vela K8s object format...
"patching object" name="example-app" resource="core.oam.dev/v1beta1, Kind=Application"
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward example-app
             SSH: vela exec example-app
         Logging: vela logs example-app
      App status: vela status example-app
  Service status: vela status example-app --svc hello-world-server
```
We use `vela status <App Name>` to view detailed infos about this app:
```
➜   vela status example-app
About:

  Name:      	example-app
  Namespace: 	default
  Created at:	2022-03-25 17:42:33 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:wftf9d4exj
    name:deploy-beijing-clusters
    type:deploy
    phase:succeeded
    message:

Services:

  - Name: hello-world-server
    Cluster: beijing-1  Namespace: default
    Type: webservice
    Healthy Ready:3/3
    Traits:
      ✅ scaler      ✅ gateway: Visiting URL: testsvc-mc.example.com, IP: 60.205.222.30
  - Name: hello-world-server
    Cluster: beijing-2  Namespace: default
    Type: webservice
    Healthy Ready:3/3
    Traits:
      ✅ scaler      ✅ gateway: Visiting URL: testsvc-mc.example.com, IP: 182.92.222.128
```
Both the beijing-1 and beijing-2 have issued the corresponding resources, they also displayed external access IP addresses, and you can therefore make it public for your users.

### Use Cluster Labels to Do Grouping
In addition to the above basic need, we often encounter additional situations: cross-regional deployment to certain clusters, specify which cloud provider's cluster, etc. In order to achieve a similar goal, the `labels` feature can be used.

Here, suppose the us-west-1 cluster comes from AWS, we must additionally apply to the AWS cluster. You can use the `vela cluster labels add` command to tag the cluster. Of course, if there is more of AWS related clusters such as us-west-2, it will be handled as well after they were labeled:
```
➜  ~ vela cluster labels add us-west-1 provider=AWS
Successfully update labels for cluster us-west-1 (type: X509Certificate).
provider=AWS
➜  ~ vela cluster list
CLUSTER        	TYPE           	ENDPOINT                 	ACCEPTED	LABELS
beijing-1      	X509Certificate	https://47.95.22.71:6443 	true
beijing-2      	X509Certificate	https://47.93.117.83:6443	true
us-west-1      	X509Certificate	https://47.88.31.118:6443	true    	provider=AWS
```
Next we update the `basic.yaml` to add an application policy `topology-aws`:
```
...
  policies:
    - type: topology
      name: beijing-clusters
      properties:
        clusters: ["beijing-1","beijing-2"]
    - type: topology
      name: topology-aws
      properties:
        clusterLabelSelector:
          provider: AWS
```
In order save your time, please deploy `intermediate.yaml` directly:
```
➜  ~ vela up -f intermediate.yaml
```
Review the status of the application again:
```
➜   vela status example-app

...

  - Name: hello-world-server
    Cluster: us-west-1  Namespace: default
    Type: webservice
    Healthy Ready:3/3
    Traits:
      ✅ scaler      ✅ gateway: Visiting URL: testsvc-mc.example.com, IP: 192.168.40.10

```
### Differentiated Configuration

Apart from above scenarios, we tend to have more application strategic needs, such as high availability of hoping to distribute 5 replicas. In this case, use the `override` policy:
```
...        
        clusterLabelSelector:
          provider: AWS
    -  type: override
       name: override-high-availability
       properties:
          components:
            - type: webservice
              traits:
              - type: scaler
                properties:
                  replicas: 5
```
At the same time, we hope that only AWS clusters can get high availability. Then we can expect KubeVela's workflow give us a hand. We use the following workflow: it aims to deploy this app by, first distributing to Beijing's clusters through the `deploy-beijing` policy, then distributing 5 copies to clusters which were labeled as AWS:
```
...                
                properties:
                  replicas: 5
  workflow:
    steps:
      - type: deploy
        name: deploy-beijing
        properties:
          policies: ["beijing-clusters"]
      - type: deploy
        name: deploy-aws
        properties:
          policies: ["override-high-availability","topology-aws"]
```
Then we attach the above policy and workflow to `intermediate.yaml` and make it to `advanced.yaml`:
```
...
  policies:
    - type: topology
      name: beijing-clusters
      properties:
        clusters: ["beijing-1","beijing-2"]
    - type: topology
      name: topology-aws
      properties:
        clusterLabelSelector:
          provider: AWS
    -  type: override
       name: override-high-availability
       properties:
          components:
            - type: webservice
              traits:
              - type: scaler
                properties:
                  replicas: 5
  workflow:
    steps:
      - type: deploy
        name: deploy-beijing
        properties:
          policies: ["beijing-clusters"]
      - type: deploy
        name: deploy-aws
        properties:
          policies: ["override-high-availability","topology-aws"]
```
Then deploy it, view the status of the application:
```
➜   vela up -f advanced.yaml
Applying an application in vela K8s object format...
"patching object" name="example-app" resource="core.oam.dev/v1beta1, Kind=Application"
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward example-app
             SSH: vela exec example-app
         Logging: vela logs example-app
      App status: vela status example-app
  Service status: vela status example-app --svc hello-world-serverapplication.core.oam.dev/podinfo-app configured
  
➜   vela status example-app

...

  - Name: hello-world-server
    Cluster: us-west-1  Namespace: default
    Type: webservice
    Healthy Ready:5/5
    Traits:
      ✅ scaler      ✅ gateway: Visiting URL: testsvc-mc.example.com, IP: 192.168.40.10

```

The above all are what we'd like to share with you for this time, thank you for reading and trying them out.

[We invite you to explore KubeVela v1.3 for more](https://kubevela.io/en/docs/install) to meet further complex requirements on business, such as [dig deep](https://kubevela.io/docs/next/case-studies/multi-cluster#override-default-configurations-in-clusters) in differentiated configurations to use `override` application policy to either override all resources on one type or only certain specific components.