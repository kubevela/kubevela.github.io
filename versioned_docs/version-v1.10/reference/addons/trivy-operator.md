---
title: Trivy-operator
---

This addon installs the [Aqua Security Trivy Operator](https://github.com/aquasecurity/trivy-operator), which scans the images of the workloads in your cluster for known vulnerabilities and writes what it finds to `VulnerabilityReport` resources.

The addon deploys the operator's Helm chart (`trivy-operator` 0.9.1, from `https://aquasecurity.github.io/helm-charts`) into the `trivy-system` namespace by default, with `trivy.ignoreUnfixed` on, so only vulnerabilities that have a fix are reported. It depends on the `fluxcd` addon, which installs the chart, and enables it if needed.

## Install

```shell
vela addon enable trivy-operator
```

## Uninstall

```shell
vela addon disable trivy-operator
```

## See the scan results

Once the operator is running, it scans every workload in the cluster. Check that the addon is healthy:

```shell
vela status addon-trivy-operator -n vela-system
```

Each scanned workload gets a `VulnerabilityReport` in its own namespace, with a count of the vulnerabilities found at each severity:

```shell
kubectl get vulnerabilityreports -A
```

To see the vulnerabilities in one report, with their IDs, the affected package and the fixed version:

```shell
kubectl get vulnerabilityreports -n <namespace> <name> -o yaml
```

## The `trivy-check` step

The addon also adds a `trivy-check` workflow step, meant to read the scan of a workload an application just deployed. On this release it fails with `invalid cue task for evaluation: runtime error: invalid memory address or nil pointer dereference`, because it lists objects with `op.#List`, which is broken here. KubeVela 1.12 fixes it; on this release, read the `VulnerabilityReport` resources directly, as above.

## Reference

- [Trivy Operator documentation](https://aquasecurity.github.io/trivy-operator/)
- [The addon's source](https://github.com/kubevela/catalog/tree/master/addons/trivy-operator)
