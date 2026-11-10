---
title:  Roadmap 2027.06
---

Date: 2027-04-01 to 2027-06-30

## Core Platform

- Each cluster runs its own components
  * Add a small controller on every target cluster that deploys, updates and health-checks its components locally.
  * Workflows are always available on every cluster, so steps such as database migrations no longer depend on an optional addon.

- A lighter management cluster
  * The management cluster only decides which components go to which clusters and watches whether they are healthy.
  * It needs far fewer permissions on target clusters, which makes it safer to run and able to manage more clusters.

- Choose how components reach clusters
  * Deliver components to a cluster directly, through a gateway, or with pull-based tools such as Open Cluster Management.
  * Every delivery method gets the same features and the same health status, and platform teams can customize how delivery works.
