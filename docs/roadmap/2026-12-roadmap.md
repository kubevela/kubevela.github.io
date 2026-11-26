---
title:  Roadmap 2026.12
---

Date: 2026-10-01 to 2026-12-31

## Core Platform

- Namespace lifecycle management
  * Deleting a namespace removes every KubeVela resource in it, even when an API those resources used is no longer served (seen with GitOps tools).

- Workflow debugging for external templates
  * Support debugging workflows that reference external templates. 
  * Currently, variables show as null when debugging workflows using workflow: ref.

- Data passing between components
  * Enable passing data from workload to traits without duplicate parameter definitions.
