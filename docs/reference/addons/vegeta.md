---
title: Vegeta
---

## Install

```shell
$ vela addon enable vegeta
```

## Uninstall

```shell
$ vela addon disable vegeta
```

## Supported workload type

Vegeta Trait supports following component types: webservice, worker and cloneset.

## How to start

Save the following as `vegeta-demo.yaml`. It runs nginx as a `webservice` and attaches a `vegeta` trait that load-tests the component's own Service.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: new-vegeta
  namespace: vegeta
spec:
  components:
    - name: new-vegeta
      type: webservice
      properties:
        exposeType: ClusterIP
        image: nginx:latest
        ports:
        - expose: true
          port: 80
          protocol: TCP
      traits:
        - type: vegeta
          properties:
            dorequest: 'GET http://new-vegeta.vegeta:80'
            # A gentle load for a first try; pick the rate and duration for your test.
            vegetacli: 'vegeta attack -rate 10 -duration 5m | vegeta encode'
            parallelism: 1
            backofflimit: 10
```

Create the namespace and deploy it:

```shell
kubectl create namespace vegeta
vela up -f vegeta-demo.yaml
```

Check the app status and trait status:

```shell
vela ls app -n vegeta
APP             COMPONENT       TYPE            TRAITS  PHASE   HEALTHY STATUS          CREATED-TIME
new-vegeta      new-vegeta      webservice      vegeta  running healthy Ready:1/1       2022-05-31 21:24:28 +0800 CST

vela status  new-vegeta  -n vegeta
About:

  Name:         new-vegeta
  Namespace:    vegeta
  Created at:   2022-05-31 21:24:28 +0800 CST
  Status:       running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:rqfzusuxgj
    name:new-vegeta
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: new-vegeta
    Cluster: local  Namespace: vegeta
    Type: webservice
    Healthy Ready:1/1
    Traits:
      ? vegeta
```

The trait runs Vegeta in a Job named after the component. Read its results, one JSON line per request, with `kubectl logs`:

```shell
$ kubectl logs -n vegeta job/new-vegeta --tail=2
{"attack":"","seq":41210,"code":200,"timestamp":"2022-05-31T13:25:02.612Z","latency":1048573,"bytes_out":0,"bytes_in":615,"error":"","body":"PCFET0NUWVBFIGh0bWw+...","method":"GET","url":"http://new-vegeta.vegeta:80","headers":{"Content-Type":["text/html"]}}
{"attack":"","seq":41211,"code":200,"timestamp":"2022-05-31T13:25:02.812Z","latency":982114,"bytes_out":0,"bytes_in":615,"error":"","body":"PCFET0NUWVBFIGh0bWw+...","method":"GET","url":"http://new-vegeta.vegeta:80","headers":{"Content-Type":["text/html"]}}
```

The `body` field is shortened here. This example sends 10 requests a second for 5 minutes. Without `vegetacli` the attack runs at 5000 requests a second for 10000 minutes, so always set it, and delete the Application to stop an attack early.

To plot the results live, pipe the logs through [jaggr](https://github.com/rs/jaggr) and [jplot](https://github.com/rs/jplot):

```shell
kubectl logs -n vegeta job/new-vegeta -f | jaggr @count=rps hist\[100,200,300,400,500\]:code p25,p50,p95:latency sum:bytes_in sum:bytes_out | jplot rps+code.hist.100+code.hist.200+code.hist.300+code.hist.400+code.hist.500 latency.p95+latency.p50+latency.p25 bytes_in.sum+bytes_out.sum
```
