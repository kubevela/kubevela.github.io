---
title:  Roadmap 2027.06
---

Date: 2027-04-01 to 2027-06-30

## Core Platform

The items below change how KubeVela runs Applications across many clusters (multi-cluster). They are also the foundation for the cluster management work planned for Winter 2027 in the [Cluster Infrastructure KEP](https://github.com/kubevela/kubevela/blob/master/design/vela-core/kep-cluster-infrastructure.md).

- Each cluster runs its own components
  * Add a controller on every target cluster that deploys, updates and health-checks its components locally, instead of the management cluster doing this work remotely.
  * Components can also be deployed directly on a cluster, without wrapping them in an Application.
  * Workflows are always available on every cluster, so steps such as database migrations no longer depend on an optional addon.
  * Design: [KEP-2.2: Spoke Component-Controller & Workflow Engine](https://github.com/kubevela/kubevela/blob/master/design/vela-core/keps/2.2-spoke-controller/README.md)

- A lighter management cluster
  * The management cluster only decides which components go to which clusters and watches whether they are healthy.
  * It needs far fewer permissions on target clusters, which makes it safer to run and able to manage more clusters.
  * Design: [KEP-2.3: Hub Application-Controller Integration](https://github.com/kubevela/kubevela/blob/master/design/vela-core/keps/2.3-hub-controller/README.md)

- Choose how components reach clusters
  * Deliver components to a cluster directly, through a gateway, or with pull-based tools such as Open Cluster Management.
  * Every delivery method gets the same features and the same health status, and platform teams can customize how delivery works.
  * Design: [KEP-2.4: Dispatcher Implementations](https://github.com/kubevela/kubevela/blob/master/design/vela-core/keps/2.4-dispatchers/README.md)
