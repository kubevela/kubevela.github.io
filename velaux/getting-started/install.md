---
title: Install VelaUX
description: Enable the velaux addon, open VelaUX and create its administrator.
---

VelaUX is the `velaux` addon in the default addon registry. It needs KubeVela installed in the cluster first; see [Install KubeVela](/docs/installation/kubernetes).

:::note
The `velaux` addon installs VelaUX v1.9.5 (addon version v1.9.5). That release predates KubeVela 1.12, so its screens don't cover the 1.12 additions: it does not show sources or modules, there is no UI for the ConfigTemplate CRD, the `+ui` parameter markers don't change its forms, and it can't edit a config Secret that 1.12 adopted.
:::

## Enable the addon

```shell
vela addon enable velaux
```

Expected output:

```
Addon velaux enabled successfully.
Please access addon-velaux from the following endpoints:
+---------+---------------+-----------------------------------+--------------------------------+-------+
| CLUSTER |   COMPONENT   |     REF(KIND/NAMESPACE/NAME)      |            ENDPOINT            | INNER |
+---------+---------------+-----------------------------------+--------------------------------+-------+
| local   | velaux-server | Service/vela-system/velaux-server | velaux-server.vela-system:8000 | true  |
+---------+---------------+-----------------------------------+--------------------------------+-------+
    To open the dashboard directly by port-forward:

    vela port-forward -n vela-system addon-velaux 8000:8000

    Please refer to https://kubevela.io/docs/reference/addons/velaux for more VelaUX addon installation and visiting method.
```

The addon is an Application, `addon-velaux`, in `vela-system`. Wait for it to be running:

```shell
vela status addon-velaux -n vela-system
```

The application is ready once its status reads `running` and every component shows `healthy`.

By default VelaUX is reachable only from inside the cluster. To expose it on a node port, a load balancer or a domain, or to keep its data in a database, see [Install Options](../operate/install-options.md).

## Open VelaUX

Port-forward the VelaUX service to your machine:

```shell
vela port-forward -n vela-system addon-velaux 8000:8000
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000). Leave the port-forward running while you use VelaUX.

## Create the administrator

The first time VelaUX opens, it asks you to create the administrator account: a username, a password (8 to 16 characters, with at least one letter and one digit) and an email. After that, sign in with that username and password.

Creating the administrator also creates the `default` project, with a `default` environment and a `default` delivery target that deploys to the `default` namespace of the cluster VelaUX runs in. That is enough to deploy your first application.

You can do the same from a script, which is handy for a cluster you build and throw away:

```shell
curl -s -X PUT http://127.0.0.1:8000/api/v1/auth/init_admin \
  -H 'Content-Type: application/json' \
  -d '{"name": "admin", "password": "VelaUX12345", "email": "admin@example.com"}'
```

Expected output:

```json
{"success":true}
```

Everything the UI does goes through the VelaUX REST API, which you can call yourself; see [VelaUX REST API](../reference/rest-api.md).

## Next steps

- [Quick Start](quick-start.md): deploy an application from VelaUX, end to end.
- [Concepts](../concepts/overview.md): projects, environments, delivery targets and the application lifecycle.
