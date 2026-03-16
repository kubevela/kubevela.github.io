---
title:  Roadmap 2026.09
---

Date: 2026-07-01 to 2026-09-30

## Core Platform

- Cluster Grouping for Policies
  * Allow creating reusable cluster groups for multi-cluster deployments. 
  * Define groups as collections of clusters or cluster label selectors. 
  * Groups should be referenceable within existing Topology Policies to allow reusability and consistency across Applications.

- Reusable Label Management
  * Create labelsets using Config and ConfigTemplate for organizing governance data like teams, organizations, and cluster information. 
  * LabelSets will be referenceable within Applications to better support governance requirements.

- Crossplane credentials management
  * Allow specifying cloud credentials for Crossplane integration via Kubernetes secrets.
