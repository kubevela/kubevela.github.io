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
           KubeVela enables you to define platform features (such as workloads, operational behaviors, and cloud services)
            as reusable </Translate><a href="https://github.com/cuelang/cue">
              CUE</a> <Translate>and/or </Translate> <a href="https://helm.sh/">Helm</a><Translate> components, 
              per needs of your application deployment. 
              And when your needs grow, your platform capabilities expand naturally in a programmable approach.</Translate>
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
            Perfect in flexibility though, X-as-Code may lead to configuration drift (i.e. the running instances are not in line with 
              the expected configuration). KubeVela solves this by modeling its capabilities as code but enforce them via
            </Translate><a href="https://kubernetes.io/docs/concepts/architecture/controller/"> Kubernetes 
            Reconcile Loops</a><Translate> which will never leave inconsistency in your clusters. This also makes KubeVela
            work with any CI/CD or GitOps tools via declarative API without integration burden.</Translate>
        </p>
      </>
    ),
  },
]

export default features
