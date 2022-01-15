---
title: 容器注入
---

Sidecar 容器作为与业务容器解耦的存在，可以帮助我们很多辅助性的重要工作，比如常见的日志代理、用来实现 Service Mesh 等等。

## 如何使用

这一次，让我们来编写一个应用部署计划里的组件 log-gen-worker。 同时我们将 sidecar 所记录的日志数据目录，和组件指向同一个数据存储卷 varlog。


```shell
cat <<EOF | vela up -f -
# YAML 文件开始
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
# YAML 文件结束
EOF
```


使用 `vela ls` 查看应用是否部署成功：


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
vela-app-with-sidecar	log-gen-worker	worker     	sidecar           	running	healthy	      	2021-08-29 22:07:07 +0800 CST
```


成功后，查看 Sidecar 所输出的日志


```
vela logs vela-app-with-sidecar -c count-log
```

从输出的日志可以看到读取日志的 sidecar 已经生效。


## 字段说明

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