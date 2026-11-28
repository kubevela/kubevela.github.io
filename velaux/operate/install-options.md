---
title: Install Options
description: The velaux addon's parameters, and how to expose VelaUX, store its data in a database and pull its image from your own registry.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

[Install VelaUX](../getting-started/install.md) enables the addon with its defaults: one replica, data kept in the cluster, reachable only by port-forward. This page covers the rest. Every option is an addon parameter. To change one on a running VelaUX, use `vela addon upgrade velaux <name>=<value>`: it keeps the parameters you set before and changes only the ones you pass. Running `vela addon enable velaux` again instead applies exactly the parameters you give it, and drops the rest. See [Upgrade VelaUX](upgrade.md).

## Parameters

Pass these to `vela addon enable velaux` as `name=value`.

| Parameter | Default | Description |
| --- | --- | --- |
| `serviceType` | `ClusterIP` | Service type: `ClusterIP`, `NodePort` or `LoadBalancer`. |
| `nodePort` | `30000` | Node port to use when `serviceType=NodePort`; ignored otherwise. |
| `domain` | | Domain to serve VelaUX on. Creates an Ingress (or a traefik route, see `gatewayDriver`). |
| `gatewayDriver` | `nginx` | `nginx` or `traefik`. |
| `secretName` | | Name of the TLS certificate Secret. Set it to serve VelaUX over HTTPS. |
| `dbType` | `kubeapi` | Where VelaUX stores its data: `kubeapi`, `mongodb`, `mysql` or `postgres`. |
| `dbURL` | | Connection URL for the database. Not used with `kubeapi`. |
| `database` | | Database name. With `kubeapi`, the namespace VelaUX stores its data in. |
| `repo` | | Image registry to pull the VelaUX image from, in place of Docker Hub. |
| `imagePullSecrets` | | Names of image pull Secrets for a private registry, for example `imagePullSecrets={a,b}`. |
| `replicas` | `1` | Number of VelaUX server replicas. |
| `serviceAccountName` | `kubevela-ux` | ServiceAccount the VelaUX server runs as. |
| `enableImpersonation` | `false` | Send requests to the Kubernetes API as the signed-in user, rather than as VelaUX's ServiceAccount. |

## Expose VelaUX with a Service type

The `serviceType` parameter takes the Kubernetes Service types `ClusterIP` (the default), `NodePort` and `LoadBalancer`.

- `LoadBalancer` needs a cloud load balancer in your cluster.
  ```shell script
  vela addon enable velaux serviceType=LoadBalancer
  ```
- `NodePort` needs you to reach the Kubernetes node IPs. VelaUX listens on node port `30000` unless you set `nodePort`.
  ```shell script
  vela addon enable velaux serviceType=NodePort
  ```

Then get the address with `vela status`:

```
vela status addon-velaux -n vela-system --endpoint
```

Expected output:

```
+-----------------------------------+---------------------+
|     REF(KIND/NAMESPACE/NAME)      |      ENDPOINT       |
+-----------------------------------+---------------------+
| Service/vela-system/velaux-server | http://<IP address> |
+-----------------------------------+---------------------+
```

## Expose VelaUX on a domain

If your cluster has an ingress controller and a domain pointing at it, set `domain`:

```bash
vela addon enable velaux domain=example.domain.com
```

Expected output:

```
Addon velaux enabled successfully.
Please access addon-velaux from the following endpoints:
+-----------------------------------+---------------------------+
|     REF(KIND/NAMESPACE/NAME)      |         ENDPOINT          |
+-----------------------------------+---------------------------+
| Ingress/vela-system/velaux-server | http://example.domain.com |
+-----------------------------------+---------------------------+
```

If you enabled the traefik addon, set `gatewayDriver=traefik` to use the Gateway API instead:

```shell script
vela addon enable velaux domain=example.domain.com gatewayDriver=traefik
```

To serve VelaUX over HTTPS:

1. Create the certificate configuration. The certificate must match the domain.

```shell
vela config create velaux-cert -t tls-certificate -n vela-system cert=<CERT_BASE64> key=<KEY_BASE64>
```

The `tls-certificate` config template comes with the `traefik` addon, which `gatewayDriver=traefik` needs anyway.

2. Enable VelaUX with the domain and the certificate:

```shell
vela addon enable velaux domain=example.domain.com gatewayDriver=traefik secretName=velaux-cert
```

## Use an external database

VelaUX stores its data in Kubernetes by default (`dbType=kubeapi`). For production, use a MongoDB, MySQL or PostgreSQL database that you run or rent, and pass its URL in `dbURL`.

<Tabs className="unique-tabs" groupId="db">
<TabItem label="MongoDB" value="mongodb">

```shell script
vela addon enable velaux dbType=mongodb dbURL=mongodb://<MONGODB_USER>:<MONGODB_PASSWORD>@<MONGODB_HOST>:<MONGODB_PORT>
```

</TabItem>
<TabItem label="MySQL" value="mysql">

Create the database first.

```shell script
vela addon enable velaux dbType=mysql dbURL=mysql://<MYSQL_USER>:<MYSQL_PASSWORD>@<MYSQL_HOST>:<MYSQL_PORT>/<MYSQL_DB_NAME>
```

The URL takes the [Go MySQL driver's connection parameters](https://github.com/go-sql-driver/mysql#parameters).

</TabItem>
<TabItem label="PostgreSQL" value="postgresql">

Create the database first.

```shell script
vela addon enable velaux dbType=postgres dbURL=postgres://<POSTGRESQL_USER>:<POSTGRESQL_PASSWORD>@<POSTGRESQL_HOST>:<POSTGRESQL_PORT>/<POSTGRESQL_DB_NAME>
```

</TabItem>
</Tabs>

## Pull the image from your own registry

The image comes from Docker Hub by default. To pull it from your own registry, copy the image there and set `repo`:

```
vela addon enable velaux repo=your-registry.example.com
```

The VelaUX image then becomes `your-registry.example.com/oamdev/velaux:<version>`. Add `imagePullSecrets` if the registry needs credentials.
