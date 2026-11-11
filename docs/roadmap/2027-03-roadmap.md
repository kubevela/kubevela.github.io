---
title:  Roadmap 2027.03
---

Date: 2027-01-01 to 2027-03-31

## Core Platform

- Day 2 operations shipped with components
  * Allow component authors to package tasks such as backup, restore, failover or password rotation with their component, so every team using it gets these tasks too.
  * Users can list the tasks available for a component or Application and run them without knowing its internal details, such as a bucket name or database address.
  * Tasks can attach to a whole Application and run the matching task on each of its components, across clusters.
  * Long tasks can pause for a person to approve before they continue, for example before switching traffic in a failover.
  * Platform teams decide who can run which task on which Application. KubeVela coordinates the task and records what happened, while the actual work is done by existing tools such as Argo Workflows, Crossplane, cloud APIs or CI pipelines.

- More from configuration resources
  * Builds on v1.12, where configs and config templates became regular Kubernetes resources.
  * Sensitive configuration values can be kept in Kubernetes secrets, and updates to those secrets are picked up automatically.
  * Send ready-to-use configuration directly to other clusters, without creating extra Applications to carry it.
