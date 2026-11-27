---
title: Grafana from an Application
description: One Application that registers a Grafana, adds a datasource and a dashboard to it through Prism, and takes them away again when it's deleted.
---

The [previous example](./grafana-with-kubectl.md) used kubectl. This one hands the same objects to KubeVela, using the component types from the `o11y-definitions` addon: one Application registers the Grafana, and another adds a datasource and a dashboard to it. Deleting the second Application deletes them from Grafana.

You need a cluster with KubeVela and the `vela-prism` addon: steps 1 and 2 of the [Quick Start](../getting-started/quick-start.md) make one.

## 1. Run a Grafana and enable the definitions

The same Grafana as before:

```shell
kubectl create namespace o11y-system
kubectl apply -n o11y-system -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
spec:
  selector:
    matchLabels: {app: grafana}
  template:
    metadata:
      labels: {app: grafana}
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:11.6.0
          env:
            - name: GF_SECURITY_ADMIN_PASSWORD
              value: kubevela
          ports:
            - containerPort: 3000
          readinessProbe:
            httpGet: {path: /api/health, port: 3000}
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
spec:
  selector: {app: grafana}
  ports:
    - port: 3000
EOF
kubectl rollout status deployment/grafana -n o11y-system --timeout=5m
vela addon enable o11y-definitions
```

`o11y-definitions` adds the `grafana-access`, `grafana-datasource` and `grafana-dashboard` component types. It lists `vela-prism` as a dependency, so it would enable Prism too if it weren't already.

## 2. Register the Grafana

The Grafana registration goes in an Application of its own, which the platform team owns. Keep it apart from the Applications that add dashboards: see [why](#why-two-applications) below.

```shell
kubectl apply -f - <<EOF
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: grafana-team-a
  namespace: vela-system
spec:
  components:
    - name: grafana-access
      type: grafana-access
      properties:
        name: team-a
        endpoint: http://grafana.o11y-system:3000
        username: admin
        password: kubevela
EOF
kubectl wait --for=jsonpath='{.status.status}'=running application/grafana-team-a -n vela-system --timeout=2m
kubectl get grafanas
```

```console
application.core.oam.dev/grafana-team-a created
application.core.oam.dev/grafana-team-a condition met
NAME     ENDPOINT                          CREDENTIAL_TYPE
team-a   http://grafana.o11y-system:3000   BasicAuth
```

The password sits in the Application here to keep the example short. On a real hub, register the Grafana with a `grafana` config instead, as in [Cloud Service Integration](/docs/next/platform-engineers/operations/o11y/integration#integrate-grafana), so the credential stays in a Secret and out of the Application and its revisions.

## 3. Add a datasource and a dashboard

`data` is the datasource or dashboard model as a JSON string, so YAML's `y` problem doesn't arise.

```shell
kubectl apply -f - <<EOF
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: team-a-dashboards
  namespace: vela-system
spec:
  components:
    - name: prometheus
      type: grafana-datasource
      properties:
        grafana: team-a
        uid: prometheus
        data: |
          {"name": "Prometheus", "type": "prometheus", "access": "proxy",
           "url": "http://prometheus-server.o11y-system:9090"}
    - name: overview
      type: grafana-dashboard
      properties:
        grafana: team-a
        uid: team-a-overview
        data: |
          {"title": "Team A Overview",
           "panels": [{"type": "timeseries", "title": "Targets up",
                       "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
                       "datasource": {"type": "prometheus", "uid": "prometheus"},
                       "targets": [{"expr": "sum(up)"}]}]}
EOF
kubectl wait --for=jsonpath='{.status.status}'=running application/team-a-dashboards -n vela-system --timeout=2m
vela status team-a-dashboards -n vela-system --tree
kubectl get grafanadatasources -l grafana=team-a
kubectl get grafanadashboards -l grafana=team-a
```

```console
application.core.oam.dev/team-a-dashboards created
application.core.oam.dev/team-a-dashboards condition met
CLUSTER       NAMESPACE     RESOURCE                                STATUS
local     ─── -         ─┬─ GrafanaDashboard/team-a-overview@team-a updated
                         └─ GrafanaDatasource/prometheus@team-a     updated
UID          NAME         TYPE         URL
prometheus   Prometheus   prometheus   http://prometheus-server.o11y-system:9090
UID               TITLE
team-a-overview   Team A Overview
```

## 4. Delete the dashboards

```shell
kubectl delete application team-a-dashboards -n vela-system
kubectl wait --for=delete application/team-a-dashboards -n vela-system --timeout=2m
kubectl get grafanadashboards -l grafana=team-a
kubectl get grafanadatasources -l grafana=team-a
```

```console
application.core.oam.dev "team-a-dashboards" deleted from vela-system namespace
No resources found
No resources found
```

KubeVela's garbage collection deleted both objects, so Prism deleted them in Grafana. The Grafana registration stays, ready for the next Application.

## Why two Applications

KubeVela garbage-collects an Application's resources together. If the same Application also holds the `grafana-access` component, its `grafana.team-a` Secret can go first, and from then on Prism can't reach that Grafana to delete anything: the dashboard and datasource deletions come back `NotFound`, KubeVela counts them as done, and both stay in Grafana. A `garbage-collect` policy with `order: dependency` and `dependsOn` between the components doesn't change that (checked on KubeVela 1.11 with Prism v1.7.0).

## Clean up

```shell
kubectl delete application grafana-team-a -n vela-system
vela addon disable o11y-definitions
kubectl delete namespace o11y-system
```
