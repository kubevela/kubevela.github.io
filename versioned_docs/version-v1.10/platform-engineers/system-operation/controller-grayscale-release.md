---
title: Controller GrayScale Release
---

:::tip
If you are using KubeVela >= v1.8.0, [controller sharding](./controller-sharding.md) is supported. If you need to run multiple version of KubeVela controllers (all have version >= v1.8.0), you can refer to controller sharding.
:::

System upgrades can always be a dangerous operation for system operators. As a control plane operator, KubeVela controller also faces similar challenges. The introduction of new features or function reconstruction could bring potential risks for running higher version controllers on low version applications.

To help system operators overcome such difficulties, KubeVela provide **controller grayscale release** mechanism which allow multiple version controllers to run concurrently. When applications are annotated with key `app.oam.dev/controller-version-require`, only the controller with matched version number will be able to handle it.

### Practical Use

Let's say you already have a controller at version `v1.9.15`. Now you want to upgrade to `v1.10.10`. To use the controller grayscale release, you can follow the below actions.

1. Deploy a new controller using the version `v1.10.10` (This can be achived by duplicate the vela-core deploy in your cluster as shown below). Add `--ignore-app-without-controller-version` to the args. This will let the controller only be able to handle applications with annotation `app.oam.dev/controller-version-require=v1.10.10`.

:::tip
To duplicate the controller, copy the installed Deployment with a new name, a new pod label, the new image and `--ignore-app-without-controller-version`. Copying keeps every flag and feature gate you installed with. This needs [yq](https://github.com/mikefarah/yq) v4:

```bash
kubectl get deploy kubevela-vela-core -n vela-system -o yaml | yq '
  .metadata.name = "kubevela-vela-core-canary" |
  del(.metadata.uid, .metadata.resourceVersion, .metadata.creationTimestamp, .metadata.generation, .metadata.annotations, .status) |
  .spec.replicas = 1 |
  .spec.selector.matchLabels."app.kubernetes.io/name" = "vela-core-canary" |
  .spec.template.metadata.labels."app.kubernetes.io/name" = "vela-core-canary" |
  .spec.template.spec.containers[0].image = "oamdev/vela-core:v1.10.10" |
  .spec.template.spec.containers[0].args += ["--ignore-app-without-controller-version"]' | kubectl apply -f -
```

The new `app.kubernetes.io/name` label keeps the canary's pods out of the main Deployment's selector and out of the webhook Service. Its leader-election lease is separate, because `--ignore-app-without-controller-version` adds the version to the lease name.
:::

2. After setting up two controllers, you could check it out through CLI commands like 
```
kubectl get deployment -n vela-system -owide
```
```
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE    CONTAINERS                           IMAGES                                  SELECTOR
kubevela-cluster-gateway    1/1     1            1           4d2h   kubevela-vela-core-cluster-gateway   oamdev/cluster-gateway:v1.9.2           app.kubernetes.io/instance=kubevela-cluster-gateway,app.kubernetes.io/name=vela-core-cluster-gateway
kubevela-vela-core          1/1     1            1           4d2h   kubevela                             oamdev/vela-core:v1.9.15                app.kubernetes.io/instance=kubevela,app.kubernetes.io/name=vela-core
kubevela-vela-core-canary   1/1     1            1           63m    kubevela                             oamdev/vela-core:v1.10.10          app.kubernetes.io/instance=kubevela,app.kubernetes.io/name=vela-core-canary
```

3. Choose one application and add annotation `app.oam.dev/controller-version-require: v1.10.10` to it. The application now will be handled by the new controller.

:::tip
You can also deploy new applications with the annotation mentioned above, like
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test
  annotations:
    app.oam.dev/controller-version-require: v1.10.10
spec:
  components:
  - type: webservice
    name: test
    properties:
      image: nginx
```
:::

4. If you view the logs in the controller, you will find out the old controller contains logs like follows. This means the old controller skips the control loop of the target app. If you look into the logs of the new controller, you will find out that the target app is being handled there.
```
I0110 10:12:30.034066       1 application_controller.go:128] "skip app: not match the controller requirement of app" application="default/test" controller="application" spanID="i-p8enedq6"
```

5. After you have confirmed the target application works as expected, you can add the annotation to more applications and let more ones to be handled by the new controller.

6. Finally, after all applications have been handled by the new controller, you can make upgrades to the original controller like using `helm upgrade` or `vela install`. Then you can remove the canary deployment and let the upgraded controller to handle all applications normally.

During this procedure, if any unexpected error happens, you can stop the canary controller by scale its replicas to 0. This won't affect the applications that are still handled by the old version controller.

:::caution
Notice that there are some limitations for the grayscale release of controller.
1. The CRD cannot be grayscale released. If different version controllers rely on various CRDs, this solution might not work properly.
2. Although during the upgrade process, each controller only handles part of the applications, they will still use all the resources required to handle applications. This means in the process, the memory resource consumption will be doubled if you have two controllers running concurrently.
:::