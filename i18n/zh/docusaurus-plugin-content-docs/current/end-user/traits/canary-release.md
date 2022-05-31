---
title: Canary Release
---

Kruise Rollout对原生Deployment、Kruise CloneSet提供渐进式交付的能力，例如：金丝雀发布、蓝绿发布、A/B Testing等，更多详情请参考：[Kruise Rollout](https://github.com/openkruise/rollouts/blob/master/docs/getting_started/introduction.md)。

本文主要介绍如何使用Kruise Rollout实现金丝雀发布。

## 准备工作

1. 安装Kruise Rollout
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

2. 安装 K8S Nginx Ingress
```shell
helm upgrade --install ingress-nginx ingress-nginx --repo https://kubernetes.github.io/ingress-nginx --namespace ingress-nginx
```

## 首次部署
如下部署了echoserver服务，它共包含5个pods，并且通过 Nginx Ingress 对外提供服务。

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
          # 第一批金丝雀发布 20% Pods，以及 20% 流量导入到新版本，需要人工确认后，才会完成后续的发布任务
          steps:
          - weight: 20
          trafficRoutings:
          - type: nginx
EOF
```

业务第一次部署并不执行 Rollout 过程，而是将对应的 Deployment、Service、Ingress 拉起，对外提供 echoserver 服务。

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

## 金丝雀发布
修改echoserver镜像版本，从 1.10.2 -> 1.10.3，如下：

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

此时，Kruise Rollout会监听到这种行为，首先会pause住Deployment的升级，然后生成对应的 canary 资源，通过调整 ingress 配置实现金丝雀发布的效果（灰度20%）。

```shell
% kubectl get applications
NAME         COMPONENT    TYPE         PHASE             HEALTHY   STATUS      AGE
echoserver   echoserver   webservice   runningWorkflow   false     Ready:5/5   132m

% kubectl get deployment
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
echoserver       5/5     0            5           75m
# Canary Deployment，灰度 20% replicas
echoserver-k9k   1/1     1            1           56s

% kubectl get service
NAME                TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
echoserver          ClusterIP   10.96.17.100   none        8080/TCP   79m
# Canary Service，指向 canary deployment
echoserver-canary   ClusterIP   10.96.133.63   none        8080/TCP   4m35s

% kubectl get ingress
NAME                CLASS    HOSTS                    ADDRESS     PORTS   AGE
echoserver          none   echoserver.example.com   localhost   80      76m
# Canary Ingress，用于流量灰度
echoserver-canary   none   echoserver.example.com   localhost   80      96s

% kubectl get ingress echoserver-canary -oyaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/canary: "true"
    # 灰度 20% 流量到 canary 版本
    nginx.ingress.kubernetes.io/canary-weight: "20"
spec:
  rules:
  - host: echoserver.example.com
    http:
    paths:
    - backend:
        service:
          # 指向 canary service
          name: echoserver-canary
          port:
            number: 8080
      path: /
      pathType: ImplementationSpecific
```

## 金丝雀验证OK，全量发布

用户通过业务的相关指标，如：日志、Metrics等其它手段，验证金丝雀版本OK之后，通过kruise cli进行全量发布。cli安装请参考[install kruise cli](https://openkruise.io/docs/cli-tool/kubectl-plugin)。

```shell
% kubectl get rollouts
NAME         STATUS        CANARY_STEP   CANARY_STATE   MESSAGE                                                                         AGE
echoserver   Progressing   1             StepPaused     Rollout is in step(1/1), and you need manually confirm to enter the next step   93m

% kubectl-kruise rollout approve rollout/echoserver -n default
rollout.rollouts.kruise.io/echoserver approved

# 当 rollout 状态为Complated时，表明全量发布完成，此时可以查看 application 资源已经ready
% kubectl get rollouts
NAME         STATUS    CANARY_STEP   CANARY_STATE   MESSAGE                                   AGE
echoserver   Healthy   1             Completed      Rollout has been completed, and succeed   119m

% kubectl get applications
NAME         COMPONENT    TYPE         PHASE     HEALTHY   STATUS      AGE
echoserver   echoserver   webservice   running   true      Ready:5/5   120m
```

## 金丝雀验证失败，回滚

回滚echoserver镜像版本，从 1.10.3 -> 1.10.2，如下：
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

Kruise Rollout监控到上述行为，将会自动完成回滚操作，并清理所有的 Canary 资源，如下：

```shell
% kubectl get rollouts
NAME         STATUS    CANARY_STEP   CANARY_STATE   MESSAGE                                                                       AGE
echoserver   Healthy   1             StepPaused     The workload has been rolled back and the rollout process will be cancelled   129m

% kubectl get applications
NAME         COMPONENT    TYPE         PHASE     HEALTHY   STATUS      AGE
echoserver   echoserver   webservice   running   true      Ready:5/5   130m
```


