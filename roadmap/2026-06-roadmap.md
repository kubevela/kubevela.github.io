---
title:  Roadmap 2026.06
---

Date: 2026-04-01 to 2026-06-30

## Core Platform

- Config Validation via Webhooks
  * Replace CLI validation with webhook-based approach to guarantee the integrity of configuration files and ensure that configuration cannot bypass validations. 
  * This will ensure better integration with GitOps practices, reduce misconfiguration in deployments and enhance KubeVela configurations ability to act as a foundation for future enhancements.

- Config Provider Definition
  * Add support for validated and type safe definitions (via ConfigTemplates) for data/configuration retrieval. 
  * This would support the existing definitions and allow for more dynamic configuration of Applications. 
  * These definitions would be written in familiar cue syntax with CueX powering the ability to retrieve configuration from external systems and other resources. 

- Declarative Addons
  * Allow Addons to be installed and managed declaratively to better enable their usage within GitOps workflows.

## Third-party integrations and addons

- Addon Ecosystem Refresh
  * Modernize and clean up the Addon catalog to ensure better stability and feature compatibility with the latest cloud and Kubernetes versions. 
