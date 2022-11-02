---
title: Attaching Sidecar Container
---

The `sidecar` trait allows you to attach a sidecar container to the component.

## How to use

In this Application, component `log-gen-worker` and sidecar share the data volume that saves the logs.
The sidebar will re-output the log to stdout.

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

Deploy this Application.

```shell
vela up -f app.yaml
```

Use `vela ls` to check the application state:


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
vela-app-with-sidecar	log-gen-worker	worker     	sidecar           	running	healthy	      	2021-08-29 22:07:07 +0800 CST
```

And check the logging output of sidecar. 

```shell
vela logs vela-app-with-sidecar -c count-log
```

<details>
<summary>expected output</summary>

```console
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

</details>