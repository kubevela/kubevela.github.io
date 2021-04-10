---
title: 多集群应用部署
---

## 简介

为确保高可用并最大化服务吞吐量，现代应用基础设施会涉及多个群集。在本部分中，我们将介绍如何使用KubeVela在支持以下功能的情况下实现跨多个集群应用程序部署：

- Rolling Upgrade：为满足持续部署应用的要求，需要以安全的方式进行rollout，这通常涉及分步进行批量部署和分析
- Traffic shifting：滚动升级应用时，它需要将流量分为旧revision和新revision，以达成验证新版本，同时保留服务可用的目的。

## AppDeployment CRD

`AppDeployment` CRD 是被设计用来满足上述需求的。下面是API的简单介绍:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: AppDeployment
metadata:
  name: sample-appdeploy
spec:
  traffic:
    hosts:
      - example.com

    http:
      - match:
          # match any requests to 'example.com/example-app'
          - uri:
              prefix: "/example-app"

        # split traffic 50/50 on v1/v2 versions of the app
        weightedTargets:
          - revisionName: example-app-v1
            componentName: testsvc
            port: 80
            weight: 50
          - revisionName: example-app-v2
            componentName: testsvc
            port: 80
            weight: 50

  appRevisions:
    - # Name of the AppRevision.
      # Each modification to Application would generate a new AppRevision.
      revisionName: example-app-v1

      # Cluster specific workload placement config
      placement:
        - clusterSelector:
            # You can select Clusters by name or labels.
            # If multiple clusters is selected, one will be picked via a unique hashing algorithm.
            labels:
              tier: production
            name: prod-cluster-1

          distribution:
            replicas: 5

        - # If no clusterSelector is given, it will use the host cluster in which this CR exists
          distribution:
            replicas: 5

    - revisionName: example-app-v2
      placement:
        - clusterSelector:
            labels:
              tier: production
            name: prod-cluster-1
          distribution:
            replicas: 5
        - distribution:
            replicas: 5
```

## Cluster CRD

在上述示例里，`placement`部分中被选择的群集是在群集CRD中被定义的。如下所示：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Cluster
metadata:
  name: prod-cluster-1
  labels:
    tier: production
spec:
  kubeconfigSecretRef:
    name: kubeconfig-cluster-1 # the secret name
```

secret必须在`config`字段中包含kubeconfig credentials：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: kubeconfig-cluster-1
data:
  config: ... # kubeconfig data
```

## 快速开始

下面是一个您可以自己动手尝试的示例。 所有的yaml文件都在 [`docs/examples/appdeployment/`](https://github.com/oam-dev/kubevela/tree/master/docs/examples/appdeployment)中。
您必须运行那个目录下所有的command。

1. 创建应用

   ```bash
   $ cat <<EOF | kubectl apply -f -
   apiVersion: core.oam.dev/v1beta1
   kind: Application
   metadata:
     name: example-app
     annotations:
       app.oam.dev/revision-only: "true"
   spec:
     components:
       - name: testsvc
         type: webservice
         properties:
           addRevisionLabel: true
           image: crccheck/hello-world
           port: 8000
   EOF
   ```

   这会创建 `example-app-v1` AppRevision. 查看一下：

   ```bash
   $ kubectl get applicationrevisions.core.oam.dev
   NAME             AGE
   example-app-v1   116s
   ```

   > 注意: 通过 `app.oam.dev/revision-only: "true"` 注释, 上面的 `Application` 资源不会创建任何pod实例并会把真正的部署进程留给`AppDeployment`。

2. 之后使用上面的AppRevision来创建AppDeployment。

   ```bash
   $ kubectl apply -f appdeployment-1.yaml
   ```

   > 注意: 为了使AppDeployment能正常工作，您的工作负载对象必须有一个`spec.replicas`字段以进行扩展。

3. 现在您可以查看到有1个deployment和2个pod示例已经被部署了。

   ```bash
   $ kubectl get deploy
   NAME         READY   UP-TO-DATE   AVAILABLE   AGE
   testsvc-v1   2/2     2            0           27s
   ```

4. 更新应用特性:

   ```bash
   $ cat <<EOF | kubectl apply -f -
   apiVersion: core.oam.dev/v1beta1
   kind: Application
   metadata:
     name: example-app
     annotations:
       app.oam.dev/revision-only: "true"
   spec:
     components:
       - name: testsvc
         type: webservice
         properties:
           addRevisionLabel: true
           image: nginx
           port: 80
   EOF
   ```

   这会创建一个新的 `example-app-v2` AppRevision。看一下:

   ```bash
   $ kubectl get applicationrevisions.core.oam.dev
   NAME
   example-app-v1
   example-app-v2
   ```

5. 之后用两个AppRevisions来更新AppDeployment:

   ```bash
   $ kubectl apply -f appdeployment-2.yaml
   ```

   （可选）如果您已安装Istio，您可以将AppDeployment与traffic split一起应用:

   ```bash
   # set up gateway if not yet
   $ kubectl apply -f gateway.yaml

   $ kubectl apply -f appdeployment-2-traffic.yaml
   ```

   注意：为了使traffic split能正常工作，您必须在工作负载的cue templates中设置下面所示的pod label(详见 [webservice.cue](https://github.com/oam-dev/kubevela/blob/master/hack/vela-templates/cue/webservice.cue)):

   ```shell
   "app.oam.dev/component": context.name
   "app.oam.dev/appRevision": context.appRevision
   ```

6. 现在你可以查看到每一个revision有一个deployment和一个pod。

   ```bash
   $ kubectl get deploy
   NAME         READY   UP-TO-DATE   AVAILABLE   AGE
   testsvc-v1   1/1     1            1           2m14s
   testsvc-v2   1/1     1            1           8s
   ```

   （可选）来验证下traffic split:

   ```bash
   # run this in another terminal
   $ kubectl -n istio-system port-forward service/istio-ingressgateway 8080:80
   Forwarding from 127.0.0.1:8080 -> 8080
   Forwarding from [::1]:8080 -> 8080

   # The command should return pages of either docker whale or nginx in 50/50
   $ curl -H "Host: example-app.example.com" http://localhost:8080/
   ```

7. Cleanup:

   ```bash
   kubectl delete appdeployments.core.oam.dev  --all
   kubectl delete applications.core.oam.dev --all
   ```
