---
title:  Standardizing Cloud Native Application Delivery Across Different Clouds
---

At its heart, Kubernetes is an infrastructure platform: It abstracts at the infrastructure layer, but does little to resolve application layer dependencies.

Today, a Kubernetes application cannot be defined and deployed uniformly across multiple platforms without modification, because its definitions depend on specific platform implementation. For example, one platform might choose Nginx as the ingress solution, while another might choose Traefik.

To solve this problem, we need a standard application model to bridge the gap between application and infrastructure.

This talk introduces Open Application Model (OAM) which enables developers to build and deploy k8s applications in a platform-agnostic way. We will look at how it approaches the problem and how it leverages cloud services and open source projects to facilitate standardized application development across multiple environments. 

<iframe width="720" height="480" src="https://www.youtube.com/embed/0yhVuBIbHcI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
