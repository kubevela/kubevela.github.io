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
           KubeVela leverages </Translate> 
            <a href="https://github.com/cuelang/cue"> CUE</a> <Translate>to
            implement its model layer. This allows you to define an application deployment
              workflow as DAG, with all steps and application's needs glued together in programmable approach.  
              No restrictions, natively extensible.</Translate>
        </p>
      </>
    ),
    reverse: true,
  },
  {
    title: <><Translate>Runtime Agnostic</Translate></>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <>
        <p>
          <Translate>
            KubeVela works as an application 
            delivery control plane that is fully runtime agnostic. It can 
            deploy and operate any 
            application components including containers, cloud functions, databases, 
            or even EC2 instances across hybrid environments, following the 
            workflow you defined.</Translate>
        </p>
      </>
    ),
  },
]

export default features
