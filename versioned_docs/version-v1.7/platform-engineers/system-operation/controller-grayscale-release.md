---
title: Controller GrayScale Release
---

System upgrades can always be a dangerous operation for system operators. As a control plane operator, KubeVela controller also faces similar challenges. The introduction of new features or function reconstruction could bring potential risks for running higher version controllers on low version applications.

To help system operators overcome such difficulties, KubeVela provide **controller grayscale release** mechanism which allow multiple version controllers to run concurrently. When applications are annotated with key `app.oam.dev/controller-version-require`, only the controller with matched version number will be able to handle it.

### Practical Use

Let's say you already have a controller at version `v1.6.4`. Now you want to upgrade to `v1.7.0-beta.1`. To use the controller grayscale release, you can follow the below actions.

1. Deploy a new controller using the version `v1.7.0-beta.1` (This can be achived by duplicate the vela-core deploy in your cluster as shown below). Add `--ignore-app-without-controller-version` to the args. This will let the controller only be able to handle applications with annotation `app.oam.dev/controller-version-require=v1.7.0-beta.1`.

:::tip
To duplicate the deploy of your controller, you can apply a deployment like the follow YAML (if you enable specific feature flags like AuthenticateApplication, it is recommended to copy your existing deployment configuration and modify the name & image field)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubevela-vela-core-canary
  namespace: vela-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/instance: kubevela
      app.kubernetes.io/name: vela-core-canary
  template:
    metadata:
      annotations:
        prometheus.io/path: /metrics
        prometheus.io/port: "8080"
        prometheus.io/scrape: "true"
      labels:
        app.kubernetes.io/instance: kubevela
        app.kubernetes.io/name: vela-core-canary
    spec:
      containers:
      - args:
        - --ignore-app-without-controller-version
        - --metrics-addr=:8080
        - --enable-leader-election
        - --use-webhook=true
        - --webhook-port=9443
        - --webhook-cert-dir=/etc/k8s-webhook-certs
        - --optimize-mark-with-prob=0.1
        - --optimize-disable-component-revision
        - --health-addr=:9440
        - --disable-caps=rollout
        - --system-definition-namespace=vela-system
        - --application-revision-limit=2
        - --definition-revision-limit=2
        - --oam-spec-ver=v0.3
        - --enable-cluster-gateway
        - --application-re-sync-period=5m
        - --concurrent-reconciles=4
        - --kube-api-qps=100
        - --kube-api-burst=200
        - --max-workflow-wait-backoff-time=60
        - --max-workflow-failed-backoff-time=300
        - --max-workflow-step-error-retry-times=10
        image: oamdev/vela-core:v1.7.0-beta.1
        imagePullPolicy: Always
        name: kubevela
        ports:
        - containerPort: 9443
          name: webhook-server
          protocol: TCP
        - containerPort: 9440
          name: healthz
          protocol: TCP
        readinessProbe:
          failureThreshold: 3
          httpGet:
            path: /readyz
            port: healthz
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 5
          successThreshold: 1
          timeoutSeconds: 1
        resources:
          limits:
            cpu: 500m
            memory: 1Gi
          requests:
            cpu: 50m
            memory: 20Mi
        volumeMounts:
        - mountPath: /etc/k8s-webhook-certs
          name: tls-cert-vol
          readOnly: true
      serviceAccount: kubevela-vela-core
      serviceAccountName: kubevela-vela-core
      volumes:
      - name: tls-cert-vol
        secret:
          defaultMode: 420
          secretName: kubevela-vela-core-admission
```
:::

2. After setting up two controllers, you could check it out through CLI commands like 
```
kubectl get deployment -n vela-system -owide
```
```
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE    CONTAINERS                           IMAGES                                  SELECTOR
kubevela-cluster-gateway    1/1     1            1           4d2h   kubevela-vela-core-cluster-gateway   oamdev/cluster-gateway:v1.7.0-alpha.3   app.kubernetes.io/instance=kubevela-cluster-gateway,app.kubernetes.io/name=vela-core-cluster-gateway
kubevela-vela-core          1/1     1            1           4d2h   kubevela                             oamdev/vela-core:v1.6.4                 app.kubernetes.io/instance=kubevela,app.kubernetes.io/name=vela-core
kubevela-vela-core-canary   1/1     1            1           63m    kubevela                             oamdev/vela-core:v1.7.0-beta.1          app.kubernetes.io/instance=kubevela,app.kubernetes.io/name=vela-core-canary
```

3. Choose one application and add annotation `app.oam.dev/controller-version-require: v1.7.0-beta.1` to it. The application now will be handled by the new controller.

:::tip
You can also deploy new applications with the annotation mentioned above, like
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test
  annotations:
    app.oam.dev/controller-version-require: v1.7.0-beta.1
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