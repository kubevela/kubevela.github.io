---
title: Sync an Application from the CLI
description: Apply an Application with vela, and watch VelaUX pick it up into a project and an environment.
---

VelaUX isn't the only way into the cluster: teams use `vela up`, `kubectl` and GitOps too. VelaUX syncs those Applications in, so the console still shows everything that runs. This applies one with `vela up`, looks at what VelaUX made of it, and deletes it again. How the sync decides on the project and environment is in [Concepts](../concepts/overview.md#applications-from-outside-velaux).

## Before you start

VelaUX installed and port-forwarded, with `VELAUX` and `TOKEN` set as in steps 1 and 2 of [Deploy with the API](deploy-with-the-api.md#1-sign-in).

## 1. Apply an Application with the CLI

```shell
kubectl create namespace team-cli
cat <<'YAML' | vela up -n team-cli -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: from-cli
spec:
  components:
    - name: from-cli
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
YAML
```

## 2. Find it in VelaUX

Give the sync a few seconds, then:

```shell
curl -s "$VELAUX/api/v1/applications?query=from-cli" -H "Authorization: Bearer $TOKEN" \
  | jq '.applications[] | {name, alias, project: .project.name}'
```

Expected output:

```json
{
  "name": "from-cli",
  "alias": "from-cli",
  "project": "default"
}
```

It landed in the `default` project. The namespace had no environment yet, so VelaUX made one for it:

```shell
curl -s $VELAUX/api/v1/envs -H "Authorization: Bearer $TOKEN" \
  | jq '.envs[] | select(.namespace == "team-cli") | {name, alias, namespace, project: .project.name, targets: [.targets[]?.name]}'
```

Expected output:

```json
{
  "name": "syc-team-cli",
  "alias": "syc-team-cli",
  "namespace": "team-cli",
  "project": "default",
  "targets": [
    "syc-local-team-cli"
  ]
}
```

The application is bound to that environment, and its component came across:

```shell
curl -s $VELAUX/api/v1/applications/from-cli/envs -H "Authorization: Bearer $TOKEN" \
  | jq '.envBindings[] | {name, appDeployName, appDeployNamespace}'
curl -s $VELAUX/api/v1/applications/from-cli/components -H "Authorization: Bearer $TOKEN" \
  | jq '.components[] | {name, type: .componentType}'
```

Expected output:

```json
{
  "name": "syc-team-cli",
  "appDeployName": "from-cli",
  "appDeployNamespace": "team-cli"
}
{
  "name": "from-cli",
  "type": "webservice"
}
```

In the console, it's on the **Applications** list like any other, with its status, instances and revisions.

To have Applications in a namespace land in a project of your choosing, create that project's environment for the namespace first; see [Projects](../guides/users/projects.md#creating-environments-for-the-project).

## 3. Delete it from the CLI

```shell
vela delete from-cli -n team-cli -y
```

VelaUX removes its record too:

```shell
curl -s "$VELAUX/api/v1/applications?query=from-cli" -H "Authorization: Bearer $TOKEN" | jq '.applications | length'
```

Expected output:

```
0
```

The environment it created stays; delete it from **Environments** if you don't want it.
