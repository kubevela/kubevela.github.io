---
title: Use an OCI Registry for Addons
---

:::caution
OCI addon registries ship together with the alpha [addon as a component](./addon-as-component.md) feature. The `vela addon` commands described here work without the feature gate, but the `type: addon` component needs `EnableAddonComponent`.
:::

Besides Git, Helm (ChartMuseum) and object storage, an addon registry can be an OCI registry, such as Amazon ECR, GitHub Container Registry or Docker Hub. Each addon is stored as a Helm chart artifact:

- The repository is `<registry prefix>/<addon name>`, for example `registry.example.com/addons/fluxcd`.
- Each semver tag is an addon version. An empty version resolves to the highest semver tag. There is no floating `latest` tag.

An OCI registry has no `index.yaml`, so discovery works differently from a Helm repository. `vela addon push` also maintains a small catalog chart named `kubevela-addon-catalog` in the same prefix. It lists the addons and versions, and `vela addon list` reads it.

## Add an OCI registry

The endpoint must use the `oci://` scheme and name the repository prefix that holds your addons:

```shell
printf '%s' "$REGISTRY_PASSWORD" | vela addon registry add my-oci \
  --type oci \
  --endpoint=oci://registry.example.com/addons \
  --username=myuser \
  --password-stdin
```

Pass the password through `--password-stdin` so it does not end up in your shell history. `--password` is also accepted.

A registry that has never had an addon pushed has no catalog yet. It is added as an empty registry instead of being rejected. Any other failure, such as bad credentials or an unreachable endpoint, rejects the registry.

### Amazon ECR

ECR passwords are short-lived tokens. Fetch one with the AWS CLI and pass it through stdin:

```shell
aws ecr get-login-password --region <region> | vela addon registry add ecr \
  --type oci \
  --endpoint=oci://<account>.dkr.ecr.<region>.amazonaws.com/addon \
  --username=AWS \
  --password-stdin
```

Because the token expires, run the command again with a fresh token when pushes or pulls start failing with an authentication error.

### Docker Hub

Docker Hub can be used as an OCI addon registry for push and pull. Use your Docker Hub account name as the repository prefix and a Docker Hub access token as the password.

Docker Hub does not let any credential list its repository catalog. KubeVela therefore does not try to enumerate repositories there, and uses the `kubevela-addon-catalog` chart written by `vela addon push` to discover addons.

## Push an addon

Push an addon directory or a packaged `.tgz` to a registry that you added, or directly to an `oci://` URL:

```shell
# To a registry that was added with `vela addon registry add`
vela addon push sample-addon my-oci

# Directly to an OCI URL, with a password from stdin
printf '%s' "$REGISTRY_PASSWORD" | vela addon push sample-addon \
  oci://registry.example.com/addons --username myuser --password-stdin

# Directly to an OCI URL, with credentials previously saved by Helm or Docker
vela addon push sample-addon oci://registry.example.com/addons
```

The addon is published at `<prefix>/<addon name>:<version>`, and the version comes from the addon's `metadata.yaml`. After the chart is pushed, the portable catalog is updated.

If the catalog cannot be updated, for example because you are not allowed to push to the catalog repository, the addon is still published. The command prints a warning, and the addon can still be installed with an explicit name and version. It does not show up in `vela addon list` until the catalog is updated.

Some flags are specific to ChartMuseum and are rejected for OCI registries: `--access-token`, `--auth-header`, `--ca-file`, `--cert-file`, `--key-file` and `--insecure`. OCI registries use the ambient Docker or Helm TLS configuration.

## Use the registry

Once the registry is added, it works with the rest of the addon commands:

```shell
vela addon registry list
vela addon list
vela addon enable fluxcd --version 3.0.2
```

`vela addon registry list` shows the registry type as `OCI`.

To install an addon from it as a component, name the registry in `registry`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: fluxcd-addon
  namespace: vela-system
spec:
  components:
    - name: fluxcd
      type: addon
      properties:
        version: "3.0.2"
        registry: my-oci
```

## Limitations

- Only an exact tag can be pinned. A version range is not resolved.
- Registry endpoints that the controller cannot read are rejected when you add the registry.
- On Docker Hub, `vela addon list` only shows what the portable catalog contains, because the registry cannot be enumerated.
