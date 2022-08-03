---
title:  Overview of GitOps
---

> This section will introduce how to use KubeVela in GitOps area and why.

GitOps is a continuous delivery method that allows developers to automatically deploy applications by changing code and declarative configurations in a Git repository, with "git-centric" operations such as PR and commit. For detailed benefits of GitOps, you can refer to [this blog](https://www.weave.works/blog/what-is-gitops-really).

KubeVela as a declarative application delivery control plane can be naturally used in GitOps approach, and this will provide below extra bonus to end users alongside with GitOps benefits:

- application delivery workflow (CD pipeline)
  - i.e. KubeVela supports pipeline style application delivery process in GitOps, instead of simply declaring final status;
- handling deployment [dependencies and designing typologies (DAG)](../end-user/workflow/component-dependency-parameter);
- [unified higher level abstraction](../getting-started/core-concept) atop various GitOps tools' primitives;
- declare, provision and consume [cloud resources](../tutorials/consume-cloud-services) in unified application definition;
- various out-of-box deployment strategies (Canary, Blue-Green ...);
- various out-of-box hybrid/multi-cloud deployment policies (placement rule, cluster selectors etc.);
- Kustomize-style patch for multi-env deployment without the need to learn Kustomize at all;
- ... and much more.

In the following sections, we will introduce steps of using KubeVela directly in GitOps approach. You can choose any of the following addons for the whole GitOps process:

- [GitOps with FluxCD](../end-user/gitops/fluxcd)

Besides these addons, the end user can use any GitOps tools they want to watch the Git repo for KubeVela applications as configuration. 