---
title: Debugging KubeVela webhooks
---

This guide runs vela-core on your workstation and points the cluster's
admission webhooks at it. Use it for local k3d or kind development.

For controller debugging without webhooks, see
[Debugging KubeVela controllers](./debugging-kubevela-controllers.md).

## Before you start

You need:

- Go 1.27.1 or later;
- `kubectl`, `openssl`, and `perl`;
- a local Kubernetes cluster;
- the KubeVela source repository;
- an IDE with Go debugging support.

Check the current cluster before running the setup script:

```shell
kubectl config current-context
kubectl cluster-info
```

The script creates webhook configurations with `failurePolicy: Fail`. While
vela-core is stopped, create and update requests for covered resources fail.
Run the cleanup command when you finish.

## Install the CRDs

From the KubeVela repository root:

```shell
make manifests
kubectl apply -f charts/vela-core/crds/
```

The setup script checks for all required KubeVela CRDs. It stops with an error
if any of them are missing.

## Configure local webhook access

Create `setup-debugger.sh` in the KubeVela repository root. Copy this script:

<details>
<summary>setup-debugger.sh</summary>

```bash
#!/usr/bin/env bash
# Webhook debugging setup for a vela-core running on your host, reached by IP.
#
# The webhook configurations point at the host's LAN IP. The serving
# certificate carries SANs for the IP and for the usual host aliases
# (host.docker.internal, host.k3d.internal, ...), so the cert stays valid
# whichever address a webhook URL uses.
#
# Run it before starting vela-core. For local k3d/kind development only. With
# failurePolicy: Fail an unreachable webhook blocks writes to the covered
# resources cluster-wide; run "$0 --cleanup" when you stop debugging.
#
# Usage: ./setup-debugger.sh [IP_ADDRESS] [PORT]
#        ./setup-debugger.sh --cleanup

set -euo pipefail

CERT_DIR="k8s-webhook-server/serving-certs"
NAMESPACE="vela-system"
SECRET_NAME="webhook-server-cert"
WEBHOOK_CONFIG_NAME="kubevela-vela-core-admission"
KUBE_CONTEXT="${KUBE_CONTEXT:-$(kubectl config current-context 2>/dev/null || true)}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${YELLOW}==> $*${NC}"; }
ok()   { echo -e "${GREEN}$*${NC}"; }
die()  { echo -e "${RED}ERROR: $*${NC}" >&2; exit 1; }
k()    { kubectl --context "${KUBE_CONTEXT}" "$@"; }

if [[ "${1:-}" == "--cleanup" ]]; then
    [[ -n "${KUBE_CONTEXT}" ]] || die "no Kubernetes context is selected"
    k delete validatingwebhookconfiguration "${WEBHOOK_CONFIG_NAME}" --ignore-not-found
    k delete mutatingwebhookconfiguration "${WEBHOOK_CONFIG_NAME}" --ignore-not-found
    k delete secret "${SECRET_NAME}" -n "${NAMESPACE}" --ignore-not-found
    ok "Webhook configurations and debug Secret removed from ${KUBE_CONTEXT}"
    exit 0
fi

detect_host_ip() {
    local ip=""
    if [[ "$(uname)" == "Darwin" ]]; then
        ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
    elif command -v ip &> /dev/null; then
        ip=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") print $(i+1)}')
    fi
    echo "${ip}"
}

HOST_IP="${1:-$(detect_host_ip)}"
WEBHOOK_PORT="${2:-9445}"

[[ -n "${HOST_IP}" ]] || die "could not detect host IP; pass it as the first argument"
[[ "${HOST_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "'${HOST_IP}' is not a valid IPv4 address"
if ! [[ "${WEBHOOK_PORT}" =~ ^[0-9]+$ ]] ||
    (( WEBHOOK_PORT < 1 || WEBHOOK_PORT > 65535 )); then
    die "'${WEBHOOK_PORT}' is not a valid port"
fi

echo -e "${GREEN}=== KubeVela Webhook Debug Setup (IP mode) ===${NC}"
echo "Host IP: ${HOST_IP}"
echo "Port:    ${WEBHOOK_PORT}"

check_prerequisites() {
    info "Checking prerequisites"
    [[ -f go.mod && -d cmd/core ]] || die "run this script from the kubevela repo root"
    command -v kubectl &> /dev/null || die "kubectl is not installed"
    command -v openssl &> /dev/null || die "openssl is not installed"
    command -v perl &> /dev/null || die "perl is not installed"

    local server
    [[ -n "${KUBE_CONTEXT}" ]] || die "no Kubernetes context is selected"
    server=$(kubectl config view --context "${KUBE_CONTEXT}" --minify -o jsonpath='{.clusters[0].cluster.server}' 2>/dev/null || true)
    echo "Context: ${KUBE_CONTEXT} (${server:-unknown server})"
    if ! k get --raw /readyz &> /dev/null; then
        echo "Cannot reach the API server for context '${KUBE_CONTEXT}'."
        if [[ "${KUBE_CONTEXT}" == k3d-* ]] && command -v k3d &> /dev/null; then
            echo "If the k3d cluster was restarted, its port may have changed. Refresh it with:"
            echo "  k3d kubeconfig merge ${KUBE_CONTEXT#k3d-} --kubeconfig-merge-default --kubeconfig-switch-context"
        fi
        die "fix kubeconfig and re-run"
    fi
    local required_crds=(
        applications.core.oam.dev
        applicationrevisions.core.oam.dev
        resourcetrackers.core.oam.dev
        componentdefinitions.core.oam.dev
        traitdefinitions.core.oam.dev
        policydefinitions.core.oam.dev
        workflowstepdefinitions.core.oam.dev
        sourcedefinitions.core.oam.dev
        definitionrevisions.core.oam.dev
        workloaddefinitions.core.oam.dev
        policies.core.oam.dev
        workflows.core.oam.dev
        configs.config.oam.dev
        configtemplates.config.oam.dev
    )
    if ! k get crd "${required_crds[@]}" &> /dev/null; then
        die "one or more required CRDs are missing; run 'make manifests && kubectl --context ${KUBE_CONTEXT} apply -f charts/vela-core/crds/'"
    fi
    ok "Prerequisites OK"
}

generate_certificates() {
    info "Generating CA and serving certificate in ${CERT_DIR}"
    mkdir -p "${CERT_DIR}"
    rm -f "${CERT_DIR}"/{ca.key,ca.crt,ca.srl,tls.key,tls.crt,webhook.csr,openssl-webhook.cnf}

    openssl genrsa -out "${CERT_DIR}/ca.key" 2048 2> /dev/null
    openssl req -x509 -new -nodes -key "${CERT_DIR}/ca.key" -days 365 \
        -out "${CERT_DIR}/ca.crt" -subj "/CN=webhook-ca"

    cat > "${CERT_DIR}/openssl-webhook.cnf" << EOF
[ req ]
prompt             = no
default_md         = sha256
distinguished_name = dn
req_extensions     = req_ext

[ dn ]
CN = ${HOST_IP}

[ req_ext ]
basicConstraints = CA:FALSE
keyUsage         = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName   = @alt_names

[ alt_names ]
IP.1  = ${HOST_IP}
IP.2  = 127.0.0.1
DNS.1 = localhost
DNS.2 = host.docker.internal
DNS.3 = host.k3d.internal
DNS.4 = host.lima.internal
DNS.5 = vela-webhook.${NAMESPACE}.svc
DNS.6 = vela-webhook.${NAMESPACE}.svc.cluster.local
EOF

    openssl genrsa -out "${CERT_DIR}/tls.key" 2048 2> /dev/null
    openssl req -new -key "${CERT_DIR}/tls.key" -out "${CERT_DIR}/webhook.csr" \
        -config "${CERT_DIR}/openssl-webhook.cnf"
    openssl x509 -req -in "${CERT_DIR}/webhook.csr" \
        -CA "${CERT_DIR}/ca.crt" -CAkey "${CERT_DIR}/ca.key" -CAcreateserial \
        -out "${CERT_DIR}/tls.crt" -days 365 \
        -extensions req_ext -extfile "${CERT_DIR}/openssl-webhook.cnf" 2> /dev/null

    openssl x509 -in "${CERT_DIR}/tls.crt" -noout -ext subjectAltName
    openssl verify -CAfile "${CERT_DIR}/ca.crt" "${CERT_DIR}/tls.crt" > /dev/null
    ok "Certificates generated"
}

create_k8s_secret() {
    info "Creating secret ${NAMESPACE}/${SECRET_NAME}"
    k create namespace "${NAMESPACE}" --dry-run=client -o yaml | k apply -f - > /dev/null
    k create secret tls "${SECRET_NAME}" -n "${NAMESPACE}" \
        --cert="${CERT_DIR}/tls.crt" --key="${CERT_DIR}/tls.key" \
        --dry-run=client -o yaml | k apply -f - > /dev/null
    ok "Secret ready"
}

# webhook_entry <name> <path> <apiGroup> <apiVersion> <resource>
webhook_entry() {
    cat << EOF
- name: $1
  clientConfig:
    url: https://${HOST_IP}:${WEBHOOK_PORT}/$2
    caBundle: ${CA_BUNDLE}
  rules:
  - apiGroups: ["$3"]
    apiVersions: ["$4"]
    resources: ["$5"]
    operations: ["CREATE", "UPDATE"]
    scope: "*"
  admissionReviewVersions: ["v1", "v1beta1"]
  sideEffects: None
  failurePolicy: Fail
  matchPolicy: Equivalent
  timeoutSeconds: 10
EOF
}

apply_webhook_configs() {
    CA_BUNDLE=$(base64 < "${CERT_DIR}/ca.crt" | tr -d '\n')

    info "Applying ValidatingWebhookConfiguration ${WEBHOOK_CONFIG_NAME}"
    {
        cat << EOF
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: ${WEBHOOK_CONFIG_NAME}
webhooks:
EOF
        webhook_entry validating.core.oam-dev.v1beta1.componentdefinitions    validating-core-oam-dev-v1beta1-componentdefinitions    core.oam.dev   v1beta1  componentdefinitions
        webhook_entry validating.core.oam.dev.v1beta1.traitdefinitions        validating-core-oam-dev-v1beta1-traitdefinitions        core.oam.dev   v1beta1  traitdefinitions
        webhook_entry validating.core.oam-dev.v1beta1.policydefinitions       validating-core-oam-dev-v1beta1-policydefinitions       core.oam.dev   v1beta1  policydefinitions
        webhook_entry validating.core.oam-dev.v1beta1.workflowstepdefinitions validating-core-oam-dev-v1beta1-workflowstepdefinitions core.oam.dev   v1beta1  workflowstepdefinitions
        webhook_entry validating.core.oam-dev.v1beta1.sourcedefinitions       validating-core-oam-dev-v1beta1-sourcedefinitions       core.oam.dev   v1beta1  sourcedefinitions
        webhook_entry validating.config.oam.dev.v1alpha1.configtemplates      validating-config-oam-dev-v1alpha1-configtemplates      config.oam.dev v1alpha1 configtemplates
        webhook_entry validating.config.oam.dev.v1alpha1.configs              validating-config-oam-dev-v1alpha1-configs              config.oam.dev v1alpha1 configs
        webhook_entry validating.core.oam.dev.v1beta1.applications            validating-core-oam-dev-v1beta1-applications            core.oam.dev   v1beta1  applications
    } | k apply -f -

    # Mirrors charts/vela-core/templates/admission-webhooks/mutatingWebhookConfiguration.yaml.
    info "Applying MutatingWebhookConfiguration ${WEBHOOK_CONFIG_NAME}"
    {
        cat << EOF
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: ${WEBHOOK_CONFIG_NAME}
webhooks:
EOF
        webhook_entry mutating.core.oam.dev.v1beta1.applications         mutating-core-oam-dev-v1beta1-applications         core.oam.dev v1beta1 applications
        webhook_entry mutating.core.oam-dev.v1beta1.componentdefinitions mutating-core-oam-dev-v1beta1-componentdefinitions core.oam.dev v1beta1 componentdefinitions
    } | k apply -f -

    ok "Webhook configurations applied"
}

# Connections to a closed port on the host's own LAN IP can hang instead of being
# refused (VPN/firewall drops the SYN), so every probe needs a hard timeout.
with_timeout() {
    local secs=$1
    shift
    perl -e 'alarm shift; exec @ARGV' "${secs}" "$@"
}

served_fingerprint() {
    with_timeout 3 openssl s_client -connect "${HOST_IP}:${WEBHOOK_PORT}" -servername "${HOST_IP}" < /dev/null 2> /dev/null \
        | openssl x509 -noout -fingerprint -sha256 2> /dev/null || true
}

verify_served_cert() {
    info "Checking the certificate served on ${HOST_IP}:${WEBHOOK_PORT}"
    local served expected
    expected=$(openssl x509 -in "${CERT_DIR}/tls.crt" -noout -fingerprint -sha256)
    served=$(served_fingerprint)
    if [[ -z "${served}" ]]; then
        echo "vela-core is not running on ${HOST_IP}:${WEBHOOK_PORT} yet; skipping. Start it from your IDE (see below)."
        echo "Note: until it is up, applies of the covered resources fail because of failurePolicy: Fail."
        echo "To check the served cert later:"
        echo "  openssl s_client -connect ${HOST_IP}:${WEBHOOK_PORT} </dev/null 2>/dev/null | openssl x509 -noout -ext subjectAltName"
        return
    fi

    # A running vela-core reloads certs from CertDir on change, which takes a few seconds.
    for _ in 1 2 3 4 5 6 7 8 9 10; do
        [[ "${served}" == "${expected}" ]] && break
        sleep 1
        served=$(served_fingerprint)
    done
    if [[ -z "${served}" ]]; then
        echo -e "${RED}Port ${WEBHOOK_PORT} is open but did not complete a TLS handshake.${NC}"
        echo "vela-core may be paused at a breakpoint; resume it and re-run this script."
        return
    fi
    if [[ "${served}" == "${expected}" ]]; then
        ok "vela-core is serving the new certificate"
    else
        echo -e "${RED}vela-core is serving a different certificate than ${CERT_DIR}/tls.crt.${NC}"
        echo "Restart the debug session and check that --webhook-cert-dir points at $(pwd)/${CERT_DIR}"
    fi
}

show_next_steps() {
    local active_ctx
    active_ctx=$(kubectl config current-context 2>/dev/null || true)
    echo
    ok "========================================="
    ok "Webhook debugging setup complete"
    ok "========================================="
    echo "Webhook URL: https://${HOST_IP}:${WEBHOOK_PORT}"
    echo "Cert dir:    $(pwd)/${CERT_DIR}"
    if [[ -n "${active_ctx}" && "${active_ctx}" != "${KUBE_CONTEXT}" ]]; then
        echo
        echo "Note: current kubectl context is '${active_ctx}', while webhooks were applied to '${KUBE_CONTEXT}'."
        echo "Switch context before starting vela-core: kubectl config use-context ${KUBE_CONTEXT}"
    fi
    echo
    echo "Debug cmd/core/main.go with:"
    echo "  --use-webhook=true"
    echo "  --webhook-port=${WEBHOOK_PORT}"
    echo "  --webhook-cert-dir=$(pwd)/${CERT_DIR}"
    echo "  --enable-leader-election=false"
    echo
    echo "If your IP changes (VPN, new network), re-run this script."
    echo "Remove the webhooks when done: $0 --cleanup"
}

main() {
    check_prerequisites
    generate_certificates
    create_k8s_secret
    apply_webhook_configs
    verify_served_cert
    show_next_steps
}

main
```

</details>

Make it executable, then run it:

```shell
chmod +x setup-debugger.sh
./setup-debugger.sh
```

The script:

1. Detects the workstation IPv4 address and uses port `9445`.
2. Generates a CA and serving certificate in
   `k8s-webhook-server/serving-certs`.
3. Adds the workstation IP and common container host names to the certificate
   SANs.
4. Creates `vela-system/webhook-server-cert`.
5. Creates validating and mutating webhook configurations that point to the
   workstation.
6. Checks the certificate served by vela-core when the server is already
   running.

Pass an address and port when automatic detection is not correct:

```shell
./setup-debugger.sh 192.168.1.20 9445
```

To target a specific context during setup:

```shell
KUBE_CONTEXT=k3d-kubevela ./setup-debugger.sh
```

`vela-core` connects to the `current-context` in `KUBECONFIG`, not
`KUBE_CONTEXT`. If you override `KUBE_CONTEXT`, switch the active context with
`kubectl config use-context <context>` or point `KUBECONFIG` at a dedicated file
for that cluster before starting the debugger.

The generated certificate includes these SANs:

- the selected workstation IP;
- `127.0.0.1` and `localhost`;
- `host.docker.internal`;
- `host.k3d.internal`;
- `host.lima.internal`;
- `vela-webhook.vela-system.svc` and its cluster-local form.

## Start vela-core

Configure the IDE to run `cmd/core/main.go` with:

```text
--use-webhook=true
--webhook-port=9445
--webhook-cert-dir=<repository>/k8s-webhook-server/serving-certs
--enable-leader-election=false
```

Set these environment variables:

```text
KUBECONFIG=<path to kubeconfig>
POD_NAMESPACE=vela-system
```

Do not change the defaults in `cmd/core/app/config/webhook.go`. Command-line
flags keep local settings out of source control.

Do not pass these chart-only certificate flags to a local controller:

- `--webhook-tls-secret`
- `--webhook-configuration`
- `--webhook-failure-policy`
- `--webhook-conversion-crds`

Those flags are for in-cluster installations. They tell vela-core to create
or renew the chart's Secret and update Service-based webhook configurations.
The local configuration uses URL-based webhooks and certificates from the
local directory.

If macOS clang fails while linking against the local SDK, set
`CGO_ENABLED=0` in the IDE environment.

## Verify the setup

### Check the TLS server

Use the CA generated by the script. Do not use `curl -k`, because it hides CA
and SAN errors.

```shell
curl --cacert k8s-webhook-server/serving-certs/ca.crt \
  -H 'Content-Type: application/json' \
  -X POST \
  "https://<workstation-ip>:9445/mutating-core-oam-dev-v1beta1-componentdefinitions?timeout=10s"
```

An empty request is rejected, but the response proves that TLS and the
webhook route work:

```json
{"kind":"AdmissionReview","apiVersion":"admission.k8s.io/v1","response":{"uid":"","allowed":false,"status":{"metadata":{},"message":"there is no content to decode","code":400}}}
```

### Check the cluster configuration

```shell
kubectl get validatingwebhookconfiguration \
  kubevela-vela-core-admission -o yaml

kubectl get mutatingwebhookconfiguration \
  kubevela-vela-core-admission -o yaml
```

Check that:

- every `clientConfig.url` uses the workstation address and debug port;
- every `caBundle` contains the generated CA;
- `failurePolicy` is `Fail`;
- `matchPolicy` is `Equivalent`;
- `timeoutSeconds` is `10`.

### Send a real admission request

Apply a ComponentDefinition while the debugger is running:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: webhook-debug
  namespace: default
spec:
  workload:
    definition:
      apiVersion: v1
      kind: ConfigMap
  schematic:
    cue:
      template: |
        output: {
          apiVersion: "v1"
          kind: "ConfigMap"
          metadata: name: context.name
        }
```

Set a breakpoint in one of these handlers before applying it:

- `pkg/webhook/core.oam.dev/v1beta1/componentdefinition/mutating_handler.go`
- `pkg/webhook/core.oam.dev/v1beta1/componentdefinition/component_definition_validating_handler.go`
- `pkg/webhook/core.oam.dev/v1beta1/application/mutating_handler.go`
- `pkg/webhook/core.oam.dev/v1beta1/application/validating_handler.go`

## Certificate behavior in Helm installations

The Helm chart uses a different flow. When cert-manager is off and
`admissionWebhooks.patch.enabled=true`, the chart passes
`--webhook-tls-secret` to vela-core.

vela-core then:

- creates or reuses `<fullname>-admission`;
- writes the serving certificate to its certificate directory;
- sets the `caBundle` on both webhook configurations;
- sets `failurePolicy` after the webhook server starts;
- checks the certificate and webhook settings every minute.

The old `kube-webhook-certgen` Jobs are not used in KubeVela 1.12. Existing
Secrets created by those Jobs are reused during an upgrade. See
[Runtime certificates](/upgrade-guides/v1.12/#runtime-certificates) in the v1.11 to v1.12
upgrade guide.

## Cleanup

Stop vela-core, then run:

```shell
./setup-debugger.sh --cleanup
```

If you used `KUBE_CONTEXT` during setup, pass the same `KUBE_CONTEXT` value to
`--cleanup`.

This removes both webhook configurations and the debug TLS Secret. It leaves
the local certificate files for inspection. Running the setup script again
replaces them.

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| Webhook calls time out | Confirm that vela-core listens on the URL in `clientConfig.url` and that the cluster can reach the workstation address. |
| TLS verification fails | Regenerate the certificates after changing networks or IP addresses. Compare the webhook `caBundle` with `ca.crt`. |
| Resources cannot be created after debugging | Run `./setup-debugger.sh --cleanup`. The webhook uses `failurePolicy: Fail`. |
| vela-core cannot find certificates | Use an absolute path for `--webhook-cert-dir`. |
| macOS linking fails with malformed SDK files | Run with `CGO_ENABLED=0` or repair the local Command Line Tools installation. |
