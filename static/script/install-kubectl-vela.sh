#!/usr/bin/env bash

# Implemented based on Dapr Cli https://github.com/dapr/cli/tree/master/install

# Kubectl-Vela CLI location
: ${KUBECTL_VELA_INSTALL_DIR:="/usr/local/bin"}

# sudo is required to copy binary to KUBECTL_VELA_INSTALL_DIR for linux
: ${USE_SUDO:="false"}

# Http request CLI
KUBECTL_VELA_HTTP_REQUEST_CLI=curl

# GitHub Organization and repo name to download release
GITHUB_ORG=oam-dev
GITHUB_REPO=kubevela

# Kubectl-Vela CLI filename
KUBECTL_VELA_CLI_FILENAME=kubectl-vela

KUBECTL_VELA_CLI_FILE="${KUBECTL_VELA_INSTALL_DIR}/${KUBECTL_VELA_CLI_FILENAME}"

getSystemInfo() {
    ARCH=$(uname -m)
    case $ARCH in
        armv7*) ARCH="arm";;
        aarch64) ARCH="arm64";;
        x86_64) ARCH="amd64";;
    esac

    OS=$(echo `uname`|tr '[:upper:]' '[:lower:]')

    # Most linux distro needs root permission to copy the file to /usr/local/bin
    if [ "$OS" == "linux" ] && [ "$VELA_INSTALL_DIR" == "/usr/local/bin" ]; then
        USE_SUDO="true"
    fi
}

verifySupported() {
    local supported=(darwin-amd64 linux-amd64 linux-arm linux-arm64)
    local current_osarch="${OS}-${ARCH}"

    for osarch in "${supported[@]}"; do
        if [ "$osarch" == "$current_osarch" ]; then
            echo "Your system is ${OS}_${ARCH}"
            return
        fi
    done

    echo "No prebuilt binary for ${current_osarch}"
    exit 1
}

runAsRoot() {
    local CMD="$*"

    if [ $EUID -ne 0 -a $USE_SUDO = "true" ]; then
        CMD="sudo $CMD"
    fi

    $CMD
}

checkHttpRequestCLI() {
    if type "curl" > /dev/null; then
        KUBECTL_VELA_HTTP_REQUEST_CLI=curl
    elif type "wget" > /dev/null; then
        KUBECTL_VELA_HTTP_REQUEST_CLI=wget
    else
        echo "Either curl or wget is required"
        exit 1
    fi
}

checkExistingKubectlVela() {
    if [ -f "$KUBECTL_VELA_CLI_FILE" ]; then
        echo -e "\nKubectl-Vela CLI is detected:"
        $KUBECTL_VELA_CLI_FILE --version
        echo -e "Reinstalling Kubectl-Vela CLI - ${KUBECTL_VELA_CLI_FILE}...\n"
    else
        echo -e "Installing Kubectl-Vela CLI...\n"
    fi
}

getLatestRelease() {
    local velaReleaseUrl="https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/releases"
    local latest_release=""

    if [ "$KUBECTL_VELA_HTTP_REQUEST_CLI" == "curl" ]; then
        latest_release=$(curl -s $velaReleaseUrl | grep \"tag_name\" | grep -v rc | awk 'NR==1{print $2}' |  sed -n 's/\"\(.*\)\",/\1/p')
    else
        latest_release=$(wget -q --header="Accept: application/json" -O - $velaReleaseUrl | grep \"tag_name\" | grep -v rc | awk 'NR==1{print $2}' |  sed -n 's/\"\(.*\)\",/\1/p')
    fi

    if [[ ! "$latest_release" =~ ^v[\.0-9]+$ ]]; then
        echo "Failed to get latest release tag."
        exit 1
    fi

    ret_val=$latest_release
}

downloadFile() {
    LATEST_RELEASE_TAG=$1

    KUBECTL_VELA_CLI_ARTIFACT="${KUBECTL_VELA_CLI_FILENAME}-${LATEST_RELEASE_TAG}-${OS}-${ARCH}.tar.gz"
    # convert `-` to `_` to let it work
    DOWNLOAD_BASE="https://github.com/${GITHUB_ORG}/${GITHUB_REPO}/releases/download"
    DOWNLOAD_URL="${DOWNLOAD_BASE}/${LATEST_RELEASE_TAG}/${KUBECTL_VELA_CLI_ARTIFACT}"

    # Create the temp directory
    KUBECTL_VELA_TMP_ROOT=$(mktemp -dt kubectl-vela-install-XXXXXX)
    ARTIFACT_TMP_FILE="$KUBECTL_VELA_TMP_ROOT/$KUBECTL_VELA_CLI_ARTIFACT"

    echo "Downloading $DOWNLOAD_URL ..."
    if [ "$KUBECTL_VELA_HTTP_REQUEST_CLI" == "curl" ]; then
        curl -SsL "$DOWNLOAD_URL" -o "$ARTIFACT_TMP_FILE"
    else
        wget -q -O "$ARTIFACT_TMP_FILE" "$DOWNLOAD_URL"
    fi

    if [ ! -f "$ARTIFACT_TMP_FILE" ]; then
        echo "failed to download $DOWNLOAD_URL ..."
        exit 1
    fi
}

installFile() {
    tar xf "$ARTIFACT_TMP_FILE" -C "$KUBECTL_VELA_TMP_ROOT"
    local tmp_root_kubectl_vela_cli="$KUBECTL_VELA_TMP_ROOT/${OS}-${ARCH}/$KUBECTL_VELA_CLI_FILENAME"

    if [ ! -f "$tmp_root_kubectl_vela_cli" ]; then
        echo "Failed to unpack Kubectl-Vela CLI executable."
        exit 1
    fi

    chmod o+x $tmp_root_kubectl_vela_cli
    runAsRoot cp "$tmp_root_kubectl_vela_cli" "$KUBECTL_VELA_INSTALL_DIR"

    if [ -f "$KUBECTL_VELA_CLI_FILE" ]; then
        echo "$KUBECTL_VELA_CLI_FILENAME installed into $KUBECTL_VELA_INSTALL_DIR successfully."

        $KUBECTL_VELA_CLI_FILE --version
    else
        echo "Failed to install $KUBECTL_VELA_CLI_FILENAME"
        exit 1
    fi
}

fail_trap() {
    result=$?
    if [ "$result" != "0" ]; then
        echo "Failed to install Kubectl-Vela CLI"
        echo "For support, go to https://kubevela.io"
    fi
    cleanup
    exit $result
}

cleanup() {
    if [[ -d "${KUBECTL_VELA_TMP_ROOT:-}" ]]; then
        rm -rf "$KUBECTL_VELA_TMP_ROOT"
    fi
}

installCompleted() {
    echo -e "\nTo get started with KubeVela, please visit https://kubevela.io"
}

# -----------------------------------------------------------------------------
# main
# -----------------------------------------------------------------------------
trap "fail_trap" EXIT

getSystemInfo
verifySupported
checkExistingKubectlVela
checkHttpRequestCLI


if [ -z "$1" ]; then
    echo "Getting the latest Kubectl-Vela CLI..."
    getLatestRelease
else
    ret_val=v$1
fi

echo "Installing $ret_val Kubectl-Vela CLI..."

downloadFile $ret_val
installFile
cleanup

installCompleted
