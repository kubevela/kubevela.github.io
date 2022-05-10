import React from 'react'
import Translate, { translate } from '@docusaurus/Translate';

const features = [
  {
    title: <><Translate>Unified Application Delivery Experience</Translate></>,
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
    title: <><Translate>Automated Deployment across Clusters</Translate></>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela natively supports rich continuous delivery strategies in various multi-cluster/hybrid-cloud scenarios or mixed environments. These strategies provides efficiency and safety to the distributed delivery process. The centralized management reduces the burden of looking over each clusters and gives unified experience across platforms. With KubeVela, you don't need to have any Ph.D. degree in Kubernetes to run automatic deployments.
          </Translate>
        </p>
      </>
    ),
    reverse: true,
  },
  {
    title: <><Translate>Declarative and Highly Extensible Workflow</Translate></>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <>
        <p>
          <Translate>
            The application delivery process is driven by declarative workflow. Executed by reconciliation loops with limited privileges, the workflow is both robust and secure enough to prevent any unexpected configuration drifts. Users can also make arbitrary reusable customizations to the workflow through writing CUE definitions. The extensibility will always satisfy your growing business demands while keeping your production safe with continuous enforcement.
          </Translate>
        </p>
      </>
    ),
  },
]

export default features
