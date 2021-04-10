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
            Perfect in flexibility, X-as-Code tends to lead to configuration drift (i.e. the running instances are not in line with 
              the expected configuration). That's why KubeVela is fully built with Kubernetes (instead of a client-side tool), 
            i.e. all its abstractions and capabilities are modeled as code but enforced via battle tested 
            </Translate><a href="https://kubernetes.io/docs/concepts/architecture/controller/"> Kubernetes 
            Control Loop</a><Translate> which will never leave configuration drift in your clusters. Also, as a set of 
            </Translate><a href="https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/">
             Custom Resources</a><Translate>, KubeVela seamlessly work with any CI/CD or GitOps tools, no integration burden.</Translate>
        </p>
      </>
    ),
  },
]

export default features
