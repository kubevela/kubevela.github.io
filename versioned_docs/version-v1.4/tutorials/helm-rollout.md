---
title: Canary Rollout Helm chart
---

## Before starting

1. Please make sure you have read the doc of about [deploying helm chart](./helm).

2. Make sure you have already enableld the kruise-rollout addon.
```shell
% vela addon enable kruise-rollout
Addon: kruise-rollout enabled Successfully.
```

3. Please make sure one of the [ingress controllers](https://kubernetes.github.io/ingress-nginx/deploy/) is available in your Kubernetes cluster.
   If not, you can install one in your cluster by enable the [ingress-nginx](../reference/addons/nginx-ingress-controller) addon:

```shell
vela addon enable ingress-nginx
```

Please refer [this](../reference/addons/nginx-ingress-controller) to get the gateway's access address.

**You also can choose to install [traefik](../reference/addons/traefik) addon.**

4. Please make sure the version of  Vela CLI tool `>=1.5.0-alpha.1`, some commands such as rollback rely on the new version.

### First deployment

When you want to use the canary rollout, you need to add the `kruise-rollout` trait at the first time, this configuration will take effect at next release process. Deploy the application with traits like below:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: canary-demo
  annotations:
    app.oam.dev/publishVersion: v1
spec:
  components:
  - name: canary-demo
    type: helm
    properties:
      repoType: "helm"
      url: "https://wangyikewxgm.github.io/my-charts/"
      chart: "canary-demo"
      version: "1.0.0"
    traits:
    - type: kruise-rollout
      properties:
        canary:
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          # The second batch of Canary releases 90% Pods, and 90% traffic imported to the new version.
          - weight: 90
          trafficRoutings:
          - type: nginx
EOF
```

This is a general helm chart created by `helm create` command, which contains a deployment whose image is `barnett/canarydemo:v1`, a service and an ingress. You can check the source of chart in [repo](https://github.com/wangyikewxgm/my-charts/tree/main/canary-demo).

Access the gateway endpoint. You can see the result always is `Demo: V1`
```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

### Canary Rollout

Update the target version of helm chart from `1.0.0` to `2.0.0`:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: canary-demo
  annotations:
    app.oam.dev/publishVersion: v2
spec:
  components:
  - name: canary-demo
    type: helm
    properties:
      repoType: "helm"
      url: "https://wangyikewxgm.github.io/my-charts/"
      chart: "canary-demo"
      # Upgade to version 2.0.0
      version: "2.0.0"
    traits:
    - type: kruise-rollout
      properties:
        canary:
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          # The second batch of Canary releases 90% Pods, and 90% traffic imported to the new version.
          - weight: 90
          trafficRoutings:
          - type: nginx
EOF
```

The only difference between two versions is image tag. Version `2.0.0` uses `barnett/canarydemo:v2`.

Access the gateway endpoint again. You will find out there is about 20% chance to meet `Demo: v2` result.

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

The other operations such as `continue rollout/rollback` are totally same with the operation for webservice component.


### Continue rollout process

After verify the success of the canary version through business-related metrics, such as logs, metrics, and other means, you can resume the workflow to continue the process of rollout.

```shell
vela workflow resume canary-demo
```

Access the gateway endpoint again multi times. You will find out the chance to meet result `Demo: v2` is highly increased, almost 90%.

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

### Canary validation successful, full release

In the end, you can resume again to finish the rollout process.

```shell
vela workflow resume canary-demo
```

Access the gateway endpoint again multi times. You will find out the result always is `Demo: v2`.

```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V2
```

### Canary verification failed, rollback

If you want to cancel the rollout process and rollback the application to the latest version, after manually check. You can rollback the rollout workflow:

You should suspend the workflow before rollback:
```shell
$ vela workflow suspend canary-demo
Rollout default/canary-demo in cluster  suspended.
Successfully suspend workflow: canary-demo
```

Then rollback:
```shell
$ vela workflow rollback canary-demo
Application spec rollback successfully.
Application status rollback successfully.
Rollout default/canary-demo in cluster  rollback.
Successfully rollback rolloutApplication outdated revision cleaned up.
```

Access the gateway endpoint again. You can see the result always is `Demo: V1`.
```shell
$ curl -H "Host: canary-demo.com" <ingress-controller-address>/version
Demo: V1
```

Please notice: rollback operation in middle of a runningWorkflow will rollback to latest succeed revision which is `v1` in this case.
Image a scenario, you deploy a successful `v1` and canary rollout to `v2`, but you find some error in this version, then you continue to rollout to `v3` directly. Error still exists, application is unhealthy then you decide to rollback.
When you execute rollback workload will let application rollback to version `v1`.

##Limitation

1. As you can see, the helm chart used in this tutorial contains a service point to workload, an ingress route to the service. 
If your helm chart doesn't have service or ingress that need not exposure the service, you cannot reproduce the canary rollout with this chart.
   
2. Currently, canary rollout has supported several types of workloads such as deployment, statefulset, and [open-kruise cloneset](https://openkruise.io/docs/user-manuals/cloneset/). That means the workload in your helm chart must be one of this three types.