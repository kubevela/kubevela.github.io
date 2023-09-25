---
title: "Unified Application Management under Cloud-Edge Collaboration: A Solution Based on OpenYurt and KubeVela"
author: Qiao Zhongpei
author_title: KubeVela team
author_url: https://github.com/chivalryq
author_image_url: https://avatars.githubusercontent.com/u/47812250?v=4
tags: [ KubeVela, OpenYurt, edge, "use-case" ]
description: "This article will focus on KubeVela and OpenYurt (two open-source projects of CNCF) and introduce the solution of cloud-edge collaboration in a practical Helm application delivery scenario."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

This article will focus on KubeVela and OpenYurt (two open-source projects of CNCF) and introduce the solution of cloud-edge collaboration in a practical Helm application delivery scenario.

## Background

With the popularization of the Internet of Everything scenario, the computing power of edge devices is increasing. It is a new technological challenge to use the advantages of cloud computing to meet complex and diversified edge application scenarios and extend cloud-native technology to the end and edge. **Cloud-Edge Collaboration** is becoming a new technological focus. This article will focus on KubeVela and OpenYurt (two open-source projects of CNCF) and introduce the solution of cloud-edge collaboration in a practical Helm application delivery scenario.

OpenYurt focuses on extending Kubernetes to edge computing in a non-intrusive manner. Based on the container orchestration and scheduling capabilities of native Kubernetes, OpenYurt integrates edge computing power into the Kubernetes infrastructure for unified management. It provides capabilities (such as edge autonomy, efficient O&M channels, unitized edge management, edge traffic topology, secure containers, and edge Serverless/FaaS) and support for heterogeneous resources. In short, OpenYurt builds a unified infrastructure for cloud-edge collaboration in a Kubernetes-native manner.

Incubated in the OAM model, KubeVela focuses on helping enterprises build unified application delivery and management capabilities. It shields the complexity of underlying infrastructure for developers and provides flexible scaling capabilities. It also provides out-of-the-box microservice container management, cloud resource management, versioning and canary release, scaling, observability, resource dependency orchestration and data delivery, multi-cluster, CI docking, and GitOps. Maximize the R&D performance of developer self-service application management, which also meets the extensibility demands of the long-term evolution of the platform.

## OpenYurt + KubeVela - What Problems Can be Solved?

As mentioned before, OpenYurt supports the access of edge nodes, allowing users to manage edge nodes by operating native Kubernetes. "Edge nodes" are used to represent computing resources closer to users (such as virtual machines or physical servers in a nearby data center). After you add them through OpenYurt, these edge nodes are converted into nodes that can be used in Kubernetes. OpenYurt uses NodePool to describe a group of edge nodes in the same region. After basic resource management is met, we have the following core requirements for how to orchestrate and deploy applications to different NodePools in a cluster.

<!--truncate-->

1. **Unified Configuration:** If you manually modify each resource to be distributed, there are many manual interventions, which are prone to errors. We need a unified way to configure parameters, which can not only facilitate batch management operations, but also connect security and audit to meet enterprise risk control and compliance requirements.
2. **Differential Deployment:** Most workloads deployed to different NodePools have the same attributes, but there are still personalized configuration differences. The key is how to set the parameters related to node selection. For example, `NodeSelector` can instruct the Kubernetes scheduler to schedule workloads to different NodePools.
3. **Scalability:** The cloud-native ecosystem is booming. Both workload types and different O&M functions are growing. We need the overall application architecture to be scalable so that we can fully benefit from the dividends of the cloud-native ecosystem and meet business needs flexibly.

KubeVela and OpenYurt can complement each other at the application layer to meet the preceding three core requirements. Next, I will show these functions with the operation process.

## Deploy an Application to the Edge

We will use the Ingress controller as an example to show how to use KubeVela to deploy applications to the edge. We want to deploy the Nginx Ingress controller to multiple NodePools to access the services provided by the specified NodePool through the edge Ingress. An Ingress can only be handled by the Ingress controller in the NodePool.

The cluster in the schematic diagram contains two NodePools: Beijing and Shanghai. The networks between them are not interconnected. We want to deploy an Nginx Ingress Controller, which can act as the network traffic ingress for each NodePool. A client close to Beijing can access the services provided in the Beijing NodePool by accessing the Ingress Controller of the Beijing NodePool and does not access the services provided in the Shanghai NodePool.

![NodePool Structure](/img/blog/yurt/nodepool.png)

### Basic Environment of Demo

We will use Kubernetes clusters to simulate edge scenarios. The cluster has three nodes, and their roles are:

- **Node 1:** master node, cloud node
- **Node 2:** worker node, edge node, in NodePool `Beijing`
- **Node 3:** worker node, edge node, in NodePool `Shanghai`


### Preparations

#### 1. Install YurtAppManager

YurtAppManager is the core component of OpenYurt. It provides NodePool CRD and controller. There are other components in OpenYurt, but we only need YurtAppManager in this tutorial.

```shell
git clone https://github.com/openyurtio/yurt-app-managercd yurt-app-manager && helm install yurt-app-manager -n kube-system ./charts/yurt-app-manager/
```
#### 2. Install KubeVela and Enable the FluxCD Addon

Install the Vela command-line tool and install KubeVela in the cluster:

```shell
curl -fsSl https://kubevela.io/script/install.sh | bash
vela install
```
We want to reuse the mature Helm charts provided by the community, so we use Helm-type components to install the Nginx Ingress Controller. In KubeVela with microkernel design, Helm components are provided by the FluxCD addon. The following enables the [FluxCD addon](https://kubevela.net/zh/docs/reference/addons/fluxcd).
```shell
vela addon enable fluxcd
```

#### 3. Prepare NodePool

Create two NodePools: Beijing and Shanghai. Dividing NodePools by region is a common pattern in actual edge scenarios. Different groups of nodes often have obvious isolation attributes (such as network disconnection, no resource sharing, resource heterogeneity, and application independence). This is the origin of the NodePool concept. In OpenYurt, features (such as NodePools and service topologies) are used to help users deal with the preceding issues. In today's example, we will use NodePools to describe and manage nodes:

```shell
kubectl apply -f - <<EOF
apiVersion: apps.openyurt.io/v1beta1
kind: NodePool
metadata:
  name: beijing
spec:
  type: Edge
  annotations:
    apps.openyurt.io/example: test-beijing
  taints:
    - key: apps.openyurt.io/example
      value: beijing
      effect: NoSchedule
---
apiVersion: apps.openyurt.io/v1beta1
kind: NodePool
metadata:
  name: shanghai
spec:
  type: Edge
  annotations:
    apps.openyurt.io/example: test-shanghai
  taints:
    - key: apps.openyurt.io/example
      value: shanghai
      effect: NoSchedule
EOF
```
Add edge nodes to their respective NodePools. Please see how OpenYurt nodes are added for more information about how edge nodes are added.

```shell
kubectl label node <node1> apps.openyurt.io/desired-nodepool=Beijing
kubectl label node <node2> apps.openyurt.io/desired-nodepool=shanghai
```
```shell
kubectl get nodepool
```
Expected Output

```shell
NAME       TYPE   READYNODES   NOTREADYNODES   AGE
beijing    Edge   1            0               6m2s
shanghai   Edge   1            0               6m1s
```

### Deploy Edge Applications in Batches

Before we get into the details, let's look at how KubeVela describes and deploys applications to the edge. With the following application, we can deploy multiple Nginx Ingress Controller to their respective edge NodePools. Using the same application to **uniformly configure** the Nginx Ingress can **eliminate duplication and reduce the management burden. It facilitates unified operations (such as the release and other O&M of components in the cluster).**

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: edge-ingress
spec:
  components:
    - name: ingress-nginx
      type: helm
      properties:
        chart: ingress-nginx
        url: https://kubernetes.github.io/ingress-nginx
        repoType: helm
        version: 4.3.0
        values:
          controller:
            service:
              type: NodePort
            admissionWebhooks:
              enabled: false
      traits:
        - type: edge-nginx
  policies:
    - name: replication
      type: replication
      properties:
        selector: [ "ingress-nginx" ]
        keys: [ "beijing","shanghai" ]
  workflow:
    steps:
      - name: deploy
        type: deploy
        properties:
          policies: ["replication"]
```
A KubeVela application has three parts.

1. **`Helm` Type Component:** It describes the version of the Helm package that we want to install into the cluster. In addition, we have attached an trait to this component: `edge-nginx`. We'll show the details of this trait later. You can regard it as a patch that contains the properties of different NodePools.
2. **The Strategy of `Replication`:** It describes how to copy components to different NodePools. The field `selector` is used to select the components to be copied. Its `keys` field will convert one component to two components with different keys ("Beijing" and "Shanghai").
3. **`Deploy` Workflow Steps:** It describes how to deploy an application. It specifies the `replication` strategy to perform replication work.

:::note
1.	If you want this application to work properly, please apply the `edge-ingress` trait described below in the cluster first.
2.	`Deploy` is a KubeVela built-in workflow step. It can be also used with `override` and `topology` strategies in [multi-cluster scenarios](https://kubevela.net/docs/case-studies/multi-cluster).
:::
 
Now, we can send the application to the cluster.

```shell
vela up -f app.yaml
```
Check the application status and resources created by KubeVela.
```
vela status edge-ingress --tree --detail
```

Expected Output

```shell
CLUSTER       NAMESPACE     RESOURCE                           STATUS    APPLY_TIME          DETAIL
local  ─── default─┬─ HelmRelease/ingress-nginx-beijing  updated   2022-11-02 12:00:24 Ready: True  Status: Release reconciliation succeeded  Age: 153m
                   ├─ HelmRelease/ingress-nginx-shanghai updated   2022-11-02 12:00:24 Ready: True  Status: Release reconciliation succeeded  Age: 153m
                   └─ HelmRepository/ingress-nginx       updated   2022-11-02 12:00:24 URL: https://kubernetes.github.io/ingress-nginx  Age: 153m
                                                                                         Ready: True
                                                                                         Status: stored artifact for revision '7bce426c58aee962d479ca84e5c
                                                                                         fc6931c19c8995e31638668cb958d4a3486c2'
```
Vela CLI can stand on a higher level to uniformly show the health status of applications. When it's needed, Vela CLI can help you penetrate applications and direct access to the underlying workloads. Also, it offers a rich selection of observability and Debug capability. For example, you can print the application's log through `vela logs`. You can forward the port that deploys applications locally through `vela port-forward`. You can use the `vela exec` command to go deep into the container at the edge and run Shell commands to troubleshoot the problem.

If you need an intuitive understanding of the application, KubeVela officials provide a Web console addon, VelaUX. You can view detailed resource topologies with the [VelaUX addon](https://kubevela.net/zh/docs/reference/addons/velaux) .

```shell
vela addon enable velaux
```
Visit the Resource Topology page of VelaUX:

![Resource Topology in VelaUX](/img/blog/yurt/velaux.png)

As you can see, KubeVela creates two `HelmRelease` to deliver the Nginx Ingress Controller Helm chart to two NodePools. `HelmRelease` resources are processed by the preceding FluxCD addon, and NGINX Ingress is installed in the **two NodePools** of the cluster. Run the following command to check whether pods of the Ingress controller are created in the Beijing NodePool. The same is true for the shanghai NodePool.

```shell
$ kubectl get node -l  apps.openyurt.io/nodepool=beijing                               
NAME                      STATUS   ROLES    AGE   VERSION
iz0xi0r2pe51he3z8pz1ekz   Ready    <none>   23h   v1.24.7+k3s1

$ kubectl get pod ingress-nginx-beijing-controller-c4c7cbf64-xthlp -oyaml|grep iz0xi0r2pe51he3z8pz1ekz
  nodeName: iz0xi0r2pe51he3z8pz1ekz
```

### Differentiated Deployment

*How can a differentiated deployment of the same component be implemented during KubeVela application delivery?* Let's continue to learn about the Trait and Policy that support the application. As mentioned above, we use KubeVela's built-in component replication policy in the workflow to attach a custom `edge-nginx` trait to ingress-nginx components.

- The component splitting policy **splits the component into two components** with a different `context.replicaKey`.
- `edge-nginx` Trait uses different `context.replicaKey` to deliver Helm charts with different configuration values to the cluster. Let the two Nginx Ingress Controller run in different NodePools and monitor Ingress resources with different ingressClasses. Patch the values of the Helm chart and modify the fields related to **Node Selection, Affinity, and ingressClass**.
- Different [patch strategies](https://kubevela.io/docs/platform-engineers/traits/patch-trait#patch-strategy) is used when patching different fields. For example, a `retainKeys` strategy can overwrite the original value, while a `jsonMergePatch` strategy is merged with the original value.


```json
"edge-nginx": {
  type: "trait"
  annotations: {}
  attributes: {
    podDisruptive: true
    appliesToWorkloads: ["helm"]
  }
}
template: {
  patch: {
    // +patchStrategy=retainKeys
    metadata: {
      name: "\(context.name)-\(context.replicaKey)"
    }
    // +patchStrategy=jsonMergePatch
    spec: values: {
      ingressClassByName: true
      controller: {
        ingressClassResource: {
          name:            "nginx-" + context.replicaKey
          controllerValue: "openyurt.io/" + context.replicaKey
        }
        _selector
      }
      defaultBackend: {
        _selector
      }
    }
  }
  _selector: {
    tolerations: [
      {
        key:      "apps.openyurt.io/example"
        operator: "Equal"
        value:    context.replicaKey
      },
    ]
    nodeSelector: {
      "apps.openyurt.io/nodepool": context.replicaKey
    }
  }
  parameter: null
}
```

### Let More Types of Applications Go to the Edge

As you can see, we only customize a trait with more than 40 rows and make full use of the built-in capabilities of KubeVela to deploy Nginx Ingress to different NodePools. **More applications** are likely to be deployed at the edge with the prosperous cloud-native ecosystem and cloud-edge collaboration trend. When a new application needs to be deployed in the edge NodePool in the new scenario, there is no need to worry. KubeVela makes it easy to expand a new edge application deployment trait following this pattern **without writing code**.

For example, we hope to deploy the implementation of the Kubernetes community's recent evolution hotspot [Gateway API](https://gateway-api.sigs.k8s.io/) to the edge as well. We can use the Gateway API to enhance the expressive capability and extensibility of the edge NodePool to expose services and use role-based network APIs on edge nodes. For this scenario, we can easily complete the deployment task based on the preceding extension method. You only need to define a new trait (as shown below):

```json
"gateway-nginx": {
  type: "trait"
  annotations: {}
  attributes: {
    podDisruptive: true
    appliesToWorkloads: ["helm"]
  }
}

template: {
  patch: {
    // +patchStrategy=retainKeys
    metadata: {
      name: "\(context.name)-\(context.replicaKey)"
    }
    // +patchStrategy=jsonMergePatch
    spec: values: {
      _selector
      fullnameOverride: "nginx-gateway-nginx-" + context.replicaKey
      gatewayClass: {
        name:           "nginx" + context.replicaKey
        controllerName: "k8s-gateway-nginx.nginx.org/nginx-gateway-nginx-controller-" + context.replicaKey
      }
    }
  }
  _selector: {
    tolerations: [
      {
        key:      "apps.openyurt.io/example"
        operator: "Equal"
        value:    context.replicaKey
      },
    ]
    nodeSelector: {
      "apps.openyurt.io/nodepool": context.replicaKey
    }
  }
  parameter: null
}
```

This Trait is similar to the one used to deploy the Nginx Ingress mentioned earlier. We also made some similar patch for Nginx Gateway chart values, including node selection, affinity, and resource name. The difference between the former trait is that this Trait specifies the gatewayClass instead of the IngressClass. Please see the GitHub [repository](https://github.com/chivalryq/yurt-vela-example/tree/main/gateway-nginx) for more information about the trait and application files. We extend the ability of the cluster to deploy a new application to the edge by customizing such a Trait.
If we cannot predict application deployment requirements brought about by the development of edge computing in the future, at least we can adapt to new scenarios through this scalability way.

## How KubeVela Solves Edge Deployment Puzzles


Let's review how KubeVela addressed the key issues raised at the beginning of the article.

1. **Unified Configuration:**:A component is used to describe the common properties of the ingress-nginx Helm chart to be deployed (such as Helm repository, chart name, version, and other unified configurations).
2. **Attribute Differences:** KubeVela uses a user-defined trait that describes the differences in Helm configurations sent to different NodePools. This trait can be repeatedly used to deploy the same Helm Chart.
3. **Scalability:** KubeVela can be programmable for common workloads (such as Deployment/StatefulSet) or other packaging methods (such as Helm or Kustomize). It requires only a few lines of code to push a new application to the edge.

It benefits from the powerful functions provided by KubeVela in the application delivery and management field. In addition to solving application definition, delivery, O&M, and observability issues within a single cluster, KubeVela natively supports application release and management in the **multi-cluster mode**. Currently, the Kubernetes deployment mode suitable for edge computing scenarios is not fixed. KubeVela can manage application tasks regardless of the architecture of single cluster + edge NodePool or multi-edge cluster architecture.

With OpenYurt and KubeVela, cloud-edge applications are deployed in a unified manner and share the same abstraction, O&M, and observability, which avoids the experience of being separated in different scenarios. In addition, cloud applications and edge applications can take advantage of KubeVela's excellent practices of a continuously integrated cloud-native ecosystem in the form of addons. In the future, the KubeVela community will continue to enrich out-of-the-box system addons and deliver better and easier-to-use application delivery and management capabilities.

If you want to know more about the capabilities of application deployment and management, you can read KubeVela’s [official documents](https://kubevela.io). If you want to know the latest development in the KubeVela [community](https://github.com/kubevela/community), you are welcome to participate in the discussion! If you are interested in OpenYurt, you are welcome to join the OpenYurt community!

You can learn more about KubeVela and the OAM project through the following materials:


- Project Code Base: https://github.com/oam-dev/kubevela Welcome Star/Watch/Fork!
- Project Official Homepage and Documents: kubevela.io