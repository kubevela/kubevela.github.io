---
title: Serve HTTPS with cert-manager
---

The `cert-manager` addon installs [cert-manager](https://cert-manager.io/), which issues TLS certificates and renews them before they expire. Here it issues a certificate for the Ingress from [Expose an Application with ingress-nginx](./expose-with-ingress-nginx.md), so start with that example's cluster and `hello` Application.

The issuer below is self-signed, so it works on a laptop with no DNS or public address. On a real cluster you'd use a Let's Encrypt issuer instead; the [cert-manager addon](../cert-manager.md) page shows how.

## Enable the addon

```shell
vela addon enable cert-manager
```

```console
Addon cert-manager enabled successfully.
Please access addon-cert-manager from the following endpoints:
+---------+--------------+--------------------------------------------------------+--------------------------------------------------------+-------+
| CLUSTER |  COMPONENT   |                REF(KIND/NAMESPACE/NAME)                |                        ENDPOINT                        | INNER |
+---------+--------------+--------------------------------------------------------+--------------------------------------------------------+-------+
| local   | cert-manager | Service/cert-manager/cert-manager-cert-manager         | cert-manager-cert-manager.cert-manager:9402            | true  |
| local   | cert-manager | Service/cert-manager/cert-manager-cert-manager-webhook | https://cert-manager-cert-manager-webhook.cert-manager | true  |
+---------+--------------+--------------------------------------------------------+--------------------------------------------------------+-------+
```

## Create an issuer

A ClusterIssuer is cluster-scoped configuration, which an Application deploys like anything else:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: selfsigned-issuer
  namespace: default
spec:
  components:
    - name: issuer
      type: k8s-objects
      properties:
        objects:
          - apiVersion: cert-manager.io/v1
            kind: ClusterIssuer
            metadata:
              name: selfsigned
            spec:
              selfSigned: {}
EOF
```

```shell
kubectl get clusterissuer selfsigned
```

```console
NAME         READY   AGE
selfsigned   True    15s
```

## Ask for a certificate

cert-manager watches Ingresses: one with the `cert-manager.io/cluster-issuer` annotation and a TLS Secret name gets a Certificate created for its hosts, written to that Secret. The `gateway` trait sets both. Update the `hello` Application:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: hello
  namespace: default
spec:
  components:
    - name: hello
      type: webservice
      properties:
        image: hashicorp/http-echo:1.0
        args: ["-text=hello from KubeVela", "-listen=:8080"]
        ports:
          - port: 8080
      traits:
        - type: gateway
          properties:
            domain: hello.localtest.me
            http:
              "/": 8080
            secretName: hello-tls
            annotations:
              cert-manager.io/cluster-issuer: selfsigned
EOF
```

```shell
kubectl get certificate -n default
```

```console
NAME        READY   SECRET      AGE
hello-tls   True    hello-tls   4s
```

## Try it

The certificate is self-signed, so tell `curl` to accept it with `-k`:

```shell
curl -sk https://hello.localtest.me:8443/
```

```console
hello from KubeVela
```

And check the certificate it served:

```shell
openssl s_client -connect 127.0.0.1:8443 -servername hello.localtest.me </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -ext subjectAltName
```

```console
subject=
issuer=
X509v3 Subject Alternative Name: critical
    DNS:hello.localtest.me
```

The subject and issuer are empty: the certificate cert-manager made from the Ingress names the host only in its subject alternative name, and the self-signed issuer signs it with its own key.

## Clean up

```shell
vela delete hello -y
vela delete selfsigned-issuer -y
vela addon disable cert-manager
vela addon disable ingress-nginx
```

Disabling `cert-manager` leaves its CRDs and namespace behind; delete them by hand if you want them gone.

## Reference

- [cert-manager addon](../cert-manager.md)
- [`gateway` trait](/docs/end-user/traits/references#gateway)
