---
title: Repository and Prerequisites
description: How the VelaUX repository is laid out, and the tools you need to work on it.
---

This section is for working on VelaUX itself: the [kubevela/velaux](https://github.com/kubevela/velaux) repository. It describes the `main` branch, and notes where the v1.9.5 release (what the addon installs, and what the rest of these docs describe) differs. The parts every KubeVela repository shares (the DCO sign-off, the PR template, labels) are in KubeVela's [contribution process](/docs/contributor/overview) and aren't repeated here.

## Repository layout

VelaUX is one repository holding a Go API server and a React frontend, built into one image. The server serves the frontend's built files and the REST API on the same port.

| Path | What's in it |
| --- | --- |
| `cmd/server/` | The server's `main`. `go run ./cmd/server/main.go` is the whole server. |
| `pkg/server/interfaces/api/` | REST handlers, one file per resource (`application.go`, `project.go`, ...), and their request and response types in `dto/v1/`. |
| `pkg/server/domain/` | The business logic: `service/` (one service per resource), `model/` (what is stored), `repository/`. |
| `pkg/server/infrastructure/` | Clients and the datastore drivers (`kubeapi`, `mongodb`, `mysql`, `postgres`). |
| `pkg/server/event/` | Background workers that run on the leader only, such as `sync/`, which syncs Applications created outside VelaUX into it. |
| `pkg/plugin/` | The server side of VelaUX plugins. |
| `packages/velaux-ui/` | The frontend (React 17, [Fusion Design](https://fusion.design/) components). |
| `packages/velaux-data/`, `packages/velaux-theme/` | Shared packages the frontend and plugins build on. |
| `plugins/` | Example plugins: `app-demo`, `node-dashboard`, `topology-picker`. |
| `addon/` | The `velaux` addon as the repository builds it, for enabling a local checkout with `vela addon enable ./addon`. The addon users install comes from [kubevela/catalog](https://github.com/kubevela/catalog/tree/master/addons/velaux). |
| `e2e-test/` | The server's end-to-end suite, run against a real cluster. |
| `docs/` | `contributing/` (setup and how to build a plugin), `TESTING.md` (the unit test databases), `apidoc/swagger.json` (the generated OpenAPI spec). |
| `makefiles/`, `Makefile` | Build, lint, test and codegen targets. |

`pkg/server/README.md` has a diagram of how the server's layers call each other.

## Prerequisites

| Tool | `main` | v1.9.5 | Where it's set |
| --- | --- | --- | --- |
| Go | 1.27.1 | 1.22 | `go.mod`; CI uses the same (`GO_VERSION` in `.github/workflows/server-test.yml`). |
| Node.js | 16 in CI and the image; 18 works with `NODE_OPTIONS=--openssl-legacy-provider` | 16 | `.github/workflows/staticcheck.yml`, `Dockerfile` (`node:16-alpine`). `package.json` asks for `>= 16`. |
| Yarn | 3.6.0, checked in as `.yarn/releases/yarn-3.6.0.cjs` | 3.6.0 | `packageManager` in `package.json`, `.yarnrc.yml`. Any global `yarn` (1.x is fine) hands over to it. |
| Docker | Any recent release | | The test databases (`docker-compose.test.yml`), image builds, k3d. |
| k3d | v5 | | A local cluster to run against. |
| `vela` CLI | Matching the KubeVela you install | | Installing KubeVela and enabling the addon. |
| kubectl | Any version supported by your cluster | | |

:::caution Node 17 and later
The frontend is built with webpack 4, which uses a hash OpenSSL 3 no longer allows. On Node 17 or later, `yarn build-packages` stops with `error:0308010C:digital envelope routines::unsupported`. Use Node 16, or set `export NODE_OPTIONS=--openssl-legacy-provider` before building.
:::

The frontend uses Yarn's Plug'n'Play (`nodeLinker: pnp`), so there's no `node_modules`. For VS Code, `docs/contributing/velaux.md` lists the settings that point the editor at Yarn's TypeScript SDK.

## Get the code

```shell
git clone https://github.com/kubevela/velaux.git
cd velaux
```

Fork it first if you plan to open a pull request, and clone your fork; see [Pull Requests](pull-requests.md).

## Next

- [Run Locally](run-locally.md): build the frontend and server, and run them against a k3d cluster.
- [Testing](testing.md): unit tests, the end-to-end suite, linting and code generation.
- [Pull Requests](pull-requests.md): how a change is checked, reviewed and merged.
