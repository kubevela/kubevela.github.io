---
title: Health Status Check
---

This documentation will introduce how to use `health` policy to apply periodical
health checking to an application.

## Background

After an application is deployed, users usually want to monitor or observe the
health condition of the running application as well as each components.
Health policy decouples health chechking procedure from application workflow
execution.
It allows to set independent health inspection cycle, such as check every 30s.
That helps users to notice as soon as applications turn out unhealthy and
follow the diagnosis message to troubleshot.

## Health Policy

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-healthscope-unhealthy
spec:
  components:
    - name: my-server
      type: webservice
      properties:
        cmd:
          - node
          - server.js
        image: oamdev/testapp:v1
        port: 8080
      traits:
        - type: ingress
          properties:
            domain: test.my.domain
            http:
              "/": 8080
    - name: my-server-unhealthy
      type: webservice
      properties:
        cmd:
          - node
          - server.js
        image: oamdev/testapp:boom # make it unhealthy
        port: 8080
  policies:
    - name: health-policy-demo
      type: health
      properties:
        probeInterval: 5
        probeTimeout: 10
```

We apply the sample application including two components, `my-server` is
supposed to be healthy while `my-server-unhealthy` is supposed to be unhealthy
(because of invalid image).

As shown in the sample, a `Health` policy is specified.
`Health` policy accepts two optional properties, `probeInterval` indicating time
duration between checking (default is 30s) and `probeTimeout` indicating time
duration before checking timeout (default is 10s).

```yaml
...
  policies:
    - name: health-policy-demo
      type: health
      properties:
        probeInterval: 5
        probeTimeout: 10
...
```

To learn about defining health checking rules, please refer to **[Status Write Back](../../platform-engineers/traits/status)**.

Finally we can observe application health status from its `status.services`.
Here is a snippet of health status.

```yaml
...
  services:
  - healthy: false
    message: 'Ready:0/1 '
    name: my-server-unhealthy
    scopes:
    - apiVersion: core.oam.dev/v1alpha2
      kind: HealthScope
      name: health-check
      namespace: default
      uid: 93345ca1-70df-4bfd-9e37-d28539cb839f
    workloadDefinition:
      apiVersion: apps/v1
      kind: Deployment
  - healthy: true
    message: 'Ready:1/1 '
    name: my-server
    scopes:
    - apiVersion: core.oam.dev/v1alpha2
      kind: HealthScope
      name: health-check
      namespace: default
      uid: 93345ca1-70df-4bfd-9e37-d28539cb839f
    traits:
    - healthy: true
      message: |
        No loadBalancer found, visiting by using 'vela port-forward policy-test'
      type: ingress
    workloadDefinition:
      apiVersion: apps/v1
      kind: Deployment
  status: running
...

```
