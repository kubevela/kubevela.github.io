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
            KubeVela introduces the multi-components </Translate>
            <i>Application</i> <Translate>abstraction to capture a full deployment of microservices, and 
            builds operational features around the application needs only. Progressive rollout 
            and multi-cluster deployment are provided out-of-box. No infrastructure level concerns, simply deploy.
          </Translate>
        </p>
      </>
    ),
  },
  {
    title: <>Natively Extensible</>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
            The </Translate><i>Application</i><Translate> abstraction is LEGO-style. It is composed of building blocks that leverages
            </Translate><a href="https://github.com/cuelang/cue"> CUELang</a> <Translate>and </Translate>
           <a href="https://helm.sh/">Helm</a> <Translate> as templating engine. This enables you to model 
           any infrastructure capabilities per needs of the application and ship them as easy-to-use abstraction modules to end users.
           No restrictions, no abstraction leak.
          </Translate>
        </p>
      </>
    ),
    reverse: true,
  },
  {
    title: <>Simple yet Reliable Abstraction Mechanism</>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <>
        <p>
          <Translate>
            Those CUE and Helm based abstractions in KubeVela are maintained with 
            </Translate><a href="https://kubernetes.io/docs/concepts/architecture/controller/"> Kubernetes 
            Control Loop</a> <Translate>, so they will never leave </Translate> <i>Configuration Drift</i> <Translate>in 
            your cluster. Also, as </Translate><a href="https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/">
             Kubernetes Custom Resources</a><Translate>, your abstractions now seamlessly work with any CI/CD or GitOps tools, no integration burden, no extra tool</Translate>.
        </p>
      </>
    ),
  },
]

export default features
