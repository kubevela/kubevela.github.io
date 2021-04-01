import React from 'react'
import Translate, { translate } from '@docusaurus/Translate';

const features = [
  {
    title: <>Application Centric</>,
    imgUrl: 'img/application-centric.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela introduces the </Translate>
            <i>Application</i> <Translate>abstraction to capture a full deployment of microservices, and 
            builds operational features around the application needs only. Progressive rollout 
            and multi-cluster deployment are provided out-of-box. No infrastructure level concerns, simply deploy.
          </Translate>
        </p>
      </>
    ),
  },
  {
    title: <>Self-Service Building Blocks</>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela exposes application management features as LEGO-style modules with leverage of
            </Translate><a href="https://github.com/cuelang/cue"> CUELang</a> <Translate>and </Translate>
           <a href="https://helm.sh/">Helm</a><Translate>. This enables you to abstract and assemble 
           any infrastructure capabilities per needs of the application and ship them to end users in self-service approach.
           Highly extensible, no abstraction leak.
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
            KubeVela maintains all abstractions with 
            </Translate><a href="https://kubernetes.io/docs/concepts/architecture/controller/"> Kubernetes 
            Control Loop</a> <Translate>, so they will never leave </Translate> <i>Configuration Drift</i> <Translate>in 
            your cluster. Also, as a set of </Translate><a href="https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/">
             Kubernetes Custom Resources</a><Translate>, KubeVela seamlessly work with any CI/CD or GitOps tools, no integration burden, no extra tool</Translate>.
        </p>
      </>
    ),
  },
]

export default features
