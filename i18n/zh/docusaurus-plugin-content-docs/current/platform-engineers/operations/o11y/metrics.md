---
title: 指标
---

## 采集应用指标

在你的应用中，如果你想要将应用内组件（如 webservice）的指标暴露给 Prometheus，从而被指标采集器采集，你只需要为其添加 `prometheus-scrape` 运维特征。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
spec:
  components:
    - name: my-app
      type: webservice
      properties:
        image: somefive/prometheus-client-example:new
      traits:
        - type: prometheus-scrape
```

你也可以显式指定指标的端口和路径。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
spec:
  components:
    - name: my-app
      type: webservice
      properties:
        image: somefive/prometheus-client-example:new
      traits:
        - type: prometheus-scrape
          properties:
            port: 8080
            path: /metrics
```

上述配置将会帮助你让 Prometheus 采集到应用组件的指标。如果你想要在 Grafana 上看到这些指标，你需要在 Grafana 上创建相应的监控大盘。详见 [监控大盘](./dashboard) 章节来了解后续步骤。

## 自定义 Prometheus 配置

如果你想自定义安装 prometheus-server ，你可以把配置放到一个单独的 ConfigMap 中，比如在命名空间 o11y-system 中的 `my-prom`。 要将你的自定义配置分发到所有集群，你还可以使用 KubeVela Application 来完成这项工作。

### 记录规则

例如，如果你想在所有集群中的所有 prometheus 服务配置中添加一些记录规则，你可以首先创建一个 Application 来分发你的记录规则，如下所示。

```yaml
# my-prom.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-prom
  namespace: o11y-system
spec:
  components:
    - type: k8s-objects
      name: my-prom
      properties:
        objects:
          - apiVersion: v1
            kind: ConfigMap
            metadata:
              name: my-prom
              namespace: o11y-system
            data:
              my-recording-rules.yml: |
                groups:
                - name: example
                  rules:
                  - record: apiserver:requests:rate5m
                    expr: sum(rate(apiserver_request_total{job="kubernetes-nodes"}[5m]))
  policies:
    - type: topology
      name: topology
      properties:
        clusterLabelSelector: {}
```

然后你需要在 prometheus-server 插件的启用过程中添加 `customConfig` 参数，比如：

```shell
vela addon enable prometheus-server thanos=true serviceType=LoadBalancer storage=1G customConfig=my-prom
```

然后你将看到记录规则配置被分发到到所有 prome。

### 告警规则和其他配置

要对告警规则等其他配置进行自定义，过程与上面显示的记录规则示例相同。 你只需要在 application 中更改/添加 prometheus 配置。

```yaml
data:
  my-alerting-rules.yml: |
    groups:
    - name: example
      rules:
      - alert: HighApplicationQueueDepth
        expr: sum(workqueue_depth{app_kubernetes_io_name="vela-core",name="application"}) > 100
        for: 10m
        annotations:
          summary: High Application Queue Depth
```

![prometheus-rules-config](../../../resources/prometheus-rules-config.jpg)

### 自定义 Grafana 凭证

如果要更改 Grafana 的默认用户名和密码，可以运行以下命令：

```shell
vela addon enable grafana adminUser=super-user adminPassword=PASSWORD
```

这会将你的默认管理员用户更改为 `super-user`，并将其密码更改为 `PASSWORD`。

### 自定义存储

如果你希望 prometheus-server 和 grafana 将数据持久化在卷中，可以在安装时指定 `storage` 参数，例如：

```shell
vela addon enable prometheus-server storage=1G
```

这将创建 PersistentVolumeClaims 并让插件使用提供的存储。 即使插件被禁用，存储也不会自动回收。 你需要手动清理存储。
