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
            <i>Application</i> <Translate>concept as main API to abstract a deployment of microservices, and then builds operational features around the applications' needs only (e.g. progressive rollout, 
            and multi-cluster app deployment etc.). No infrastructure concerns, simply deploy.
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
            The</Translate> <i>Application</i> <Translate> is composed of modularized building blocks 
            that leverages </Translate><a href="https://github.com/cuelang/cue">CUELang</a> <Translate>and </Translate>
           <a href="https://helm.sh/">Helm</a> <Translate> as templates. This enables you to
            abstract any Kubernetes capabilities the application needs with a consistent approach,
             and ship them to end users in LEGO-style. No restrictions, no abstraction leak.
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
            The abstractions in KubeVela are defined by CUE or Helm, but maintained with 
            </Translate><a href="https://kubernetes.io/docs/concepts/architecture/controller/"> Kubernetes 
            Control Loop</a> <Translate> so they will never leave </Translate> <i>Configuration Drift</i> <Translate>in 
            your cluster. Also, as </Translate><a href="https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/">
             Kubernetes Custom Resources</a><Translate>, your abstractions now seamlessly work with any CI/CD or GitOps tools, no integration burden, no extra tool</Translate>.
        </p>
      </>
    ),
  },
]

export default features
