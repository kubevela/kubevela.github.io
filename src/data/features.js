import React from 'react'
import Translate, { translate } from '@docusaurus/Translate';

const features = [
  {
    title: <Translate>Deployment as Code</Translate>,
    imgUrl: 'img/application-centric.svg',
    description: (
      <p>
        <Translate>
          Declare your deployment plan as a workflow that runs automatically with any CI/CD or GitOps system. Template and customize workflow steps, workloads, policies and configurations with the powerful and extensible CueX engine. Orchestrate all your infrastructure capabilities as reusable modules and leverage the growing ecosystem of community addons. No more ad-hoc scripts or brittle glue code - just clean, declarative deployments. KubeVela's deployment workflow is powered by the Open Application Model.
        </Translate>
      </p>
    ),
  },
  {
    title: <Translate>Built-in Security, Compliance and Observability Building Blocks</Translate>,
    imgUrl: 'img/extending-natively.svg',
    description: (
      <p>
        <Translate>
          Enterprise-grade security with built-in RBAC, secrets management, and policy enforcement. Multi-cluster authorization and authentication that works with your existing identity providers. Comprehensive observability from day one - metrics, logs, and traces for every deployment. Create reusable workflow definitions to support Day 2 operations and maintenance tasks. Meet compliance requirements without sacrificing developer experience.
        </Translate>
      </p>
    ),
    reverse: true,
  },
  {
    title: <Translate>Multi-Cloud and Hybrid Delivery as a First-Class Feature</Translate>,
    imgUrl: 'img/simple-yet-extensible-abstraction-mechanism.svg',
    description: (
      <p>
        <Translate>
          Native support for multi-cluster and hybrid-cloud scenarios including progressive rollouts across test, staging, and production environments. Automatic canary deployments, blue-green releases, and continuous verification. Smart placement strategies across clusters and clouds. Abstract away infrastructure complexity and simplify platform consumption for end users. Build your own abstractions that perfectly match your organization's needs. True multi-cloud delivery without compromise.
        </Translate>
      </p>
    ),
  },
]

export default features
