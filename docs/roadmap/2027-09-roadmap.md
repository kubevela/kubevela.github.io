---
title:  Roadmap 2027.09
---

Date: 2027-07-01 to 2027-09-30

## User Experience

- KubeVela MCP server: safer changes from AI assistants
  * A `vela mcp` server lets AI assistants such as Claude, Copilot or Cursor look up definitions, check Application status and preview changes.
  * Show which Applications a definition change will affect before it is made.
  * Check a new definition for mistakes before it is published.
  * Changes made through the MCP server can be paused or stopped, and only a person can approve them to continue.
  * Use the MCP server from VelaUX, with the same permissions the user already has.
  * Design: [KEP: Vela MCP](https://github.com/kubevela/kubevela/blob/master/design/vela-cli/kep-vela-mcp.md)

- DefKit: write definitions in Go
  * DefKit, introduced in v1.11, lets platform teams write, test and publish definitions in Go instead of CUE.
  * Convert existing CUE definitions to Go automatically, so teams do not have to rewrite them by hand.
  * Ship definitions written in Go inside addons, and share and version them like any other Go package.
  * Provide editor plugins to write, check and preview definitions, with errors shown as you type.
  * Add step-by-step guides and examples for writing, testing and publishing definitions with DefKit.
