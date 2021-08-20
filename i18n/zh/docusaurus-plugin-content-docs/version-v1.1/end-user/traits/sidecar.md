---
title: 容器注入
---
本小节会介绍，如何为应用部署计划的一个组件，添加 `sidecar` 运维特征来收集日志。

### 开始之前

> ⚠️ 请安装 [KubeVela CLI 命令行工具](../../getting-started/quick-install.mdx##3)

### 如何使用

先熟悉 `ingress` 运维特征的相关信息：

```shell
$ vela show sidecar

# Properties
+---------+-----------------------------------------+-----------------------+----------+---------+
|  NAME   |               DESCRIPTION               |         TYPE          | REQUIRED | DEFAULT |
+---------+-----------------------------------------+-----------------------+----------+---------+
| name    | Specify the name of sidecar container   | string                | true     |         |
| cmd     | Specify the commands run in the sidecar | []string              | false    |         |
| image   | Specify the image of sidecar container  | string                | true     |         |
| volumes | Specify the shared volume path          | [[]volumes](#volumes) | false    |         |
+---------+-----------------------------------------+-----------------------+----------+---------+


## volumes
+-----------+-------------+--------+----------+---------+
|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-----------+-------------+--------+----------+---------+
| name      |             | string | true     |         |
| path      |             | string | true     |         |
+-----------+-------------+--------+----------+---------+
```

接下来，让我们来编写一个应用部署计划里的组件 `log-gen-worker`。
同时，我们将 `sidecar` 所记录的日志数据目录和组件，指向同一个数据源 `varlog`。

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app-with-sidecar
spec:
  components:
    - name: log-gen-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - /bin/sh
          - -c
          - >
            i=0;
            while true;
            do
              echo "$i: $(date)" >> /var/log/date.log;
              i=$((i+1));
              sleep 1;
            done
        volumes:
          - name: varlog
            mountPath: /var/log
            type: emptyDir
      traits:
        - type: sidecar
          properties:
            name: count-log
            image: busybox
            cmd: [ /bin/sh, -c, 'tail -n+1 -f /var/log/date.log']
            volumes:
              - name: varlog
                path: /var/log
```

编写完毕，在 YAML 文件所在路径下，部署这个应用：

```shell
kubectl apply -f app.yaml
```

成功后，先检查应用生成的工作负载情况：

```shell
$ kubectl get pod
NAME                              READY   STATUS    RESTARTS   AGE
log-gen-worker-76945f458b-k7n9k   2/2     Running   0          90s
```

然后，查看 `sidecar` 的输出，日志显示正常。

```shell
$ kubectl logs -f log-gen-worker-76945f458b-k7n9k count-log
0: Fri Apr 16 11:08:45 UTC 2021
1: Fri Apr 16 11:08:46 UTC 2021
2: Fri Apr 16 11:08:47 UTC 2021
3: Fri Apr 16 11:08:48 UTC 2021
4: Fri Apr 16 11:08:49 UTC 2021
5: Fri Apr 16 11:08:50 UTC 2021
6: Fri Apr 16 11:08:51 UTC 2021
7: Fri Apr 16 11:08:52 UTC 2021
8: Fri Apr 16 11:08:53 UTC 2021
9: Fri Apr 16 11:08:54 UTC 2021 
```