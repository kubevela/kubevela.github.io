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
            yet higher level API to capture a full deployment of microservices 
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
            a modern data configuration language. This allows you to declare 
            application deployment workflow with all steps and delivery needs 
            assembled together in programmable approach. No restrictions, 
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
            infrastructure. It can deploy and manage any 
            application types including containers, cloud services, databases, 
            or even EC2 instances across hybrid environments, following the 
            workflow you designed.</Translate>
        </p>
      </>
    ),
  },
]

export default features
