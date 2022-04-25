import React from 'react'
import Translate, { translate } from '@docusaurus/Translate';

const features = [
  {
    title: <><Translate>Unified Application Delivery Model</Translate></>,
    imgUrl: 'img/application-centric.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela introduces a unified and cross-platform delivery model that allows you to deploy any workload type, including containers, databases, or even VM instances to any cloud or Kubernetes clusters. It supports cross-environment promotion and custom delivery workflow. The whole model was fully intention-driven, having both user experience and robustness.
          </Translate>
        </p>
      </>
    ),
  },
  {
    title: <><Translate>Programmable Delivery Workflow</Translate></>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
            Application delivery workflow is driven by CUE - a powerful configuration language developed at Google. This allows you to design application deployment steps per needs and orchestrate them in programmable approach. No restrictions, natively extensible, for maximum compatibility with your existing Infrastructure.
          </Translate>
        </p>
      </>
    ),
    reverse: true,
  },
  {
    title: <><Translate>Multi-cluster/Hybrid-cloud Continuous Delivery Control Plane</Translate></>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela natively supports rich continuous delivery policies in various multi-cluster/hybrid-cloud scenarios or mixed environments. On the one hand, it can enhance the CI/CD pipeline by serving as unified control plane. On the other hand, it is also capable of leveraging GitOps to automate continuous delivery process in the style of IaC.</Translate>
        </p>
      </>
    ),
  },
]

export default features
