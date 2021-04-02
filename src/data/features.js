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
    title: <>Templates Based Self-Service</>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
           In KubeVela, all deployable workloads, cloud services and operational features are abstracted as LEGO-sytle templates via
             </Translate><a href="https://github.com/cuelang/cue"> CUE</a> <Translate>and/or </Translate>
           <a href="https://helm.sh/">Helm</a><Translate>. This enables the end-users to declare
            an application deployment by picking and assembling templates per their own need. No restrictions, natively extensible.
          </Translate>
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
            Defined by CUE and Helm, abstractions in KubeVela are essentially maintained with 
            </Translate><a href="https://kubernetes.io/docs/concepts/architecture/controller/"> Kubernetes 
            Control Loop</a> <Translate> so they will never leave </Translate> <i>Configuration Drift</i> <Translate>in 
            your cluster. Also, as a set of </Translate><a href="https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/">
             Kubernetes Custom Resources</a><Translate>, KubeVela seamlessly work with any CI/CD or GitOps tools, no integration burden, no extra tool</Translate>.
        </p>
      </>
    ),
  },
]

export default features
