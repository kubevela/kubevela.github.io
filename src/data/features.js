import React from 'react'
import Translate, { translate } from '@docusaurus/Translate';

const features = [
  {
    title: <><Translate>Application Centric</Translate></>,
    imgUrl: 'img/application-centric.svg',
    description: (
      <>
        <p>
          <Translate>
            Leveraging Open Application Model (OAM), KubeVela introduces consistent yet higher level API to capture a full deployment of microservices 
            on top of hybrid environments. Placement strategy, traffic shifting 
            and rolling update are declared at application level. No infrastructure level concern, simply deploy. 
          </Translate>
        </p>
      </>
    ),
  },
  {
    title: <><Translate>Natively Extensible</Translate></>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
           Unlike traditional PaaS systems, application management capabilities 
            in KubeVela (e.g. workload types, operational behaviors, and cloud services) are built
            as reusable</Translate> <a href="https://github.com/cuelang/cue">
              CUE</a> <Translate>and/or</Translate> <a href="https://helm.sh/">Helm</a> <Translate>components
               and exposed to users as self-service API. When users' needs grow, 
              these capabilities can naturally expand in programmable approach. 
              No restriction, fully flexible.</Translate>
        </p>
      </>
    ),
    reverse: true,
  },
  {
    title: <><Translate>Runtime Agnostic</Translate></>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela has no requirement for runtime. It uses Kubernetes as control plane to deploy (and manage) 
            diverse workload types such as container, cloud functions, databases,
             or even EC2 instances across hybrid environments. 
             Also, this makes KubeVela seamlessly work with any Kubernetes compatible
            CI/CD or GitOps tools via declarative API.</Translate>
        </p>
      </>
    ),
  },
]

export default features
