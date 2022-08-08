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
            'tutorials/access-application',
            'end-user/traits/rollout',
            'end-user/traits/sidecar',
          ],
        },
        {
          type: 'category',
          label: 'Helm Chart CD',
          collapsed: true,
          items: [
            'tutorials/helm',
            'tutorials/helm-rollout',
          ],
        },
        {
          type: 'category',
          label: 'Cloud Resources CD',
          collapsed: true,
          items: [
            'tutorials/consume-cloud-services',
            {
              type: 'category',
              label: 'Terraform',
              collapsed: false,
              items: [
                'end-user/components/cloud-services/cloud-resource-scenarios',
                'end-user/components/cloud-services/provision-and-consume-database',
                'end-user/components/cloud-services/provision-and-initiate-database',
                'end-user/components/cloud-services/secure-your-database-connection',
                'end-user/components/cloud-services/provision-an-RDS-instance-with-more-than-one-database',
                'end-user/components/cloud-services/provision-instance-and-database-separately',
              ],
            },
            'end-user/components/cloud-services/provision-cloud-resources-by-crossplane',
          ],
        },
        {
          type: 'category',
          label: 'Kubernetes Manifest CD',
          collapsed: true,
          items: [
            'tutorials/k8s-object',
            'tutorials/k8s-object-rollout',
          ],
        },
        {
          type: 'category',
          label: 'Multi Cluster Delivery',
          collapsed: true,
          items: [
            'case-studies/multi-cluster',
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
          items: ['case-studies/gitops', 'end-user/gitops/fluxcd'],
        },
        {
          type: 'category',
          label: 'Declarative Workflow',
          collapsed: true,
          items: [
            'end-user/workflow/overview',
            'end-user/workflow/suspend',
            'end-user/workflow/step-group',
            'end-user/workflow/dependency',
            'end-user/workflow/inputs-outputs',
            'end-user/workflow/if-condition',
            'end-user/workflow/timeout',
          ],
        },
        'platform-engineers/operations/observability',
        {
          'General CD Features': [
            'how-to/dashboard/application/create-application',
            'end-user/version-control',
            'end-user/workflow/component-dependency-parameter',
            'case-studies/initialize-env',
            'end-user/policies/apply-once',
            'end-user/policies/gc',
            'end-user/policies/shared-resource',
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
            'platform-engineers/system-operation/migration-from-old-version',
          ],
        },
        {
          'User Management': ['how-to/dashboard/user/user', 'tutorials/sso'],
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
            'platform-engineers/system-operation/working-with-ocm',
          ],
        },
        {
          'Manage Config of Integration': [
            'how-to/dashboard/config/dex-connectors',
            'how-to/dashboard/config/helm-repo',
            'how-to/dashboard/config/image-registry',
          ],
        },
        'platform-engineers/system-operation/performance-finetuning',
        'platform-engineers/workflow/working-mechanism',
        {
          'UX Customization': [
            'platform-engineers/openapi-v3-json-schema',
            'reference/ui-schema',
            'reference/topology-rule',
          ],
        },
        'platform-engineers/openapi/overview',
      ],
    },
    {
      type: 'category',
      label: 'Developer Guide',
      collapsed: true,
      items: [
        'contributor/overview',
        {
          type: 'category',
          label: 'Extension',
          collapsed: true,
          items: [
            {
              Addons: [
                'platform-engineers/addon/intro',
                'platform-engineers/addon/addon-registry',
              ],
            },
            {
              'Cloud Resources': [
                'platform-engineers/addon/terraform',
                'platform-engineers/components/component-terraform',
              ],
            },
          ],
        },
        {
          'CUE in KubeVela': [
            'platform-engineers/cue/basic',
            'platform-engineers/cue/definition-edit',
            'platform-engineers/components/custom-component',
            'platform-engineers/traits/customize-trait',
            'platform-engineers/policy/custom-policy',
            'platform-engineers/traits/status',
            'platform-engineers/workflow/workflow',
            {
              'Patch and Override': [
                'platform-engineers/traits/patch-trait',
                'platform-engineers/cue/patch-strategy',
              ],
            },
            'platform-engineers/system-operation/velaql',
            {
              Debugging: [
                'platform-engineers/debug/dry-run',
                'platform-engineers/debug/debug',
              ],
            },
            'platform-engineers/x-def-version',
          ],
        },
        {
          'Contribution Guide': [
            'contributor/non-code-contribute',
            'contributor/code-contribute',
            'contributor/cli-ref-doc',
          ],
        },
        {
          Conventions: [
            'contributor/release-process',
            'contributor/code-conventions',
            'contributor/principle-of-test',
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
        'platform-engineers/workflow/cue-actions',
        {
          type: 'category',
          label: 'Community Verified Addons',
          items: [
            'reference/addons/overview',
            'reference/addons/velaux',
            'reference/addons/rollout',
            'reference/addons/fluxcd',
            {
              'Cloud Resources': [
                'reference/addons/terraform',
                'reference/addons/crossplane',
              ],
            },
            'reference/addons/ai',
            'reference/addons/traefik',
            'reference/addons/cert-manager',
            'reference/addons/kubevela-io',
            'reference/addons/pyroscope',
            'reference/addons/vegeta',
            'reference/addons/ocm-gateway-manager-addon',
            'reference/addons/ocm-hub-control-plane',
            'reference/addons/vela-prism',
            'reference/addons/flink-kubernetes-operator',
            'reference/addons/chartmuseum',
          ],
        },
        'end-user/components/cloud-services/cloud-resources-list',
        'reference/user-improvement-plan',
      ],
    },
    'roadmap/README',
    {
      type: 'doc',
      id: 'developers/references/devex/faq',
    },
  ],
};
