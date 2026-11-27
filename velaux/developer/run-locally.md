---
title: Run Locally
description: Build the VelaUX frontend and run the server on your machine against a k3d cluster.
---

The server runs on your machine with `go run` and talks to whatever cluster `KUBECONFIG` points at. The frontend is built into `public/build/`, which the server serves, and `yarn dev` rebuilds it as you edit. You need the tools from [Repository and Prerequisites](overview.md).

## 1. A cluster with KubeVela

Create a k3d cluster and write its kubeconfig to a file of its own, so your default kubeconfig is left alone:

```shell
k3d cluster create velaux-dev --kubeconfig-update-default=false
export KUBECONFIG=$(k3d kubeconfig write velaux-dev)
```

Install KubeVela into it. `main` is built against KubeVela 1.12 and also runs on 1.10 and 1.11; v1.9.5 against KubeVela 1.9:

```shell
vela install
```

`vela install` installs the KubeVela version that matches the CLI; see [Install KubeVela](/docs/installation/kubernetes) for the Helm chart and its options.

## 2. The addon's cluster resources

The server expects what the `velaux` addon puts in the cluster: its ServiceAccount and RBAC, the UI schemas and the config templates. Enable the repository's copy of the addon with no replicas, so you get those without a second VelaUX running in the cluster:

```shell
vela addon enable ./addon replicas=0
```

:::caution
Don't drop `replicas=0`. The repository's `addon/metadata.yaml` still says `v1.8.0-rc.3`, so `vela addon enable ./addon` on its own runs that old image in the cluster. It competes with your local server for the `apiserver-lock` lease, and only the leader runs the background workers (the Application sync among them), so half of what you test would come from the old server.
:::

## 3. The frontend

```shell
yarn install
yarn build-packages
yarn dev
```

`yarn build-packages` builds `@velaux/theme`, `@velaux/data` and `@velaux/ui`, which the app and the plugins import. `yarn dev` then builds the app into `public/build/` and watches for changes; leave it running. On Node 17 or later, set `NODE_OPTIONS=--openssl-legacy-provider` first (see [Prerequisites](overview.md#prerequisites)).

To build once instead, for example before running the server without a watcher, use `yarn build`.

## 4. The server

In another terminal, from the repository root (the server serves `public/build/` relative to the directory it starts in):

```shell
export KUBECONFIG=$(k3d kubeconfig write velaux-dev)
make run-server
```

It listens on `0.0.0.0:8000`. Wait for the server to log that it's started, then open [http://127.0.0.1:8000](http://127.0.0.1:8000) and create the administrator, or do it from the shell:

```shell
curl -s -X PUT http://127.0.0.1:8000/api/v1/auth/init_admin \
  -H 'Content-Type: application/json' \
  -d '{"name": "admin", "password": "VelaUX12345", "email": "admin@example.com"}'
```

The server keeps its data in the cluster, as ConfigMaps in the `kubevela` namespace (`--datastore-type=kubeapi`, `--datastore-database=kubevela`). To start from scratch, delete that namespace, or the cluster.

## While you work

- **Frontend changes** show up when you reload the page, once `yarn dev` has rebuilt.
- **Server changes** need a restart: stop `make run-server` and run it again.
- **Server flags** go after `go run`: `go run ./cmd/server/main.go --help` lists them, for example `--bind-addr`, `--datastore-type` and `--plugin-path`.
- **Plugins**: `yarn packages:plugins` builds the example plugins in `plugins/`; the server loads plugins from `./plugins` by default. `docs/contributing/how-to-build-plugin.md` in the repository covers writing one.

When you're done:

```shell
k3d cluster delete velaux-dev
```
