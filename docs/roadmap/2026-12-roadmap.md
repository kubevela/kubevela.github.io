---
title:  Roadmap 2026.12
---

Date: 2026-10-01 to 2026-12-31

## Core Platform

- Namespace lifecycle management
  * Resolve stale GroupVersion discovery issues when deleting namespaces in Gitops plugin scenarios. 
  * This guarantees that deleting a namespace results in a complete and clean removal of all related KubeVela resources, preventing orphaned components.

- Workflow debugging for external templates
  * Support debugging workflows that reference external templates. 
  * Currently, variables show as null when debugging workflows using workflow: ref.

- Data passing between components
  * Enable passing data from workload to traits without duplicate parameter definitions.
