const { Component } = require('react');

module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: ['getting-started/introduction', 'install', 'quick-start'],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'getting-started/core-concept',
        'getting-started/definition',
        'getting-started/architecture',
      ],
    },
    {
      type: 'category',
      label: 'User Guide',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Container Image CD',
          collapsed: true,
          items: [
            'tutorials/webservice',
            'case-studies/multi-cluster',
            'end-user/traits/rollout',
            'end-user/traits/ingress',
            'end-user/traits/sidecar',
          ],
        },
        {
          type: 'category',
          label: 'Helm Chart CD',
          collapsed: true,
          items: [
            'tutorials/helm',
          ],
        },
        {
          'Cloud Resources CD': [
            'tutorials/consume-cloud-services',
            'end-user/components/cloud-services/provision-and-consume-cloud-services',
            'end-user/components/cloud-services/provision-and-initiate-database',
            'end-user/components/cloud-services/secure-your-database-connection',
            'end-user/components/cloud-services/provision-an-RDS-instance-with-more-than-one-database',
          ],
        },
        {
          type: 'category',
          label: 'Kubernetes Manifest CD',
          collapsed: true,
          items: [
            'tutorials/k8s-object',
            'end-user/components/ref-objects',
          ],
        },
        {
          type: 'category',
          label: 'CI Integration',
          collapsed: true,
          items: [
            'tutorials/jenkins',
            'tutorials/trigger',
            'how-to/dashboard/trigger/overview',
            'case-studies/gitops',
          ],
        },
        {
          'General CD Features': [
            'how-to/dashboard/application/create-application',
            'tutorials/workflows',
            'end-user/workflow/component-dependency-parameter',
            'end-user/version-control',
            'end-user/policies/apply-once',
            'end-user/policies/gc',
            'end-user/service-account-integration',
          ],
        },
        'end-user/components/more',
      ],
    },
    {
      type: 'category',
      label: 'Operator Manual',
      items: [
        {
          'Advanced Installation': [
            'platform-engineers/system-operation/bootstrap-parameters',
            'platform-engineers/advanced-install',
            'platform-engineers/system-operation/offline-installation',
          ],
        },
        'tutorials/sso',
        'how-to/dashboard/user/user',
        'how-to/dashboard/user/rbac',
        'how-to/dashboard/user/project',
        {
          'Manage resource': [
            'platform-engineers/system-operation/managing-clusters',
            'how-to/dashboard/target/overview',
          ],
        },
        {
          'Manage integration configs': [
            'how-to/dashboard/config/dex-connectors',
            'how-to/dashboard/config/helm-repo',
          ],
        },
        'how-to/cli/addon/addon',
        'platform-engineers/system-operation/observability',
        'platform-engineers/system-operation/performance-finetuning',
        {
          type: 'category',
          label: 'Extension',
          collapsed: true,
          items: [
            {
              'Learning CUE': [
                'platform-engineers/cue/basic',
                'platform-engineers/cue/definition-edit',
                'platform-engineers/cue/advanced',
              ],
            },
            {
              Addons: ['platform-engineers/addon/intro'],
            },
            'platform-engineers/components/custom-component',
            {
              'Cloud Resources': [
                'platform-engineers/addon/terraform',
                'platform-engineers/components/component-terraform',
              ],
            },
            {
              type: 'category',
              label: 'Traits System',
              items: [
                'platform-engineers/traits/customize-trait',
                'platform-engineers/traits/patch-trait',
                'platform-engineers/traits/status',
                'platform-engineers/traits/advanced',
              ],
            },
            {
              'Workflow System': [
                'platform-engineers/workflow/workflow',
                'platform-engineers/workflow/cue-actions',
                'platform-engineers/workflow/working-mechanism',
              ],
            },
            'platform-engineers/system-operation/velaql',
            'platform-engineers/debug/dry-run',
            'platform-engineers/debug/debug',
            'platform-engineers/x-def-version',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Developer Guide',
      collapsed: true,
      items: [
        'contributor/overview',
        'contributor/non-code-contribute',
        'contributor/code-contribute',
        'contributor/release-process',
        'contributor/code-conventions',
        'contributor/principle-of-test',
      ],
    },
    {
      type: 'category',
      label: 'References',
      items: [
        'cli/vela',
        'platform-engineers/oam/x-definition',
        'end-user/components/references',
        'end-user/traits/references',
        'end-user/policies/references',
        'end-user/workflow/built-in-workflow-defs',
        {
          type: 'category',
          label: 'Official Addons',
          items: [
            'reference/addons/overview',
            'reference/addons/velaux',
            'reference/addons/terraform',
            'reference/addons/ai',
            'reference/addons/traefik',
          ],
        },
        'end-user/components/cloud-services/cloud-resources-list',
        'reference/ui-schema',
        'reference/user-improvement-plan',
        {
          label: 'VelaUX API Doc',
          type: 'link',
          href: 'https://kubevela.stoplight.io/docs/kubevela/b3A6NDI5NzQxMzM-detail-definition',
        },
      ],
    },
    {
      type: 'category',
      label: 'Roadmap',
      items: ['roadmap/README'],
    },
    {
      type: 'doc',
      id: 'developers/references/devex/faq',
    },
  ],
};
