import React from 'react'
import Translate, { translate } from '@docusaurus/Translate';

const features = [
  {
    title: <><Translate>Application Centric</Translate></>,
    imgUrl: 'img/application-centric.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela introduces Open Application Model (OAM) as the consistent 
            yet higher level API to capture and render a full deployment of microservices 
            on top of hybrid environments. Placement strategy, traffic shifting 
            and rolling update are declared at application level. 
            No infrastructure level concern, simply deploy. 
          </Translate>
        </p>
      </>
    ),
  },
  {
    title: <><Translate>Programmable Workflow</Translate></>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <>
        <p>
          <Translate>
           KubeVela models application delivery as DAG (Directed Acyclic Graph) 
           and expresses it with</Translate> 
            <a href="https://github.com/cuelang/cue"> CUE</a>, <Translate>
            a modern data configuration language. This allows you to design 
            application deployment steps per needs and
            orchestrate them in programmable approach. No restrictions, 
            natively extensible.</Translate>
        </p>
      </>
    ),
    reverse: true,
  },
  {
    title: <><Translate>Infrastructure Agnostic</Translate></>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela works as an application 
            delivery control plane that is fully decoupled from runtime 
            infrastructure. It can deploy any 
            workload types including containers, cloud services, databases, 
            or even VM instances to any cloud or Kubernetes cluster, following the 
            workflow designed by you.</Translate>
        </p>
      </>
    ),
  },
]

export default features
