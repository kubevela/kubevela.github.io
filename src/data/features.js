import React from 'react'
import Translate, { translate } from '@docusaurus/Translate';

const features = [
  {
    title: <>Developer Centric</>,
    imgUrl: 'img/application-centric.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela introduces the </Translate>
            <i>Application</i> <Translate>as the main API to capture a full deployment of microservices, and builds features
             around the application needs only. Progressive rollout 
            and multi-cluster deployment are provided out-of-box. No infrastructure level concerns, simply deploy.
          </Translate>
        </p>
      </>
    ),
  },
  {
    title: <>Self-Service</>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
           KubeVela models platform features (such as workloads, operational behaviors, and cloud services)
            as reusable </Translate><a href="https://github.com/cuelang/cue">
              CUE</a> <Translate>and/or </Translate> <a href="https://helm.sh/">Helm</a><Translate> components, 
              and expose them to end users as self-service building blocks. 
              When your needs grow, these capabilities can extend naturally in a programmable approach. 
              No restriction, fully flexible.</Translate>
        </p>
      </>
    ),
    reverse: true,
  },
  {
    title: <>Simple yet Reliable</>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela is built with Kubernetes as control plane so unlike traditional X-as-Code solutions, 
            it never leaves configuration drift in your clusters. Also, this makes KubeVela work with any 
            CI/CD or GitOps tools via declarative API without any integration burden.</Translate>
        </p>
      </>
    ),
  },
]

export default features
