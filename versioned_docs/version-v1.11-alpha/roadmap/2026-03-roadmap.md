---
title:  Roadmap 2026.03
---

Date: 2026-01-01 to 2026-03-31

## Core Platform

- Native Helm Chart Support
  * Make Helm a first class citizen within KubeVela, adding native support through CueX and a supporting helmchart component. 
  * This will allow KubeVela to deploy Helm Charts directly, without the need for external tools or addons like FluxCD and will use the existing KubeVela multi-cluster dispatch system for better awareness of the underlying managed resources within KubeVela. 
- Definition Quality Improvements
  * Review all definitions with focus on workflow steps. Validate definitions work in both Applications and WorkflowRuns. 
  * Add test cases for each definition, ensure all definitions are working as intended and re-establish consistency between Applications and WorkflowRuns.
- Testing Infrastructure Enhancement
  * Improve E2E test suite for faster and more reliable releases. Add better test coverage and automation.


## Best practices and community

- Community Growth Program
  * Create clear contributor guidelines and recognition system. 
  * Add more examples to the repository showing real use cases. 
  * Make it easier to contribute components and traits with better templates. 
  * Remove outdated documentation and update examples to current versions.
