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
    title: <>A Self-Service Platform</>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
           In KubeVela, any capability an application deployment needs (e.g. workloads, operational features, and cloud services etc)
            are abstracted as reusable modules. This creates a self-service workflow where platform
             team abstracts and maintains capabilities via </Translate><a href="https://github.com/cuelang/cue">
              CUE</a> <Translate>and/or </Translate> <a href="https://helm.sh/">Helm</a><Translate>, 
              and end-users ship code by picking and assembling these modules into an application deployment. 
              No restrictions, fully extensible.</Translate>
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
            All these self-service capability modules are actually maintained with 
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
