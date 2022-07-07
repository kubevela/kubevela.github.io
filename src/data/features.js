import React from 'react'
import Translate, { translate } from '@docusaurus/Translate';

const features = [
  {
    title: <Translate>Deployment as Code</Translate>,
    imgUrl: 'img/application-centric.svg',
    description: (
      <p>
        <Translate>
          Declare your deployment plan as workflow, run it automatically with any CI/CD or GitOps system, extend or re-program the workflow steps with CUE. No add-hoc scripts, no dirty glue code, just deploy. The deployment workflow in KubeVela is powered by Open Application Model.
        </Translate>
      </p>
    ),
  },
  {
    title: <Translate>Built-in security and compliance building blocks</Translate>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <p>
        <Translate>
          Choose from the wide range of LDAP integrations we provided out-of-box, enjoy multi-cluster authorization that is fully automated, pick and apply fine-grained RBAC modules and customize them per your own supply chain requirements.
        </Translate>
      </p>
    ),
    reverse: true,
  },
  {
    title: <Translate>Multi-cloud/hybrid-environments app delivery as first-class citizen</Translate>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <p>
        <Translate>
          Progressive rollout across test/staging/production environments, automatic canary, blue-green and continuous verification, rich placement strategy across clusters and clouds, fully managed cloud environments provision.
        </Translate>
      </p>
    ),
  },
]

export default features
