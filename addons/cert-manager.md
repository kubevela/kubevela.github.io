---
title: cert-manager
---

[cert-manager](https://cert-manager.io/) issues TLS certificates and renews them before they expire. Enable this addon to get Let's Encrypt certificates for the routes you expose with the traefik or ingress-nginx addons, or to let the vela-core chart use cert-manager for its own certificates (`admissionWebhooks.certManager.enabled` for the admission webhook, `multicluster.clusterGateway.secureTLS.certManager.enabled` for cluster-gateway).

You only need it once per cluster.

## Install

```shell
vela addon enable cert-manager
```

This installs cert-manager v1.9.1 from `https://charts.jetstack.io` into the `cert-manager` namespace.

## Uninstall

```shell
vela addon disable cert-manager
```

The addon leaves cert-manager's CRDs and its namespace behind when you disable it.

## Parameters

| Name | Description | Type | Default |
| --- | --- | --- | --- |
| `installCRDs` | Install cert-manager's CRDs with the chart. | bool | `true` |
| `upgradeCRD` | Upgrade the CRDs when cert-manager is upgraded. | bool | `false` |
| `clusters` | Clusters to install on. Leave it out to install on every cluster. | []string | |
| `namespace` | Namespace cert-manager runs in. | string | `cert-manager` |
| `replicas` | Number of cert-manager replicas. | int | `1` |
| `staging` | Use the Let's Encrypt staging API. Turn it on until your setup works, so failed attempts don't hit the production rate limits. | bool | `false` |
| `dns01` | Get a wildcard certificate from Let's Encrypt with a DNS01 challenge. See below. | object | |

`dns01` takes:

| Name | Description | Type |
| --- | --- | --- |
| `dns01.namespace` | Namespace the Certificate, and so its Secret, is created in. Use the namespace of the service that serves it. | string |
| `dns01.cloudflare.email` | Email of your domain's Cloudflare account. | string |
| `dns01.cloudflare.token` | Cloudflare API token with read and write access to the domain. Use an [API token](https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/#api-tokens), not a global API key. | string |
| `dns01.cloudflare.zone` | Cloudflare DNS zone; often the same as the domain. | string |
| `dns01.cloudflare.domain` | Your domain apex, for example `example.com`. | string |
| `dns01.alidns.email` | Email associated with your domain. | string |
| `dns01.alidns.accessToken` | AliDNS API access token with read and write access to the domain. | string |
| `dns01.alidns.secretKey` | AliDNS API secret key. | string |
| `dns01.alidns.regionId` | AliDNS region, for example `cn-beijing`. Defaults to `""`. | string |
| `dns01.alidns.groupName` | Your domain apex, for example `example.com`. | string |

Set either `cloudflare` or `alidns`.

## What `dns01` creates

With `dns01` set, the addon also creates:

- a ClusterIssuer `letsencrypt`, pointed at the Let's Encrypt staging or production API depending on `staging`;
- a Secret holding your DNS provider's credentials, in the cert-manager namespace;
- a Certificate for the domain and its wildcard (`example.com` and `*.example.com`) in `dns01.namespace`. With Cloudflare the certificate is written to the Secret `cloudflare-tls`; with AliDNS, to `alidns-certificate-tls`.

With AliDNS it also installs the [alidns-webhook](https://github.com/DEVmachine-fr/cert-manager-alidns-webhook) chart, which cert-manager needs to solve the challenge.

## Get a wildcard certificate with Cloudflare

1. Enable the addon with your Cloudflare details. Start with `staging=true`:

   ```shell
   vela addon enable cert-manager                      \
       staging=true                                    \
       dns01.namespace="default"                       \
       dns01.cloudflare.email="your-email@example.com" \
       dns01.cloudflare.token="your-token-here"        \
       dns01.cloudflare.zone="example.com"             \
       dns01.cloudflare.domain="example.com"
   ```

2. Follow the challenge in cert-manager's logs (pick the `cert-manager-cert-manager-...` pod):

   ```shell
   vela logs addon-cert-manager -n vela-system
   ```

   While the DNS record propagates you see:

   ```console
   cert-manager/challenges "msg"="propagation check failed" "error"="DNS record for \"example.com\" not yet propagated" ...
   ```

   Once the certificate is issued:

   ```console
   cert-manager/certificaterequests-issuer-acme/sign "msg"="certificate issued" ...
   ```

3. Check the certificate:

   ```shell
   kubectl get certificate cloudflare-certificate -n default
   ```

   `READY` turns `True`, and the Secret `cloudflare-tls` in `default` holds the certificate. Name it wherever a route takes a TLS Secret.

4. When it works, enable the addon again with `staging=false` (or leave `staging` out) to get a trusted certificate.

## Get a wildcard certificate with AliDNS

```shell
vela addon enable cert-manager                       \
    staging=true                                     \
    dns01.namespace="default"                        \
    dns01.alidns.email="your-email@example.com"      \
    dns01.alidns.accessToken="your-accesstoken-here" \
    dns01.alidns.secretKey="your-secretKey-here"     \
    dns01.alidns.regionId="cn-beijing"               \
    dns01.alidns.groupName="example.com"
```

The certificate is `alidns-certificate` in `dns01.namespace`, and its Secret is `alidns-certificate-tls`.
