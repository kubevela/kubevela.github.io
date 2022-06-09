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
            'tutorials/helm-multi-cluster',
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
            'how-to/dashboard/trigger/overview',
            'tutorials/jenkins',
            'tutorials/trigger',
          ],
        },
        {
          type: 'category',
          label: 'GitOps',
          collapsed: true,
          items: [
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
            'platform-engineers/system-operation/vela-cli-image',
            'platform-engineers/system-operation/enable-addon-offline',
            'platform-engineers/system-operation/migration-from-old-version'
          ],
        },
        {
          'User Management': [
            'how-to/dashboard/user/user',
            'tutorials/sso',
          ],
        },
        'how-to/dashboard/user/project',
        {
          'Authentication and Authorization': [
            'how-to/dashboard/user/rbac',
            'platform-engineers/auth/basic',
            'platform-engineers/auth/advance',
            'platform-engineers/auth/integration',
          ],
        },
        {
          'Cluster Management': [
            'platform-engineers/system-operation/managing-clusters',
            'how-to/dashboard/target/overview',
          ],
        },
        {
          'Manage Config of Integration': [
            'how-to/dashboard/config/dex-connectors',
            'how-to/dashboard/config/helm-repo',
          ],
        },
        'platform-engineers/system-operation/observability',
        'platform-engineers/system-operation/performance-finetuning',
        {
          'UX Customization': [
            'reference/ui-schema',
            'reference/topology-rule',
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
        {
          'Conventions': [
            'contributor/release-process',
            'contributor/code-conventions',
            'contributor/principle-of-test',
          ],
        },
        {
          'CUE in KubeVela': [
            'platform-engineers/cue/basic',
            'platform-engineers/cue/definition-edit',
            'platform-engineers/components/custom-component',
            {
              type: 'category',
              label: 'Traits System',
              items: [
                'platform-engineers/traits/customize-trait',
                'platform-engineers/traits/advanced',
              ],
            },
            'platform-engineers/traits/status',
            {
              'Workflow System': [
                'platform-engineers/workflow/workflow',
                'platform-engineers/workflow/cue-actions',
                'platform-engineers/workflow/working-mechanism',
              ],
            },
            {
              'Patch and Override': [
                'platform-engineers/traits/patch-trait',
                'platform-engineers/cue/patch-strategy',
              ]
            },
            {
              'Debugging': [
                'platform-engineers/debug/dry-run',
                'platform-engineers/debug/debug',
              ],
            },
            'platform-engineers/system-operation/velaql',
          ],
        },
        {
          type: 'category',
          label: 'Contribute Extension',
          collapsed: true,
          items: [
            {
              Addons: ['platform-engineers/addon/intro'],
            },
            {
              'Cloud Resources': [
                'platform-engineers/addon/terraform',
                'platform-engineers/components/component-terraform',
              ],
            },
            'platform-engineers/x-def-version',
          ],
        },
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
          label: 'Community Addons',
          items: [
            'reference/addons/overview',
            'reference/addons/velaux',
            'reference/addons/rollout',
            'reference/addons/fluxcd',
            'reference/addons/terraform',
            'reference/addons/ai',
            'reference/addons/traefik',
          ],
        },
        'end-user/components/cloud-services/cloud-resources-list',
        'reference/user-improvement-plan',
        {
          label: 'VelaUX API Doc',
          type: 'link',
          href: 'https://kubevela.stoplight.io/docs/kubevela/b3A6NDI5NzQxMzM-detail-definition',
        },
      ],
    },
    'roadmap/README',
    {
      type: 'doc',
      id: 'developers/references/devex/faq',
    },
  ],
};
