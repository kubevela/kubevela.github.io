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
    title: <>Platform-as-Code</>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
           In KubeVela, all its application deployment features such as workloads, operational behaviors, and cloud services
            are defined via reusable </Translate><a href="https://github.com/cuelang/cue">
              CUE</a> <Translate>and/or </Translate> <a href="https://helm.sh/">Helm</a><Translate> components. 
              This creates a application deployment system whose capabilities are maintained as programmable packages, 
              when your needs grow, your platform capabilities expand. Zero-restriction and fully flexible.</Translate>
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
            Though perfect in flexibility and best in developer experience, X-as-Code may leads to </Translate> <i>configuration drift</i> <Translate>. 
            That's why KubeVela is built with Kubernetes, i.e. all its abstractions and capabilities are code but executed via battle tested 
            </Translate><a href="https://kubernetes.io/docs/concepts/architecture/controller/"> Kubernetes 
            Control Loop</a><Translate>, convergence and determinism are guaranteed. Also, as a set of </Translate><a href="https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/">
             Custom Resources</a><Translate>, KubeVela seamlessly work with any CI/CD or GitOps tools, no integration burden.</Translate>
        </p>
      </>
    ),
  },
]

export default features
