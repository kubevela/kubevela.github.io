---
title: Grafana with kubectl
description: Run a Grafana, register it with Prism, and create, find, change and delete a datasource and a dashboard with kubectl alone.
---

This runs a plain Grafana on the cluster, registers it with Prism, and manages a datasource and a dashboard in a folder entirely through `kubectl`. A throwaway curl pod checks what Grafana itself holds at each step.

You need a cluster with KubeVela and the `vela-prism` addon: steps 1 and 2 of the [Quick Start](../getting-started/quick-start.md) make one.

## 1. Run a Grafana

Prism keeps Grafana access in `o11y-system`, so the namespace has to exist either way; Grafana goes there too.

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
```

A small helper for asking Grafana directly, as its admin:

```shell
grafana() {
  kubectl run grafana-curl-$RANDOM --rm -i --restart=Never --quiet --image=curlimages/curl:8.11.1 -- \
    -s -u admin:kubevela "$@"
}
```

## 2. Register it

`kubectl create`, not `apply`, so the password isn't copied into an annotation:

```shell
kubectl create -f - <<EOF
apiVersion: o11y.prism.oam.dev/v1alpha1
kind: Grafana
metadata:
  name: default
spec:
  endpoint: http://grafana.o11y-system:3000
  access:
    username: admin
    password: kubevela
EOF
kubectl get grafanas
kubectl get secret grafana.default -n o11y-system
```

```console
grafana.o11y.prism.oam.dev/default created
NAME      ENDPOINT                          CREDENTIAL_TYPE
default   http://grafana.o11y-system:3000   BasicAuth
NAME              TYPE     DATA   AGE
grafana.default   Opaque   2      0s
```

## 3. A datasource

```shell
kubectl apply -f - <<EOF
apiVersion: o11y.prism.oam.dev/v1alpha1
kind: GrafanaDatasource
metadata:
  name: prometheus@default
spec:
  name: Prometheus
  type: prometheus
  access: proxy
  url: http://prometheus-server.o11y-system:9090
  isDefault: true
EOF
kubectl get grafanadatasources
grafana http://grafana.o11y-system:3000/api/datasources/uid/prometheus; echo
```

```console
grafanadatasource.o11y.prism.oam.dev/prometheus@default created
UID          NAME         TYPE         URL
prometheus   Prometheus   prometheus   http://prometheus-server.o11y-system:9090
{"id":1,"uid":"prometheus","orgId":1,"name":"Prometheus","type":"prometheus","typeLogoUrl":"public/app/plugins/datasource/prometheus/img/prometheus_logo.svg","access":"proxy","url":"http://prometheus-server.o11y-system:9090","user":"","database":"","basicAuth":false,"basicAuthUser":"","withCredentials":false,"isDefault":true,"jsonData":{},"secureJsonFields":{},"version":1,"readOnly":false,"apiVersion":""}
```

Nothing listens at that URL in this example; Grafana keeps a datasource whether or not it answers.

## 4. A dashboard in a folder

Folders are Grafana's, so make one there first, then point the dashboard at it with a label:

```shell
grafana -X POST -H 'Content-Type: application/json' \
  -d '{"uid":"team-a","title":"Team A"}' http://grafana.o11y-system:3000/api/folders; echo
kubectl apply -f - <<EOF
apiVersion: o11y.prism.oam.dev/v1alpha1
kind: GrafanaDashboard
metadata:
  name: team-a-overview@default
  labels:
    o11y.oam.dev/grafana-dashboard-folder-uid: team-a
spec:
  title: Team A Overview
  tags: [team-a]
  time:
    from: now-6h
    to: now
  panels:
    - type: timeseries
      title: Targets up
      gridPos: {h: 8, w: 12, x: 0, "y": 0}
      datasource: {type: prometheus, uid: prometheus}
      targets:
        - expr: sum(up)
EOF
kubectl get grafanadashboards -o wide
```

```console
{"id":1,"uid":"team-a","orgId":1,"title":"Team A",...}
grafanadashboard.o11y.prism.oam.dev/team-a-overview@default created
UID               TITLE             FOLDERID
team-a-overview   Team A Overview   1
```

## 5. Find it

Label selectors become Grafana search parameters:

```shell
kubectl get grafanadashboards -l tag=team-a
kubectl get grafanadashboards -l query=Overview
kubectl get grafanadashboards -l tag=team-b
```

```console
UID               TITLE
team-a-overview   Team A Overview
UID               TITLE
team-a-overview   Team A Overview
No resources found
```

## 6. Change it

Add a second panel and apply again. Grafana bumps the dashboard's version:

```shell
kubectl patch grafanadashboard team-a-overview@default --type json -p '[
  {"op": "add", "path": "/spec/panels/-", "value":
    {"type": "stat", "title": "Scrape targets", "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
     "datasource": {"type": "prometheus", "uid": "prometheus"}, "targets": [{"expr": "count(up)"}]}}
]'
kubectl get grafanadashboard team-a-overview@default -o jsonpath='{.spec.version} {range .spec.panels[*]}{.title}, {end}'; echo
```

```console
grafanadashboard.o11y.prism.oam.dev/team-a-overview@default patched
2 Targets up, Scrape targets,
```

To look at it in Grafana's UI, `kubectl port-forward -n o11y-system svc/grafana 3000` and sign in as `admin` / `kubevela`.

## 7. Delete

```shell
kubectl delete grafanadashboard team-a-overview@default
kubectl delete grafanadatasource prometheus@default
grafana http://grafana.o11y-system:3000/api/search?type=dash-db; echo
```

```console
grafanadashboard.o11y.prism.oam.dev "team-a-overview@default" deleted
grafanadatasource.o11y.prism.oam.dev "prometheus@default" deleted
[]
```

Deleting the dashboard or datasource deletes it in Grafana: there is no other copy.

## Clean up

```shell
kubectl delete grafana default
kubectl delete namespace o11y-system
```

`kubectl delete grafana default` deletes the `grafana.default` Secret; Grafana itself is untouched until its namespace goes.
