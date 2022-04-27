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
            KubeVela introduces a unified and cross-platform delivery model(OAM) that allows you to deploy any workload type, including containers, databases, or even VM instances to any cloud or Kubernetes clusters. It helps you to just write application once, and deliver it the same everywhere, no more re-writing everything from scratch for any new delivery target.
          </Translate>
        </p>
      </>
    ),
  },
  {
    title: <><Translate>Intention-driven Delivery Workflow</Translate></>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
            The whole delivery model was fully intention-driven, having both user experience and robustness. The implementation is driven by CUE - a powerful configuration language developed at Google, and runs on Kubernetes with reconciliation loops. This allows you to design application deployment steps per needs, satisfy the fast growth of businesses requirements, while also keep your production safe with continuous enforcement.
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
            KubeVela natively supports rich continuous delivery policies in various multi-cluster/hybrid-cloud scenarios or mixed environments, it supports cross-environment promotion as well. It can enhance the CI/CD pipeline by serving as unified control plane, while it is also capable of leveraging GitOps to automate continuous delivery process in the style of IaC.
          </Translate>
        </p>
      </>
    ),
  },
]

export default features
