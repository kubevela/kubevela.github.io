---
title: Canary Release
---

Kruise Rollout provides incremental delivery capabilities for Native Deployment, Kruise CloneSet, e.g. Canary Release, Blue-green Release, A/B Testing, etc.
For more details, please refer to: [Kruise Rollout](https://github.com/openkruise/rollouts/blob/master/docs/getting_started/introduction.md).

This article focuses on how to implement Canary Release using Kruise Rollout.

## Requirements

1. Install Kruise Rollout
```shell
% vela addon enable kruise-rollout
enable addon by local dir: addons/kruise-rollout
I0531 17:23:35.526011   81152 apply.go:107] "creating object" name="kruise-rollout" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0531 17:23:35.688687   81152 apply.go:107] "creating object" name="addon-secret-kruise-rollout" resource="/v1, Kind=Secret"
⠸ Waiting addon application running. It is now in phase: runningWorkflow (timeout 0/600 seconds)...
Addon: kruise-rollout enabled Successfully.

% kubectl get pods -n kruise-rollout
NAME                                                 READY   STATUS    RESTARTS   AGE
kruise-rollout-controller-manager-696bdb76f8-2vqp8   1/1     Running   0          7m21s
kruise-rollout-controller-manager-696bdb76f8-mbplq   1/1     Running   0          7m21s
```

2. Install K8S Nginx Ingress
```shell
helm upgrade --install ingress-nginx ingress-nginx --repo https://kubernetes.github.io/ingress-nginx --namespace ingress-nginx
```

## First Deployment

The echoserver service is deployed, which contains five pods and is served externally via Nginx Ingress.

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: echoserver
spec:
  components:
  - name: echoserver
    type: webservice
    properties:
      image: cilium/echoserver:1.10.2
      ports:
      - port: 8080
      env:
      - name: PORT
        value: '8080'
    traits:
    - type: scaler
      properties:
        replicas: 5
    - type: gateway
      properties:
        domain: echoserver.example.com
        http:
          "/": 8080
    - type: kruise-rollout
      properties:
        canary:
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          trafficRoutings:
          - type: nginx
EOF
```

The first deployment of the business does not perform the Rollout process, but starts up the corresponding Deployment, Service,
and Ingress to provide echoserver services to the outside world.

```shell
% kubectl get applications
NAME         COMPONENT    TYPE         PHASE     HEALTHY   STATUS      AGE
echoserver   echoserver   webservice   running   true      Ready:5/5   8s

% kubectl get deployment
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
echoserver   5/5     5            5           130m

% kubectl get service
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
echoserver   ClusterIP   10.96.17.100   none        8080/TCP   19s

% kubectl get ingress
NAME         CLASS    HOSTS                    ADDRESS     PORTS   AGE
echoserver   none   echoserver.example.com   localhost   80      26s
```

## Canary Release
Modify echoserver image tag, from 1.10.2 to 1.10.3, as follows:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: echoserver
spec:
  components:
  - name: echoserver
    type: webservice
    properties:
      image: cilium/echoserver:1.10.3
      ports:
      - port: 8080
      env:
      - name: PORT
        value: '8080'
    traits:
      ...
EOF
```

At this point, Kruise Rollout will listen to this behavior, first pause to live Deployment's upgrade, then generate the corresponding canary resources,
by adjusting ingress configuration to achieve the effect of canary release (grayscale 20%).

```shell
% kubectl get applications
NAME         COMPONENT    TYPE         PHASE             HEALTHY   STATUS      AGE
echoserver   echoserver   webservice   runningWorkflow   false     Ready:5/5   132m

% kubectl get deployment
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
echoserver       5/5     0            5           75m
# Canary Deployment, grayscale 20% replicas
echoserver-k9k   1/1     1            1           56s

% kubectl get service
NAME                TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
echoserver          ClusterIP   10.96.17.100   none        8080/TCP   79m
# Canary Service, selector canary deployment
echoserver-canary   ClusterIP   10.96.133.63   none        8080/TCP   4m35s

% kubectl get ingress
NAME                CLASS    HOSTS                    ADDRESS     PORTS   AGE
echoserver          none   echoserver.example.com   localhost   80      76m
# Canary Ingress
echoserver-canary   none   echoserver.example.com   localhost   80      96s

% kubectl get ingress echoserver-canary -oyaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/canary: "true"
    # routing 20% traffics to canary deployment
    nginx.ingress.kubernetes.io/canary-weight: "20"
spec:
  rules:
  - host: echoserver.example.com
    http:
    paths:
    - backend:
        service:
          # canary service
          name: echoserver-canary
          port:
            number: 8080
      path: /
      pathType: ImplementationSpecific
```

## Canary validation successful, full release

After the user verifies the success of the canary version through business-related metrics, such as logs, metrics, and other means,
the full release is performed through kruise-cli. cli installation please refer to: [install kruise-cli](https://openkruise.io/docs/cli-tool/kubectl-plugin).

```shell
% kubectl get rollouts
NAME         STATUS        CANARY_STEP   CANARY_STATE   MESSAGE                                                                         AGE
echoserver   Progressing   1             StepPaused     Rollout is in step(1/1), and you need manually confirm to enter the next step   93m

% kubectl-kruise rollout approve rollout/echoserver -n default
rollout.rollouts.kruise.io/echoserver approved

# when rollout State = Complated, indicates full release completed, and currently the application is ready
% kubectl get rollouts
NAME         STATUS    CANARY_STEP   CANARY_STATE   MESSAGE                                   AGE
echoserver   Healthy   1             Completed      Rollout has been completed, and succeed   119m

% kubectl get applications
NAME         COMPONENT    TYPE         PHASE     HEALTHY   STATUS      AGE
echoserver   echoserver   webservice   running   true      Ready:5/5   120m
```

## Canary verification failed, rollback

rollback echoserver image tag, from 1.10.3 to 1.10.2, as follows:
```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: echoserver
spec:
  components:
  - name: echoserver
    type: webservice
    properties:
      image: cilium/echoserver:1.10.2
      ports:
      - port: 8080
      env:
      - name: PORT
        value: '8080'
    traits:
      ...
EOF
```

Kruise Rollout listens for the above behavior and will automatically complete the rollback operation and clean up all Canary resources, as follows:

```shell
% kubectl get rollouts
NAME         STATUS    CANARY_STEP   CANARY_STATE   MESSAGE                                                                       AGE
echoserver   Healthy   1             StepPaused     The workload has been rolled back and the rollout process will be cancelled   129m

% kubectl get applications
NAME         COMPONENT    TYPE         PHASE     HEALTHY   STATUS      AGE
echoserver   echoserver   webservice   running   true      Ready:5/5   130m
```


