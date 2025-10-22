---
title: Quick Install
---

Choose the installation method that best fits your environment:

## Option A: Standalone (No Kubernetes Required)

Perfect for beginners and local development. VelaD includes everything you need:

```bash
# Install VelaD (includes KubeVela + Kubernetes)
curl -fsSl https://static.kubevela.net/script/install-velad.sh | bash

# Start KubeVela with UI console
velad install --set enableHA=false
```

> 📖 **Need more details?** See the full [Standalone Installation Guide](../installation/standalone) for platform-specific instructions.

## Option B: Existing Kubernetes Cluster

If you already have a Kubernetes cluster:

```bash
# Install the vela CLI
curl -fsSl https://kubevela.io/script/install.sh | bash

# Install KubeVela to your cluster
vela install

# Install the UI console (VelaUX)
vela addon enable velaux
```

> 📖 **Need more details?** See the full [Kubernetes Installation Guide](../installation/kubernetes) for Helm installation and production configurations.

## Verify Installation

```bash
vela version
```

You should see:
```
CLI Version: v1.10.x
Core Version: v1.10.x
```

## Next Steps

✅ Installation complete! Now continue to [Deploy Your First App](../getting-started/first-application).