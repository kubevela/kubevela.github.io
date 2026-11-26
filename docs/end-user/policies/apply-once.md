---
title: Let Other Controllers Change Fields
---

KubeVela puts back any field that drifts from the Application. When an HPA, KEDA or Istio owns a field, tell KubeVela to leave it alone with `apply-once`.

## Leave one field alone

Name the field and the resources it applies to. Here an HPA, or anyone with `kubectl scale`, owns the replica count of the `hello-world` Deployment, and KubeVela keeps correcting everything else:

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
        rules:
          - selector:
              resourceTypes: ["Deployment"]
            strategy:
              path: ["spec.replicas"]
```

This is the form to reach for: it gives away only the field another controller owns.

Each rule has a selector and a strategy:

| Field | What it does |
| --- | --- |
| `selector` | Which resources the rule covers. See [Resource selectors](./resource-selectors.md) for the fields. When several rules match a resource, the first one wins. |
| `strategy.path` | The fields KubeVela leaves as they are on the cluster, such as `spec.replicas` or `spec.template.spec.containers[0].resources`. `["*"]` leaves the whole object alone. |
| `strategy.affect` | When the rule applies. Unset, it applies both times below. |

`affect` takes one of these values:

| Value | When KubeVela keeps the live value |
| --- | --- |
| `onUpdate` | When the Application is updated and its resources are applied again. Between updates, the periodic drift check still puts the field back. |
| `onStateKeep` | During the periodic drift check only. An update to the Application applies the field as declared. |
| `always` (or unset) | Both: at updates and during the drift check. Changing the field in the Application does not change it on an existing resource either. |

With `onStateKeep`, `always` or no `affect`, the drift check also leaves a covered resource alone when it is deleted out of band: KubeVela does not recreate it until the next update of the Application.

## See it work

Apply the Application above, then scale the Deployment by hand:

```bash
kubectl scale deploy hello-world --replicas=5
```

Wait past the next drift check (5 minutes by default, see below), and the replicas are still yours:

```bash
$ kubectl get deploy hello-world
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
hello-world   5/5     5            5           8m
```

Now remove the `policies` block from the Application and apply it again. KubeVela applies the Deployment as declared, and the count returns to 3:

```bash
$ kubectl get deploy hello-world
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
hello-world   3/3     3            3           9m
```

## Leave every field alone

`enable: true` with no `rules` turns off drift correction for every field of every resource in the Application:

```yaml
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
```

:::caution
This is the bluntest option. KubeVela stops putting back any change made on the cluster, including a deleted resource or an edited image, until the Application itself is updated. Prefer a rule that names the fields another controller owns.
:::

## When the drift check runs

The drift check runs every 5 minutes once the Application is running, or suspended without errors. Change the period with the `application-re-sync-period` controller flag; see [bootstrap parameters](../../platform-engineers/system-operation/bootstrap-parameters.md) for details. To set a different interval on one Application, use the [`app.oam.dev/reconcile-interval`](../workflow/suspending-application-reconciliation.md#per-application-reconcile-interval) annotation (v1.11+).
