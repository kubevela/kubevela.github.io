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
            KubeVela abstracts away the infrastructure level primitives by introducing the </Translate>
            <i>Application</i> <Translate>aconcept as main API, and then building operational 
            features around the applications' needs only.
          </Translate>
        </p>
      </>
    ),
  },
  {
    title: <>Extending Natively</>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
            The</Translate> <i>Application</i> <Translate>abstraction is composed of modularized building blocks 
            that support </Translate><a href="https://github.com/cuelang/cue">CUELang</a> <Translate>and </Translate>
           <a href="https://helm.sh/">Helm</a> <Translate> as template engines. This enable you to
            abstract Kubernetes capabilities in LEGO-style and ship them to end users via plain
          </Translate> <code>kubectl apply -f</code>.
        </p>
      </>
    ),
    reverse: true,
  },
  {
    title: <>Simple yet Reliable Abstractions Mechanism</>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <>
        <p>
          <Translate>
            Unlike most IaC (Infrastructure-as-Code) solutions, the abstractions in KubeVela is built with 
            </Translate><a href="https://kubernetes.io/docs/concepts/architecture/controller/"> Kubernetes 
            Control Loop</a> <Translate> so they will never leave </Translate> <i>Configuration Drift</i> <Translate>in 
            your cluster. As a </Translate><a href="https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/">
             Kubernetes Custom Resource</a> <Translate>, KubeVela works with any CI/CD or GitOps tools seamlessly, 
            no integration effort needed.
           </Translate>
        </p>
      </>
    ),
  },
]

export default features
