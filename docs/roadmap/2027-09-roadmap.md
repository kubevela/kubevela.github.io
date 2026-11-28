---
title:  Roadmap 2027.09
---

Date: 2027-07-01 to 2027-09-30

## User Experience

- KubeVela MCP server: safer changes from AI assistants
  * The `vela mcp` server shipped in v1.12. AI assistants such as Claude, Copilot or Cursor can already use it to look up definitions, check Application status, preview a change to an Application, and see what a definition change does to the first Applications that use it. See [AI agents with vela mcp](../tutorials/vela-mcp.md).
  * Show every Application a definition change will affect, not only the first few, before it is made.
  * Hold a change made through the MCP server for a person to approve, outside the Application's own workflow.
  * Use the MCP server from VelaUX, with the same permissions the user already has.
  * Design: [KEP: Vela MCP](https://github.com/kubevela/kubevela/blob/master/design/vela-cli/kep-vela-mcp.md)

- DefKit: write definitions in Go
  * DefKit, introduced in v1.11, lets platform teams write, test and publish definitions in Go instead of CUE.
  * Convert existing CUE definitions to Go automatically, so teams do not have to rewrite them by hand.
  * Ship definitions written in Go inside addons, and share and version them like any other Go package.
  * Provide editor plugins to write, check and preview definitions, with errors shown as you type.
  * Add step-by-step guides and examples for writing, testing and publishing definitions with DefKit.

## Performance and Scale

- Find KubeVela's limits, using 2021 as the starting point
  * Use the [2021 performance test](https://kubevela.io/blog/2021/08/30/kubevela-performance-test/) as a reference. Run the same Application shape (a webservice and a worker component with scaler, sidecar, ingress and configmap traits) at the same scales: 3,000 Applications on 200 nodes, 5,000 on 500 nodes and 12,000 on 1,000 nodes, simulated with kubemark. This shows whether the current release is faster or slower than in 2021.
  * Then keep increasing the number of Applications, components per Application and clusters until the controller or the Kubernetes API server fails, and record where and why it fails, for example running out of memory, a growing work queue, or API server throttling.
  * Publish the results next to the 2021 ones: time to create and delete all Applications, reconcile latency (average and p99), controller CPU and memory, and the point where each test failed. For reference, in 2021 the controller created 3,000 Applications in 25 minutes with 0.5 CPU and 1 Gi of memory, and 99% of reconciles finished in under 800 ms.
  * Cover what the 2021 test left out: Workflows, multi-cluster delivery, and the management and target cluster setup planned for Summer 2027.
  * Update the recommended controller settings (CPU, memory, concurrent reconciles, API QPS and burst) for each scale, and document the largest setup that has been tested to work.
  * Make the test setup and dashboards reusable, so the same test can run before each release and catch slowdowns early.
