---
title: One-time delivery
---

By default, the KubeVela controller will prevent configuration drift for applied resources by reconciling them routinely. This is useful if you want to keep your application always having the desired configuration in avoid of some unintentional changes by external modifiers.

However, sometimes, you might want to use KubeVela Application to dispatch jobs and recycle jobs, but also want to leave those resources mutable after workflow is finished. In this case, you can use the following apply-once policy.

### How to use
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: apply-once-app
spec:
  components:
    - name: hello-world
      type: webservice
      properties:
        image: oamdev/hello-world
      traits:
        - type: scaler
          properties:
            replicas: 3
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
```

In this case, if you change the replicas of the hello-world deployment after Application enters running state, the change will not be reverted. On the contrary, if you disable the apply-once policy (by default), any changes to the replicas of hello-world application will be brought back in the next reconcile loop.

The configuration drift check will be launched every 5 minutes after application enters the running state or the suspending state without errors. You can configure the time through setting the `application-re-sync-period` bootstrap parameter in the controller. See [bootstrap parameters](../../platform-engineers/system-operation/bootstrap-parameters) for details.